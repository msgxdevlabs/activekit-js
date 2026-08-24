# @activekit/elements

## 0.2.0-alpha.0

### Minor Changes

- 0c0efe6: Wrap `mountLauncher` in every binding, and stop dropping `colors`.

  Each binding gains a launcher alongside its widget: `<ActiveKitLauncher>` in
  react, vue and svelte, and `<activekit-launcher>` in elements. All four render
  nothing — the launcher appends itself to `document.body` and floats over the
  page — and all four expose `open`, `close`, `expand`, `collapse` and `refresh`
  through their framework's own idiom: a forwarded `ref` in react, `expose()` in
  vue, instance methods via `bind:this` in svelte, and methods on the element in
  elements. Lifecycle glue only; the launcher itself still lives in
  `@activekit/js`.

  The custom element's heading attribute is `panel-title` rather than `title`,
  because `title` is a global HTML attribute and would hang a browser tooltip
  off the element as a side effect.

  The widget bindings also forward `colors`, which they were silently dropping:
  their props extended `MountOptions`, so the option typechecked and then never
  reached `mountWidget`. `<activekit-widget>` gains `brand-color` and
  `accent-color` for the same reason.

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

### Patch Changes

- Updated dependencies [b00df4c]
- Updated dependencies [82076a6]
- Updated dependencies [19f91ec]
- Updated dependencies [8975d2d]
  - @activekit/js@0.2.0-alpha.0

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

### Patch Changes

- Updated dependencies [1ef7d09]
  - @activekit/js@0.1.0
