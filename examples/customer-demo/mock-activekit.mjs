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
 * The one game "Acme Learn" runs, as the progress read answers it: two facts
 * and no configuration. What a game is made of reaches a subject as the
 * campaigns below, each one placed by the slot it fills.
 */
const GAME = { id: "game_acme_learn", status: "live" };

// --- the platform's published economy ---------------------------------------
//
// These are constants the platform owns and a customer reads, not numbers this
// demo invents: `LEVEL_BASE_XP` and `SLOT_XP` in the platform's own
// `packages/core/src/level.ts`, published so a customer can see what each
// completion pays and never set it. They are transcribed here for the same
// reason the rest of this file is: nothing in this repository can reach the
// platform, and a mock that guesses at the economy teaches a wrong one.

/** What a completion pays in XP, by the slot the campaign fills. */
const SLOT_XP = { daily: 20, main: 30, side: 50, event: 80 };

/**
 * What a main quest's whole chain pays, once, when its last objective ticks.
 * `SLOT_XP.main` is what each objective along the way pays, which is why the
 * main slot is the only one that credits XP twice for one week.
 */
const MAIN_CHAIN_XP = 100;

/** The per-level step of the platform's triangular level curve. */
const LEVEL_BASE_XP = 100;

/** The cumulative XP at which `level` begins. Level 1 begins at 0. */
const xpForLevel = (level) => (LEVEL_BASE_XP * (level - 1) * level) / 2;

/**
 * The level a subject holding `xp` has reached, by the curve above. Level is
 * derived from XP and never stored, on the platform and here: one source of
 * truth means a level that cannot drift from the XP behind it.
 */
const levelForXp = (xp) => {
	let level = 1;
	while (xpForLevel(level + 1) <= xp) level += 1;
	return level;
};

/**
 * The game's slots, as the campaign rows a subject reads them off.
 *
 * `status` is the subject-facing one: `live`, `paused` or `ended`. A draft is
 * never answered to a subject at all, so it has no spelling here.
 *
 * `title` is the player-facing sentence the customer wrote, frozen into the
 * published version. It rides the wire and the operator's own campaign `name`
 * beside it never does: that is a dashboard string for a different reader, and
 * it is answered only on a grant. What a card draws is `title`.
 *
 * `events` is the criteria: the declared event names that advance the campaign
 * by one. A checklist's are the union of its steps', which is how the platform
 * finds a step's event without the candidate lookup learning what a step is.
 */
