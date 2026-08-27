# @activekit/js

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

### Patch Changes

- 01e8b7e: The inline widget now reads the platform's real progress shape: the goal's `achieved` and `target`, `status: "live"` for the default pick, and the reward union for the earned pill. `campaignKey` is now `campaignId`, since the wire carries ids, and a new `label` option names the card — the platform never sends a campaign name to a subject, so the card no longer pretends it did.
- 01f0afb: Point the default app origin at `play.activekit.app`, where the app is
  actually served. It defaulted to `app.activekit.app`, a hostname nothing
  listens on, so every integration that did not pass `appUrl` opened a frame
  that could never load. Caught the day the app first deployed.

## 0.2.0-alpha.0

### Minor Changes

- b00df4c: Replace the native launcher with the shell: a bubble that opens the ActiveKit
  app in a frame on ActiveKit's own origin.

  **Breaking, and deliberately so while it is still free.** `mountLauncher` is
  gone, along with `LauncherOptions`, `LauncherHandle`, the
  `ActiveKitLauncher` components in every binding, `<activekit-launcher>`, and
  the `activekit-launcher.js` CDN build. `mountShell` replaces it, with
  `ActiveKitShell` and `<activekit-shell>` alongside; the CDN build is
  `activekit-shell.js`.

  Two states rather than three. The compact corner panel is removed: it was too
  substantial to draw natively without reimplementing what the app renders, too
  small to justify creating a document and animating a resize for, and it
  duplicated the inline widget. Every awkward case in the geometry protocol was
  that panel.

  What the shell does:

  - Renders a bubble, a frame, a loading skeleton and a versioned `postMessage`
    protocol. Nothing else, ever — every screen with content in it is served
    from the app's origin, so this file does not grow when the product does.
  - Hands the subject token to the app by `postMessage` after its `ready`
    handshake, never in the frame URL, which would reach the referrer header,
    browser history and every proxy log on the way.
  - Verifies both `event.origin` and `event.source` on every inbound message,
    and names the app's origin on every outbound one — never `*`.
  - Builds the frame on first pointer contact with the bubble by default —
    mouse enter, or pointer down on a touch screen. `idle` builds it once the
    page settles instead, at the cost of an app document on every page view;
    `none` waits for the click. A cold open shows a native skeleton, and an
    unreachable host degrades to a quiet offline state.
  - Shows a dot rather than a count on the bubble, from `GET /v1/me/badge`. It
    means unacknowledged, and opening the app clears it.

  `ActiveKitClient` gains `token` and `apiUrl` getters, so the bindings can build
  a shell from the client already in their provider rather than making callers
  pass the token twice.

  The inline widget is unchanged and keeps its full `colors` option — a card
  sitting inside someone's layout genuinely has to match it. The shell takes five
  colors for the bubble and frame chrome only; what the app looks like comes from
  the tenant's saved preset, not from a mount call on someone else's page.

  Sizes: `@activekit/js` 7.16 → 5.65 kB brotli, and the floating CDN build
  7.07 → 5.78 kB. Both budgets tightened to match.

- 82076a6: Split the script-tag build in two, and budget by entry point.

  `activekit.js` now carries the inline widget alone; the floating launcher
  ships as `activekit-launcher.js`, exported as `@activekit/js/global/launcher`.
  A script tag has no bundler to shake out the half a page did not ask for, so
  the old single file put the expanded view's markup and CSS on every embed:
  the inline widget is 2.9 kB brotli where it used to be 7.4 kB. Loading
  `activekit.js` with `data-mode="launcher"` now logs an error naming the file
  to load instead. Pages that want both embeds should install the package and
  let a bundler share the client between them.

  Size budgets move from one number per package to one per entry point, since
  that is the unit a customer actually downloads. `dist/index.js` keeps its 8 kB
  as a ceiling on the whole library — `sideEffects: false` means a bundler ships
  only the imported subset — while the script-tag builds, which have no such
  escape, get 3.5 kB and 7.5 kB. `activekit.sizeLimit` entries may now be
  `{ "limit": "3.5 kB", "pays": "…" }`, and the size table prints who pays.

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

- 8975d2d: Add `mountLauncher`: a floating corner launcher with two open states, a
  compact panel highlighting one campaign and an expanded view of the subject's
  stats, every campaign's progress, and their reward history. The bubble wears
  a progress ring and a reward-ready dot; `Esc` closes; `auto` theme follows
  `prefers-color-scheme` live. It self-mounts from its own script-tag build,
  `activekit-launcher.js`. Read-only like everything else in the package: the
  expanded view reports grants, it cannot claim them.

  Both the widget and the launcher also gain a `colors` option for brand
  theming: `brand`, `onBrand`, `accent`, `ring`, `background`, `foreground`,
  `muted`, `track`, with per-theme `light`/`dark` refinements. Values are
  validated; hex pairs that measurably fail WCAG contrast log a console
  warning. Both script-tag builds take `data-brand-color` and
  `data-accent-color`.

## 0.1.1

### Patch Changes

- 55b1cc9: README: mark the script-tag section as not yet live, and stop naming a CDN
  version that does not exist. `cdn.activekit.app` is planned, not running, and
  the example previously implied a `v1.0.0` build was available to fetch.

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
