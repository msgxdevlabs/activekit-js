---
"@activekit/js": minor
"@activekit/react": minor
"@activekit/vue": minor
"@activekit/svelte": minor
"@activekit/elements": minor
---

Replace the native launcher with the shell: a bubble that opens the ActiveKit
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
- Prefetches the frame on idle by default (`hover` and `none` also available),
  so a click opens into content rather than a spinner, with a native skeleton
  for a cold open and a quiet offline state when the host cannot be reached.
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
