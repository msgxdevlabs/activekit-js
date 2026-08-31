// `webhooks.on` and `webhooks.dispatch`, against the envelope the platform
// actually posts.
//
// The bodies here are copied from `apps/api/src/webhook-delivery.ts` in
// `activekit-io`, which serializes each one exactly once and signs those bytes:
// `{ id, type, createdAt, data }`, with the payload under `data` and nothing
// flattened beside it. Tests that assert a shape we invented would pass forever
// while the integration failed on first contact.
//
// Tests run against `dist/`, not `src/` — the published artifact is what
// customers execute. `pnpm check` builds first.
import assert from "node:assert/strict";
import test from "node:test";

import {
	ActiveKit,
	createWebhookRouter,
	signWebhook,
	WebhookHandlerError,
	WebhookVerificationError,
} from "../dist/index.js";

const SECRET = "whsec_test_do_not_use";
const NOW = 1_754_827_200; // fixed clock; a time-dependent test is a flaky test
const now = () => NOW * 1000;

/** One grant, exactly as `renderGrant` puts it on the wire. */
const GRANT = {
	id: "grant_9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f",
	campaign: { id: "campaign_9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f", name: "Top-up bonus" },
	app: { id: "app_9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f", name: "Support Copilot", slug: "support-copilot" },
	subject: { externalId: "user_8c1d2e" },
	environment: "production",
	status: "pending",
	reward: { kind: "credits", amount: 500 },
	issuedAt: "2026-08-22T09:30:00.000Z",
	updatedAt: "2026-08-22T09:30:00.000Z",
};

const GRANT_CREATED = JSON.stringify({
	id: "whd_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
	type: "grant.created",
	createdAt: "2026-08-22T09:30:00.000Z",
	data: { grant: GRANT },
});

/** What the dashboard's send-test button posts. No grant, and it says so. */
const WEBHOOK_TEST = JSON.stringify({
	id: "whtest_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
	type: "webhook.test",
	createdAt: "2026-08-22T09:30:00.000Z",
	data: {
		test: true,
		endpoint: "whep_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
		environment: "production",
		message: "This is a test delivery from ActiveKit.",
	},
});

const deliver = async (router, body, options = {}) =>
	router.dispatch(body, await signWebhook(body, SECRET, NOW), SECRET, { now, ...options });

test("runs the handler registered for the event type, with the envelope intact", async () => {
	const router = createWebhookRouter();
	const seen = [];
	router.on("grant.created", (event) => {
		seen.push(event);
	});

	const result = await deliver(router, GRANT_CREATED);

	assert.equal(result.status, "handled");
	assert.equal(result.handlers, 1);
	assert.equal(seen.length, 1);
	// The four envelope fields, and the grant under `data` rather than beside it.
	assert.equal(seen[0].id, "whd_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d");
	assert.equal(seen[0].type, "grant.created");
	assert.equal(seen[0].createdAt, "2026-08-22T09:30:00.000Z");
	assert.deepEqual(seen[0].data.grant, GRANT);
	// There is no flattened `user` or `credits`. The reward is a snapshot on the
	// grant, and reaching for anything else finds undefined rather than a value.
	assert.equal(seen[0].data.user, undefined);
	assert.equal(seen[0].data.credits, undefined);
});

test("refuses a delivery whose signature does not check out, before any handler runs", async () => {
	const router = createWebhookRouter();
	let ran = false;
	router.on("grant.created", () => {
		ran = true;
	});
	const header = await signWebhook(GRANT_CREATED, SECRET, NOW);
	const tampered = GRANT_CREATED.replace('"amount":500', '"amount":500000');

	await assert.rejects(
		() => router.dispatch(tampered, header, SECRET, { now }),
		WebhookVerificationError,
	);
	assert.equal(ran, false, "a handler ran for a body that failed verification");
});

test("dispatches the raw bytes it was handed, never a re-serialized copy", async () => {
	// The discipline `verify` exists for, carried into dispatch. This body is
	// signed with whitespace a serializer would not reproduce, so a dispatch that
	// parsed and re-stringified before verifying would hand different bytes to
	// the HMAC and fail. It looks like a broken secret when it happens in
	// production, which is why it is pinned here instead.
	const spaced = `{ "id": "whd_spaced", "type": "grant.created", "createdAt": "2026-08-22T09:30:00.000Z", "data": { "grant": ${JSON.stringify(GRANT)} } }`;
	assert.notEqual(JSON.stringify(JSON.parse(spaced)), spaced, "the fixture is not actually re-serialization-sensitive");

	const router = createWebhookRouter();
	const seen = [];
	router.on("grant.created", (event) => {
		seen.push(event.id);
	});

	const result = await deliver(router, spaced);

	assert.equal(result.status, "handled");
	assert.deepEqual(seen, ["whd_spaced"]);
});

test("an unregistered event type is ignored, not thrown", async () => {
	// `webhook.test` is not hypothetical: the dashboard's send-test button posts
	// it at every endpoint, so a receiver that registered only `grant.created`
	// meets this on its first day. Throwing here would also mean the platform's
	// next event type breaks receivers on the platform's deploy rather than on
	// their own.
	const router = createWebhookRouter();
	let ran = false;
	router.on("grant.created", () => {
		ran = true;
	});

	const result = await deliver(router, WEBHOOK_TEST);

	assert.equal(result.status, "ignored");
	assert.equal(result.handlers, 0);
	assert.equal(result.event.type, "webhook.test");
	assert.equal(result.event.data.test, true);
	assert.equal(ran, false);
});

