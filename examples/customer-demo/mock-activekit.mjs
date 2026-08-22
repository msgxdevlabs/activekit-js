// In-memory stand-in for the ActiveKit API (`api.activekit.app/v1`), which is
// not live yet. It implements just enough of the contract for the SDKs to run
// against unmodified:
//
//   POST /v1/subjects/tokens   (API key)       mint a subject token
//   POST /v1/events            (API key)       record an event, advance programs
//   GET  /v1/me/progress       (subject token) the subject's snapshot
//   GET  /v1/me/grants         (subject token) what the subject earned
//
// Nothing in here is customer integration code — a real integration never
// implements this side. See README.md for which files you would actually copy.

import { randomUUID } from "node:crypto";

export const API_KEY = "ak_demo_not_a_real_key";

/**
 * The programs "Acme Learn" is running. In production these are configured in
 * the ActiveKit dashboard; the `event` field is the criteria: which recorded
 * event name advances the program by one.
 */
const PROGRAMS = [
	{
		id: "prg_streak",
		key: "daily-practice",
		name: "Daily Practice Streak",
		status: "active",
		target: 7,
		event: "practice.checkin",
		reward: { kind: "points", amount: 500, unit: "points", label: "500 bonus points" },
	},
	{
		id: "prg_lessons",
		key: "lesson-marathon",
		name: "Lesson Marathon",
		status: "active",
		target: 10,
		event: "lesson.completed",
		reward: { kind: "badge", amount: 1, unit: "badge", label: "Marathon badge" },
	},
	{
		id: "prg_referral",
		key: "refer-a-friend",
		name: "Refer a Friend",
		status: "active",
		target: 3,
		event: "referral.converted",
		reward: { kind: "credit", amount: 15, unit: "USD", label: "$15 account credit" },
	},
];

/** subjectId → { progress: Map<programId, {current, completedAt}>, grants: [] } */
const subjects = new Map();
/**
 * idempotency-key → the full original response. Proper Idempotency-Key
 * semantics replay the first response, not just suppress the side effect — a
 * retried record() that did advance a program must still be told it advanced.
 */
const seenEvents = new Map();

const freshSubject = () => ({
	progress: new Map(PROGRAMS.map((p) => [p.id, { current: 0, completedAt: null }])),
	grants: [],
});

/**
 * Pre-populate a subject so the very first page load already looks lived-in:
 * a streak underway, a couple of lessons done, one historical reward.
 */
export const seed = (subjectId) => {
	const state = freshSubject();
	state.progress.get("prg_streak").current = 4;
	state.progress.get("prg_lessons").current = 6;
	state.progress.get("prg_referral").current = 1;
	state.grants.push({
		id: `grn_${randomUUID().slice(0, 8)}`,
		programId: "prg_streak",
		subjectId,
		reward: { kind: "points", amount: 100, unit: "points", label: "Welcome gift — 100 points" },
		status: "fulfilled",
		createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
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
		programs: PROGRAMS.map((program) => {
			const { current, completedAt } = state.progress.get(program.id);
			return {
				program: { id: program.id, key: program.key, name: program.name, status: program.status },
				current,
				target: program.target,
				// Deliberately stays true after the grant is recorded, so the demo's
				// "Reward ready" pill and bubble dot are actually visible — this mock
				// auto-issues at the instant of eligibility, which a real deployment
				// may not. The live API's exact semantics are still under construction.
				eligible: current >= program.target,
				completedAt,
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
	for (const program of PROGRAMS) {
		if (program.status !== "active" || program.event !== body.name) continue;
		const progress = state.progress.get(program.id);
		if (progress.completedAt) continue; // completed programs stay completed
		progress.current += 1;
		advanced.push(program.key);
		if (progress.current >= program.target) {
			progress.completedAt = new Date().toISOString();
			state.grants.unshift({
				id: `grn_${randomUUID().slice(0, 8)}`,
				programId: program.id,
				subjectId: body.subjectId,
				// Frozen copy of the reward at issuance, per the contract.
				reward: { ...program.reward },
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
	if (url.pathname === "/v1/subjects/tokens" && req.method === "POST") {
		if (bearer(req) !== API_KEY) {
			json(res, 401, { code: "unauthorized", message: "invalid API key" });
			return true;
		}
		if (typeof body?.subjectId !== "string" || body.subjectId.length === 0) {
			json(res, 400, { code: "invalid_request", message: "subjectId is required" });
			return true;
		}
		const ttl = typeof body.ttlSeconds === "number" ? body.ttlSeconds : 900;
		const { token, exp } = mintToken(body.subjectId, ttl);
		json(res, 200, { token, expiresAt: new Date(exp * 1000).toISOString() });
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

	json(res, 404, { code: "not_found", message: `no route for ${req.method} ${url.pathname}` });
	return true;
};
