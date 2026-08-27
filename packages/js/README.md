# @activekit/js

Browser client and embeddable widget for [ActiveKit](https://activekit.app).
Vanilla TypeScript, zero dependencies. 2.9 kB brotli for the client and inline
widget, 5.8 kB for the shell — you pay for the embed you mount, not the
package.

**Read-only.** This package retrieves a subject's own campaign progress and
grants. It cannot record events, issue grants, or change anything — see
[Why read-only](#why-read-only).

Every other ActiveKit front-end package wraps this one. Using React, Svelte, or
anything with custom-element support? Reach for
[`@activekit/react`](https://www.npmjs.com/package/@activekit/react),
[`@activekit/svelte`](https://www.npmjs.com/package/@activekit/svelte) or
[`@activekit/elements`](https://www.npmjs.com/package/@activekit/elements)
instead — they wrap this and handle teardown for you.

```bash
pnpm add @activekit/js
```

## Authentication

Pass a **subject token**, minted on your server with the
[`activekit`](https://www.npmjs.com/package/activekit) server SDK:

```ts
const { token } = await activekit.subjects.createSession({ subjectId: user.id });
```

Never an API key. An API key in the browser is an API key in every browser: it
grants organization-wide access, and no amount of obfuscation changes that.

## Client

```ts
import { createClient } from "@activekit/js";

const client = createClient({ token });

// Progress across every campaign the subject is enrolled in.
const { campaigns } = await client.progress();

// Everything they have earned, newest first.
const grants = await client.grants();

// Fires on every successful progress() call.
const off = client.on("progress", (snapshot) => render(snapshot));

// Rotate an expiring token in place.
client.setToken(next);
```

That is the whole surface. Transient failures (429, 5xx, network) retry twice
by default, honouring `Retry-After` and falling back to exponential backoff
with jitter. Everything else throws `ActiveKitError` with `status`, `code` and
`requestId` — quote `requestId` in a support ticket; it is the only handle that
reaches the trace.

Retries here are free of consequence: every request is a `GET`, so a retry
cannot double-count anything. That is why there is no idempotency-key
machinery in this package — it would have nothing to protect.

## Why read-only

Anything the browser can write, the browser's owner can forge.

A subject who can record their own events can mint streak days and referrals
at whatever rate their developer console allows. Server-side re-derivation does
not save you, because the *event* is the thing being faked — the server is
faithfully computing a reward from a lie. For a product whose whole job is
recording what people earned, that is not a hardening detail, it is the
integrity of the grant record.

So the split is:

| | Where | Credential |
|---|---|---|
| **Reading** progress and grants | browser, this package | subject token, scoped to one subject |
| **Recording** events, issuing grants | your server, [`activekit`](https://www.npmjs.com/package/activekit) | API key, never leaves your backend |

`CampaignProgress.eligible` tells you the server would honor a grant right now.
Render a button on it if you like — but that button posts to *your* backend,
which calls the server SDK. Nothing in this package can complete that action,
and the test suite asserts as much: it walks the client's prototype chain for
write-shaped methods and asserts every captured request is a `GET` with no body.

## Widget

```ts
import { createClient, mountWidget } from "@activekit/js";

const handle = mountWidget(document.querySelector("#rewards")!, client, {
  campaignKey: "daily-login",
  theme: "auto",
});

await handle.refresh();  // re-fetch and repaint
handle.destroy();
```

The widget renders inside a shadow root. Your page's CSS cannot reach in and
its styles cannot leak out — which matters because this ships to sites we do
not control and cannot test against.

It reports and does not act: when a subject becomes eligible it shows a
"Reward ready" marker and stops there. There is no claim button, for the reason
above.

## Shell

The floating embed: a bubble docked in a corner of the page that opens the
ActiveKit app over the dimmed page. Two states — the bubble is pressed and the
app opens. There is no compact panel in between.

```ts
import { mountShell } from "@activekit/js";

const shell = mountShell({
  token,                       // subject token, minted on your server
  label: "Rewards",            // the bubble's accessible name and the frame's title
  position: "bottom-right",    // or "bottom-left"
  theme: "auto",
  prefetch: "hover",           // "hover" (default) | "idle" | "none"
});

await shell.open();   // resolves once the app signals ready
shell.close();        // Escape and a scrim click do the same
shell.toggle();
await shell.refresh();
shell.setToken(next);
shell.destroy();
```

It appends itself to `document.body`; there is no target element because your
layout gives up nothing for it.

### What runs on your page, and what doesn't

Almost nothing runs here. The shell is a button, a frame, a loading skeleton
and a versioned message protocol — 5.8 kB brotli, and it does not grow when the
product does, because every screen with content in it is served from
`play.activekit.app` on ActiveKit's own origin.

That means your content-security policy needs `frame-src`, not permission to
execute our code. We cannot read your page, and you can say so in a security
review.

Three details worth knowing:

- **The subject token never appears in the frame's URL.** It crosses by
  `postMessage`, after the app's handshake. A URL reaches the referrer header,
  browser history and every proxy log on the way.
- **The frame is built on first pointer contact with the bubble** — mouse enter,
  or pointer down on a touch screen. That is a few hundred milliseconds of lead
  time, and nothing at all for the visitors who never go near it. `prefetch:
  "idle"` builds it once the page settles instead, at the cost of an app
  document on every page view; `"none"` waits for the click. A cold open shows a
  native skeleton, and an unreachable host degrades to a quiet offline state
  rather than a blank rectangle.
- **The bubble shows a dot, not a count.** One boolean from
  `GET /v1/me/badge`, polled every 60 seconds by default. It means
  *unacknowledged*, and opening the app clears it.

### Content-security policy

```
frame-src   https://play.activekit.app;
connect-src https://api.activekit.app;
```

`frame-src` is permission to *embed* the app, not to run our code in your page —
which is the whole reason the rich surface lives behind an origin boundary.
`connect-src` covers the one boolean the bubble reads to decide whether to show
its dot, on the same subject token the inline widget already uses.

### Colors

The shell paints five tokens; the app themes itself from your ActiveKit
dashboard settings rather than from a mount option.

```ts
mountShell({
  token,
  colors: {
    brand: "#5b5bd6",      // bubble fill
    onBrand: "#ffffff",    // icon on the bubble
    ring: "#ffffff",       // the unseen dot's border
    background: "#ffffff", // frame and skeleton ground
    foreground: "#102033", // close button
  },
});
```

Five, not eight, and deliberately: a mount call on someone else's page is the
wrong place to decide what our product looks like, and an option in this API
can never be removed.

### Widget brand colors

The built-in look is the ActiveKit design system, light and dark: teal fills
that white text can be read on, ink on canvas in the light theme, the slate
ladder in the dark one, and tabular figures on every number. `mountWidget`
takes a `colors` option to re-brand it. The
shadow root seals the embed off from your CSS on purpose, so theming crosses
the boundary as an option, not a stylesheet:

```ts
mountWidget(target, client, {
  colors: {
    brand: "#5b5bd6",          // bubble + progress fills
    accent: "#b45309",         // "Reward ready" pill, fulfilled chips
    ring: "#ffffff",           // ring + dot, drawn on the (brand-colored) bubble
    dark: { brand: "#7b7bec" } // per-theme refinements, merged over the base
  },
});
```

`onBrand` (the icon color on the bubble), `background`, `foreground`,
`muted` and `track` are also accepted. `accent` seeds `ring` unless you set
`ring` yourself, because they sit on opposite grounds (panel vs. bubble) and
one color rarely passes contrast on both. Which is
the caveat: the built-in palette is WCAG-tuned, and overriding moves that
responsibility to you. Hex pairs that measurably fail AA log a console
warning; invalid values are ignored, loudly.

## Script tag

For pages with no build step. **Not live yet** — `cdn.activekit.app` is the
planned host for this build; until it exists, install through a bundler.

```html
<div id="activekit"></div>
<script
  src="https://cdn.activekit.app/v<version>/activekit.js"
  integrity="sha384-…"
  crossorigin="anonymous"
  data-token="SUBJECT_JWT"
  data-campaign="daily-login"
  defer
></script>
```

Pin the exact version and its hash. A floating `/v1/` path is planned for teams
who want automatic updates; understand that it lets us change code on your page
without you deploying.

For the shell, load `activekit-shell.js` instead — a separate file, and no
container element needed:

```html
<script
  src="https://cdn.activekit.app/v<version>/activekit-shell.js"
  integrity="sha384-…"
  crossorigin="anonymous"
  data-token="SUBJECT_JWT"
  data-label="Rewards"
  defer
></script>
```

Two files rather than one with a mode switch, because a script tag has no
bundler to shake out what you did not ask for: the shell carries an iframe host
and a message protocol, and a page that only wants the inline card should not
download them. 2.9 kB brotli against the shell's 5.8 kB.

`data-token`, `data-api-url` and `data-theme` work on both. `data-campaign` and
`data-target` are the widget's; `data-app-url`, `data-position`, `data-label`,
`data-prefetch` and `data-brand-color` are the shell's. Want both embeds on one
page? Install the package and let a bundler share them, rather than loading two
tags.

## Support

Works in every browser with `fetch`, shadow DOM and custom elements — Chrome,
Edge, Firefox and Safari, current and previous major.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
