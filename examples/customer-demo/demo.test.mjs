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
const standInSource = () =>
	readFileSync(new URL("../dummy-app/public/embed.js", import.meta.url), "utf8");

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

	const event = await (await fetch(`${base}/api/actions/grammar`, { method: "POST" })).json();

	assert.deepEqual(event.meta, { course: "spanish-101" });
});

test("every route the demo's own page calls answers", async () => {
	// The page has a button for every one of these, one per objective of Acme's
	// game plus the token fetch and the reset. A 404 or a 502 on any of them is
	// `pnpm demo` broken, which is the whole defect this file exists for.
	await reset();

	for (const [method, path] of [
		["GET", "/api/activekit/token"],
		["POST", "/api/actions/practice"],
		["POST", "/api/actions/grammar"],
		["POST", "/api/actions/listening"],
		["POST", "/api/actions/speaking"],
		["POST", "/api/actions/refer"],
		["POST", "/api/actions/sprint"],
		["POST", "/api/demo/reset"],
	]) {
		const res = await fetch(`${base}${path}`, { method });
		assert.equal(res.status, 200, `${method} ${path} answered ${res.status}`);
	}
});

// ---------------------------------------------------------------------------
// Idempotency, and the 202. Two platform behaviors a client has to handle, so
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
	const streak = (await client.progress()).campaigns.find((c) => c.id === "cmp_streak_7");
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
		"game",
		"progression",
		"streak",
		"wallets",
	]);
	assert.equal(snapshot.environment, "sandbox");
	assert.equal(snapshot.campaignCount, snapshot.campaigns.length);
	// Two facts and no configuration: what a game is made of reaches a subject
	// as the campaigns beside it.
	assert.deepEqual(Object.keys(snapshot.game).sort(), ["id", "status"]);
	assert.equal(snapshot.game.status, "live");
	// The level band rides the wire, so an "XP to the next level" line is
	// subtraction over served numbers rather than the platform's curve
	// re-derived out here.
	assert.deepEqual(Object.keys(snapshot.progression).sort(), [
		"level",
		"levelFloorXp",
		"nextLevelXp",
		"xp",
	]);
	const { xp, level, levelFloorXp, nextLevelXp } = snapshot.progression;
	assert.ok(levelFloorXp <= xp && xp < nextLevelXp, `${xp} is outside level ${level}`);
	assert.deepEqual(Object.keys(snapshot.streak).sort(), ["current", "longest"]);
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

	const streak = (await client.progress()).campaigns.find((c) => c.id === "cmp_streak_7");

	assert.deepEqual(Object.keys(streak).sort(), [
		"cadence",
		"completed",
		"completedAt",
		"endsAt",
		"enrollment",
		"events",
		"goal",
		"id",
		"periodEndsAt",
		"periodKey",
		"publishedVersion",
		"reward",
		"slot",
		"startsAt",
		"status",
		"title",
		"xp",
	]);
	// `live`, not `active`; `goal.achieved`, not a flat `current`. The retired
	// shape is asserted absent because a mock drifting back toward the client's
	// old expectations is exactly how this broke.
	assert.equal(streak.status, "live");
	assert.equal(streak.goal.achieved, 4);
	assert.equal(streak.goal.target, 7);
	assert.equal(streak.goal.longest, 4);
	assert.deepEqual(streak.events, ["practice.checkin"]);
	// The player-facing sentence rides the wire; the operator's own campaign
	// name never does, and is answered only on a grant.
	assert.equal(streak.title, "Practice seven days running");
	assert.equal(streak.name, undefined);
	// A side quest has no clock, so it covers no period.
	assert.equal(streak.slot, "side");
	assert.equal(streak.cadence, "once");
	assert.equal(streak.periodKey, null);
	assert.equal(streak.periodEndsAt, null);
	assert.equal(streak.xp, 50);
	assert.equal(streak.current, undefined);
	assert.equal(streak.eligible, undefined);
	assert.equal(streak.campaign, undefined);
	// An offer until issuance freezes a copy of it, and tagged as such. A
	// reward read off a grant is history; reading one as the other is how a
	// reversal gets celebrated.
	assert.deepEqual(streak.reward, { source: "campaign", reward: { kind: "credits", amount: 1500 } });
});

test("a completed campaign reports its reward from the grant that froze it", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const client = createClient({ token, apiUrl: `${base}/v1` });

	const done = (await client.progress()).campaigns.find((c) => c.id === "cmp_onboarding");

	assert.equal(done.status, "ended");
	// Two values and never a third: a finished campaign is still one the subject
	// enrolled in, with `completed` and `completedAt` beside it saying the rest.
	// `completed` was a third `enrollment` the wire cannot answer, and it lived
	// in this mock rather than in the platform until the types caught it.
	assert.equal(done.enrollment, "enrolled");
	assert.equal(done.completed, true);
	assert.ok(Number.isFinite(Date.parse(done.completedAt)), "completedAt is not a timestamp");
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

	// Two steps short of this week's chain: the seed leaves `grammar` ticked.
	await fetch(`${base}/api/actions/listening`, { method: "POST" });
	await fetch(`${base}/api/actions/speaking`, { method: "POST" });

	const grants = await client.grants();
	const week = grants.find((grant) => grant.campaign.id === "cmp_week_chain");

	assert.ok(week, "finishing the week's chain issued no grant");
	assert.equal(week.status, "pending");
	assert.deepEqual(week.reward, { kind: "credits", amount: 500 });
	// One grant for the week, not one per objective: five grants a week per
	// subject meters the customer's ledger five times for one behavior.
	assert.equal(grants.filter((grant) => grant.campaign.id === "cmp_week_chain").length, 1);
});