test("a failing handler surfaces rather than being swallowed", async () => {
	// The platform retries a non-2xx on a schedule. A receiver that dropped a
	// grant it could not fulfill and answered 200 anyway would never see it
	// again; one that throws gets the delivery back.
	const router = createWebhookRouter();
	const boom = new Error("billing system refused");
	router.on("grant.created", () => {
		throw boom;
	});

	await assert.rejects(() => deliver(router, GRANT_CREATED), (error) => {
		assert.ok(error instanceof WebhookHandlerError, `expected WebhookHandlerError, got ${error?.name}`);
		assert.deepEqual(error.errors, [boom]);
		assert.equal(error.cause, boom);
		assert.equal(error.event.id, "whd_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d");
		assert.match(error.message, /grant\.created/);
		return true;
	});
});

test("a rejected promise from a handler surfaces the same way as a throw", async () => {
	const router = createWebhookRouter();
	router.on("grant.created", async () => {
		throw new Error("async failure");
	});

	await assert.rejects(() => deliver(router, GRANT_CREATED), WebhookHandlerError);
});

test("every handler runs even when one of them fails", async () => {
	// A handler skipped because an unrelated one threw is a silent half-delivery,
	// and the retry then re-runs the ones that already succeeded.
	const router = createWebhookRouter();
	const ran = [];
	router.on("grant.created", async () => {
		ran.push("first");
	});
	router.on("grant.created", async () => {
		ran.push("second");
		throw new Error("second failed");
	});
	router.on("grant.created", async () => {
		ran.push("third");
	});

	await assert.rejects(() => deliver(router, GRANT_CREATED), (error) => {
		assert.equal(error.errors.length, 1);
		return true;
	});
	assert.deepEqual(ran.sort(), ["first", "second", "third"]);
});

test("collects every failure, not just the first", async () => {
	const router = createWebhookRouter();
	router.on("grant.created", () => {
		throw new Error("one");
	});
	router.on("grant.created", () => {
		throw new Error("two");
	});

	await assert.rejects(() => deliver(router, GRANT_CREATED), (error) => {
		assert.deepEqual(error.errors.map((e) => e.message).sort(), ["one", "two"]);
		return true;
	});
});

test("several handlers share a type, and unsubscribing removes exactly one", async () => {
	const router = createWebhookRouter();
	const ran = [];
	const off = router.on("grant.created", () => ran.push("a"));
	router.on("grant.created", () => ran.push("b"));

	const both = await deliver(router, GRANT_CREATED);
	assert.equal(both.handlers, 2);

	off();
	const one = await deliver(router, GRANT_CREATED);

	assert.equal(one.handlers, 1);
	assert.deepEqual(ran, ["a", "b", "b"]);
});

test("unsubscribing the last handler for a type returns the type to ignored", async () => {
	const router = createWebhookRouter();
	const off = router.on("grant.created", () => {});
	off();

	const result = await deliver(router, GRANT_CREATED);

	assert.equal(result.status, "ignored");
	assert.equal(result.handlers, 0);
});

test("refuses a signed body that is not an ActiveKit envelope", async () => {
	// It verified, so it was signed with this secret. It still names no event,
	// and reporting `ignored` would invite a 2xx for something nobody can account
	// for.
	const router = createWebhookRouter();
	const body = JSON.stringify({ hello: "world" });

	await assert.rejects(() => deliver(router, body), /not an ActiveKit event envelope/);
});

test("the tolerance window applies to dispatch exactly as it does to verify", async () => {
	const router = createWebhookRouter();
	router.on("grant.created", () => {});
	const stale = await signWebhook(GRANT_CREATED, SECRET, NOW - 3600);

	await assert.rejects(() => router.dispatch(GRANT_CREATED, stale, SECRET, { now }), /tolerance/);
});

test("a router needs no API key, and the client exposes the same two calls", async () => {
	// Receiving a webhook needs a signing secret. Requiring an organization-wide
	// API key in a process that only fulfills grants would be a worse posture,
	// so the factory stands alone.
	assert.equal(typeof createWebhookRouter().on, "function");

	const kit = new ActiveKit({ apiKey: "ak_test", fetch: async () => new Response("{}") });
	const seen = [];
	kit.webhooks.on("grant.created", (event) => seen.push(event.id));

	const result = await kit.webhooks.dispatch(
		GRANT_CREATED,
		await signWebhook(GRANT_CREATED, SECRET, NOW),
		SECRET,
		{ now },
	);

	assert.equal(result.status, "handled");
	assert.deepEqual(seen, ["whd_1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"]);
});

test("two clients keep separate registries", async () => {
	const stub = async () => new Response("{}");
	const a = new ActiveKit({ apiKey: "ak_a", fetch: stub });
	const b = new ActiveKit({ apiKey: "ak_b", fetch: stub });
	a.webhooks.on("grant.created", () => {});

	const onB = await b.webhooks.dispatch(
		GRANT_CREATED,
		await signWebhook(GRANT_CREATED, SECRET, NOW),
		SECRET,
		{ now },
	);

	assert.equal(onB.status, "ignored");
});
