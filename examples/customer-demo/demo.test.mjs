/*
 * The customer demo, exercised end to end against its own mock.
 *
 * Why this file exists
 * --------------------
 * `pnpm demo` was broken for two merges and nobody noticed, because nothing in
 * CI ever ran it. The mock served `POST /v1/subjects/tokens` and read
 * `body.subjectId`; the SDK had moved to `POST /subject-sessions` with
 * `{ subject }`. The first call the demo makes was a 404, and the README
 * advertised the whole thing under "See it running". A test that only imported
 * the files and checked they parse would have stayed green through all of it,
 * so this one boots the real server and makes the real calls.
 *
 * Why it lives here, and not in a package
 * ---------------------------------------
 * `examples/` is deliberately not a pnpm workspace package. Making it one to
 * borrow `pnpm -r test` would also hand it a build, a `publint --strict` run
 * and a size budget, all for code nobody installs. So the recursive `test`
 * script cannot reach it, and the root `test` script names this file directly
 * after recursing. That matters because CI runs exactly one command, `pnpm
 * check`, and `check` calls `test`: a check that CI does not run is the same
 * check that was missing.
 *
 * The other candidate was `packages/server/test/`, which already has a runner.
 * It was rejected: a published package's suite would then depend on
 * `examples/`, which points the dependency the wrong way round. The example
 * consumes the packages, never the reverse.
 *
 * What it asserts
 * ---------------
 * That the demo's calls reach routes the mock actually serves, and that the
 * mock answers in the platform's shapes rather than in shapes reverse
 * engineered from the client. Wherever the call can be made through an SDK, it
 * is: the token route goes through `activekit`'s `subjects.createSession`, the
 * action routes through `events.track`, and the subject reads through
 * `@activekit/js`'s `createClient`. Only the shell's dot is requested by hand,
 * because mounting the shell needs a DOM, and that one is tied back to the
 * built shell bundle instead.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test, { after, before } from "node:test";

import { createClient } from "../../packages/js/dist/index.js";
import { API_KEY } from "./mock-activekit.mjs";

const serverPath = fileURLToPath(new URL("server.mjs", import.meta.url));
const shellBundle = () =>
	readFileSync(
		new URL("../../packages/js/dist/activekit-shell.global.iife.js", import.meta.url),
		"utf8",
	);

/** The subject `server.mjs` acts for. Its own constant, mirrored here. */
const DEMO_SUBJECT = "sub_demo_1";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Ask the OS for a port rather than picking one. Two of these suites running at
 * once, or a stray `pnpm demo`, must not turn into a flaky EADDRINUSE.
 */
const freePort = () =>
	new Promise((resolve, reject) => {
		const probe = createServer();
		probe.on("error", reject);
		probe.listen(0, "127.0.0.1", () => {
			const { port } = probe.address();
			probe.close(() => resolve(port));
		});
	});

let child;
let base;

/** The organization side: what Acme's backend holds, and no browser ever does. */
const apiKeyed = (path, init = {}) =>
	fetch(`${base}/v1${path}`, {
		...init,
		headers: { authorization: `Bearer ${API_KEY}`, "content-type": "application/json", ...init.headers },
	});

/** A subject session, minted the way the platform mints one. */
const session = async (subject) => {
	const res = await apiKeyed("/subject-sessions", {
		method: "POST",
		body: JSON.stringify({ subject }),
	});
	assert.equal(res.status, 200, `minting a session for ${subject} failed`);
	return res.json();
};

const reset = () => fetch(`${base}/api/demo/reset`, { method: "POST" });

before(async () => {
	const port = await freePort();
	base = `http://127.0.0.1:${port}`;
	child = spawn(process.execPath, [serverPath], {
		env: { ...process.env, PORT: String(port) },
		stdio: ["ignore", "pipe", "pipe"],
	});

	let noise = "";
	child.stdout.on("data", (chunk) => (noise += chunk));
	child.stderr.on("data", (chunk) => (noise += chunk));

	for (let attempt = 0; attempt < 100; attempt++) {
		if (child.exitCode !== null) {
			throw new Error(`the demo server exited with ${child.exitCode}: ${noise.trim()}`);
		}
		try {
			await fetch(`${base}/`);
			return;
		} catch {
			await wait(100);
		}
	}
	throw new Error(`the demo server never came up: ${noise.trim()}`);
});

