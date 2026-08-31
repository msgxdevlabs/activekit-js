---
---

Repair `examples/customer-demo`, and put a check behind it. No package changes,
so this releases nothing.

`pnpm demo` could not run. The mock served `POST /v1/subjects/tokens` and read
`body.subjectId`; the SDK moved to `POST /subject-sessions` with `{ subject }`
two releases ago and the mock never followed, so the first call the demo makes
was a 404 and the README advertised the whole thing under "See it running".

The mock now answers what the platform answers, on every route it serves, not
only the two that were reported:

- `POST /v1/subject-sessions` replaces `POST /v1/subjects/tokens`, takes
  `{ subject }`, answers the token, its expiry and the subject it belongs to,
  and rejects a stray field rather than dropping it. A session's lifetime is the
  platform's to set, so `ttlSeconds` is now the 400 it always should have been.
- `POST /v1/events` reads `subject`, `meta` and a body `idempotencyKey` rather
  than `subjectId`, `properties` and a header nothing sends, and answers a
  recorded event rather than an invented `{ eventId, advanced }`. A retry
  replays its first answer instead of writing twice, and an event name the app
  has not confirmed answers 202 `pending_confirmation` rather than pretending to
  have recorded it.
- `GET /v1/me/progress` answers the real snapshot: `environment`, the campaign
  count, wallets, the XP progression, and campaigns carrying `goal.achieved`,
  `enrollment`, the criteria's event names and a reward tagged with whether it
  is the published offer or the copy a grant froze. The flat `current`,
  `eligible` and nested `campaign` of the old shape are gone.
- `GET /v1/me/grants` answers `{ environment, grants, grantCount }` rather than
  `{ data }`, in the grant shape the browser client reads, and stamps
  acknowledgment inside the read with `firstShown` true exactly once.
- `GET /v1/me/badge` sends `unacknowledged`, which is the field the shell reads.
  It sent `unseen`, so the dot could never light.
- `POST /v1/me/badge/seen` is gone. Every method but `GET` and `HEAD` under
  `/v1/me` is now refused with a 405 before a credential is read, which is the
  read-only boundary stated as a rule rather than left to each route.

The example's own frontend follows: it handles the 202 answer, and reads the
goal back out of the snapshot by the event names a campaign listens for, since
the platform never sends a campaign's name to a subject.

`examples/customer-demo/demo.test.mjs` is new and runs in `pnpm check`. It
boots the demo server on a free port and drives it through the SDKs a customer
ships, so a mock that drifts back toward the client's shapes is a red build
rather than a demo nobody ran.
