// In-memory stand-in for the ActiveKit API (`api.activekit.app/v1`), which is
// not live yet. It implements just enough of the contract for the SDKs to run
// against unmodified:
//
//   POST /v1/subject-sessions  (API key)       mint a subject session
//   POST /v1/events            (API key)       record an event, advance campaigns
//   GET  /v1/me/progress       (subject token) the subject's snapshot
//   GET  /v1/me/grants         (subject token) what the subject earned
//   GET  /v1/me/badge          (subject token) the shell's dot: { unseen }
//   POST /v1/me/badge/seen     (subject token) acknowledge, clearing the dot
//
// Nothing in here is customer integration code — a real integration never
// implements this side. See README.md for which files you would actually copy.

import { randomUUID } from "node:crypto";

export const API_KEY = "ak_demo_not_a_real_key";

/**
 * The campaigns "Acme Learn" is running. In production these are configured in
 * the ActiveKit dashboard; the `event` field is the criteria: which recorded
 * event name advances the campaign by one.
 */
const CAMPAIGNS = [
	{
		id: "cmp_streak",
		key: "daily-practice",
		name: "Daily practice streak",
		status: "active",
		target: 7,
		event: "practice.checkin",
		reward: { kind: "points", amount: 500, unit: "points", label: "500 bonus points" },
	},
	{
		id: "cmp_lessons",
		key: "lesson-marathon",
		name: "Lesson marathon",
		status: "active",
		target: 10,
		event: "lesson.completed",
		reward: { kind: "badge", amount: 1, unit: "badge", label: "Marathon badge" },
	},
	{
		id: "cmp_referral",
		key: "refer-a-friend",
		name: "Refer a friend",
		status: "active",
		target: 3,
		event: "referral.converted",
		reward: { kind: "credit", amount: 15, unit: "USD", label: "$15 account credit" },
	},
	{
		// An ended campaign, so the widget's non-active states get exercised: a
		// status chip in the campaign list and a completion in the stats.
		id: "cmp_onboarding",
		key: "onboarding-week",
		name: "Onboarding week",
		status: "ended",
		target: 5,
		event: "onboarding.step",
		reward: { kind: "points", amount: 100, unit: "points", label: "Welcome gift, 100 points" },
	},
];

/** subjectId → { progress: Map<campaignId, {current, completedAt}>, grants: [] } */
const subjects = new Map();
/**
 * idempotency-key → the full original response. Proper Idempotency-Key
 * semantics replay the first response, not just suppress the side effect — a
 * retried record() that did advance a campaign must still be told it advanced.
 */
const seenEvents = new Map();

const freshSubject = () => ({
	progress: new Map(CAMPAIGNS.map((p) => [p.id, { current: 0, completedAt: null }])),
	grants: [],
});

/**
 * Pre-populate a subject so the very first page load already looks lived-in:
 * a streak underway, a couple of lessons done, one historical reward.
 */
