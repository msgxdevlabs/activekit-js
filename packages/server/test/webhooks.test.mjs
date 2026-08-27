import assert from "node:assert/strict";
import test from "node:test";

import { ActiveKit, WebhookVerificationError, signWebhook, verifyWebhook } from "../dist/index.js";

const SECRET = "whsec_test_do_not_use";
const BODY = JSON.stringify({ type: "grant.created", data: { id: "grant_1", amount: 100 } });
const NOW = 1_754_827_200; // fixed clock; a time-dependent test is a flaky test
const now = () => NOW * 1000;

test("accepts a signature it just produced", async () => {
	const header = await signWebhook(BODY, SECRET, NOW);

	const event = await verifyWebhook(BODY, header, SECRET, { now });

	assert.equal(event.type, "grant.created");
	assert.equal(event.data.id, "grant_1");
});

test("rejects a tampered body", async () => {
	const header = await signWebhook(BODY, SECRET, NOW);
	const tampered = BODY.replace('"amount":100', '"amount":100000');

	await assert.rejects(
		() => verifyWebhook(tampered, header, SECRET, { now }),
		WebhookVerificationError,
	);
});

test("rejects the wrong secret", async () => {
	const header = await signWebhook(BODY, SECRET, NOW);

	await assert.rejects(
		() => verifyWebhook(BODY, header, "whsec_someone_elses", { now }),
		/Signature mismatch/,
	);
});

test("rejects a replay outside the tolerance window", async () => {
	const header = await signWebhook(BODY, SECRET, NOW - 3600);

	await assert.rejects(() => verifyWebhook(BODY, header, SECRET, { now }), /tolerance/);
});

test("accepts a replay inside the tolerance window", async () => {
	const header = await signWebhook(BODY, SECRET, NOW - 120);

	const event = await verifyWebhook(BODY, header, SECRET, { now });

	assert.equal(event.type, "grant.created");
});

test("rejects a future timestamp beyond tolerance — a skewed clock is still an attack surface", async () => {
	const header = await signWebhook(BODY, SECRET, NOW + 3600);

	await assert.rejects(() => verifyWebhook(BODY, header, SECRET, { now }), /tolerance/);
});

test("accepts either signature during a secret rotation", async () => {
	const oldHeader = await signWebhook(BODY, "whsec_old", NOW);
	const newHeader = await signWebhook(BODY, SECRET, NOW);
	const oldSig = oldHeader.split("v1=")[1];
	const newSig = newHeader.split("v1=")[1];
	// The platform's format: semicolons, and `ts` rather than `t`.
	const dualHeader = `ts=${NOW};v1=${oldSig};v1=${newSig}`;

	const event = await verifyWebhook(BODY, dualHeader, SECRET, { now });

	assert.equal(event.type, "grant.created");
});

test("rejects a malformed header rather than guessing", async () => {
	for (const header of ["", "garbage", "v1=abc", `t=${NOW}`, "t=notanumber,v1=abc"]) {
		await assert.rejects(
			() => verifyWebhook(BODY, header, SECRET, { now }),
			WebhookVerificationError,
			`should have rejected: ${JSON.stringify(header)}`,
		);
	}
});

test("rejects a signed body that is not JSON", async () => {
	const raw = "not json at all";
	const header = await signWebhook(raw, SECRET, NOW);

	await assert.rejects(() => verifyWebhook(raw, header, SECRET, { now }), /not valid JSON/);
});

test("re-serializing the body breaks verification — the documented footgun", async () => {
	const header = await signWebhook(BODY, SECRET, NOW);
	// What `JSON.stringify(await request.json())` produces: same data, different bytes.
	const reserialized = JSON.stringify({ data: { amount: 100, id: "grant_1" }, type: "grant.created" });

	assert.notEqual(reserialized, BODY);
	await assert.rejects(() => verifyWebhook(reserialized, header, SECRET, { now }), /mismatch/);
});

test("client requires an API key", () => {
	assert.throws(() => new ActiveKit({ apiKey: "" }), /apiKey. is required/);
});

test("records an event with an idempotency key", async () => {
	const calls = [];
	const client = new ActiveKit({
		apiKey: "ak_live_x",
		apiUrl: "https://api.test/v1",
		fetch: async (url, init) => {
			calls.push({ url, init });
			return new Response(JSON.stringify({
				id: "evt_1", name: "session_start", subject: "sub_1",
				meta: null, clientTrust: false,
				occurredAt: "2026-08-10T00:00:00.000Z", receivedAt: "2026-08-10T00:00:00.000Z", late: false,
			}), {
				headers: { "content-type": "application/json" },
			});
		},
	});

	await client.events.record({
		subjectId: "sub_1",
		name: "session_start",
		idempotencyKey: "sub_1:2026-08-10",
	});

	assert.equal(calls[0].url, "https://api.test/v1/events");
	assert.equal(calls[0].init.headers.authorization, "Bearer ak_live_x");
	// In the body, under the platform's own field names, because its body is a
	// strict object: `subject` rather than `subjectId`, and the idempotency key
	// required rather than sent as a header nothing reads.
	assert.deepEqual(JSON.parse(calls[0].init.body), {
		name: "session_start",
		subject: "sub_1",
		idempotencyKey: "sub_1:2026-08-10",
	});
});

test("builds a grants query without empty parameters", async () => {
	let seen = "";
	const client = new ActiveKit({
		apiKey: "ak_live_x",
		apiUrl: "https://api.test/v1",
		fetch: async (url) => {
			seen = url;
			return new Response(JSON.stringify({ grants: [] }), {
				headers: { "content-type": "application/json" },
			});
		},
	});

	await client.grants.list({ subjectId: "sub_1", environment: "production" });

	// The platform's query schema is not strict: it strips what it does not
	// know rather than refusing it, so a wrong parameter name silently widens
	// the answer to the whole organization. These names are its names.
	assert.equal(seen, "https://api.test/v1/grants?subject=sub_1&environment=production");
});

test("no query string when there are no parameters", async () => {
	let seen = "";
	const client = new ActiveKit({
		apiKey: "ak_live_x",
		apiUrl: "https://api.test/v1",
		fetch: async (url) => {
			seen = url;
			return new Response(JSON.stringify({ grants: [] }), {
				headers: { "content-type": "application/json" },
			});
		},
	});

	await client.grants.list();

	assert.equal(seen, "https://api.test/v1/grants");
});
