import { assertApiKeyShape, assertServerRuntime, assertSubjectId } from "./credentials.js";
import type { SubjectSession, SubjectSessionInput } from "./credentials.js";
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
	/**
	 * Organization API key, `ak_…`. Server-side only.
	 *
	 * Never ship this to a browser. It grants organization-wide read and write,
	 * there is no scoping that makes that safe in a page, and the constructor
	 * refuses to build at all where a DOM exists rather than leaving that to a
	 * code review. What a browser gets is a subject session token from
	 * {@link ActiveKit.subjects}, which reads one subject and expires in minutes.
	 */
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
 *
 * **It does not run in a browser, by construction.** This is the one ActiveKit
 * package that can write, and the credential that lets it is organization-wide,
 * so the constructor refuses a DOM outright (`src/credentials.ts`). The token a
 * page needs comes from {@link ActiveKit.subjects}, minted here and sent there.
 *
 * There is no free function that takes an API key anywhere in this package.
 * `webhooks.verify` takes a secret and is exported standalone because verifying
 * is something a page could never usefully do; minting is the opposite, so the
 * only path to a session runs through an instance that already holds the key
 * privately. A `createSubjectSession(apiKey, subject)` would be the shape that
 * gets copy-pasted into a component, so it does not exist to copy.
 */
export class ActiveKit {
	readonly #apiKey: string;
	readonly #apiUrl: string;
	readonly #fetch: FetchLike;
	readonly #maxRetries: number;

	constructor(options: ActiveKitOptions) {
		// Before the key is read, let alone stored: a bundle that reaches a page
		// fails on this line in development rather than shipping.
		assertServerRuntime();

		if (!options?.apiKey) throw new TypeError("ActiveKit: `apiKey` is required.");
		assertApiKeyShape(options.apiKey);
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
		 * Exchange this API key for a short-lived, read-only session scoped to one
		 * subject: the only supported way to authenticate a browser.
		 *
		 * ```ts
		 * const session = await activekit.subjects.createSession({ subject: user.id });
		 * return Response.json(session); // safe whole — see `SubjectSession`
		 * ```
		 *
		 * The app and environment are the presented key's own, off its row, and
		 * the body cannot name either. So a session can never read wider than the
		 * key that minted it, and nothing a caller sends can widen it.
		 *
		 * The token opens `GET /v1/me/*` and nothing else. It can never open
		 * `POST /v1/events`, from either end: the read surface refuses every
		 * method but `GET`, `HEAD` and `OPTIONS` before it looks at a credential
		 * at all, and event ingest refuses every credential that does not open
		 * `ak_`, which a JWT never does.
		 *
		 * @see {@link SubjectSessionInput} for why there is no lifetime argument
		 * and no refresh helper.
		 */
		// `async`, deliberately, for a method whose body can refuse before it ever
		// reaches the network. A function typed `Promise` that throws
		// synchronously walks straight past the caller's `.catch`, and in a
		// request handler that is the difference between a 500 and a dead
		// process. Every refusal below arrives as a rejection.
		createSession: async (input: SubjectSessionInput): Promise<SubjectSession> =>
			this.#request<SubjectSession>("POST", "/subject-sessions", {
				// Validated here, not left to the 400, because the failure that
				// matters is the one the API accepts: subjects are created on first
				// sight, so a coerced `undefined` mints a working session for a
				// subject nobody meant to exist.
				body: { subject: assertSubjectId(input?.subject) },
			}),
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
