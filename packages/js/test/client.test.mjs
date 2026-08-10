// Tests run against `dist/`, not `src/` — the published artifact is what
// customers execute, so it is what gets asserted on. `pnpm check` builds first.
import assert from "node:assert/strict";
import test from "node:test";

import { ActiveKitError, createClient } from "../dist/index.js";

/** Minimal fetch double. Returns queued responses in order and records calls. */
const stubFetch = (responses) => {
	const calls = [];
	const queue = [...responses];
	const fetch = async (url, init) => {
		calls.push({ url, init });
		const next = queue.shift();
		if (!next) throw new Error(`Unexpected extra request to ${url}`);
		if (next instanceof Error) throw next;
		return new Response(next.body === undefined ? null : JSON.stringify(next.body), {
			status: next.status ?? 200,
			headers: next.headers ?? { "content-type": "application/json" },
		});
	};
	return { fetch, calls };
};

test("refuses to construct without a token", () => {
	assert.throws(() => createClient({ token: "" }), /token. is required/);
});

test("sends the subject JWT and parses the response", async () => {
	const { fetch, calls } = stubFetch([{ body: { eventId: "evt_1", advanced: ["daily-login"] } }]);
	const client = createClient({ token: "jwt_abc", fetch, apiUrl: "https://api.test/v1" });

	const result = await client.track("session_start", { plan: "free" });

	assert.deepEqual(result, { eventId: "evt_1", advanced: ["daily-login"] });
	assert.equal(calls.length, 1);
	assert.equal(calls[0].url, "https://api.test/v1/events");
	assert.equal(calls[0].init.headers.authorization, "Bearer jwt_abc");
	assert.deepEqual(JSON.parse(calls[0].init.body), {
		name: "session_start",
		properties: { plan: "free" },
	});
});

test("forwards the idempotency key so a retry cannot double-count", async () => {
	const { fetch, calls } = stubFetch([{ body: { eventId: "evt_2", advanced: [] } }]);
	const client = createClient({ token: "jwt", fetch });

	await client.track("streak_day", {}, { idempotencyKey: "2026-08-10:subject_1" });

	assert.equal(calls[0].init.headers["idempotency-key"], "2026-08-10:subject_1");
});

test("omits the idempotency header when none was given", async () => {
	const { fetch, calls } = stubFetch([{ body: { eventId: "evt_3", advanced: [] } }]);
	const client = createClient({ token: "jwt", fetch });

	await client.track("streak_day");

	assert.ok(!("idempotency-key" in calls[0].init.headers));
});

test("retries a 503 and succeeds", async () => {
	const { fetch, calls } = stubFetch([
		{ status: 503, body: { code: "unavailable", message: "try later" } },
		{ body: { eventId: "evt_4", advanced: [] } },
	]);
	const client = createClient({ token: "jwt", fetch });

	const result = await client.track("session_start");

	assert.equal(result.eventId, "evt_4");
	assert.equal(calls.length, 2);
});

test("does not retry a 400 — a bad request stays bad", async () => {
	const { fetch, calls } = stubFetch([
		{
			status: 400,
			body: { code: "invalid_event", message: "unknown event name" },
			headers: { "content-type": "application/json", "x-request-id": "req_9" },
		},
	]);
	const client = createClient({ token: "jwt", fetch });

	const error = await client.track("nope").catch((e) => e);

	assert.ok(error instanceof ActiveKitError);
	assert.equal(error.status, 400);
	assert.equal(error.code, "invalid_event");
	assert.equal(error.requestId, "req_9");
	assert.match(error.message, /unknown event name/);
	assert.equal(calls.length, 1);
});

test("gives up after maxRetries and surfaces the last error", async () => {
	const { fetch, calls } = stubFetch([
		{ status: 500, body: { code: "internal" } },
		{ status: 500, body: { code: "internal" } },
	]);
	const client = createClient({ token: "jwt", fetch, maxRetries: 1 });

	const error = await client.progress().catch((e) => e);

	assert.ok(error instanceof ActiveKitError);
	assert.equal(error.status, 500);
	assert.equal(calls.length, 2);
});

test("survives a non-JSON error body from something in front of the API", async () => {
	const { fetch } = stubFetch([
		{ status: 403, body: undefined, headers: { "content-type": "text/html" } },
	]);
	const client = createClient({ token: "jwt", fetch });

	const error = await client.grants().catch((e) => e);

	assert.equal(error.code, "unknown_error");
	assert.equal(error.status, 403);
});

test("a rejected claim is a result, not an exception", async () => {
	const { fetch } = stubFetch([
		{ body: { granted: false, grant: null, reason: "budget_exhausted" } },
	]);
	const client = createClient({ token: "jwt", fetch });

	const result = await client.claim("referral");

	assert.equal(result.granted, false);
	assert.equal(result.reason, "budget_exhausted");
});

test("emits `grant` when the server issues one, and unsubscribes cleanly", async () => {
	const grant = { id: "grn_1", programId: "prg_1", subjectId: "sub_1", status: "recorded" };
	const { fetch } = stubFetch([
		{ body: { granted: true, grant, reason: null } },
		{ body: { granted: true, grant, reason: null } },
	]);
	const client = createClient({ token: "jwt", fetch });

	const seen = [];
	const off = client.on("grant", (g) => seen.push(g.id));

	await client.claim("daily-login");
	off();
	await client.claim("daily-login");

	assert.deepEqual(seen, ["grn_1"]);
});

test("one throwing subscriber does not stop the others", async () => {
	const { fetch } = stubFetch([
		{ body: { granted: true, grant: { id: "grn_2" }, reason: null } },
	]);
	const client = createClient({ token: "jwt", fetch });

	const seen = [];
	client.on("grant", () => {
		throw new Error("subscriber blew up");
	});
	client.on("grant", (g) => seen.push(g.id));

	await client.claim("daily-login");

	assert.deepEqual(seen, ["grn_2"]);
});

test("a destroyed client refuses further requests", async () => {
	const { fetch } = stubFetch([]);
	const client = createClient({ token: "jwt", fetch });

	client.destroy();

	await assert.rejects(() => client.grants(), /destroyed/);
});

test("setToken swaps the credential without rebuilding the client", async () => {
	const { fetch, calls } = stubFetch([
		{ body: { eventId: "e", advanced: [] } },
		{ body: { eventId: "e", advanced: [] } },
	]);
	const client = createClient({ token: "old", fetch });

	await client.track("a");
	client.setToken("new");
	await client.track("b");

	assert.equal(calls[0].init.headers.authorization, "Bearer old");
	assert.equal(calls[1].init.headers.authorization, "Bearer new");
});
