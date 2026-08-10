# @activekit/js

Browser client and embeddable widget for [ActiveKit](https://activekit.app).
Vanilla TypeScript, zero dependencies, ~2 kB brotli.

Every other ActiveKit front-end package is a wrapper around this one. Using
React, Svelte, or anything with custom-element support? Reach for
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

// Record something the subject did.
await client.track("session_start", { plan: "free" });

// Pass an idempotency key for anything a retry could double-count.
await client.track("streak_day", {}, { idempotencyKey: `${user.id}:${today}` });

// Progress across every program the subject is enrolled in.
const { programs } = await client.progress();

// Ask for a grant. The server re-derives eligibility and ignores whatever the
// client believes about its own progress — a refusal is a result, not an error.
const { granted, grant, reason } = await client.claim("daily-login");

const off = client.on("grant", (grant) => celebrate(grant));
```

Transient failures (429, 5xx, network) retry twice by default, honouring
`Retry-After` and falling back to exponential backoff with jitter. Everything
else throws `ActiveKitError` with `status`, `code` and `requestId` — quote
`requestId` in a support ticket; it is the only handle that reaches the trace.

Rotate an expiring token in place with `client.setToken(next)`.

## Widget

```ts
import { createClient, mountWidget } from "@activekit/js";

const handle = mountWidget(document.querySelector("#rewards")!, client, {
  programKey: "daily-login",
  theme: "auto",
  onGrant: () => refetchCredits(),
});

handle.destroy();
```

The widget renders inside a shadow root. Your page's CSS cannot reach in and
its styles cannot leak out — which matters because this ships to sites we do
not control and cannot test against.

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
