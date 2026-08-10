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
	/**
	 * Whether the server currently considers this subject eligible.
	 *
	 * For display only. Nothing in this SDK can act on it: issuing a grant is a
	 * write, and writes happen on the organization's server through the
	 * `activekit` package. Render a button if you like — it posts to *your*
	 * backend, not to ours.
	 */
	eligible: boolean;
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

export interface SubjectSnapshot {
	subjectId: string;
	programs: ProgramProgress[];
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
