// The credential boundary, asserted on the built artifact.
//
// Two secrets, opposite blast radii: an API key is organization-wide read and
// write and lives on a server forever; a subject session token reads one
// subject's `GET /v1/me/*` and dies in fifteen minutes. Every test in this file
// exists because minting the second is the first reason anybody has to want
// this package near a browser, which is where the first one must never be.
import assert from "node:assert/strict";
import test from "node:test";

import { ActiveKit, SUBJECT_ID_MAX_LENGTH } from "../dist/index.js";
import * as pkg from "../dist/index.js";

/** Records the calls a client makes and answers a canned session. */
const stub = (body = SESSION, init = {}) => {
	const calls = [];
	const fetch = async (url, options) => {
		calls.push({ url, init: options });
		return new Response(JSON.stringify(body), {
			status: init.status ?? 200,
			headers: init.headers ?? { "content-type": "application/json" },
		});
	};
	return { fetch, calls };
};

/** Exactly what `POST /v1/subject-sessions` answers, field for field. */
const SESSION = {
	token: "eyJhbGciOiJIUzI1NiIsInR5cCI6ImFrLXN1YmplY3Qrand0In0.e30.sig",
	expiresAt: "2026-08-24T12:15:00.000Z",
	subject: { externalId: "user_8c1d2e" },
	environment: "production",
};

const client = (fetch) => new ActiveKit({ apiKey: "ak_live_x", apiUrl: "https://api.test/v1", fetch });

// ---------------------------------------------------------------------------
// The wire shape. Verified against `apps/api/src/routes/subject-sessions.ts`
// in the platform, not inferred: the body is a strict schema, so an extra field
// is a 400 rather than something the server ignores.
// ---------------------------------------------------------------------------

test("mints against POST /subject-sessions", async () => {
	const { fetch, calls } = stub();

	await client(fetch).subjects.createSession({ subject: "user_8c1d2e" });

	assert.equal(calls.length, 1);
	assert.equal(calls[0].url, "https://api.test/v1/subject-sessions");
	assert.equal(calls[0].init.method, "POST");
	assert.equal(calls[0].init.headers.authorization, "Bearer ak_live_x");
});

test("sends the subject under the key the API's strict schema names", async () => {
	const { fetch, calls } = stub();

	await client(fetch).subjects.createSession({ subject: "user_8c1d2e" });

	// `subject`, not `subjectId`. The route validates with a strict object, so
	// the wrong key is a 400 and not a field the server quietly ignores.
	assert.deepEqual(JSON.parse(calls[0].init.body), { subject: "user_8c1d2e" });
});

test("drops a field the API would refuse rather than forwarding it", async () => {
	const { fetch, calls } = stub();

	// A JS caller with no types, or a TS caller who kept an old `ttlSeconds`
	// from the stub this replaced. The lifetime is the platform's and the body
	// is strict, so forwarding this is a guaranteed 400 in production.
	await client(fetch).subjects.createSession({ subject: "user_8c1d2e", ttlSeconds: 3600 });

	assert.deepEqual(JSON.parse(calls[0].init.body), { subject: "user_8c1d2e" });
});

test("returns the API's answer whole, so it can be handed to a browser as-is", async () => {
	const { fetch } = stub();

	const session = await client(fetch).subjects.createSession({ subject: "user_8c1d2e" });

	// Deep-equal, not field-by-field: the point of the shape is that nothing was
	// renamed, computed or dropped, so `res.json(session)` is right by
	// construction and stays right when the contract adds a field.
	assert.deepEqual(session, SESSION);
});

test("surfaces the environment the key is scoped to", async () => {
	const { fetch } = stub({ ...SESSION, environment: "sandbox" });

	const session = await client(fetch).subjects.createSession({ subject: "user_8c1d2e" });

	// "My events go to sandbox and my widget shows production" is the confusion
	// this field exists to make visible. Losing it in a reshape would hide it.
	assert.equal(session.environment, "sandbox");
});

test("a refused mint raises ActiveKitError with the API's own code", async () => {
	const { fetch } = stub({ code: "unauthorized", message: "no API key" }, { status: 401 });

	const error = await client(fetch)
		.subjects.createSession({ subject: "user_8c1d2e" })
		.catch((e) => e);

	assert.equal(error.name, "ActiveKitError");
	assert.equal(error.status, 401);
	assert.equal(error.code, "unauthorized");
});

// ---------------------------------------------------------------------------
// The guards. These are the tests that matter most in this file: an API key in
// a browser is the single catastrophic failure this package has, and it is the
// reason `POST /v1/events` is server-to-server in the first place.
// ---------------------------------------------------------------------------

test("refuses to construct where a DOM exists", () => {
	// A page that imports this package fails on the line that constructs it, on
	// the developer's machine, before a bundle carrying the key is deployed.
	globalThis.document = { createElement: () => ({}) };
	try {
		assert.throws(() => new ActiveKit({ apiKey: "ak_live_x" }), /cannot run in a browser/);
	} finally {
		delete globalThis.document;
	}
});