export const seed = (subjectId) => {
	const state = freshSubject();
	state.progress.get("cmp_streak").current = 4;
	state.progress.get("cmp_lessons").current = 6;
	state.progress.get("cmp_referral").current = 1;
	const onboarding = state.progress.get("cmp_onboarding");
	onboarding.current = 5;
	onboarding.completedAt = new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString();
	state.grants.push({
		id: `grant_${randomUUID().slice(0, 8)}`,
		campaignId: "cmp_onboarding",
		subjectId,
		reward: { kind: "points", amount: 100, unit: "points", label: "Welcome gift, 100 points" },
		status: "fulfilled",
		createdAt: onboarding.completedAt,
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
// Looks like a JWT so the demo reads like production. It is not one — do not
// copy this format anywhere; real tokens are minted and signed by ActiveKit.

/** Fifteen minutes, the platform's fixed number. Not a caller's choice. */
const SUBJECT_SESSION_LIFETIME_SECONDS = 15 * 60;

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

const json = (res, status, body) => {
	res.writeHead(status, {
		"content-type": "application/json",
		"x-request-id": `req_${randomUUID().slice(0, 12)}`,
	});
	res.end(JSON.stringify(body));
};

const bearer = (req) => {
	const header = req.headers["authorization"] ?? "";
	return header.startsWith("Bearer ") ? header.slice(7) : null;
};

const snapshotOf = (subjectId) => {
	const state = subjectState(subjectId);
	return {
		subjectId,
		campaigns: CAMPAIGNS.map((campaign) => {
			const { current, completedAt } = state.progress.get(campaign.id);
			return {
				campaign: { id: campaign.id, key: campaign.key, name: campaign.name, status: campaign.status },
				current,
				target: campaign.target,
				// Deliberately stays true after the grant is recorded, so the demo's
				// "Reward ready" pill and bubble dot are actually visible — this mock
				// auto-issues at the instant of eligibility, which a real deployment
				// may not. The live API's exact semantics are still under construction.
				eligible: campaign.status === "active" && current >= campaign.target,
				completedAt,
				// The live preview of what completing this campaign earns. A copy,
				// because the SDK treats it as display data, never as the grant.
				reward: { ...campaign.reward },
			};
		}),
	};
};

const recordEvent = (body, idempotencyKey) => {
	if (idempotencyKey && seenEvents.has(idempotencyKey)) {
		return seenEvents.get(idempotencyKey);
	}
	const eventId = `evt_${randomUUID().slice(0, 12)}`;

	const state = subjectState(body.subjectId);
	const advanced = [];
	for (const campaign of CAMPAIGNS) {
		if (campaign.status !== "active" || campaign.event !== body.name) continue;
		const progress = state.progress.get(campaign.id);
		if (progress.completedAt) continue; // completed campaigns stay completed
		progress.current += 1;
		advanced.push(campaign.key);
		if (progress.current >= campaign.target) {
			progress.completedAt = new Date().toISOString();
			state.grants.unshift({
				id: `grant_${randomUUID().slice(0, 8)}`,
				campaignId: campaign.id,
				subjectId: body.subjectId,
				// Frozen copy of the reward at issuance, per the contract.
				reward: { ...campaign.reward },
				status: "recorded",
				createdAt: new Date().toISOString(),
			});
		}
	}
	const response = { eventId, advanced };
	if (idempotencyKey) seenEvents.set(idempotencyKey, response);
	return response;
};

/**
 * Handle a request if it targets the mock API. Returns true when handled.
 * `body` is the parsed JSON body (or null).
 */
export const handleMockApi = (req, res, url, body) => {
	if (!url.pathname.startsWith("/v1/")) return false;

	// Organization endpoints: authenticated by the API key.
	if (url.pathname === "/v1/subject-sessions" && req.method === "POST") {
		if (bearer(req) !== API_KEY) {
			json(res, 401, { code: "unauthorized", message: "invalid API key" });
			return true;
		}
		// Strict, like the real route: the body names the subject and nothing
		// else. The lifetime is the platform's, so a caller asking for one is a
		// 400 here too rather than a field that is quietly ignored.
		const extra = Object.keys(body ?? {}).filter((key) => key !== "subject");
		if (typeof body?.subject !== "string" || body.subject.length === 0 || extra.length > 0) {
			json(res, 400, {
				code: "invalid_request",
				message: extra.length > 0 ? `unknown field: ${extra[0]}` : "subject is required",
			});
			return true;
		}
		const { token, exp } = mintToken(body.subject, SUBJECT_SESSION_LIFETIME_SECONDS);
		json(res, 200, {
			token,
			expiresAt: new Date(exp * 1000).toISOString(),
			subject: { externalId: body.subject },
			// The demo's key is a production key, so its sessions read production.
			environment: "production",
		});
		return true;
	}

	if (url.pathname === "/v1/events" && req.method === "POST") {
		if (bearer(req) !== API_KEY) {
			json(res, 401, { code: "unauthorized", message: "invalid API key" });
			return true;
		}
		if (typeof body?.subjectId !== "string" || typeof body?.name !== "string") {
			json(res, 400, { code: "invalid_request", message: "subjectId and name are required" });
			return true;
		}
		json(res, 200, recordEvent(body, req.headers["idempotency-key"]));
		return true;
	}

	// Subject endpoints: authenticated by a subject token, scoped to that subject.
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
		json(res, 200, { data: subjectState(payload.sub).grants });
		return true;
	}

	// The shell's one read. A boolean, not a count: the shell draws a dot, and
	// a dot cannot be wrong the way "3" can when there are two. Cheap enough to
	// poll, which is the other half of the reason it is shaped this way.
	if (url.pathname === "/v1/me/badge" && req.method === "GET") {
		const payload = parseToken(bearer(req));
		if (!payload) {
			json(res, 401, { code: "unauthorized", message: "invalid or expired subject token" });
			return true;
		}
		const state = subjectState(payload.sub);
		const unseen =
			state.grants.some((grant) => !state.seen?.has(grant.id)) ||
			snapshotOf(payload.sub).campaigns.some((campaign) => campaign.eligible);
		json(res, 200, { unseen });
		return true;
	}

	// Opening the app is the acknowledgement — this is what turns the dot off.
	// Without it the dot is a standing condition rather than an event, and a
	// dot that is always lit is one nobody sees.
	if (url.pathname === "/v1/me/badge/seen" && req.method === "POST") {
		const payload = parseToken(bearer(req));
		if (!payload) {
			json(res, 401, { code: "unauthorized", message: "invalid or expired subject token" });
			return true;
		}
		const state = subjectState(payload.sub);
		state.seen ??= new Set();
		for (const grant of state.grants) state.seen.add(grant.id);
		json(res, 200, { unseen: false });
		return true;
	}

	json(res, 404, { code: "not_found", message: `no route for ${req.method} ${url.pathname}` });
	return true;
};