// ---------------------------------------------------------------------------
// The game model: one game per app, with its campaigns placed in slots that
// each run on their own clock. Acme's game fills all four, so every shape the
// widget has to draw is exercised by the demo rather than described in a doc.
// ---------------------------------------------------------------------------

/** The subject's snapshot, through the client a customer actually ships. */
const snapshot = async () => {
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	return createClient({ token, apiUrl: `${base}/v1` }).progress();
};

test("every campaign names the slot it fills, and the game fills all four", async () => {
	await reset();

	const { campaigns } = await snapshot();

	// A campaign with no slot is one published before the game model, and this
	// game has none: the widget cannot place a campaign it cannot put in a
	// region, so a null here is a card with nowhere to draw.
	assert.ok(
		campaigns.every((campaign) => campaign.slot !== null),
		"a campaign reached the wire with no slot",
	);
	assert.deepEqual(
		[...new Set(campaigns.map((campaign) => campaign.slot))].sort(),
		["daily", "event", "main", "side"],
	);
});

test("the period keys name the clock each slot runs on", async () => {
	await reset();

	const byId = Object.fromEntries((await snapshot()).campaigns.map((c) => [c.id, c]));

	// A UTC day for a daily objective, an ISO week for the main quest, and
	// nothing at all for a campaign that runs once. Two instances of one
	// objective differ by this and by nothing else a reader can see.
	assert.equal(byId["cmp_daily_practice"].cadence, "daily");
	assert.match(byId["cmp_daily_practice"].periodKey, /^\d{4}-\d{2}-\d{2}$/);
	assert.equal(byId["cmp_week_chain"].cadence, "weekly");
	assert.match(byId["cmp_week_chain"].periodKey, /^\d{4}-W\d{2}$/);
	assert.equal(byId["cmp_referral"].periodKey, null);

	for (const id of ["cmp_daily_practice", "cmp_week_chain"]) {
		const ends = Date.parse(byId[id].periodEndsAt);
		assert.ok(Number.isFinite(ends), `${id} has no period end`);
		assert.ok(ends > Date.now(), `${id}'s period has already stopped`);
	}
	assert.equal(byId["cmp_referral"].periodEndsAt, null);
});

test("a checklist reports its steps, and one event ticks exactly one of them", async () => {
	await reset();

	const before = (await snapshot()).campaigns.find((c) => c.id === "cmp_week_chain");
	assert.equal(before.goal.kind, "checklist");
	// `achieved` counts the steps that are done, so a bar and a list drawn from
	// the same goal cannot disagree.
	assert.equal(before.goal.achieved, 1);
	assert.equal(before.goal.target, 3);
	assert.deepEqual(Object.keys(before.goal.steps[0]).sort(), [
		"achieved",
		"done",
		"key",
		"target",
	]);
	// No title and no XP on a step: neither is served, and a surface that wants
	// them writes its own words rather than reading a field that is not there.
	assert.equal(before.goal.steps[0].title, undefined);
	assert.equal(before.goal.steps[0].xp, undefined);
	assert.deepEqual(
		before.goal.steps.map((step) => [step.key, step.done]),
		[
			["grammar", true],
			["listening", false],
			["speaking", false],
		],
	);

	await fetch(`${base}/api/actions/listening`, { method: "POST" });

	const after = (await snapshot()).campaigns.find((c) => c.id === "cmp_week_chain");
	assert.deepEqual(
		after.goal.steps.map((step) => [step.key, step.done]),
		[
			["grammar", true],
			["listening", true],
			["speaking", false],
		],
	);
	assert.equal(after.goal.achieved, 2);
	assert.equal(after.completed, false);
});

test("a daily objective pays XP and writes no grant at all", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const client = createClient({ token, apiUrl: `${base}/v1` });
	const grantsBefore = (await client.grants()).length;
	const xpBefore = (await client.progress()).progression.xp;

	await fetch(`${base}/api/actions/practice`, { method: "POST" });

	const after = await client.progress();
	const daily = after.campaigns.find((c) => c.id === "cmp_daily_practice");
	assert.equal(daily.completed, true);
	// A reward of kind `none`, which is the commonest the game model writes: the
	// customer's ledger is never touched, so there is no grant row to record and
	// nothing to celebrate. Only the XP moves.
	assert.deepEqual(daily.reward, { source: "campaign", reward: { kind: "none" } });
	assert.equal(after.progression.xp, xpBefore + 20);
	assert.equal((await client.grants()).length, grantsBefore, "a `none` reward issued a grant");
});