test("the browser refusal has no opt-out option", () => {
	// An escape hatch is set by exactly the person the guard exists to stop, so
	// there must not be one to find. Every spelling anybody would try.
	globalThis.document = { createElement: () => ({}) };
	try {
		for (const escape of [
			{ dangerouslyAllowBrowser: true },
			{ allowBrowser: true },
			{ browser: true },
			{ unsafe: true },
			{ force: true },
		]) {
			assert.throws(
				() => new ActiveKit({ apiKey: "ak_live_x", ...escape }),
				/cannot run in a browser/,
				`\`${Object.keys(escape)[0]}\` opened a way into the browser`,
			);
		}
	} finally {
		delete globalThis.document;
	}
});

test("refuses a subject session token handed in as the API key", () => {
	// The direction that otherwise 401s, which reads as a revoked key and sends
	// the reader to their dashboard rather than to the line that swapped them.
	assert.throws(
		() => new ActiveKit({ apiKey: SESSION.token }),
		/looks like a subject session token/,
	);
});

test("warns, but does not refuse, a key with an unfamiliar prefix", () => {
	// A deny list, not an allow list: refusing here would make this package the
	// reason a newly minted key does not work.
	const warnings = [];
	const warn = console.warn;
	console.warn = (...args) => warnings.push(args.join(" "));
	try {
		assert.doesNotThrow(() => new ActiveKit({ apiKey: "sk_something_else" }));
	} finally {
		console.warn = warn;
	}
	assert.match(warnings.join("\n"), /does not start with `ak_`/);
});

test("refuses a coerced empty value as a subject", async () => {
	const { fetch, calls } = stub();
	const ak = client(fetch);

	// Subjects are created on first sight, so these do not fail at the API —
	// they mint a real, working session for a subject nobody meant to create,
	// and every event that user generates afterwards lands on it.
	for (const bad of ["undefined", "null", ""]) {
		await assert.rejects(
			() => ak.subjects.createSession({ subject: bad }),
			TypeError,
			`the subject ${JSON.stringify(bad)} reached the network`,
		);
	}

	await assert.rejects(() => ak.subjects.createSession({}), TypeError);
	assert.equal(calls.length, 0, "a refused subject still made a request");
});

test("a refused subject rejects rather than throwing past the caller's catch", async () => {
	const { fetch } = stub();
	// The method is typed `Promise`, so a synchronous throw would walk straight
	// past `.catch` and, in a request handler, take the process with it.
	let settled = "nothing";
	await client(fetch)
		.subjects.createSession({ subject: "" })
		.then(
			() => (settled = "resolved"),
			() => (settled = "rejected"),
		);

	assert.equal(settled, "rejected");
});

test("refuses a subject id past the API's bound", async () => {
	const { fetch, calls } = stub();

	await assert.rejects(
		() => client(fetch).subjects.createSession({ subject: "u".repeat(SUBJECT_ID_MAX_LENGTH + 1) }),
		/the limit is 256/,
	);
	// The bound is the same one event ingest carries, so every subject
	// `events.record` can create is a subject this route can name.
	assert.equal(SUBJECT_ID_MAX_LENGTH, 256);
	assert.equal(calls.length, 0);
});

test("exports no free function that takes a credential", () => {
	// The shape that gets copy-pasted into a React component is a standalone
	// `createSubjectSession(apiKey, subject)`. `webhooks.verify` is exported
	// standalone and takes a secret, and it is the deliberate counter-example:
	// verifying is something a page could never usefully do, minting is the
	// opposite. So the only path to a token runs through an instance holding
	// the key privately, and this pins the surface that guarantees it.
	assert.deepEqual(Object.keys(pkg).sort(), [
		"ActiveKit",
		"ActiveKitError",
		"SUBJECT_ID_MAX_LENGTH",
		"WebhookVerificationError",
		"signWebhook",
		"verifyWebhook",
	]);
});

test("the API key is not reachable from a constructed client", () => {
	const ak = new ActiveKit({ apiKey: "ak_live_secret" });

	// Walk the prototype chain, as the browser client's own guard does.
	const surface = new Set();
	for (let o = ak; o && o !== Object.prototype; o = Object.getPrototypeOf(o)) {
		for (const key of Object.getOwnPropertyNames(o)) surface.add(key);
	}
	assert.ok(!surface.has("apiKey"), "the API key is a readable property");

	// The two ways a key actually escapes a server: a log line and a response
	// body that serialized more than it meant to.
	assert.doesNotMatch(JSON.stringify(ak), /ak_live_secret/);
	assert.doesNotMatch(String(ak), /ak_live_secret/);
	assert.doesNotMatch(Object.keys(ak).join(), /apiKey/i);
});

test("the mint result carries no credential but the token", async () => {
	const { fetch } = stub();

	const session = await client(fetch).subjects.createSession({ subject: "user_8c1d2e" });

	// `res.json(session)` is the documented next move, so the whole object has
	// to be safe to send. The API key must not have been folded in anywhere.
	assert.doesNotMatch(JSON.stringify(session), /ak_live_x/);
});
