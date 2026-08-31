// In-memory stand-in for the ActiveKit API (`api.activekit.app/v1`), which is
// not live in production yet. It serves the routes this demo's two SDKs
// actually call, in the shapes the platform actually answers:
//
//   POST /v1/subject-sessions  (API key)       open a session for one subject
//   POST /v1/events            (API key)       record an event, advance campaigns
//   GET  /v1/me/progress       (subject token) the subject's snapshot
//   GET  /v1/me/grants         (subject token) what the subject earned, and the
//                                              read that stamps acknowledgment
//   GET  /v1/me/badge          (subject token) the shell's dot: { unacknowledged }
//
// Two rules govern every line below. Both are worth stating, because ignoring
// the first is what broke this file once already.
//
// 1. A mock is shaped by the platform, never by the client in front of it. A
//    mock reshaped to satisfy its caller agrees with that caller's bugs, and
//    this example is the reference integration a developer copies. Where the
//    two disagreed, the platform won.
// 2. Nothing a subject token can reach writes. Every method but GET and HEAD
//    under `/v1/me` is refused before a credential is read, which is why there
//    is no acknowledge route here: `GET /v1/me/grants` stamps acknowledgment
//    inside the read.
//
// Nothing in here is customer integration code. A real integration never
// implements this side. See README.md for which files you would actually copy.

import { randomUUID } from "node:crypto";

export const API_KEY = "ak_demo_not_a_real_key";

/**
 * Which side of the app answered. Every subject-facing response carries it,
 * because a sandbox rehearsal and real production debt are otherwise
 * indistinguishable. Keys are scoped to one environment, and this one is a
 * demo, so it is always the sandbox.
 */
const ENVIRONMENT = "sandbox";

/**
 * The campaigns "Acme Learn" is running. In production these are configured in
 * the ActiveKit dashboard.
 *
 * `status` is the subject-facing one: `live`, `paused` or `ended`. A draft is
 * never answered to a subject at all, so it has no spelling here.
 *
 * `events` is the criteria: the declared event names that advance the campaign
 * by one. The platform sends those, and deliberately never sends the campaign's
 * `name`, which is an operator string. What a player reads is written from the
 * goal and the event names through a vocabulary pack, so the name below is only
 * ever answered on a grant.
 */
const CAMPAIGNS = [
	{
		id: "cmp_streak",
		name: "Daily practice streak",
		status: "live",
		goal: { kind: "streak", target: 7 },
		events: ["practice.checkin"],
		reward: { kind: "credits", amount: 500 },
		startsAt: null,
		endsAt: null,
		publishedVersion: 1,
	},
	{
		id: "cmp_lessons",
		name: "Lesson marathon",
		status: "live",
		goal: { kind: "count", target: 10 },
		events: ["lesson.completed"],
		reward: { kind: "badge", badge: "marathon" },
		startsAt: null,
		endsAt: null,
		publishedVersion: 1,
	},
	{
		id: "cmp_referral",
		name: "Refer a friend",
		status: "live",
		goal: { kind: "count", target: 3 },
		events: ["referral.converted"],
		reward: { kind: "credits", amount: 1500 },
		startsAt: null,
		endsAt: null,
		publishedVersion: 2,
	},
	{
		// An ended campaign, so the non-live states get exercised: a status other
		// than `live` in the snapshot, an `enrollment` of `completed`, and a
		// reward whose source is a grant rather than the published offer.
		id: "cmp_onboarding",
		name: "Onboarding week",
		status: "ended",
		goal: { kind: "count", target: 5 },
		events: ["onboarding.step"],
		reward: { kind: "perk", perk: "streak-freeze" },
		startsAt: null,
		endsAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
		publishedVersion: 1,
	},
];

/**
 * Every event name confirmed for this app. An unconfirmed name is answered 202
 * and dropped rather than recorded, so this is the set that decides which of
 * the two answers `POST /v1/events` gives.
 */
const CONFIRMED_EVENTS = new Set(CAMPAIGNS.flatMap((campaign) => campaign.events));

/** subjectId -> { progress: Map<campaignId, {achieved, longest, completedAt}>, grants: [] } */
const subjects = new Map();
/**
 * idempotencyKey -> the full original answer. Proper idempotency replays the
 * first response rather than only suppressing the side effect: a retried call
 * that did advance a campaign must still be told what it recorded.
 */
