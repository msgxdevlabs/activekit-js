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

const SNAPSHOT = {
	subjectId: "sub_1",
	campaigns: [
		{
			campaign: { id: "cmp_1", key: "daily-login", name: "Daily login", status: "active" },
			current: 3,
			target: 7,
			eligible: false,
			completedAt: null,
		},
	],
};

test("refuses to construct without a token", () => {
	assert.throws(() => createClient({ token: "" }), /token. is required/);
});

test("sends the subject JWT and parses the response", async () => {
	const { fetch, calls } = stubFetch([{ body: SNAPSHOT }]);
	const client = createClient({ token: "jwt_abc", fetch, apiUrl: "https://api.test/v1" });

	const snapshot = await client.progress();

	assert.equal(snapshot.subjectId, "sub_1");
	assert.equal(snapshot.campaigns[0].current, 3);
	assert.equal(calls.length, 1);
	assert.equal(calls[0].url, "https://api.test/v1/me/progress");
	assert.equal(calls[0].init.headers.authorization, "Bearer jwt_abc");
});

test("reads grants", async () => {
	const grant = { id: "grant_1", campaignId: "cmp_1", subjectId: "sub_1", status: "recorded" };
	const { fetch, calls } = stubFetch([{ body: { data: [grant] } }]);
	const client = createClient({ token: "jwt", fetch, apiUrl: "https://api.test/v1" });

	const grants = await client.grants();

	assert.deepEqual(grants, [grant]);
	assert.equal(calls[0].url, "https://api.test/v1/me/grants");
});

// ---------------------------------------------------------------------------
// The read-only boundary. These are the tests that matter most in this file:
// anything the browser can write, the browser's owner can forge, so the
// absence of a write path is a security property and not a stylistic one.
// ---------------------------------------------------------------------------

test("exposes no method that could write", () => {
	const client = createClient({ token: "jwt", fetch: async () => new Response("{}") });

	// Walk the prototype chain so inherited methods count too.
	const surface = new Set();
	for (let o = client; o && o !== Object.prototype; o = Object.getPrototypeOf(o)) {
		for (const key of Object.getOwnPropertyNames(o)) surface.add(key);
	}

	for (const forbidden of ["track", "claim", "record", "post", "create", "update", "delete"]) {
		assert.ok(
			!surface.has(forbidden),
			`\`${forbidden}\` is on the browser client. Writes belong in the \`activekit\` server SDK — ` +
				`a subject who can record their own events can mint streaks and referrals at will.`,
		);
	}
});

test("every request is a GET, with no body", async () => {
	const { fetch, calls } = stubFetch([{ body: SNAPSHOT }, { body: { data: [] } }]);
	const client = createClient({ token: "jwt", fetch });

	// Drive the entire public read surface.
	await client.progress();
	await client.grants();

	assert.ok(calls.length > 0, "no requests captured — this test would pass vacuously");
	for (const { url, init } of calls) {
		assert.equal(init.method, "GET", `${url} was not a GET`);
		assert.equal(init.body, undefined, `${url} carried a body`);
		assert.ok(!("content-type" in init.headers), `${url} declared a content type`);
	}
});

test("retries are safe because every request is idempotent", async () => {
	const { fetch, calls } = stubFetch([
		{ status: 503, body: { code: "unavailable", message: "try later" } },
		{ body: SNAPSHOT },
	]);
	const client = createClient({ token: "jwt", fetch });

	const snapshot = await client.progress();

	assert.equal(snapshot.subjectId, "sub_1");
	assert.equal(calls.length, 2);
	// Nothing was mutated on the first attempt, so the retry cannot double-count.
	assert.ok(calls.every((c) => c.init.method === "GET"));
});

test("does not retry a 400 — a bad request stays bad", async () => {
	const { fetch, calls } = stubFetch([
		{
			status: 400,
			body: { code: "invalid_campaign", message: "unknown campaign key" },
			headers: { "content-type": "application/json", "x-request-id": "req_9" },
		},
	]);
	const client = createClient({ token: "jwt", fetch });

	const error = await client.progress().catch((e) => e);

	assert.ok(error instanceof ActiveKitError);
	assert.equal(error.status, 400);
	assert.equal(error.code, "invalid_campaign");
	assert.equal(error.requestId, "req_9");
	assert.match(error.message, /unknown campaign key/);
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

test("emits `progress` on every snapshot, and unsubscribes cleanly", async () => {
	const { fetch } = stubFetch([{ body: SNAPSHOT }, { body: SNAPSHOT }]);
	const client = createClient({ token: "jwt", fetch });

	const seen = [];
	const off = client.on("progress", (s) => seen.push(s.subjectId));

	await client.progress();
	off();
	await client.progress();

	assert.deepEqual(seen, ["sub_1"]);
});

test("one throwing subscriber does not stop the others", async () => {
	const { fetch } = stubFetch([{ body: SNAPSHOT }]);
	const client = createClient({ token: "jwt", fetch });

	const seen = [];
	client.on("progress", () => {
		throw new Error("subscriber blew up");
	});
	client.on("progress", (s) => seen.push(s.subjectId));

	await client.progress();

	assert.deepEqual(seen, ["sub_1"]);
});

test("a destroyed client refuses further requests", async () => {
	const { fetch } = stubFetch([]);
	const client = createClient({ token: "jwt", fetch });

	client.destroy();

	await assert.rejects(() => client.grants(), /destroyed/);
});

test("setToken swaps the credential without rebuilding the client", async () => {
	const { fetch, calls } = stubFetch([{ body: SNAPSHOT }, { body: SNAPSHOT }]);
	const client = createClient({ token: "old", fetch });

	await client.progress();
	client.setToken("new");
	await client.progress();

	assert.equal(calls[0].init.headers.authorization, "Bearer old");
	assert.equal(calls[1].init.headers.authorization, "Bearer new");
});
