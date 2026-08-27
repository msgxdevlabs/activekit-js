# activekit

## 1.0.0-alpha.1

### Major Changes

- 01e8b7e: Align every call with the API the platform actually serves. Most of this SDK
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

### Minor Changes

- eb01296: Rename `subjects.createToken` to `subjects.createSession`. It returns a session,
  not just a token: the platform serves `/v1/subject-sessions` and answers with the
  token, its expiry and the subject it belongs to, so the old name described one
  field of the answer and made every reader translate.

### Patch Changes

- f5c7e18: Call `POST /subject-sessions` with a `subject` field, which is what the platform
  serves and accepts. It posted to `/subjects/tokens` with a `subjectId` and an
  unsupported `ttlSeconds`, so minting a browser token failed for every caller.

## 0.2.0-alpha.0

### Minor Changes

- 19f91ec: Rename the campaign surface and retheme the embeds to the ActiveKit design
  system.

  The vocabulary is now the platform's: `CampaignProgress`, `campaignKey`,
  `Grant.campaignId`, `SubjectSnapshot.campaigns`, the `campaign` element
  attribute, and `data-campaign` on the CDN tag. These packages are unpublished
  placeholders, so the old `program` names are gone with no alias.

  The widget and launcher drop the placeholder palette for the ActiveKit design
  system's values in both themes: teal fills white text can be read on, ink and
  slate text rungs, canvas and slate grounds, the system's radii, elevation,
  motion, and tabular figures on every number. The launcher's expanded state is
  now a centered modal over the dimmed host page: a slate sidebar with the
  subject's avatar and three sections. Overview holds stat values, the nearest
  goal, and the active-campaign grid; Campaigns lists every campaign with
  progress and what completing it earns; Rewards is the grant history. Escape
  and the scrim close it, and focus stays inside while it is open.
  `CampaignProgress` gains an optional `reward` preview, and the launcher gains
  a `subjectLabel` option (`data-subject-label` on the CDN tag) for the
  sidebar's display name.

## 0.1.0

### Minor Changes

- 1ef7d09: First public release.

  Server SDK (`activekit`): event recording with idempotency keys, grant reads,
  subject token minting, and Web Crypto webhook verification that runs unchanged
  on Node, Workers, Bun and Deno.

  Browser client (`@activekit/js`): read-only, zero-dependency client with retry
  and `Retry-After` handling, plus a shadow-DOM widget that cannot leak styles
  into — or inherit them from — the host page. It reads a subject's own progress
  and grants and issues nothing but `GET`s: anything the browser can write, the
  browser's owner can forge, so recording events stays on the server side of the
  API key. Test-enforced, not just documented.

  Bindings (`@activekit/react`, `@activekit/svelte`, `@activekit/elements`):
  lifecycle glue over the same widget. No logic of their own.
