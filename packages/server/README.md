# activekit

Server SDK for [ActiveKit](https://activekit.app) — record events, read grants,
mint subject sessions, verify webhooks.

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

### Mint a subject session

The only supported way to authenticate a browser. The API key grants
organization-wide read and write; a session token reads one subject's own view
for fifteen minutes and can never write anything.

```ts
const session = await activekit.subjects.createSession({ subject: user.id });
```

```jsonc
{
  "token": "eyJhbGciOiJIUzI1NiIs…",   // present it as `Authorization: Bearer`
  "expiresAt": "2026-08-24T12:15:00.000Z",
  "subject": { "externalId": "user_8c1d2e" },
  "environment": "production"          // the side your API key is scoped to
}
```

Send it whole. Every field is either the credential you meant to deliver or a
fact about it, so `res.json(session)` is correct by construction — and it stays
correct when the API contract adds a field, which a hand-built object would not.

The app and environment come off your API key's own row, never out of the body,
so a session can never read wider than the key that minted it. Check
`environment` in your integration test: "my events go to sandbox and my widget
shows production" is a real confusion, and this is where it is visible.

Never put the token in a URL. The API refuses one in a query string outright
rather than answering 401, because by then it is already in browser history, in
a referrer header and in every access log along the way. It crosses to the page
through the shell handshake, or through your own endpoint as below.

#### Lifetime, and why there is no refresh helper

The token lives fifteen minutes. That is the platform's number, not a parameter:
`createSession` takes no `ttlSeconds`, because the API rejects a body carrying
one and a type that lets you ask for something the wire refuses is a 400 waiting
for production.

**This package deliberately ships nothing that keeps a session alive.** Renewing
has to happen where the token is spent, which is the browser; minting has to
happen where the API key is, which is emphatically not. Any helper here that
refreshed for you would need the key at the moment of renewal, so it would be
either useless in a page or catastrophic in one. There is also nowhere to put a
timer: this SDK runs per request in a Worker or a lambda that dies at the end of
it, and a long-lived Node process holding one timer per signed-in subject is a
leak with a memory profile.

The seam that works is three steps and needs no SDK support:

```ts
// 1. Your server, on your own authenticated route.
app.get("/api/activekit/token", async (req, res) => {
  const session = await activekit.subjects.createSession({ subject: req.user.id });
  res.json(session); // safe whole — the API key is not in it
});
```

```ts
// 2 and 3. Your page, before `expiresAt` comes round.
const { token } = await fetch("/api/activekit/token").then((r) => r.json());
client.setToken(token); // `@activekit/js` swaps it without rebuilding
```

Read `req.user.id` from your own session, never from something the browser sent.
This call is the moment your server asserts who someone is, and ActiveKit takes
that on your word because only you can know it. Subjects are created on first
sight, so a coerced `undefined` would otherwise mint a working session for a
subject nobody meant to exist — `createSession` refuses that one for you.

### The API key never goes to a browser

This package holds a credential that grants organization-wide read and write,
and there is no scoping that makes it safe in a page. So the bar here is not
that browser use is discouraged:

```ts
new ActiveKit({ apiKey }); // TypeError, if a DOM exists
```

The constructor refuses to build where `document` exists, before it reads the
key. Code that reaches for this package in a component fails on the developer's
own machine rather than in a deployed bundle. There is no opt-out option, on
purpose — an escape hatch is set by exactly the person the guard exists to stop.
If a test runner puts server code under jsdom, the fix is that file's test
environment.

Two smaller guards ride along: a subject session token passed as `apiKey` is
refused by name rather than left to answer a confusing 401, and a key that does
not start with `ak_` draws a warning but is allowed, because refusing it would
make this package the reason a newly minted key does not work.

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