const seenEvents = new Map();

const freshSubject = () => ({
	progress: new Map(CAMPAIGNS.map((c) => [c.id, { achieved: 0, longest: 0, completedAt: null }])),
	grants: [],
});

/**
 * Pre-populate a subject so the very first page load already looks lived in: a
 * streak underway, a couple of lessons done, one historical reward.
 */
export const seed = (subjectId) => {
	const state = freshSubject();
	const streak = state.progress.get("cmp_streak");
	streak.achieved = 4;
	streak.longest = 4;
	state.progress.get("cmp_lessons").achieved = 6;
	state.progress.get("cmp_referral").achieved = 1;
	const onboarding = state.progress.get("cmp_onboarding");
	onboarding.achieved = 5;
	onboarding.completedAt = new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString();
	state.grants.push({
		id: `grant_${randomUUID().slice(0, 8)}`,
		campaign: { id: "cmp_onboarding", name: "Onboarding week" },
		// The customer fulfilled this one in their own billing system and told
		// the platform so. A grant issued a moment ago is still `pending`.
		status: "fulfilled",
		reward: { kind: "perk", perk: "streak-freeze" },
		issuedAt: onboarding.completedAt,
		// Left unacknowledged on purpose, so the bubble carries its dot on the
		// first page load and opening the app visibly clears it.
		acknowledgedAt: null,
	});
	subjects.set(subjectId, state);
};

export const reset = (subjectId) => {
	seenEvents.clear();
	seed(subjectId);
};

const subjectState = (subjectId) => {
	if (!subjects.has(subjectId)) subjects.set(subjectId, freshSubject());
	return subjects.get(subjectId);
};

// --- fake subject tokens ----------------------------------------------------
// Looks like a JWT so the demo reads like production. It is not one. Do not
// copy this format anywhere; real tokens are minted and signed by ActiveKit.

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

const mintToken = (subjectId, ttlSeconds) => {
	const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
	return { token: `demo.${b64url({ sub: subjectId, exp })}.unsigned`, exp };
};

const parseToken = (token) => {
	const parts = String(token ?? "").split(".");
	if (parts.length !== 3 || parts[0] !== "demo") return null;
	try {
		const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
		if (typeof payload.sub !== "string") return null;
		if (payload.exp * 1000 < Date.now()) return null;
		return payload;
	} catch {
		return null;
	}
};

// --- request handling -------------------------------------------------------

const json = (res, status, body, headers = {}) => {
	res.writeHead(status, {
		"content-type": "application/json",
		"x-request-id": `req_${randomUUID().slice(0, 12)}`,
		...headers,
	});
	res.end(JSON.stringify(body));
};

const bearer = (req) => {
	const header = req.headers["authorization"] ?? "";
	return header.startsWith("Bearer ") ? header.slice(7) : null;
};

/**
 * The platform's request bodies are strict objects, so a key it does not know
 * is a 400 rather than something quietly dropped. That strictness is the whole
 * reason a wrong field name is a bug you find rather than a bug you ship, so
 * the mock keeps it.
 */
const unexpectedKey = (body, allowed) =>
	Object.keys(body ?? {}).find((key) => !allowed.includes(key));

const snapshotOf = (subjectId) => {
	const state = subjectState(subjectId);
	const campaigns = CAMPAIGNS.map((campaign) => {
		const { achieved, longest, completedAt } = state.progress.get(campaign.id);
		const grant = state.grants.find((g) => g.campaign.id === campaign.id);
		return {
			id: campaign.id,
			status: campaign.status,
			enrollment: completedAt ? "completed" : achieved > 0 ? "enrolled" : "not_enrolled",
			goal: {
				kind: campaign.goal.kind,
				achieved,
				target: campaign.goal.target,
				// Streaks only: the best run this subject has had.
				...(campaign.goal.kind === "streak" ? { longest } : {}),
			},
			events: [...campaign.events],
			// The published promise until issuance freezes a copy of it, and the
			// frozen copy after. The tag is the point: a reward read off a
			// campaign is an offer and one read off a grant is history, and
			// reading the second as the first is how a reversal gets celebrated.
			reward: grant
				? { source: "grant", reward: { ...grant.reward }, status: grant.status }
				: { source: "campaign", reward: { ...campaign.reward } },
			completed: Boolean(completedAt),
			startsAt: campaign.startsAt,
			endsAt: campaign.endsAt,
			publishedVersion: campaign.publishedVersion,
		};
	});
	return {
		environment: ENVIRONMENT,
		campaigns,
		campaignCount: campaigns.length,
		// This mock's campaigns pay grants and never credit a wallet, so there is
		// no balance to project over. Empty, with the count that goes with it,
		// is what staging answers for exactly that subject.
		wallets: [],
		currencyCount: 0,
		// No XP rules live in this mock, so it answers the floor rather than
		// inventing a curve the platform does not have.
		progression: { xp: 0, level: 1 },
	};
};

