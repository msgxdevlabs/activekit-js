export { ActiveKit, ActiveKitError } from "./client.js";
export type { ActiveKitOptions, Grant, Page, RecordEventInput } from "./client.js";

// The credential boundary. `SUBJECT_ID_MAX_LENGTH` is exported so a caller can
// bound their own id before it reaches here, rather than discovering the limit
// from a thrown error in production.
export { SUBJECT_ID_MAX_LENGTH } from "./credentials.js";
export type { SubjectSession, SubjectSessionInput } from "./credentials.js";

export { signWebhook, verifyWebhook, WebhookVerificationError } from "./webhooks.js";
export type { VerifyOptions } from "./webhooks.js";
