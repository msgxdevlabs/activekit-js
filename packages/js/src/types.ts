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

/** A campaign an organization is running: streak, daily login, referral. */
export interface Campaign {
	id: string;
	key: string;
	name: string;
	/** `active` is the only state a subject can make progress in. */
	status: "draft" | "active" | "paused" | "ended";
}

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

/**
 * How far along a goal is, in the goal's own unit.
 *
 * `achieved` rather than `current`, and nested rather than flat, because that
 * is the shape `/v1/me/progress` answers.
 */
export interface GoalProgress {
	kind: string;
	achieved: number;
	target: number;
	/** Streaks only: the best run this subject has had. */
	longest?: number;
}

export interface CampaignProgress {
	id: string;
	/** `live`, `paused` or `ended`. A draft is never answered to a subject. */
	status: "live" | "paused" | "ended";
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
	progression: { xp: number; level: number };
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
