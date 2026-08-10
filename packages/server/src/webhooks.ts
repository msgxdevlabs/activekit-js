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

/** Parse `t=1754827200,v1=abc…` into its parts. Unknown keys are ignored. */
const parseHeader = (header: string): { timestamp: number; signatures: string[] } => {
	let timestamp = Number.NaN;
	const signatures: string[] = [];
	for (const part of header.split(",")) {
		const index = part.indexOf("=");
		if (index === -1) continue;
		const key = part.slice(0, index).trim();
		const value = part.slice(index + 1).trim();
		if (key === "t") timestamp = Number(value);
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
	 * can make you fulfil the same reward repeatedly.
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

	const expected = await sign(`${timestamp}.${rawBody}`, secret);

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
	return `t=${timestampSeconds},v1=${await sign(`${timestampSeconds}.${rawBody}`, secret)}`;
}
