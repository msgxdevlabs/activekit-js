import { ActiveKitError } from "./types.js";
import type { ActiveKitEvents, Grant, SubjectSnapshot } from "./types.js";

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

/**
 * Read-only client for the browser.
 *
 * **This SDK cannot write.** It reads a subject's own campaign progress and
 * grants, and that is the entire surface. There is no `track`, no `claim`, and
 * no code path that issues anything but a GET — `#get` below is the only
 * transport, and its method is a literal.
 *
 * That is a deliberate boundary, not an unfinished feature. Anything the
 * browser can POST, the browser's owner can forge: a subject who can record
 * their own events can mint streak days and referrals at whatever rate their
 * console allows, and server-side re-derivation does not help when the *event*
 * is the thing being faked. So events are recorded by the organization's
 * server, with an API key, through the `activekit` package. The browser only
 * ever asks what already happened.
 *
 * A pleasant consequence: every request here is idempotent, so a retry can
 * never double-count anything. That is why there is no idempotency-key
 * machinery in this package — it has nothing to protect.
 */
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

	/**
	 * The current subject token.
	 *
	 * Exposed because `mountShell` needs a token and an API root, and a page
	 * that already built a client has both. Without this every binding would
	 * make callers pass the same token twice, and the two copies would drift
	 * apart the first time one of them was rotated.
	 */
	get token(): string {
		return this.#token;
	}

	/** The API root this client was built against, without a trailing slash. */
	get apiUrl(): string {
		return this.#apiUrl;
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

	/** Current progress across every campaign the subject is enrolled in. */
	async progress(): Promise<SubjectSnapshot> {
		const snapshot = await this.#get<SubjectSnapshot>("/me/progress");
		this.#emit("progress", snapshot);
		return snapshot;
	}

	/** Everything this subject has earned, newest first. */
	async grants(): Promise<Grant[]> {
		const { data } = await this.#get<{ data: Grant[] }>("/me/grants");
		return data;
	}

	/** Drops every subscriber. Call it when the host page tears the widget down. */
	destroy(): void {
		this.#destroyed = true;
		this.#handlers.clear();
	}

	/**
	 * The only transport in this package. `GET` is a literal on purpose: there
	 * is no parameter a caller or a future edit can set to make this write.
	 */
	async #get<T>(path: string): Promise<T> {
		if (this.#destroyed) throw new TypeError("ActiveKit: client has been destroyed.");

		const init: RequestInit = {
			method: "GET",
			headers: {
				authorization: `Bearer ${this.#token}`,
				accept: "application/json",
			},
		};

		let lastError: ActiveKitError | undefined;

		for (let attempt = 0; attempt <= this.#maxRetries; attempt++) {
			let response: Response;
			try {
				response = await this.#fetch(`${this.#apiUrl}${path}`, init);
			} catch {
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