after(() => {
	child?.kill("SIGTERM");
});

// ---------------------------------------------------------------------------
// Acme's backend, which is the half a customer copies.
// ---------------------------------------------------------------------------

test("the token route reaches a route the mock serves", async () => {
	// This is the first call the demo makes, and the one that was a 404. It runs
	// through `subjects.createSession`, so the path and the body are the SDK's
	// rather than this file's opinion of them.
	const res = await fetch(`${base}/api/activekit/token`);
	const body = await res.json();

	assert.equal(res.status, 200, `expected a session, got ${JSON.stringify(body)}`);
	assert.equal(typeof body.token, "string");
	assert.ok(body.token.length > 0);
	assert.ok(Number.isFinite(Date.parse(body.expiresAt)), "expiresAt is not a timestamp");
});

test("a session answers the token, its expiry and the subject it belongs to", async () => {
	const answer = await session("sub_shape_check");

	assert.deepEqual(Object.keys(answer).sort(), ["expiresAt", "subject", "token"]);
	assert.deepEqual(answer.subject, { externalId: "sub_shape_check" });
});

test("the session body is strict, so a wrong field is a 400 and not a shrug", async () => {
	// The strictness is the reason a wrong field name is a bug you find rather
	// than a bug you ship. `ttlSeconds` used to land here and look like it
	// worked; a session's lifetime is the platform's to set.
	const res = await apiKeyed("/subject-sessions", {
		method: "POST",
		body: JSON.stringify({ subject: "sub_strict", ttlSeconds: 60 }),
	});

	assert.equal(res.status, 400);
	assert.equal((await res.json()).code, "invalid_request");
});

test("the old subject-token route is gone, and stays gone", async () => {
	const res = await apiKeyed("/subjects/tokens", {
		method: "POST",
		body: JSON.stringify({ subjectId: DEMO_SUBJECT }),
	});

	assert.equal(res.status, 404, "the mock still serves the route the platform replaced");
});

test("an action records an event in the platform's own field names", async () => {
	await reset();

	const res = await fetch(`${base}/api/actions/practice`, { method: "POST" });
	const event = await res.json();

	assert.equal(res.status, 200, `expected a recorded event, got ${JSON.stringify(event)}`);
	// `subject`, not `subjectId`. The mock read `subjectId` off the body while
	// the SDK sent `subject`, so the subject arrived undefined and progress moved
	// for nobody.
	assert.equal(event.subject, DEMO_SUBJECT);
	assert.deepEqual(Object.keys(event).sort(), [
		"clientTrust",
		"id",
		"late",
		"meta",
		"name",
		"occurredAt",
		"receivedAt",
		"subject",
	]);
	assert.match(event.id, /^evt_/);
	assert.equal(event.name, "practice.checkin");
	// Recorded on an organization API key, server to server. A client-trust
	// event is one a browser could have shaped, and those are barred from
	// reward-bearing criteria.
	assert.equal(event.clientTrust, false);
	assert.equal(event.late, false);
});

test("an action carries its properties through as the platform's meta", async () => {
	await reset();

	const event = await (await fetch(`${base}/api/actions/lesson`, { method: "POST" })).json();

	assert.deepEqual(event.meta, { course: "spanish-101" });
});

test("every route the demo's own page calls answers", async () => {
	// The page makes exactly these three calls of its own. A 404 or a 502 on any
	// of them is `pnpm demo` broken, which is the whole defect this file exists
	// for.
	await reset();

	for (const [method, path] of [
		["GET", "/api/activekit/token"],
		["POST", "/api/actions/refer"],
		["POST", "/api/demo/reset"],
	]) {
		const res = await fetch(`${base}${path}`, { method });
		assert.equal(res.status, 200, `${method} ${path} answered ${res.status}`);
	}
});

// ---------------------------------------------------------------------------
// Idempotency, and the 202. Two platform behaviours a client has to handle, so
// a mock that does not reproduce them teaches a client that breaks in
// production. Driven straight at `/v1/events` because the demo's buttons mint a
// fresh key per click on purpose, to simulate a week of logins in ten seconds.
// ---------------------------------------------------------------------------

