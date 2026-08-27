# activekit

Server SDK for [ActiveKit](https://activekit.app) — record events, read grants,
mint subject tokens, verify webhooks.

`fetch`-based and dependency-free, so one build runs on Node 20+, Cloudflare
Workers, Bun and Deno. Nothing here imports a Node builtin.

**This is the only ActiveKit package that can write.** The browser packages are
read-only by design: anything the browser can write, the browser's owner can
forge. Events reach ActiveKit from your backend, holding an API key, or they do
not reach it at all.

```bash
pnpm add activekit
```

## Usage

```ts
import { ActiveKit } from "activekit";

const activekit = new ActiveKit({ apiKey: process.env.ACTIVEKIT_API_KEY! });
```

### Record an event

Events are the only input to campaign criteria. Pass an `idempotencyKey` for
anything a retry could double-count — for a streak or a referral, a duplicate
is a double grant against a real budget.

```ts
await activekit.events.record({
  subjectId: user.id,
  name: "session_start",
  properties: { plan: "free" },
  idempotencyKey: `${user.id}:${today}`,
});
```

### Read the ledger

ActiveKit records what subjects earned; your billing system fulfils it. Grants
are append-only and snapshot the reward as it was at issuance, so editing a
reward never rewrites history.

```ts
const { data, nextCursor } = await activekit.grants.list({ subjectId: user.id });
```

### Mint a browser token

The only supported way to authenticate a browser. The API key grants
organization-wide access; a subject token grants one subject's own view.

```ts
const { token, expiresAt } = await activekit.subjects.createSession({
  subjectId: user.id,
  ttlSeconds: 900,
});
```

### Verify a webhook

```ts
const event = await activekit.webhooks.verify(
  await request.text(),                       // raw body — see below
  request.headers.get("activekit-signature")!,
  process.env.ACTIVEKIT_WEBHOOK_SECRET!,
);
```

Pass the **raw** request body, byte for byte. `JSON.stringify(await
request.json())` re-serializes with different key order or spacing and the
signature will not match — the most common integration failure, and it looks
like a bad secret rather than a re-serialized body.

Verification is async because it uses Web Crypto rather than `node:crypto`.
There is no synchronous variant on purpose: a sync API would have to reach for
Node's crypto and would die the first time it was deployed to an edge runtime.

Signatures older than 300 seconds are rejected. Without that window a captured
signature stays valid forever, and replaying a `grant.created` webhook means
fulfilling the same reward twice. Adjust with `{ toleranceSeconds }` if your
queue's retry delay genuinely exceeds it.

Multiple `v1=` values in one header are accepted, which is what makes rotating
a signing secret a non-event.

## Errors

Every non-2xx throws `ActiveKitError` with `status`, `code` and `requestId`.
429s and 5xx retry twice by default (`maxRetries`), honouring `Retry-After`.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