const CAMPAIGNS = [
	{
		id: "cmp_daily_practice",
		name: "Daily practice",
		title: "Practice for five minutes",
		slot: "daily",
		cadence: "daily",
		status: "live",
		goal: { kind: "count", target: 1 },
		events: ["practice.checkin"],
		// Pays nothing, and is the commonest reward the game model writes: a
		// daily objective credits XP and never touches the customer's ledger,
		// which is what makes the slot free to leave running forever. No grant
		// row is written at all, so there is nothing here to celebrate.
		reward: { kind: "none" },
		startsAt: null,
		endsAt: null,
		publishedVersion: 1,
	},
	{
		id: "cmp_week_chain",
		name: "Weekly practice plan",
		title: "Finish this week's practice plan",
		slot: "main",
		cadence: "weekly",
		status: "live",
		// A checklist, the goal kind the main quest brought: a list of ticks
		// rather than a quantity. Each step has its own event, and the step keys
		// are authored once and never renumbered.
		goal: {
			kind: "checklist",
			steps: [
				{ key: "grammar", event: "lesson.grammar", target: 1 },
				{ key: "listening", event: "lesson.listening", target: 1 },
				{ key: "speaking", event: "lesson.speaking", target: 1 },
			],
		},
		reward: { kind: "credits", amount: 500 },
		startsAt: null,
		endsAt: null,
		publishedVersion: 1,
	},
	{
		id: "cmp_streak_7",
		name: "Seven-day streak milestone",
		title: "Practice seven days running",
		slot: "side",
		cadence: "once",
		status: "live",
		goal: { kind: "streak", target: 7 },
		events: ["practice.checkin"],
		reward: { kind: "credits", amount: 1500 },
		startsAt: null,
		endsAt: null,
		publishedVersion: 1,
	},
	{
		id: "cmp_referral",
		name: "Refer a friend",
		title: "Bring three friends along",
		slot: "side",
		cadence: "once",
		status: "live",
		goal: { kind: "count", target: 3 },
		events: ["referral.converted"],
		reward: { kind: "badge", badge: "recruiter" },
		startsAt: null,
		endsAt: null,
		publishedVersion: 2,
	},
	{
		// The event slot, which is the only one with a hard start and a hard end.
		id: "cmp_autumn_sprint",
		name: "Autumn sprint",
		title: "Five sprint sessions before the sprint ends",
		slot: "event",
		cadence: "once",
		status: "live",
		goal: { kind: "count", target: 5 },
		events: ["sprint.session"],
		reward: { kind: "credits", amount: 2000 },
		startsAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
		endsAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
		publishedVersion: 1,
	},
	{
		// An ended campaign, so the non-live states get exercised: a status other
		// than `live` in the snapshot, a completion instant, and a reward whose
		// source is a grant rather than the published offer.
		id: "cmp_onboarding",
		name: "Onboarding week",
		title: "Find your way around",
		slot: "side",
		cadence: "once",
		status: "ended",
		goal: { kind: "count", target: 5 },
		events: ["onboarding.step"],
		reward: { kind: "perk", perk: "streak-freeze" },
		startsAt: null,
		endsAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
		publishedVersion: 1,
	},
];

/** The declared event names of one campaign, a checklist's being its steps'. */
const criteriaOf = (campaign) =>
	campaign.goal.kind === "checklist"
		? campaign.goal.steps.map((step) => step.event)
		: campaign.events;

/**
 * Every event name confirmed for this app. An unconfirmed name is answered 202
 * and dropped rather than recorded, so this is the set that decides which of
 * the two answers `POST /v1/events` gives.
 */
const CONFIRMED_EVENTS = new Set(CAMPAIGNS.flatMap(criteriaOf));

// --- the clocks the slots run on --------------------------------------------
//
// Computed on every read rather than frozen at seed, so a demo left open
// overnight answers today's period instead of yesterday's. The fields roll and
// the progress behind them does not: a completed daily objective stays
// completed under tomorrow's period key, where the platform would have
// materialized a fresh instance. The demo is not a clock, and a walk that
// crosses UTC midnight should reset it.

/** `2026-09-19`, the UTC day a `daily` instance covers. */
const utcDayKey = (now) => now.toISOString().slice(0, 10);

/** The next UTC midnight, which is when that day's instance stops. */
const endOfUtcDay = (now) =>
	new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
	).toISOString();

