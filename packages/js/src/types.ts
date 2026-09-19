/**
 * Wire types for the read-only surface of the ActiveKit public API (`/v1`).
 *
 * These mirror the API's OpenAPI contract, not its database. Anything that is
 * not in the contract does not belong here — the SDK is downstream of the
 * published API, never of the product's internals.
 *
 * There are no request types in this file, because the browser never sends a
 * body. See the note on read-only in `client.ts`.
 */

/**
 * Which slot of the customer's game a campaign fills.
 *
 * The four slots draw in four different places, which is what makes this the
 * field that places a campaign rather than one more thing to list about it:
 * `daily` resets every UTC day, `main` is the week's chain, `side` has no
 * clock, and `event` runs between a hard start and a hard end.
 */
export type CampaignSlot = "daily" | "main" | "side" | "event";

/** How often a campaign is written: once, or one period of a clock. */
export type CampaignCadence = "once" | "daily" | "weekly";

/**
 * A reward, as the API describes it: what a completion earns. Grants carry a
 * frozen copy of this shape; campaign progress carries the live preview.
 */
export type Reward =
	| { kind: "credits"; amount: number }
	| { kind: "percent_bonus"; percent: number; of: string }
	| { kind: "badge"; badge: string }
	| { kind: "perk"; perk: string }
	| { kind: "custom"; label: string; meta?: Record<string, unknown> };

/**
 * What a campaign pays, and which side of the promise it came from.
 *
 * `campaign` is the published promise; `grant` is what issuance froze, and it
 * carries its own status. The tag is the whole point: a reward drawn from a
 * grant is history and a reward drawn from a campaign is an offer, and reading
 * one as the other is how a reversal gets celebrated.
 */
export type CampaignReward =
	| { source: "campaign"; reward: Reward }
	| { source: "grant"; reward: Reward; status: GrantStatus };

/** One step of a checklist goal, in the order the goal declares them. */
export interface ChecklistStep {
	/** Stable key, authored once and never renumbered. */
	key: string;
	achieved: number;
	target: number;
	done: boolean;
}

/**
 * How far along a goal is, in the goal's own unit.
 *
 * `achieved` rather than `current`, and nested rather than flat, because that
 * is the shape `/v1/me/progress` answers.
 *
 * A union rather than one interface with optional extras, because that is what
 * the platform answers: `longest` belongs to a streak and `steps` to a
 * checklist, and a flat shape lets a caller read either off any goal, get
 * `undefined` and draw it. Narrow on `kind` and the arm carries what it has.
 */
export type GoalProgress =
	| { kind: "count"; achieved: number; target: number }
	| { kind: "sum"; achieved: number; target: number }
	| { kind: "streak"; achieved: number; target: number; longest: number }
	| { kind: "checklist"; achieved: number; target: number; steps: readonly ChecklistStep[] };

export interface CampaignProgress {
	id: string;
	/** `live`, `paused` or `ended`. A draft is never answered to a subject. */
	status: "live" | "paused" | "ended";
	/**
	 * The title the organization wrote for the person reading, frozen into the
	 * published version so it cannot change under a campaign they have already
	 * finished. Not the operator's own campaign name, which this read
	 * withholds: that is a different string for a different reader.
	 *
	 * Null for a campaign published before titles existed, which is a cue to
	 * fall back rather than an empty line to draw.
	 */
	title: string | null;
	/** Which slot of the game this fills. Null before the game model. */
	slot: CampaignSlot | null;
	/** Null for a campaign published before the game model. */
	cadence: CampaignCadence | null;
	/**
	 * Which period this instance covers: `2026-09-14` for a day, `2026-W38`
	 * for an ISO week, null for a campaign that runs once. Two instances of
	 * one objective differ by this and by nothing else a reader can see.
	 */
	periodKey: string | null;
	/** When that period stops, RFC 3339, so a countdown needs neither key format. */
	periodEndsAt: string | null;
	/**
	 * The XP completing this campaign pays, a platform constant per slot that
	 * the organization never sets. For `main` it is what the whole chain pays,
	 * once, when its last step ticks. Null for a campaign in no slot, because
	 * there is no constant to name.
	 */
	xp: number | null;
	enrollment: "not_enrolled" | "enrolled" | "completed";
	goal: GoalProgress;
	/**
	 * The declared event names this campaign's criteria listen for.
	 *
	 * These, with the goal, are what a player-facing label is written from. The
	 * campaign's own name is deliberately never sent: it is an operator string,
	 * and subject-facing words come from a swappable vocabulary pack.
	 */
	events: string[];
	reward: CampaignReward;
	completed: boolean;
	/** When the goal was reached, RFC 3339. Null until it is. */
	completedAt: string | null;
	startsAt: string | null;
	endsAt: string | null;
	publishedVersion: number;
}

export type GrantStatus = "pending" | "fulfilled" | "voided" | "reversed";

export interface Grant {
	id: string;
	campaign: { id: string; name: string };
	status: GrantStatus;
	/** Frozen copy of the reward at the moment it was granted. */
	reward: Reward;
	issuedAt: string;
	acknowledgedAt: string | null;
	/**
	 * True exactly once, on the answer that stamped this grant.
	 *
	 * It is what a celebration is staged from, and it is not by itself
	 * permission to celebrate: a voided or reversed grant carries it too, so
	 * read `status` first.
	 */
	firstShown: boolean;
}

export interface WalletBalance {
	/** The currency's name. `coins` is the default. */
	currency: string;
	balance: number;
}

/**
 * Everything `/v1/me/progress` answers, in one read.
 *
 * Nothing here names the subject. The platform withholds that on purpose: the
 * session already establishes who is asking, and repeating it would put an
 * identifier into a payload that does not need one.
 */
export interface SubjectSnapshot {
	environment: "sandbox" | "production";
	campaigns: CampaignProgress[];
	campaignCount: number;
	wallets: WalletBalance[];
	currencyCount: number;
	/**
	 * XP and the level derived from it, with the level's own band beside them,
	 * so a level bar and an "XP to the next level" line are subtraction over
	 * served numbers rather than the platform's curve re-derived out here.
	 */
	progression: { xp: number; level: number; levelFloorXp: number; nextLevelXp: number };
	/**
	 * The game this app runs, or null when the organization has not set one up.
	 * Two facts and no configuration: what a game is made of reaches a subject
	 * as the campaigns above.
	 */
	game: { id: string; status: "draft" | "live" | "paused" } | null;
}

/** Events the client emits. Subscribe with `client.on(...)`. */
export interface ActiveKitEvents {
	/** A fresh snapshot arrived. Fires on every successful `progress()`. */
	progress: SubjectSnapshot;
}

/**
 * Every non-2xx response from the API.
 *
 * `requestId` is the thing to quote in a support ticket — it is the only handle
 * that reaches the server-side trace.
 */
export class ActiveKitError extends Error {
	override readonly name = "ActiveKitError";
	readonly status: number;
	readonly code: string;
	readonly requestId: string | null;

	constructor(message: string, options: { status: number; code: string; requestId?: string | null }) {
		super(message);
		this.status = options.status;
		this.code = options.code;
		this.requestId = options.requestId ?? null;
	}
}
