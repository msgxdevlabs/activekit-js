# @activekit/js

Browser client and embeddable widget for [ActiveKit](https://activekit.app).
Vanilla TypeScript, zero dependencies, ~6 kB brotli.

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
const { token } = await activekit.subjects.createToken({ subjectId: user.id });
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
integrity of the ledger.

So the split is:

| | Where | Credential |
|---|---|---|
| **Reading** progress and grants | browser, this package | subject token, scoped to one subject |
| **Recording** events, issuing grants | your server, [`activekit`](https://www.npmjs.com/package/activekit) | API key, never leaves your backend |

`CampaignProgress.eligible` tells you the server would honour a grant right now.
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

## Launcher

The widget's floating sibling: a bubble docked in a corner of the page that
opens into a compact progress panel, and maximizes into a dashboard of the
subject's stats — every campaign's progress and their full reward history.

```ts
import { createClient, mountLauncher } from "@activekit/js";

const launcher = mountLauncher(client, {
  campaignKey: "daily-login",  // highlighted by the bubble's ring and the compact panel
  position: "bottom-right",   // or "bottom-left"
  title: "Your rewards",
  theme: "auto",
});

launcher.open();     // compact panel
launcher.expand();   // maximized dashboard
launcher.close();    // back to the bubble — Esc does the same
await launcher.refresh();
launcher.destroy();
```

It appends itself to `document.body`; there is no target element because your
layout gives up nothing for it. The bubble wears a progress ring for the
highlighted campaign and a dot when a reward is ready. Same shadow root, same
read-only surface as the widget — the dashboard shows grants, it cannot claim
them.

One habit worth knowing: the launcher repaints on every successful
`client.progress()`, whoever triggered it. After your backend records an
event, a single `client.progress()` call brings the launcher up to date.

### Brand colors

Both `mountWidget` and `mountLauncher` take a `colors` option. The shadow
root seals the embed off from your CSS on purpose, so theming crosses the
boundary as an option, not a stylesheet:

```ts
mountLauncher(client, {
  colors: {
    brand: "#5b5bd6",          // bubble + progress fills
    accent: "#b45309",         // "Reward ready" pill, fulfilled chips
    ring: "#ffffff",           // ring + dot, drawn on the (brand-colored) bubble
    dark: { brand: "#7b7bec" } // per-theme refinements, merged over the base
  },
});
```

`background`, `foreground`, `muted` and `track` are also accepted. `accent`
seeds `ring` unless you set `ring` yourself — they sit on opposite grounds
(panel vs. bubble), and one color rarely passes contrast on both. Which is
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

Add `data-mode="launcher"` to self-mount the floating launcher instead of the
inline widget — no container element needed. `data-position` and `data-title`
pass through, and `data-brand-color` / `data-accent-color` cover the script
tag's share of the `colors` option.

## Support

Works in every browser with `fetch`, shadow DOM and custom elements — Chrome,
Edge, Firefox and Safari, current and previous major.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