/** `2026-W38`, the ISO week a `weekly` instance covers. */
const isoWeekKey = (now) => {
	const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	// An ISO week belongs to the year holding its Thursday, so step to that
	// Thursday before reading either the year or the week number off it.
	day.setUTCDate(day.getUTCDate() + 4 - (day.getUTCDay() || 7));
	const firstOfYear = Date.UTC(day.getUTCFullYear(), 0, 1);
	const week = Math.ceil(((day.getTime() - firstOfYear) / 86_400_000 + 1) / 7);
	return `${day.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

/** Next Monday 00:00 UTC, which is when this week's instance stops. */
const endOfIsoWeek = (now) => {
	const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
	day.setUTCDate(day.getUTCDate() + (8 - (day.getUTCDay() || 7)));
	return day.toISOString();
};

/** Whole UTC days since the epoch, so consecutive days differ by one. */
const utcDay = (instant) => Math.floor(instant.getTime() / 86_400_000);

/**
 * The activity streak the progress read serves, folded the way the platform's
 * `foldActivityStreak` folds it: distinct UTC days on which a daily completion
 * paid XP, `current` the run ending at the last such day while that day is
 * today or yesterday and 0 once it is older, `longest` the best run. A day
 * after `now` is not history yet and drops out.
 *
 * The platform reads only the newest 730 such days, so its `longest` is the
 * best run inside that window. This fold reads every day it is given, which
 * is the same answer for any history a demo can hold.
 *
 * Exported so the demo test can hold the fold to fixed days and a fixed `now`.
 */
export const activityStreakOf = (days, now) => {
	const today = utcDay(now);
	const sorted = [...days].filter((day) => day <= today).sort((a, b) => a - b);
	if (sorted.length === 0) return { current: 0, longest: 0 };
	let run = 1;
	let longest = 1;
	for (let i = 1; i < sorted.length; i += 1) {
		run = sorted[i] === sorted[i - 1] + 1 ? run + 1 : 1;
		longest = Math.max(longest, run);
	}
	return { current: today - sorted[sorted.length - 1] <= 1 ? run : 0, longest };
};

/** `{ periodKey, periodEndsAt }` for a cadence. A `once` campaign has neither. */
const periodOf = (cadence, now) => {
	if (cadence === "daily") return { periodKey: utcDayKey(now), periodEndsAt: endOfUtcDay(now) };
	if (cadence === "weekly") return { periodKey: isoWeekKey(now), periodEndsAt: endOfIsoWeek(now) };
	return { periodKey: null, periodEndsAt: null };
};

/**
 * subjectId -> {
 *   progress: Map<campaignId, { achieved, longest, completedAt, steps }>,
 *   grants: [],
 *   walletEntries: [],
 *   xp: number,
 *   dailyDays: Set<number>,
 * }
 *
 * `walletEntries` rather than a balance, because that is what the platform
 * holds: entries are append-only and the balance is a projection over them, so
 * a reversal is a compensating entry and never a rewrite. `xp` is stored and
 * the level is not, for the reason `levelForXp` gives. `dailyDays` is the
 * record the activity streak is read from, one `utcDay` per day a daily
 * objective paid XP, which is the platform's own source: its XP awards joined
 * to the slot of the campaign that paid them.
 */
const subjects = new Map();
/**
 * idempotencyKey -> the full original answer. Proper idempotency replays the
 * first response rather than only suppressing the side effect: a retried call
 * that did advance a campaign must still be told what it recorded.
 */
const seenEvents = new Map();

const freshProgress = () => ({
	achieved: 0,
	longest: 0,
	completedAt: null,
	// Per-step counts for a checklist, keyed by the step's own key. Empty for
	// every other goal kind, which counts in one number.
	steps: {},
});

const freshSubject = () => ({
	progress: new Map(CAMPAIGNS.map((campaign) => [campaign.id, freshProgress()])),
	grants: [],
	walletEntries: [],
	xp: 0,
	dailyDays: new Set(),
});

/**
 * Pre-populate a subject so the very first page load already looks lived in:
 * a week's plan underway, a streak standing, a sprint half done, and one
 * historical reward.
 */
export const seed = (subjectId, now = new Date()) => {
	const state = freshSubject();
	const streak = state.progress.get("cmp_streak_7");
	streak.achieved = 4;
	streak.longest = 4;
	// One of the week's three objectives ticked, so the board has something
	// done and something open on the first paint.
	state.progress.get("cmp_week_chain").steps["grammar"] = 1;
	state.progress.get("cmp_referral").achieved = 1;
	state.progress.get("cmp_autumn_sprint").achieved = 2;
	const onboarding = state.progress.get("cmp_onboarding");
	onboarding.achieved = 5;
	onboarding.completedAt = new Date(now.getTime() - 9 * 24 * 3600 * 1000).toISOString();
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
	// XP from that history. A perk pays no coins, so the wallet stays empty
	// until a credit-denominated reward is earned in front of you, which is the
	// first thing the demo's buttons can do.
	state.xp = 340;
	// Four days of finished daily objectives, ending the day before the seed.
	// Today's is still open, so on the day it is seeded the streak reads 4 and
	// the practice button makes it 5. Read on any later day it has broken.
	const today = utcDay(now);
	for (let daysAgo = 1; daysAgo <= 4; daysAgo += 1) state.dailyDays.add(today - daysAgo);
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

/**
 * One campaign's goal, in the goal's own unit and in the shape the read
 * answers: nested rather than flat, `achieved` rather than `current`, and only
 * the extras the kind actually has.
 *
 * A checklist step carries `key`, `achieved`, `target` and `done` and nothing
 * else. It has no title and no XP of its own on the wire; both are owed and
 * neither is served, so a surface that wants them writes its own words rather
 * than reading fields the platform does not answer.
 */
const goalOf = (campaign, progress) => {
	if (campaign.goal.kind === "checklist") {
		const steps = campaign.goal.steps.map((step) => {
			const achieved = progress.steps[step.key] ?? 0;
			return { key: step.key, achieved, target: step.target, done: achieved >= step.target };
		});
		return {
			kind: "checklist",
			achieved: steps.filter((step) => step.done).length,
			target: steps.length,
			steps,
		};
	}
	return {
		kind: campaign.goal.kind,
		achieved: progress.achieved,
		target: campaign.goal.target,
		// Streaks only: the best run this subject has had.
		...(campaign.goal.kind === "streak" ? { longest: progress.longest } : {}),
	};
};

/** The balance projected over one subject's entries, one row per currency. */
const walletsOf = (state) => {
	const balances = new Map();
	for (const entry of state.walletEntries) {
		balances.set(entry.currency, (balances.get(entry.currency) ?? 0) + entry.amount);
	}
	return [...balances].map(([currency, balance]) => ({ currency, balance }));
};

/**
 * The progress read. `now` is a parameter so the demo test can read the
 * seeded streak at a fixed instant rather than at whatever time the suite
 * happens to run, which is the difference between a test and a midnight flake.
 */
export const snapshotOf = (subjectId, now = new Date()) => {
	const state = subjectState(subjectId);
	const campaigns = CAMPAIGNS.map((campaign) => {
		const progress = state.progress.get(campaign.id);
		const grant = state.grants.find((g) => g.campaign.id === campaign.id);
		const goal = goalOf(campaign, progress);
		// Anything at all recorded against this campaign, a part-ticked
		// checklist step included, which `goal.achieved` alone would read as
		// nothing because it counts finished steps.
		const started =
			progress.completedAt !== null ||
			goal.achieved > 0 ||
			(goal.kind === "checklist" && goal.steps.some((step) => step.achieved > 0));
		return {
			id: campaign.id,
			status: campaign.status,
			title: campaign.title,
			slot: campaign.slot,
			cadence: campaign.cadence,
			...periodOf(campaign.cadence, now),
			// The platform constant this slot pays, which the customer reads and
			// never sets. For `main` it is what the whole chain pays, once, when
			// its last step ticks.
			xp: campaign.slot === "main" ? MAIN_CHAIN_XP : SLOT_XP[campaign.slot],
			// Two values, not three: a campaign a subject cannot enroll in is
			// absent from this list rather than present as a third state, and a
			// finished campaign stays `enrolled` with `completed` beside it.
			enrollment: started ? "enrolled" : "not_enrolled",
			goal,
			events: [...criteriaOf(campaign)],
			// The published promise until issuance freezes a copy of it, and the
			// frozen copy after. The tag is the point: a reward read off a
			// campaign is an offer and one read off a grant is history, and
			// reading the second as the first is how a reversal gets celebrated.
			reward: grant
				? { source: "grant", reward: { ...grant.reward }, status: grant.status }
				: { source: "campaign", reward: { ...campaign.reward } },
			completed: Boolean(progress.completedAt),
			completedAt: progress.completedAt,
			startsAt: campaign.startsAt,
			endsAt: campaign.endsAt,
			publishedVersion: campaign.publishedVersion,
		};
	});
	const wallets = walletsOf(state);
	const level = levelForXp(state.xp);
	return {
		environment: ENVIRONMENT,
		campaigns,
		campaignCount: campaigns.length,
		wallets,
		currencyCount: wallets.length,
		// The band beside the level, so an "XP to the next level" line is
		// subtraction over served numbers rather than the platform's curve
		// re-derived by every surface that draws it.
		progression: {
			xp: state.xp,
			level,
			levelFloorXp: xpForLevel(level),
			nextLevelXp: xpForLevel(level + 1),
		},
		game: { ...GAME },
		// Top-level, and a different thing from the `streak` goal on a campaign:
		// the days a daily completion paid XP, whatever the day's objective
		// was. A subject the daily slot has never paid reads 0 and 0.
		streak: activityStreakOf(state.dailyDays, now),
	};
};

/**
 * Advance one campaign by one event, and pay what that completion earns.
 *
 * The economy is the platform's, transcribed: a main quest step credits
 * `SLOT_XP.main` the moment it ticks; a completion whose reward is `none`
 * credits the slot's XP and writes no grant row at all; and any other
 * completion writes a grant, credits the slot's XP (`MAIN_CHAIN_XP` for the
 * main quest's week), and for a credit-denominated reward appends the wallet
 * entry that reward cost.
 */
const applyEvent = (state, campaign, event) => {
	const progress = state.progress.get(campaign.id);
	if (progress.completedAt) return; // completed campaigns stay completed

	if (campaign.goal.kind === "checklist") {
		const step = campaign.goal.steps.find((s) => s.event === event.name);
		const ticked = progress.steps[step.key] ?? 0;
		if (ticked >= step.target) return;
		progress.steps[step.key] = ticked + 1;
		if (progress.steps[step.key] >= step.target && campaign.slot === "main") {
			state.xp += SLOT_XP.main;
		}
		const complete = campaign.goal.steps.every(
			(s) => (progress.steps[s.key] ?? 0) >= s.target,
		);
		if (!complete) return;
	} else {
		progress.achieved += 1;
		progress.longest = Math.max(progress.longest, progress.achieved);
		if (progress.achieved < campaign.goal.target) return;
	}

	progress.completedAt = event.at;
	// Every completion below pays XP, so a daily one is a day the activity
	// streak counts. A set, because three daily objectives finished on one day
	// are one day of activity.
	if (campaign.slot === "daily") state.dailyDays.add(utcDay(new Date(event.at)));

	if (campaign.reward.kind === "none") {
		// No grant row, because there is nothing to record: the customer's
		// ledger is never touched and the only thing earned is XP. The main
		// slot pays the chain's own figure rather than the slot's, the same as
		// the branch below, or the XP credited here would disagree with the
		// `xp` this campaign serves on the wire.
		state.xp += campaign.slot === "main" ? MAIN_CHAIN_XP : SLOT_XP[campaign.slot];
		return;
	}

	const grantId = `grant_${randomUUID().slice(0, 8)}`;
	state.grants.unshift({
		id: grantId,
		campaign: { id: campaign.id, name: campaign.name },
		// Issued, not yet fulfilled. Fulfilment is the customer's act in their
		// own billing system, and the platform records that it happened rather
		// than performing it.
		status: "pending",
		// Frozen copy of the reward at issuance, so a later edit to the campaign
		// never rewrites what this subject earned.
		reward: { ...campaign.reward },
		issuedAt: event.at,
		acknowledgedAt: null,
	});
	state.xp += campaign.slot === "main" ? MAIN_CHAIN_XP : SLOT_XP[campaign.slot];
	if (campaign.reward.kind === "credits") {
		state.walletEntries.push({
			currency: "coins",
			amount: campaign.reward.amount,
			grantId,
			at: event.at,
		});
	}
};

/**
 * Returns `{ status, body }`, because the two answers here are 200 and 202.
 * `receivedAt` is a parameter for the reason `snapshotOf`'s `now` is.
 */
export const recordEvent = (body, receivedAt = new Date()) => {
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
		if (campaign.status !== "live" || !criteriaOf(campaign).includes(body.name)) continue;
		applyEvent(state, campaign, { name: body.name, at: recorded.receivedAt });
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