/** Returns `{ status, body }`, because the two answers here are 200 and 202. */
const recordEvent = (body) => {
	// Replay rather than suppress, and keyed off the body field. The key used to
	// be read from an `Idempotency-Key` header that nothing sends, which made
	// every retry a second write against a real budget.
	const replay = seenEvents.get(body.idempotencyKey);
	if (replay) return replay;

	if (!CONFIRMED_EVENTS.has(body.name)) {
		// 202, and not an error. The name is not confirmed for this app, so the
		// delivery is dropped rather than recorded, and saying so is the point:
		// a caller that reads every 2xx as recorded will believe in events the
		// platform never kept. Nothing is stored against the idempotency key,
		// because nothing happened for a retry to replay.
		return { status: 202, body: { status: "pending_confirmation", name: body.name } };
	}

	const receivedAt = new Date();
	const occurredAt = body.occurredAt ? new Date(body.occurredAt) : receivedAt;
	const recorded = {
		id: `evt_${randomUUID().replace(/-/g, "").slice(0, 16)}`,
		name: body.name,
		subject: body.subject,
		meta: body.meta ?? null,
		// False for everything recorded here: this came in on an organization API
		// key, server to server. A client-trust event is one a browser could have
		// shaped, and those are barred from reward-bearing criteria.
		clientTrust: false,
		occurredAt: occurredAt.toISOString(),
		receivedAt: receivedAt.toISOString(),
		// A backfill, recorded well after it happened. The real window is the
		// platform's to set; one minute is this mock's stand-in for it.
		late: receivedAt.getTime() - occurredAt.getTime() > 60_000,
	};

	const state = subjectState(body.subject);
	for (const campaign of CAMPAIGNS) {
		if (campaign.status !== "live" || !campaign.events.includes(body.name)) continue;
		const progress = state.progress.get(campaign.id);
		if (progress.completedAt) continue; // completed campaigns stay completed
		progress.achieved += 1;
		progress.longest = Math.max(progress.longest, progress.achieved);
		if (progress.achieved >= campaign.goal.target) {
			progress.completedAt = recorded.receivedAt;
			state.grants.unshift({
				id: `grant_${randomUUID().slice(0, 8)}`,
				campaign: { id: campaign.id, name: campaign.name },
				// Issued, not yet fulfilled. Fulfilment is the customer's act in
				// their own billing system, and the platform records that it
				// happened rather than performing it.
				status: "pending",
				// Frozen copy of the reward at issuance, so a later edit to the
				// campaign never rewrites what this subject earned.
				reward: { ...campaign.reward },
				issuedAt: recorded.receivedAt,
				acknowledgedAt: null,
			});
		}
	}

	const answer = { status: 200, body: recorded };
	seenEvents.set(body.idempotencyKey, answer);
	return answer;
};

/**
 * Read a subject's grants, and stamp acknowledgment while doing it.
 *
 * Acknowledgment is a side effect of the read and not a call of its own, which
 * is the only arrangement compatible with a browser that cannot write.
 * `firstShown` is true exactly once per grant, on the answer that stamped it,
 * and it is what a celebration is staged from. It is not by itself permission
 * to celebrate: a voided or reversed grant carries it too.
 */
const readGrants = (subjectId) => {
	const state = subjectState(subjectId);
	const stampedAt = new Date().toISOString();
	const grants = state.grants.map((grant) => {
		const firstShown = grant.acknowledgedAt === null;
		if (firstShown) grant.acknowledgedAt = stampedAt;
		return { ...grant, firstShown };
	});
	return { environment: ENVIRONMENT, grants, grantCount: grants.length };
};

/**
 * Handle a request if it targets the mock API. Returns true when handled.
 * `body` is the parsed JSON body (or null).
 */