test("a credits grant credits the wallet the balance projects over", async () => {
	await reset();
	const { token } = await (await fetch(`${base}/api/activekit/token`)).json();
	const client = createClient({ token, apiUrl: `${base}/v1` });
	assert.deepEqual((await client.progress()).wallets, [], "the seed starts with a balance");

	await fetch(`${base}/api/actions/listening`, { method: "POST" });
	await fetch(`${base}/api/actions/speaking`, { method: "POST" });

	const after = await client.progress();
	// The player-facing balance, `wallets`, and never the customer's own credit
	// economy, which is a different object under a different word.
	assert.deepEqual(after.wallets, [{ currency: "coins", balance: 500 }]);
	assert.equal(after.currencyCount, 1);
	// Two steps at 30 and the chain's own 100, which is the one slot that pays
	// twice for a week: per objective on the way, and once when the last ticks.
	assert.equal(after.progression.xp, 340 + 30 + 30 + 100);
});

test("a streak carries the best run beside the run still standing", async () => {
	await reset();

	await fetch(`${base}/api/actions/practice`, { method: "POST" });

	const streak = (await snapshot()).campaigns.find((c) => c.id === "cmp_streak_7");
	assert.equal(streak.goal.kind, "streak");
	assert.equal(streak.goal.achieved, 5);
	assert.equal(streak.goal.longest, 5);
	// One event, two campaigns: the check-in moves today's objective and the
	// streak milestone beside it, because both name it in their criteria.
	assert.equal(
		(await snapshot()).campaigns.find((c) => c.id === "cmp_daily_practice").completed,
		true,
	);
});

test("the activity streak starts at zero and moves only on a daily objective", async () => {
	// The top-level `streak`, not the campaign goal of the same name: the days
	// the game's daily slot was finished. A subject who has finished none reads
	// 0 and 0, which the widget draws as a chip rather than hides.
	await reset();
	const subject = "sub_activity_streak";
	const { token } = await session(subject);
	const client = createClient({ token, apiUrl: `${base}/v1` });
	const track = (name, key) =>
		apiKeyed("/events", {
			method: "POST",
			body: JSON.stringify({ name, subject, idempotencyKey: `${subject}:${key}` }),
		});

	assert.deepEqual((await client.progress()).streak, { current: 0, longest: 0 });

	// A side quest's event moves its own goal and never the streak, which reads
	// XP paid by the daily slot and nothing else.
	await track("referral.converted", "refer:1");
	assert.deepEqual((await client.progress()).streak, { current: 0, longest: 0 });

	await track("practice.checkin", "practice:1");
	assert.deepEqual((await client.progress()).streak, { current: 1, longest: 1 });

	// Today is already counted: a second check-in is the same day, not a second.
	await track("practice.checkin", "practice:2");
	assert.deepEqual((await client.progress()).streak, { current: 1, longest: 1 });
});

test("the seeded subject's streak stands through yesterday and today extends it", async () => {
	await reset();
	assert.deepEqual((await snapshot()).streak, { current: 4, longest: 4 });

	await fetch(`${base}/api/actions/practice`, { method: "POST" });

	assert.deepEqual((await snapshot()).streak, { current: 5, longest: 5 });
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

test("the stand-in names a ground the shell's own guard accepts", () => {
	// Read out of the two files rather than restated here, because a copy of the
	// rule in a third place is a rule that can be right in two places and wrong
	// where it matters. The shell's guard is the literal in the built bundle a
	// customer loads; the grounds are the ones the stand-in would post.
	const guard = /\/\^#\[0-9a-f\]\{6\}\$\/i/.exec(shellBundle());
	assert.ok(guard, "the shell no longer guards the shape of `ground`");
	const shape = new RegExp("^#[0-9a-f]{6}$", "i");

	const source = standInSource();
	assert.match(source, /type: "ready", ground:/, "the stand-in stopped naming its ground");
	// Matched inside the `GROUNDS` literal rather than over the file, because a
	// sweep of every hex string passes only while nothing else in the file
	// carries one, and then fails some later change with a message about
	// grounds.
	const literal = /const GROUNDS = \{([^}]*)\}/.exec(source);
	assert.ok(literal, "the stand-in no longer names its grounds in one place");
	const grounds = [...literal[1].matchAll(/"(#[0-9a-fA-F]{3,8})"/g)].map((match) => match[1]);
	assert.equal(grounds.length, 2, `expected one ground per template, found ${grounds.length}`);

	for (const ground of grounds) {
		// The guard refuses a three-digit form on purpose, and a template
		// authoring `#fff` would silently leave the theme default standing.
		assert.ok(shape.test(ground), `the shell would refuse ${ground}`);
		// Lowercase is the contract's word, and the guard is deliberately looser
		// on case than the contract, so nothing mechanical holds this but this.
		assert.equal(ground, ground.toLowerCase(), `${ground} is not lowercase`);
	}
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
