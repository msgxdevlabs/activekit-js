import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { ActiveKit } from "../dist/index.js";

// These pin the wire shape rather than the method's behaviour, because the
// method has almost none: what matters is that the path and the body match
// what `apps/api/src/routes/subject-sessions.ts` in `activekit-io` accepts.
// They disagreed once, silently, and only a real integration would have found
// it: the SDK posted to `/subjects/tokens` with a `subjectId`, and the platform
// serves `/subject-sessions` and takes a `subject`.

function stubFetch(capture) {
	return mock.fn(async (url, init) => {
		capture.url = String(url);
		capture.init = init;
		return new Response(
			JSON.stringify({
				token: "st_test",
				expiresAt: "2026-08-27T19:15:00.000Z",
				subject: { externalId: "user_8c1d2e" },
			}),
			{ status: 200, headers: { "content-type": "application/json" } },
		);
	});
}

test("posts to the path the platform actually serves", async () => {
	const capture = {};
	const kit = new ActiveKit({ apiKey: "ak_test", fetch: stubFetch(capture) });

	await kit.subjects.createToken({ subjectId: "user_8c1d2e" });

	assert.match(capture.url, /\/subject-sessions$/);
	assert.doesNotMatch(capture.url, /subjects\/tokens/);
	assert.equal(capture.init.method, "POST");
});

test("names the subject field the way the platform's strict body requires", async () => {
	const capture = {};
	const kit = new ActiveKit({ apiKey: "ak_test", fetch: stubFetch(capture) });

	await kit.subjects.createToken({ subjectId: "user_8c1d2e" });

	const body = JSON.parse(capture.init.body);
	assert.deepEqual(body, { subject: "user_8c1d2e" });
});

test("returns the token, its expiry and the subject it belongs to", async () => {
	const kit = new ActiveKit({ apiKey: "ak_test", fetch: stubFetch({}) });

	const session = await kit.subjects.createToken({ subjectId: "user_8c1d2e" });

	assert.equal(session.token, "st_test");
	assert.equal(session.expiresAt, "2026-08-27T19:15:00.000Z");
	assert.equal(session.subject.externalId, "user_8c1d2e");
});
