import { createWebhookRouter, signWebhook, verifyWebhook } from "./webhooks.js";
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

/** What the platform answers when it accepted and recorded the event. */
export interface RecordedEvent {
	id: string;
	name: string;
	subject: string;
	meta: Record<string, unknown> | null;
	clientTrust: boolean;
	occurredAt: string;
	receivedAt: string;
	late: boolean;
}

/**
 * What it answers when the event name is not confirmed for this app: the
 * delivery is dropped rather than recorded, and saying so is the point. A
 * caller that treats every 2xx as recorded will believe in events the platform
 * never kept.
 */
export interface PendingEvent {
	status: "pending_confirmation";
	name: string;
}

export interface TrackEventInput {
	/**
	 * The identifier your own system knows this person by, exactly as your
	 * events carry it. The platform names this field `subject` on the wire; it
	 * is `subjectId` here because that is what it is to a caller holding a user
	 * record, and the mapping happens in one place rather than in every app.
	 */
	subjectId: string;
	name: string;
	properties?: Record<string, unknown>;
	/**
	 * Deduplication handle. Strongly recommended: without one, a retried request
	 * records the event twice, and for a streak or a referral that is a
	 * double-grant against a real budget.
	 */
	/**
	 * Required. The platform dedupes on it, so a retry after a timeout records
	 * one event rather than two. It was optional here while it was being sent
	 * as a header nothing read, which made every retry a double write.
	 */
	idempotencyKey: string;
	/** Defaults to server receipt time. Pass an ISO string when backfilling. */
	occurredAt?: string;
}

/**
 * @deprecated Renamed to `TrackEventInput`, alongside `events.record` becoming
 * `events.track`. Identical shape; the alias stays so `1.0.0-alpha.1` keeps
 * compiling.
 */
export type RecordEventInput = TrackEventInput;

/**
 * The two calls that put an event into the platform, one of which is the same
 * function under its former name.
 *
 * Declared rather than inferred so the deprecation reaches the published
 * `.d.ts` and an editor strikes `record` through at the call site, which is the
 * only way a rename nobody is forced into actually happens.
 */
export interface EventsApi {
	/**
	 * Record something a subject did. The event is the only input to criteria.
	 *
	 * Named `track` because that is what the platform's own route is called, and
	 * what the roadmap, the landing page and every other SDK in this space say.
	 * The verb is yours; `RecordedEvent` is what the platform did with it.
	 */
	track(input: TrackEventInput): Promise<RecordedEvent | PendingEvent>;
	/**
	 * @deprecated Renamed to `track`. This is the same function, not a wrapper,
	 * and it is staying: `activekit@1.0.0-alpha.1` is published and callers of it
	 * are not being broken for a name. Move to `track` at your convenience.
	 */
	record(input: TrackEventInput): Promise<RecordedEvent | PendingEvent>;
}

export interface Grant {
	id: string;
	campaign: { id: string; name: string };
	app: { id: string; name: string; slug: string };
	subject: { externalId: string };
	/**
	 * Which side of the app issued it. Load bearing for reconciliation: without
	 * it a sandbox rehearsal is indistinguishable from real production debt.
	 */
	environment: "sandbox" | "production";
	/**
	 * `voided` and `reversed` are both terminal. `reversed` is the clawback,
	 * and it is a state a fulfilment system has to handle rather than a state
	 * that cannot happen.
	 */
	status: "pending" | "fulfilled" | "voided" | "reversed";
	/** Frozen at issuance, so a later edit to the reward never rewrites history. */
	reward: Reward;
	issuedAt: string;
	updatedAt: string;
}

/**
 * What a grant pays. A discriminated union, because the fields differ per kind
 * and a flat shape would promise fields that are absent on most of them.
 */
export type Reward =
	| { kind: "credits"; amount: number }
	| { kind: "percent_bonus"; percent: number; of: string }
	| { kind: "badge"; badge: string }
	| { kind: "perk"; perk: string }
	| { kind: "custom"; label: string; meta?: Record<string, unknown> };

/**
 * @deprecated Nothing returns one. `GET /v1/grants` answers `{ grants }` with
 * no cursor, so this type describes pagination the platform does not serve. It
 * is still exported because it was exported in `1.0.0-alpha.1`; the surface
 * freeze before 1.0 is where it goes.
 */
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

	readonly #track = (input: TrackEventInput): Promise<RecordedEvent | PendingEvent> => {
		const { subjectId, properties, idempotencyKey, ...rest } = input;
		return this.#request("POST", "/events", {
			// Mapped rather than spread. The platform's body is a strict
			// object, so a stray key is a 400 rather than something ignored,
			// and the key names differ from the ones a caller thinks in.
			body: {
				...rest,
				subject: subjectId,
				idempotencyKey,
				...(properties ? { meta: properties } : {}),
			},
		});
	};

	/**
	 * `record` and `track` are one function under two names, deliberately the
	 * same reference rather than one delegating to the other. A wrapper is a
	 * second place for the two to drift; identity cannot drift, and a test
	 * asserts it.
	 */
	readonly events: EventsApi = { track: this.#track, record: this.#track };

	readonly grants = {
		/**
		 * Read what subjects earned. This is the grant record you reconcile against —
		 * ActiveKit records grants, your billing system fulfills them.
		 */
		list: (
			params: {
				subjectId?: string;
				campaignId?: string;
				status?: Grant["status"];
				environment?: Grant["environment"];
			} = {},
		): Promise<{ grants: Grant[] }> => {
			// Named as the platform names them. These were `subjectId` and
			// `campaignKey`, which its query schema does not reject: it strips
			// them, so the filters vanished and the answer was every grant in
			// the organization. A wrong filter that 400s is a bug you find; one
			// that silently widens the answer is a bug you ship.
			const query = new URLSearchParams();
			if (params.subjectId) query.set("subject", params.subjectId);
			if (params.campaignId) query.set("campaign", params.campaignId);
			if (params.status) query.set("status", params.status);
			if (params.environment) query.set("environment", params.environment);
			const suffix = query.size > 0 ? `?${query}` : "";
			return this.#request("GET", `/grants${suffix}`);
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

	/**
	 * One registry per client. Its own factory is exported too, because
	 * receiving a webhook needs a signing secret and not an API key.
	 */
	readonly #webhookRouter = createWebhookRouter();

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

		/**
		 * Register a handler for one event type. Returns a function that
		 * unregisters it. Registration alone receives nothing: `dispatch` is what
		 * verifies a delivery and runs what is registered for it.
		 */
		on: this.#webhookRouter.on,

		/**
		 * Verify one delivery and run its handlers. The other half of `on`, and
		 * `verify` plus a lookup rather than a second signature implementation.
		 */
		dispatch: this.#webhookRouter.dispatch,

		/** Sign a payload. For tests and local replay only. */
		sign: signWebhook,
	};

	async #request<T>(
		method: string,
		path: string,
		options: { body?: unknown } = {},
	): Promise<T> {
		const headers: Record<string, string> = {
			authorization: `Bearer ${this.#apiKey}`,
			accept: "application/json",
		};
		if (options.body !== undefined) headers["content-type"] = "application/json";

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
