/**
 * Wire types for the ActiveKit public API (`/v1`).
 *
 * These mirror the API's OpenAPI contract, not its database. Anything that is
 * not in the contract does not belong here — the SDK is downstream of the
 * published API, never of the product's internals.
 */

/** A campaign an organization is running: streak, daily login, referral. */
export interface Program {
	id: string;
	key: string;
	name: string;
	/** `active` is the only state a subject can make progress in. */
	status: "draft" | "active" | "paused" | "ended";
}

/** How far the current subject has got in one program. */
export interface ProgramProgress {
	program: Program;
	/** Server-computed. Never derived in the browser — the client cannot be trusted to count. */
	current: number;
	target: number;
	/** Whether the server would honour a claim right now. Advisory: it is re-derived on claim. */
	claimable: boolean;
	completedAt: string | null;
}

/**
 * What a subject earned. A grant snapshots the reward as it was at issuance —
 * it is never re-read from the live reward, so historical grants stay honest
 * after a reward is edited.
 */
export interface Grant {
	id: string;
	programId: string;
	subjectId: string;
	/** Frozen copy of the reward at the moment it was granted. */
	reward: {
		kind: string;
		amount: number;
		unit: string;
		label: string;
	};
	status: "pending" | "recorded" | "fulfilled" | "revoked";
	createdAt: string;
}

export interface TrackResult {
	/** Server-assigned event id. Use it when correlating with your own logs. */
	eventId: string;
	/** Programs whose progress moved because of this event. */
	advanced: string[];
}

export interface ClaimResult {
	/** The server's verdict. A rejected claim is a normal outcome, not an error. */
	granted: boolean;
	grant: Grant | null;
	/** Machine-readable reason when `granted` is false, e.g. `not_eligible`, `budget_exhausted`. */
	reason: string | null;
}

export interface SubjectSnapshot {
	subjectId: string;
	programs: ProgramProgress[];
}

/** Events the client emits. Subscribe with `client.on(...)`. */
export interface ActiveKitEvents {
	/** A grant was issued to this subject. */
	grant: Grant;
	/** Progress changed for one or more programs. */
	progress: SubjectSnapshot;
	/** Any error the client swallowed rather than throwing, e.g. a failed background refresh. */
	error: ActiveKitError;
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
