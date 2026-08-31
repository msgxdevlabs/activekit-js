// `events.track`, and `events.record` staying alive under it.
//
// The rename is the whole of the story here: the roadmap, the landing page and
// the platform's own route object all say track, and this SDK said record.
// `activekit@1.0.0-alpha.1` is published and `activekit-play`'s demo Worker
// calls `events.record` against it, so record keeps working. These tests are
// what stops "keeps working" from decaying into "still exists, posts something
// else".
//
// Tests run against `dist/`, not `src/` — the published artifact is what
// customers execute. `pnpm check` builds first.
import assert from "node:assert/strict";
import test from "node:test";

import { ActiveKit } from "../dist/index.js";

const RECORDED = {
	id: "evt_1",
	name: "session_start",
	subject: "sub_1",
	meta: null,
	clientTrust: false,
	occurredAt: "2026-08-10T00:00:00.000Z",
	receivedAt: "2026-08-10T00:00:00.000Z",
	late: false,
};

/** Captures one request and answers what the platform answers. */
const capturing = (body = RECORDED, status = 200) => {
	const calls = [];
	const client = new ActiveKit({
		apiKey: "ak_live_x",
		apiUrl: "https://api.test/v1",
		fetch: async (url, init) => {
			calls.push({ url, init });
			return new Response(JSON.stringify(body), {
				status,
				headers: { "content-type": "application/json" },
			});
		},
	});
	return { client, calls };
};

const INPUT = {
	subjectId: "sub_1",
	name: "session_start",
	properties: { plan: "free" },
	idempotencyKey: "sub_1:2026-08-10",
};

test("track posts the platform's own field names", async () => {
	const { client, calls } = capturing();

	await client.events.track(INPUT);

	assert.equal(calls[0].url, "https://api.test/v1/events");
	assert.equal(calls[0].init.method, "POST");
	assert.equal(calls[0].init.headers.authorization, "Bearer ak_live_x");
	// `subject`, not `subjectId`; `meta`, not `properties`. The platform's body
	// is a strict object, so a stray key is a 400 rather than something ignored.
	assert.deepEqual(JSON.parse(calls[0].init.body), {
		name: "session_start",
		subject: "sub_1",
		idempotencyKey: "sub_1:2026-08-10",
		meta: { plan: "free" },
	});
});

test("record is track, the same function under its former name", async () => {
	// Identity, not equivalence-by-inspection. A wrapper is a second place for
	// the two to drift; the same reference cannot.
	const { client } = capturing();

	assert.equal(client.events.record, client.events.track);
});

test("record posts byte for byte what track posts", async () => {
	// The identity assertion above is the strong one. This is the assertion that
	// still holds if someone ever has a reason to split them: whatever record
	// becomes, it goes to the same path with the same body.
	const viaTrack = capturing();
	const viaRecord = capturing();

	await viaTrack.client.events.track(INPUT);
	await viaRecord.client.events.record(INPUT);

	assert.equal(viaRecord.calls[0].url, viaTrack.calls[0].url);
	assert.equal(viaRecord.calls[0].init.method, viaTrack.calls[0].init.method);
	assert.equal(viaRecord.calls[0].init.body, viaTrack.calls[0].init.body);
});

test("track answers what the platform recorded", async () => {
	const { client } = capturing();

	const event = await client.events.track(INPUT);

	assert.equal(event.id, "evt_1");
	assert.equal(event.late, false);
});

test("an unconfirmed event name answers pending, not a silent success", async () => {
	// A 202 means the delivery was dropped rather than recorded. A caller that
	// treats every 2xx as recorded will believe in events the platform never
	// kept, so the status is on the answer.
	const { client } = capturing({ status: "pending_confirmation", name: "new_name" }, 202);

	const event = await client.events.track({ ...INPUT, name: "new_name" });

	assert.equal(event.status, "pending_confirmation");
	assert.equal(event.name, "new_name");
});

test("properties are omitted from the body rather than sent as null", async () => {
	const { client, calls } = capturing();

	await client.events.track({
		subjectId: "sub_1",
		name: "session_start",
		idempotencyKey: "sub_1:2026-08-10",
	});

	assert.deepEqual(JSON.parse(calls[0].init.body), {
		name: "session_start",
		subject: "sub_1",
		idempotencyKey: "sub_1:2026-08-10",
	});
});
