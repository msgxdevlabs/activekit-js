import { ActiveKitError } from "./types.js";
import type {
	ActiveKitEvents,
	ClaimResult,
	Grant,
	SubjectSnapshot,
	TrackResult,
} from "./types.js";

const DEFAULT_API_URL = "https://api.activekit.app/v1";

/** Status codes worth trying again. Everything else is our fault or the caller's. */
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface ActiveKitOptions {
	/**
	 * Subject JWT, minted by your server with the `activekit` server SDK.
	 *
	 * Never an API key. An API key in the browser is an API key in every
	 * browser — it grants organization-wide access and there is no scoping that
	 * makes that safe.
	 */
	token: string;
	/** Override for self-hosted or non-production API hosts. */
	apiUrl?: string;
	/** Injected for tests and non-browser runtimes. Defaults to global `fetch`. */
	fetch?: FetchLike;
	/** Attempts after the first, for transient failures only. Default 2. */
	maxRetries?: number;
}

type Handler<K extends keyof ActiveKitEvents> = (payload: ActiveKitEvents[K]) => void;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * `Retry-After` is seconds or an HTTP date. Both are common; neither is
 * guaranteed to be present, so fall back to exponential backoff with jitter —
 * a fleet of widgets retrying in lockstep is how a blip becomes an outage.
 */
const backoff = (attempt: number, retryAfter: string | null): number => {
	if (retryAfter) {
		const seconds = Number(retryAfter);
		if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 30_000);
		const date = Date.parse(retryAfter);
		if (Number.isFinite(date)) return Math.min(Math.max(date - Date.now(), 0), 30_000);
	}
	return Math.min(2 ** attempt * 250, 8_000) * (0.5 + Math.random() / 2);
};

export class ActiveKitClient {
	readonly #apiUrl: string;
	readonly #fetch: FetchLike;
	readonly #maxRetries: number;
	readonly #handlers = new Map<keyof ActiveKitEvents, Set<(payload: never) => void>>();
	#token: string;
	#destroyed = false;

	constructor(options: ActiveKitOptions) {
		if (!options?.token) {
			throw new TypeError("ActiveKit: `token` is required — mint one server-side per subject.");
		}
		this.#token = options.token;
		this.#apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, "");
		this.#maxRetries = options.maxRetries ?? 2;

		const injected = options.fetch ?? globalThis.fetch;
		if (typeof injected !== "function") {
			throw new TypeError("ActiveKit: no global `fetch` — pass one via `options.fetch`.");
		}
		this.#fetch = injected.bind(globalThis) as FetchLike;
	}

	/** Swap in a freshly minted JWT before the current one expires. */
	setToken(token: string): void {
		this.#token = token;
	}

	on<K extends keyof ActiveKitEvents>(event: K, handler: Handler<K>): () => void {
		let set = this.#handlers.get(event);
		if (!set) {
			set = new Set();
			this.#handlers.set(event, set);
		}
		set.add(handler as (payload: never) => void);
		return () => {
			set.delete(handler as (payload: never) => void);
		};
	}

	#emit<K extends keyof ActiveKitEvents>(event: K, payload: ActiveKitEvents[K]): void {
		for (const handler of this.#handlers.get(event) ?? []) {
			// One bad subscriber must not take down the others, or the widget.
			try {
				(handler as Handler<K>)(payload);
			} catch {
				/* subscriber's problem */
			}
		}
	}

	/**
	 * Record something the subject did.
	 *
	 * Pass an `idempotencyKey` for anything a retry could double-count. The
	 * server deduplicates on it, which is the only thing standing between a
	 * flaky connection and a subject earning the same streak day twice.
	 */
	async track(
		name: string,
		properties: Record<string, unknown> = {},
		options: { idempotencyKey?: string } = {},
	): Promise<TrackResult> {
		return this.#request<TrackResult>("POST", "/events", {
			body: { name, properties },
			...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
		});
	}

	/**
	 * Ask the server to issue a grant.
	 *
	 * The request is *intent*, never fact: the server re-derives eligibility and
	 * ignores anything the client claims about its own progress. A `granted:
	 * false` result is a normal outcome with a `reason`, not a thrown error.
	 */
	async claim(programKey: string, options: { idempotencyKey?: string } = {}): Promise<ClaimResult> {
		const result = await this.#request<ClaimResult>("POST", "/claims", {
			body: { programKey },
			...(options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : {}),
		});
		if (result.granted && result.grant) this.#emit("grant", result.grant);
		return result;
	}

	/** Current progress across every program the subject is enrolled in. */
	async progress(): Promise<SubjectSnapshot> {
		const snapshot = await this.#request<SubjectSnapshot>("GET", "/me/progress");
		this.#emit("progress", snapshot);
		return snapshot;
	}

	/** Everything this subject has earned, newest first. */
	async grants(): Promise<Grant[]> {
		const { data } = await this.#request<{ data: Grant[] }>("GET", "/me/grants");
		return data;
	}

	/** Drops every subscriber. Call it when the host page tears the widget down. */
	destroy(): void {
		this.#destroyed = true;
		this.#handlers.clear();
	}

	async #request<T>(
		method: string,
		path: string,
		options: { body?: unknown; idempotencyKey?: string } = {},
	): Promise<T> {
		if (this.#destroyed) throw new TypeError("ActiveKit: client has been destroyed.");

		const headers: Record<string, string> = {
			authorization: `Bearer ${this.#token}`,
			accept: "application/json",
		};
		if (options.body !== undefined) headers["content-type"] = "application/json";
		if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;

		const init: RequestInit = {
			method,
			headers,
			...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
		};

		let lastError: ActiveKitError | undefined;

		for (let attempt = 0; attempt <= this.#maxRetries; attempt++) {
			let response: Response;
			try {
				response = await this.#fetch(`${this.#apiUrl}${path}`, init);
			} catch (cause) {
				// Network failure: no status, no request id, and indistinguishable
				// from an offline tab. Retry, then surface it.
				lastError = new ActiveKitError(`ActiveKit: request to ${path} failed`, {
					status: 0,
					code: "network_error",
				});
				if (attempt === this.#maxRetries) throw lastError;
				await sleep(backoff(attempt, null));
				continue;
			}

			if (response.ok) return (await response.json()) as T;

			lastError = await this.#toError(response, path);

			if (!RETRYABLE.has(response.status) || attempt === this.#maxRetries) throw lastError;
			await sleep(backoff(attempt, response.headers.get("retry-after")));
		}

		/* istanbul ignore next — the loop always returns or throws */
		throw lastError;
	}

	async #toError(response: Response, path: string): Promise<ActiveKitError> {
		let code = "unknown_error";
		let message = `ActiveKit: ${response.status} from ${path}`;
		try {
			const body = (await response.json()) as { code?: string; message?: string };
			if (body.code) code = body.code;
			if (body.message) message = `ActiveKit: ${body.message}`;
		} catch {
			// A non-JSON error body means something in front of the API answered —
			// a proxy, a WAF, a captive portal. Keep the generic message.
		}
		return new ActiveKitError(message, {
			status: response.status,
			code,
			requestId: response.headers.get("x-request-id"),
		});
	}
}

/** Create a browser client. One per subject, reused for the page's lifetime. */
export function createClient(options: ActiveKitOptions): ActiveKitClient {
	return new ActiveKitClient(options);
}