export const handleMockApi = (req, res, url, body) => {
	if (!url.pathname.startsWith("/v1/")) return false;

	// Refused before any credential is read, and refused for every path under
	// `/v1/me`, not just the ones that exist. This is the read-only boundary in
	// one line: a subject token can never write, so there is no acknowledge
	// route to reach and no shape of request that could add one. The shell used
	// to post to `/v1/me/badge/seen` and collect this 405 on every open.
	const subjectScoped = url.pathname === "/v1/me" || url.pathname.startsWith("/v1/me/");
	if (subjectScoped && req.method !== "GET" && req.method !== "HEAD") {
		json(
			res,
			405,
			{ code: "method_not_allowed", message: `${req.method} is not allowed on ${url.pathname}` },
			{ allow: "GET, HEAD" },
		);
		return true;
	}

	// Organization endpoints: authenticated by the API key, server to server.
	if (url.pathname === "/v1/subject-sessions" && req.method === "POST") {
		if (bearer(req) !== API_KEY) {
			json(res, 401, { code: "unauthorized", message: "invalid API key" });
			return true;
		}
		const stray = unexpectedKey(body, ["subject"]);
		if (stray) {
			// `ttlSeconds` used to land here and look like it worked. A session's
			// lifetime is the platform's to set: a caller could choose badly, and
			// a token that outlives its purpose is the thing this whole mechanism
			// exists to avoid.
			json(res, 400, { code: "invalid_request", message: `unexpected field ${stray}` });
			return true;
		}
		if (typeof body?.subject !== "string" || body.subject.length === 0) {
			json(res, 400, { code: "invalid_request", message: "subject is required" });
			return true;
		}
		const { token, exp } = mintToken(body.subject, 900);
		json(res, 200, {
			token,
			expiresAt: new Date(exp * 1000).toISOString(),
			subject: { externalId: body.subject },
		});
		return true;
	}

	if (url.pathname === "/v1/events" && req.method === "POST") {
		if (bearer(req) !== API_KEY) {
			json(res, 401, { code: "unauthorized", message: "invalid API key" });
			return true;
		}
		const stray = unexpectedKey(body, ["name", "subject", "meta", "idempotencyKey", "occurredAt"]);
		if (stray) {
			json(res, 400, { code: "invalid_request", message: `unexpected field ${stray}` });
			return true;
		}
		if (typeof body?.name !== "string" || typeof body?.subject !== "string") {
			json(res, 400, { code: "invalid_request", message: "name and subject are required" });
			return true;
		}
		if (typeof body?.idempotencyKey !== "string" || body.idempotencyKey.length === 0) {
			json(res, 400, { code: "invalid_request", message: "idempotencyKey is required" });
			return true;
		}
		const answer = recordEvent(body);
		json(res, answer.status, answer.body);
		return true;
	}

	// Subject endpoints: authenticated by a subject token, scoped to that
	// subject, and read-only by the refusal at the top of this function.
	if (url.pathname === "/v1/me/progress" && req.method === "GET") {
		const payload = parseToken(bearer(req));
		if (!payload) {
			json(res, 401, { code: "unauthorized", message: "invalid or expired subject token" });
			return true;
		}
		json(res, 200, snapshotOf(payload.sub));
		return true;
	}

	if (url.pathname === "/v1/me/grants" && req.method === "GET") {
		const payload = parseToken(bearer(req));
		if (!payload) {
			json(res, 401, { code: "unauthorized", message: "invalid or expired subject token" });
			return true;
		}
		json(res, 200, readGrants(payload.sub));
		return true;
	}

	// The shell's one read. A boolean, not a count: the shell draws a dot, and a
	// dot cannot be wrong the way "3" can when there are two. Cheap enough to
	// poll, which is the other half of the reason it is shaped this way.
	// `unacknowledged` is the field name, and the dot goes out when the read of
	// `/v1/me/grants` above stamps the grants it stands for.
	if (url.pathname === "/v1/me/badge" && req.method === "GET") {
		const payload = parseToken(bearer(req));
		if (!payload) {
			json(res, 401, { code: "unauthorized", message: "invalid or expired subject token" });
			return true;
		}
		const state = subjectState(payload.sub);
		json(res, 200, { unacknowledged: state.grants.some((g) => g.acknowledgedAt === null) });
		return true;
	}

	json(res, 404, { code: "not_found", message: `no route for ${req.method} ${url.pathname}` });
	return true;
};
