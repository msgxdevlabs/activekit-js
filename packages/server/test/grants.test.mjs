// `grants.list`, against the filters `apps/api/src/routes/grants.ts` accepts.
//
// The bug this pins is in that file's own design: the query schema is not
// strict. It strips what it does not recognize rather than refusing it, so a
// filter under the wrong name does not 400, it vanishes, and asking for one
// subject's grants quietly answers the whole organization's. A wrong filter
// that 400s is a bug you find; one that silently widens the answer is a bug you
// ship, and it ships into a reconciliation report.
//
// So each of the four names gets its own row rather than one composite
// assertion: a table where every case names the parameter it is defending is a
// table that says which one broke.
//
// Tests run against `dist/`, not `src/` — the published artifact is what
// customers execute. `pnpm check` builds first.
import assert from "node:assert/strict";
import test from "node:test";

import { ActiveKit } from "../dist/index.js";

const listing = (grants = []) => {
	const calls = [];
	const client = new ActiveKit({
		apiKey: "ak_live_x",
		apiUrl: "https://api.test/v1",
		fetch: async (url) => {
			calls.push(url);
			return new Response(JSON.stringify({ grants }), {
				headers: { "content-type": "application/json" },
			});
		},
	});
	return { client, calls };
};

/** Each caller-facing filter, and the parameter the platform reads it under. */
const FILTERS = [
	{
		what: "one subject's grants",
		params: { subjectId: "user_8c1d2e" },
		query: "?subject=user_8c1d2e",
	},
	{
		what: "one campaign's grants",
		params: { campaignId: "campaign_9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f" },
		query: "?campaign=campaign_9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f",
	},
	{
		what: "grants standing in one status",
		params: { status: "pending" },
		query: "?status=pending",
	},
	{
		what: "one environment's grants",
		params: { environment: "production" },
		query: "?environment=production",
	},
	{
		what: "the reconciliation view: one subject, production only",
		params: { subjectId: "user_8c1d2e", environment: "production" },
		query: "?subject=user_8c1d2e&environment=production",
	},
	{
		what: "all four at once",
		params: {
			subjectId: "user_8c1d2e",
			campaignId: "campaign_9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f",
			status: "fulfilled",
			environment: "sandbox",
		},
		query:
			"?subject=user_8c1d2e&campaign=campaign_9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f&status=fulfilled&environment=sandbox",
	},
	{ what: "no filter at all", params: {}, query: "" },
];

for (const { what, params, query } of FILTERS) {
	test(`asks for ${what} under the platform's own parameter names`, async () => {
		const { client, calls } = listing();

		await client.grants.list(params);

		assert.equal(calls[0], `https://api.test/v1/grants${query}`);
	});
}

test("an undefined filter is left out rather than sent empty", async () => {
	// `?status=` is not the same request as no status at all, and building the
	// query by spreading whatever the caller passed is how it becomes one.
	const { client, calls } = listing();

	await client.grants.list({ subjectId: "user_8c1d2e", status: undefined });

	assert.equal(calls[0], "https://api.test/v1/grants?subject=user_8c1d2e");
});

test("answers the platform's envelope, with the reward snapshot on each grant", async () => {
	// `{ grants }`, not `{ data, nextCursor }`. There is no cursor to page with.
	const grant = {
		id: "grant_9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f",
		campaign: { id: "campaign_9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f", name: "Top-up bonus" },
		app: { id: "app_9f8c1d2e", name: "Support Copilot", slug: "support-copilot" },
		subject: { externalId: "user_8c1d2e" },
		environment: "production",
		status: "pending",
		reward: { kind: "credits", amount: 500 },
		issuedAt: "2026-08-22T09:30:00.000Z",
		updatedAt: "2026-08-22T09:30:00.000Z",
	};
	const { client } = listing([grant]);

	const answer = await client.grants.list();

	assert.deepEqual(Object.keys(answer), ["grants"]);
	assert.deepEqual(answer.grants, [grant]);
});