test("a retried event replays its first answer instead of writing twice", async () => {
	await reset();
	const subject = "sub_idem";
	const body = JSON.stringify({
		name: "practice.checkin",
		subject,
		idempotencyKey: `${subject}:practice:2026-08-31`,
	});

	const first = await (await apiKeyed("/events", { method: "POST", body })).json();
	const second = await (await apiKeyed("/events", { method: "POST", body })).json();

	// Replay, not suppression: a retry that did advance a campaign must still be
	// told what it recorded, so the whole answer comes back, not an empty ack.
	assert.deepEqual(second, first);

	const { token } = await session(subject);
	const client = createClient({ token, apiUrl: `${base}/v1` });
	const streak = (await client.progress()).campaigns.find((c) => c.id === "cmp_streak");
	assert.equal(streak.goal.achieved, 1, "the retry advanced the streak a second time");
});

test("an unconfirmed event name answers 202 pending, and records nothing", async () => {
	// Not an error. The delivery is dropped rather than recorded, and saying so
	// is the point: a caller that reads every 2xx as recorded believes in events
	// the platform never kept. The demo's three buttons never trip this, which
	// is exactly why it needs a test.
	await reset();
	const subject = "sub_pending";

	const res = await apiKeyed("/events", {
		method: "POST",
		body: JSON.stringify({
			name: "practice.rehearsal",
			subject,
			idempotencyKey: `${subject}:rehearsal:1`,
		}),
	});
	const answer = await res.json();

	assert.equal(res.status, 202);
	assert.deepEqual(answer, { status: "pending_confirmation", name: "practice.rehearsal" });
	assert.equal(answer.id, undefined, "a pending event must not look recorded");

	const { token } = await session(subject);
	const client = createClient({ token, apiUrl: `${base}/v1` });
	const snapshot = await client.progress();
	assert.ok(
		snapshot.campaigns.every((campaign) => campaign.goal.achieved === 0),
		"a pending event moved a goal",
	);
});

// ---------------------------------------------------------------------------
// The browser's half, through the client a customer actually ships.
// ---------------------------------------------------------------------------

test("the browser client reads the snapshot the platform answers", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const client = createClient({ token, apiUrl: `${base}/v1` });

	const snapshot = await client.progress();

	assert.deepEqual(Object.keys(snapshot).sort(), [
		"campaignCount",
		"campaigns",
		"currencyCount",
		"environment",
		"progression",
		"wallets",
	]);
	assert.equal(snapshot.environment, "sandbox");
	assert.equal(snapshot.campaignCount, snapshot.campaigns.length);
	assert.equal(typeof snapshot.progression.xp, "number");
	assert.equal(typeof snapshot.progression.level, "number");
	assert.ok(Array.isArray(snapshot.wallets));
	assert.equal(snapshot.currencyCount, snapshot.wallets.length);
	// Nothing here names the subject. The session already establishes who is
	// asking, and repeating it puts an identifier in a payload that does not
	// need one.
	assert.equal(snapshot.subjectId, undefined);
});

test("campaign progress is the platform's shape, not the one it replaced", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const client = createClient({ token, apiUrl: `${base}/v1` });

	const streak = (await client.progress()).campaigns.find((c) => c.id === "cmp_streak");

	assert.deepEqual(Object.keys(streak).sort(), [
		"completed",
		"endsAt",
		"enrollment",
		"events",
		"goal",
		"id",
		"publishedVersion",
		"reward",
		"startsAt",
		"status",
	]);
	// `live`, not `active`; `goal.achieved`, not a flat `current`. The retired
	// shape is asserted absent because a mock drifting back toward the client's
	// old expectations is exactly how this broke.
	assert.equal(streak.status, "live");
	assert.equal(streak.goal.achieved, 4);
	assert.equal(streak.goal.target, 7);
	assert.equal(streak.goal.longest, 4);
	assert.deepEqual(streak.events, ["practice.checkin"]);
	assert.equal(streak.current, undefined);
	assert.equal(streak.eligible, undefined);
	assert.equal(streak.campaign, undefined);
	// An offer until issuance freezes a copy of it, and tagged as such. A
	// reward read off a grant is history; reading one as the other is how a
	// reversal gets celebrated.
	assert.deepEqual(streak.reward, { source: "campaign", reward: { kind: "credits", amount: 500 } });
});

test("a completed campaign reports its reward from the grant that froze it", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const client = createClient({ token, apiUrl: `${base}/v1` });

	const done = (await client.progress()).campaigns.find((c) => c.id === "cmp_onboarding");

	assert.equal(done.status, "ended");
	assert.equal(done.enrollment, "completed");
	assert.equal(done.completed, true);
	assert.equal(done.reward.source, "grant");
	assert.equal(done.reward.status, "fulfilled");
});

