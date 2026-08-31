/**
 * Webhook signature verification.
 *
 * Built on Web Crypto, not `node:crypto`, for one reason: this SDK has to run
 * in workerd, where the Node crypto surface does not exist. Web Crypto is
 * present in Node 20+, Workers, Bun and Deno alike, so there is one
 * implementation instead of a runtime fork.
 *
 * Every operation here is async because `crypto.subtle` is. There is no
 * synchronous variant on purpose — a sync API would have to reach for
 * `node:crypto` and would die the first time it was deployed to an edge
 * runtime, which is exactly the class of bug that only shows up in production.
 */

import type { Grant } from "./client.js";
// Type-only, and erased: `verbatimModuleSyntax` emits no import for it, so the
// value cycle `client.ts` -> `webhooks.ts` stays one directional at runtime.

/** Thrown for every verification failure. Never leaks which check failed. */
export class WebhookVerificationError extends Error {
	override readonly name = "WebhookVerificationError";
}

const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer): string =>
	[...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

/**
 * Constant-time comparison.
 *
 * `a === b` on a signature leaks its prefix through timing, one byte at a
 * time. Length is compared first and non-secretly — it is not sensitive, and
 * the loop needs a bound.
 */
const timingSafeEqual = (a: string, b: string): boolean => {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return diff === 0;
};

const sign = async (payload: string, secret: string): Promise<string> => {
	const key = await crypto.subtle.importKey(
		"raw",
		encoder.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
};

/** Parse `ts=1754827200;v1=abc…` into its parts. Unknown keys are ignored. */
const parseHeader = (header: string): { timestamp: number; signatures: string[] } => {
	let timestamp = Number.NaN;
	const signatures: string[] = [];
	for (const part of header.split(";")) {
		const index = part.indexOf("=");
		if (index === -1) continue;
		const key = part.slice(0, index).trim();
		const value = part.slice(index + 1).trim();
		if (key === "ts") timestamp = Number(value);
		else if (key === "v1") signatures.push(value);
	}
	return { timestamp, signatures };
};

export interface VerifyOptions {
	/**
	 * How old a signature may be, in seconds. Default 300.
	 *
	 * This is the replay window: without it, a signature captured once stays
	 * valid forever, and an attacker who can replay a `grant.created` webhook
	 * can make you fulfill the same reward repeatedly.
	 */
	toleranceSeconds?: number;
	/** Injected in tests. Defaults to the current time. */
	now?: () => number;
}

/**
 * Verify a webhook and return its parsed body.
 *
 * Pass the **raw** request body, byte for byte. `await request.json()` then
 * `JSON.stringify` will re-serialize with different key order or spacing and
 * the signature will not match — that is the single most common integration
 * failure, and it looks like a broken secret rather than a re-serialized body.
 */
export async function verifyWebhook<T = unknown>(
	rawBody: string,
	signatureHeader: string,
	secret: string,
	options: VerifyOptions = {},
): Promise<T> {
	if (!rawBody) throw new WebhookVerificationError("Empty webhook body.");
	if (!signatureHeader) throw new WebhookVerificationError("Missing signature header.");
	if (!secret) throw new WebhookVerificationError("Missing webhook signing secret.");

	const { timestamp, signatures } = parseHeader(signatureHeader);

	if (!Number.isFinite(timestamp) || signatures.length === 0) {
		throw new WebhookVerificationError("Malformed signature header.");
	}

	const tolerance = options.toleranceSeconds ?? 300;
	const now = Math.floor((options.now?.() ?? Date.now()) / 1000);
	if (Math.abs(now - timestamp) > tolerance) {
		throw new WebhookVerificationError("Signature timestamp outside tolerance window.");
	}

	const expected = await sign(`${timestamp}:${rawBody}`, secret);

	// Multiple v1 values exist during a secret rotation. Any match is a pass.
	if (!signatures.some((candidate) => timingSafeEqual(candidate, expected))) {
		throw new WebhookVerificationError("Signature mismatch.");
	}

	try {
		return JSON.parse(rawBody) as T;
	} catch {
		throw new WebhookVerificationError("Webhook body is not valid JSON.");
	}
}

/**
 * Produce a signature header for a payload.
 *
 * Exported so integration tests can generate real webhooks without a live
 * ActiveKit instance. Not part of any production path.
 */
export async function signWebhook(
	rawBody: string,
	secret: string,
	timestampSeconds: number,
): Promise<string> {
	return `ts=${timestampSeconds};v1=${await sign(`${timestampSeconds}:${rawBody}`, secret)}`;
}

// ---------------------------------------------------------------------------
// Receiving: the envelope, the registry, and the one call that dispatches.
// ---------------------------------------------------------------------------

/**
 * The envelope every ActiveKit webhook arrives in.
 *
 * Pinned against `apps/api/src/webhook-delivery.ts` in the platform, which
 * serializes it exactly once and signs those bytes. Four fields, and the
 * payload for a given `type` lives under `data` rather than flattened beside
 * them, so adding a field to a grant never collides with a field of the
 * envelope.
 */
export interface WebhookEnvelope<TType extends string = string, TData = unknown> {
	/**
	 * The delivery's own id, and the key to dedupe on.
	 *
	 * Delivery is at least once: a receiver that answered slowly, or a queue
	 * that replayed, sees the same `id` again. It is identical across every
	 * attempt and every replay of one delivery, so storing it and dropping the
	 * repeat is the whole of idempotency on this side. A real delivery opens
	 * `whd_`; a test opens `whtest_` and names no row.
	 */
	readonly id: string;
	readonly type: TType;
	/** When the delivery was created, RFC 3339. Not when this attempt was sent. */
	readonly createdAt: string;
	readonly data: TData;
}

/**
 * A grant was issued. The one event that means somebody earned something, and
 * the one you fulfill from your own billing system.
 *
 * `grant.created` is the name the platform sends today. `docs/techstack.md`
 * records `grant.issued` as where the name is going; that rename is its own
 * story with a migration in it, and until it lands an SDK that listened for
 * `grant.issued` would hear nothing at all.
 */
export type GrantCreatedEvent = WebhookEnvelope<"grant.created", { readonly grant: Grant }>;

/**
 * Somebody pressed send test in the dashboard. Nothing was earned and nothing
 * is owed.
 *
 * It carries no `data.grant` at all, so a receiver reaching for the grant finds
 * nothing rather than a plausible fake, and every marker saying "this is a
 * test" is inside the signed body rather than in a header anyone on the path
 * could add or strip.
 */
export type WebhookTestEvent = WebhookEnvelope<
	"webhook.test",
	{
		readonly test: true;
		/** The `whep_` id of the endpoint registration that was tested. */
		readonly endpoint: string;
		readonly environment: "sandbox" | "production";
		readonly message: string;
	}
>;

/** Every event type the platform sends today, by name. */
export interface WebhookEventMap {
	"grant.created": GrantCreatedEvent;
	"webhook.test": WebhookTestEvent;
}

export type WebhookEvent = WebhookEventMap[keyof WebhookEventMap];

/**
 * What runs when an event arrives. Returning a promise is supported and
 * awaited: a handler that fires and forgets is a handler whose failure the
 * platform will never learn about.
 */
export type WebhookHandler<TEvent = WebhookEvent> = (event: TEvent) => void | Promise<void>;

/** Call to unregister. Returned by `on`. */
export type WebhookUnsubscribe = () => void;

/** What one dispatch did, once the signature checked out. */
export interface WebhookDispatchResult {
	/**
	 * `handled` when at least one handler ran to completion. `ignored` when the
	 * event verified and nothing was registered for its type, which is a normal
	 * outcome and not an error. Answer 2xx either way: the delivery arrived, and
	 * asking the platform to retry an event you do not handle only produces the
	 * same non-event four more times.
	 */
	readonly status: "handled" | "ignored";
	/**
	 * The parsed envelope. Typed as the open shape on purpose: `on` is where
	 * per-type narrowing happens, and a caller reading this field is usually
	 * logging the id rather than reaching into the payload.
	 */
	readonly event: WebhookEnvelope;
	/** How many handlers ran. Zero exactly when `status` is `ignored`. */
	readonly handlers: number;
}

/**
 * Thrown when a registered handler rejected.
 *
 * The failure is not swallowed and it is not returned in a field a caller can
 * forget to read, because the platform retries on a non-2xx and a receiver that
 * quietly drops a grant it failed to fulfill is worse than one that fails
 * loudly and gets the delivery again. Let it propagate, or catch it and answer
 * 500 yourself.
 */
export class WebhookHandlerError extends Error {
	override readonly name = "WebhookHandlerError";
	/** The event whose handlers failed, so a log line can name the delivery id. */
	readonly event: WebhookEnvelope;
	/** Every rejection, not just the first. `cause` is the first of them. */
	readonly errors: readonly unknown[];

	constructor(event: WebhookEnvelope, errors: readonly unknown[]) {
		super(`ActiveKit: webhook handler failed for ${event.type} (${event.id}).`, {
			cause: errors[0],
		});
		this.event = event;
		this.errors = errors;
	}
}

/**
 * Register handlers by event type, then hand one verified request to
 * `dispatch`.
 *
 * ## Why there are two calls and not one
 *
 * `on` alone does nothing: registration is a table, and something still has to
 * check a signature and decide what the body means. `dispatch` is that
 * something, and it is `verify` plus a lookup rather than a second
 * implementation of either — it calls `verifyWebhook` with the arguments you
 * would have passed yourself, so every property verification has (the `ts:body`
 * construction, the tolerance window, multiple `v1` values during a rotation)
 * holds here unchanged, and there is one place where a signature is checked.
 *
 * ## Why it takes raw text rather than a `Request`
 *
 * A `dispatch(request, secret)` that read the body itself would be shorter to
 * call on Workers and unusable on the many Node servers whose body was already
 * consumed by a JSON middleware. Text is the one input every runtime and every
 * framework can produce, and it keeps the raw-body discipline visible at the
 * call site instead of hiding it: what you sign is what you send, and what you
 * verify is what arrived, byte for byte. Nothing between `verifyWebhook`
 * parsing the body and a handler receiving it re-serializes anything.
 *
 * ## Why an unregistered type is a result and not a throw
 *
 * The platform sends `webhook.test` today, from the dashboard's send-test
 * button, and will add types as the product grows. A receiver that threw on an
 * unknown type would break on the platform's next release rather than on its
 * own deploy, which is a failure nobody watching that deploy could have
 * predicted. So an unhandled type answers `{ status: "ignored" }` — visible to
 * the caller, countable in a metric, and not an error.
 *
 * ## Why every handler runs, and why one failing still throws
 *
 * Handlers for one type run concurrently and all of them run, so a handler is
 * never skipped because an unrelated one failed. If any rejected, `dispatch`
 * throws `WebhookHandlerError` carrying every rejection.
 *
 * ## Why this is a standalone factory
 *
 * Receiving a webhook needs a signing secret, not an API key. A receiver that
 * only fulfills grants can hold this and no organization-wide credential.
 * `new ActiveKit(...)` exposes the same two methods for the common case where
 * the process does both.
 */
export interface WebhookRouter {
	/**
	 * Register a handler for one event type. Returns a function that
	 * unregisters it. Several handlers may share a type; all of them run.
	 */
	on<TType extends keyof WebhookEventMap>(
		type: TType,
		handler: WebhookHandler<WebhookEventMap[TType]>,
	): WebhookUnsubscribe;
	/** An event type this SDK does not know yet. The envelope is still typed. */
	on(type: string, handler: WebhookHandler<WebhookEnvelope>): WebhookUnsubscribe;
	/**
	 * Verify one delivery and run what is registered for it. Pass the **raw**
	 * request body, byte for byte, exactly as `verify` takes it.
	 *
	 * Throws `WebhookVerificationError` if the signature, the timestamp or the
	 * body fails to check out, and `WebhookHandlerError` if a handler rejected.
	 */
	dispatch(
		rawBody: string,
		signatureHeader: string,
		secret: string,
		options?: VerifyOptions,
	): Promise<WebhookDispatchResult>;
}

export function createWebhookRouter(): WebhookRouter {
	const registry = new Map<string, Set<WebhookHandler<never>>>();

	const on = (type: string, handler: WebhookHandler<never>): WebhookUnsubscribe => {
		const handlers = registry.get(type) ?? new Set<WebhookHandler<never>>();
		handlers.add(handler);
		registry.set(type, handlers);
		return () => {
			handlers.delete(handler);
			if (handlers.size === 0) registry.delete(type);
		};
	};

	const dispatch = async (
		rawBody: string,
		signatureHeader: string,
		secret: string,
		options?: VerifyOptions,
	): Promise<WebhookDispatchResult> => {
		// The raw text goes straight through. `verifyWebhook` parses it once and
		// hands back the object; nothing here stringifies it again, which is the
		// discipline that keeps the signature meaningful.
		const event = await verifyWebhook<WebhookEnvelope>(rawBody, signatureHeader, secret, options);

		// A body that verified but carries no `type` is not an ActiveKit event.
		// Ignoring it would report `ignored` and invite a 2xx for something
		// nobody can account for.
		if (typeof event?.type !== "string") {
			throw new WebhookVerificationError("Webhook body is not an ActiveKit event envelope.");
		}

		const handlers = [...(registry.get(event.type) ?? [])] as WebhookHandler<WebhookEnvelope>[];
		if (handlers.length === 0) return { status: "ignored", event, handlers: 0 };

		// `async` around the call so a handler that throws synchronously becomes
		// a rejection rather than blowing up the loop before its siblings start.
		const settled = await Promise.allSettled(handlers.map(async (handler) => handler(event)));
		const errors = settled
			.filter((result): result is PromiseRejectedResult => result.status === "rejected")
			.map((result) => result.reason as unknown);
		if (errors.length > 0) throw new WebhookHandlerError(event, errors);

		return { status: "handled", event, handlers: handlers.length };
	};

	return { on, dispatch };
}
