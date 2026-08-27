import { signWebhook, verifyWebhook } from "./webhooks.js";
import type { VerifyOptions } from "./webhooks.js";

const DEFAULT_API_URL = "https://api.activekit.app/v1";
const RETRYABLE = new Set([429, 500, 502, 503, 504]);

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export class ActiveKitError extends Error {
	override readonly name = "ActiveKitError";
	readonly status: number;
	readonly code: string;
	readonly requestId: string | null;

	constructor(message: string, options: { status: number; code: string; requestId?: string | null }) {
		super(message);
		this.status = options.status;
		this.code = options.code;
		this.requestId = options.requestId ?? null;
	}
}

export interface ActiveKitOptions {
	/** Organization API key. Server-side only — never ship this to a browser. */
	apiKey: string;
	apiUrl?: string;
	fetch?: FetchLike;
	/** Attempts after the first, for transient failures only. Default 2. */
	maxRetries?: number;
}

export interface RecordEventInput {
	subjectId: string;
	name: string;
	properties?: Record<string, unknown>;
	/**
	 * Deduplication handle. Strongly recommended: without one, a retried request
	 * records the event twice, and for a streak or a referral that is a
	 * double-grant against a real budget.
	 */
	idempotencyKey?: string;
	/** Defaults to server receipt time. Pass an ISO string when backfilling. */
	occurredAt?: string;
}

export interface Grant {
	id: string;
	campaignId: string;
	subjectId: string;
	reward: { kind: string; amount: number; unit: string; label: string };
	status: "pending" | "recorded" | "fulfilled" | "revoked";
	createdAt: string;
}

export interface Page<T> {
	data: T[];
	/** Pass back as `cursor`. `null` means the last page. */
	nextCursor: string | null;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

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
 * ActiveKit server client.
 *
 * `fetch`-based and dependency-free so the same build runs on Node 20+,
 * Cloudflare Workers, Bun and Deno. Nothing here imports a Node builtin.
 */
export class ActiveKit {
	readonly #apiKey: string;
	readonly #apiUrl: string;
	readonly #fetch: FetchLike;
	readonly #maxRetries: number;

	constructor(options: ActiveKitOptions) {
		if (!options?.apiKey) throw new TypeError("ActiveKit: `apiKey` is required.");
		this.#apiKey = options.apiKey;
		this.#apiUrl = (options.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, "");
		this.#maxRetries = options.maxRetries ?? 2;

		const injected = options.fetch ?? globalThis.fetch;
		if (typeof injected !== "function") {
			throw new TypeError("ActiveKit: no global `fetch` — pass one via `options.fetch`.");
		}
		this.#fetch = injected.bind(globalThis) as FetchLike;
	}

	readonly events = {
		/** Record something a subject did. The event is the only input to criteria. */
		record: (input: RecordEventInput): Promise<{ eventId: string; advanced: string[] }> => {
			const { idempotencyKey, ...body } = input;
			return this.#request("POST", "/events", {
				body,
				...(idempotencyKey ? { idempotencyKey } : {}),
			});
		},
	};

	readonly grants = {
		/**
		 * Read what subjects earned. This is the ledger you reconcile against —
		 * ActiveKit records grants, your billing system fulfils them.
		 */
		list: (params: { subjectId?: string; campaignKey?: string; cursor?: string; limit?: number } = {}) => {
			const query = new URLSearchParams();
			for (const [key, value] of Object.entries(params)) {
				if (value !== undefined) query.set(key, String(value));
			}
			const suffix = query.size > 0 ? `?${query}` : "";
			return this.#request<Page<Grant>>("GET", `/grants${suffix}`);
		},
	};

	readonly subjects = {
		/**
		 * Open a short-lived, read-only session for one subject, for
		 * `@activekit/js` in the browser.
		 *
		 * Named for what it returns rather than for the field a caller reaches
		 * for first. The platform serves `/v1/subject-sessions`, its contract
		 * row is Subject session, and the answer carries the token, its expiry
		 * and the subject it belongs to. Calling it `createToken` would name one
		 * field of that and force every reader to translate.
		 *
		 * This is the only supported way to authenticate a browser. The API key
		 * grants organization-wide access; a subject token grants one subject's
		 * own view and nothing else, read only, scoped to `/v1/me/*`.
		 *
		 * `subjectId` is whatever your own system knows this person by, exactly
		 * as your events carry it. A subject the platform has not seen before is
		 * created on first sight rather than refused.
		 *
		 * The lifetime is the platform's to set and is not a parameter: a caller
		 * choosing it could choose badly, and a token that outlives its purpose
		 * is the one thing this whole mechanism exists to avoid.
		 */
		createSession: (input: { subjectId: string }) =>
			this.#request<{ token: string; expiresAt: string; subject: { externalId: string } }>(
				"POST",
				"/subject-sessions",
				// The platform names this field `subject`, and its body is strict,
				// so an unexpected key is a 400 rather than something ignored.
				{ body: { subject: input.subjectId } },
			),
	};

	readonly webhooks = {
		/**
		 * Verify a webhook and return its body. Pass the raw request text, not a
		 * re-serialized object.
		 */
		verify: <T = unknown>(
			rawBody: string,
			signatureHeader: string,
			secret: string,
			options?: VerifyOptions,
		): Promise<T> => verifyWebhook<T>(rawBody, signatureHeader, secret, options),

		/** Sign a payload. For tests and local replay only. */
		sign: signWebhook,
	};

	async #request<T>(
		method: string,
		path: string,
		options: { body?: unknown; idempotencyKey?: string } = {},
	): Promise<T> {
		const headers: Record<string, string> = {
			authorization: `Bearer ${this.#apiKey}`,
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
			} catch {
				lastError = new ActiveKitError(`ActiveKit: request to ${path} failed`, {
					status: 0,
					code: "network_error",
				});
				if (attempt === this.#maxRetries) throw lastError;
				await sleep(backoff(attempt, null));
				continue;
			}

			if (response.ok) return (await response.json()) as T;

			let code = "unknown_error";
			let message = `ActiveKit: ${response.status} from ${path}`;
			try {
				const body = (await response.json()) as { code?: string; message?: string };
				if (body.code) code = body.code;
				if (body.message) message = `ActiveKit: ${body.message}`;
			} catch {
				/* non-JSON error body — a proxy or WAF answered, not the API */
			}

			lastError = new ActiveKitError(message, {
				status: response.status,
				code,
				requestId: response.headers.get("x-request-id"),
			});

			if (!RETRYABLE.has(response.status) || attempt === this.#maxRetries) throw lastError;
			await sleep(backoff(attempt, response.headers.get("retry-after")));
		}

		/* istanbul ignore next — the loop always returns or throws */
		throw lastError;
	}
}