test("grants come back under the envelope key the client reads", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const client = createClient({ token, apiUrl: `${base}/v1` });

	// `client.grants()` destructures `{ grants }`. The mock answered `{ data }`,
	// which resolved undefined while the signature promised an array.
	const grants = await client.grants();

	assert.ok(Array.isArray(grants), "the grants envelope key does not match the client's");
	assert.equal(grants.length, 1);
	assert.deepEqual(Object.keys(grants[0]).sort(), [
		"acknowledgedAt",
		"campaign",
		"firstShown",
		"id",
		"issuedAt",
		"reward",
		"status",
	]);
	assert.match(grants[0].id, /^grant_/);
	assert.deepEqual(Object.keys(grants[0].campaign).sort(), ["id", "name"]);
	assert.ok(["pending", "fulfilled", "voided", "reversed"].includes(grants[0].status));
	assert.equal(grants[0].subjectId, undefined);
	assert.equal(grants[0].campaignId, undefined);
});

test("completing a campaign issues a grant that snapshots its reward", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const client = createClient({ token, apiUrl: `${base}/v1` });

	// Three lessons short of the marathon.
	for (let i = 0; i < 4; i++) await fetch(`${base}/api/actions/lesson`, { method: "POST" });

	const grants = await client.grants();
	const marathon = grants.find((grant) => grant.campaign.id === "cmp_lessons");

	assert.ok(marathon, "finishing the marathon issued no grant");
	assert.equal(marathon.status, "pending");
	assert.deepEqual(marathon.reward, { kind: "badge", badge: "marathon" });
});

// ---------------------------------------------------------------------------
// The shell's dot, and the boundary underneath it.
// ---------------------------------------------------------------------------

test("the dot is the field the shell reads, and the grants read clears it", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const authed = { headers: { authorization: `Bearer ${token}` } };

	// Requested by hand because mounting the shell needs a DOM. Tied back to the
	// built bundle so this stays the shell's call and not this file's memory of
	// it: `unseen` is what the SDK used to read, and `Boolean(undefined)` held
	// the dot off for every subject forever.
	const bundle = shellBundle();
	assert.match(bundle, /\/me\/badge/, "the shell no longer asks for /me/badge");
	assert.match(bundle, /unacknowledged/, "the shell no longer reads `unacknowledged`");

	const before = await (await fetch(`${base}/v1/me/badge`, authed)).json();
	assert.deepEqual(before, { unacknowledged: true });

	// Opening the app is the acknowledgement, and the platform stamps it inside
	// the read rather than as a call of its own. `firstShown` is true exactly
	// once, on the answer that stamped the grant.
	const first = await (await fetch(`${base}/v1/me/grants`, authed)).json();
	assert.equal(first.grants[0].firstShown, true);
	assert.ok(first.grants[0].acknowledgedAt, "the read did not stamp acknowledgment");

	const second = await (await fetch(`${base}/v1/me/grants`, authed)).json();
	assert.equal(second.grants[0].firstShown, false);

	const after = await (await fetch(`${base}/v1/me/badge`, authed)).json();
	assert.deepEqual(after, { unacknowledged: false });
});

test("nothing a subject token can reach writes", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const authed = { method: "POST", headers: { authorization: `Bearer ${token}` } };

	// 405 and not 404, and refused before the credential is read. The shell used
	// to post to `/me/badge/seen` on every open and collect this on each one. A
	// subject who can write is a subject who can mint their own streaks, so the
	// refusal covers every path under `/v1/me`, including ones that do not
	// exist.
	for (const path of ["/v1/me", "/v1/me/badge/seen", "/v1/me/grants", "/v1/me/progress"]) {
		const res = await fetch(`${base}${path}`, authed);
		assert.equal(res.status, 405, `POST ${path} answered ${res.status}`);
		assert.equal(res.headers.get("allow"), "GET, HEAD");
	}
});

test("a subject token cannot record an event", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();

	const res = await fetch(`${base}/v1/events`, {
		method: "POST",
		headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
		body: JSON.stringify({
			name: "practice.checkin",
			subject: DEMO_SUBJECT,
			idempotencyKey: "forged:1",
		}),
	});

	assert.equal(res.status, 401);
});
