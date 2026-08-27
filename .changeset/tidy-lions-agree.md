---
"activekit": major
"@activekit/js": major
---

Align every call with the API the platform actually serves. Most of this SDK
could not have worked against a live deployment.

- **Webhook verification accepted no real delivery.** The platform's header is
  `ts=<seconds>;v1=<hex>` over `ts:body`; this parsed `t=<seconds>,v1=<hex>`
  over `ts.body`, so every genuine signature failed as "malformed header". The
  round-trip test passed because signing and verifying shared the same wrong
  format.
- **`events.record` was a 400 every time.** The body is strict: it wants
  `subject` and `meta`, not `subjectId` and `properties`, and it requires
  `idempotencyKey` in the body rather than as a header the platform never
  reads. That last one made every retry a double write.
- **`grants.list` filters were silently ignored**, so asking for one subject's
  grants answered the whole organization's, and the response envelope is
  `{ grants }` rather than `{ data, nextCursor }`. Cursor pagination does not
  exist on the platform and is gone; `status` and `environment` filters do
  exist and are now reachable.
- **The bubble's unseen dot could never light**, because it read `unseen` where
  the platform sends `unacknowledged`.
- **The shell posted to `/me/badge/seen` on every open**, a route that does not
  exist and could not: `/v1/me` refuses every method but GET before it reads a
  credential. Acknowledgment happens inside `GET /v1/me/grants`, which is what
  the shell now calls.
- **`client.grants()` returned `undefined`**, reading `.data` off a `{ grants }`
  answer while its signature promised an array.

Types now match the wire. `Grant` carries a nested campaign, `issuedAt`,
`acknowledgedAt` and `firstShown`; its status is `pending | fulfilled | voided
| reversed`, so a clawback is representable. `Reward` is a discriminated union
rather than a flat shape with an invented `unit`. The progress snapshot carries
the wallets and the XP progression it always sent.

Event names are deliberately untouched: the platform still emits
`grant.created`, and renaming it is a coordinated change in both repositories.
