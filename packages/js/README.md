# @activekit/js

Browser client and embeddable widget for [ActiveKit](https://activekit.app).
Vanilla TypeScript, zero dependencies, ~2 kB brotli.

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

// Progress across every program the subject is enrolled in.
const { programs } = await client.progress();

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

`ProgramProgress.eligible` tells you the server would honour a grant right now.
Render a button on it if you like — but that button posts to *your* backend,
which calls the server SDK. Nothing in this package can complete that action,
and the test suite asserts as much: it walks the client's prototype chain for
write-shaped methods and asserts every captured request is a `GET` with no body.

## Widget

```ts
import { createClient, mountWidget } from "@activekit/js";

const handle = mountWidget(document.querySelector("#rewards")!, client, {
  programKey: "daily-login",
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

## Script tag

For pages with no build step:

```html
<div id="activekit"></div>
<script
  src="https://cdn.activekit.app/v1.0.0/activekit.js"
  integrity="sha384-…"
  crossorigin="anonymous"
  data-token="SUBJECT_JWT"
  data-program="daily-login"
  defer
></script>
```

Pin the exact version and its hash. A floating `/v1/` path exists for teams who
want automatic updates; understand that it lets us change code on your page
without you deploying.

## Support

Works in every browser with `fetch`, shadow DOM and custom elements — Chrome,
Edge, Firefox and Safari, current and previous major.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
