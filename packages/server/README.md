# activekit

Server SDK for [ActiveKit](https://activekit.app) — track events, read grants,
mint subject tokens, verify and handle webhooks.

`fetch`-based and dependency-free, so one build runs on Node 20+, Cloudflare
Workers, Bun and Deno. Nothing here imports a Node builtin or reaches a Node
global, and a check in `pnpm check` fails the build when something does.

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

### Track an event

Events are the only input to campaign criteria. Pass an `idempotencyKey` for
anything a retry could double-count: for a streak or a referral, a duplicate is
a double grant against a real budget.

```ts
await activekit.events.track({
  subjectId: user.id,
  name: "session_start",
  properties: { plan: "free" },
  idempotencyKey: `${user.id}:${today}`,
});
```

`events.record` is the same function under its former name. It is deprecated,
it still works, and it is not going away in a `1.x`: this SDK is published and
callers of it are not being broken for a name.

An event whose name this app has not confirmed answers
`{ status: "pending_confirmation", name }` instead of a recorded event. The
delivery was dropped rather than kept, so check the status before treating a
2xx as recorded.

### Read grants

ActiveKit records what subjects earned; your billing system fulfills it. Grants
are append-only and snapshot the reward as it was at issuance, so editing a
reward never rewrites history.

```ts
const { grants } = await activekit.grants.list({
  subjectId: user.id,
  environment: "production",
});
```

Filters are `subjectId`, `campaignId`, `status` and `environment`, and they
compose. There is no cursor: the list answers everything that matched. Filter
on `environment: "production"` for the reconciliation view, since a sandbox
grant is a rehearsal record and never something you owe.

### Mint a browser token

The only supported way to authenticate a browser. The API key grants
organization-wide access; a subject token grants one subject's own view, read
only.

```ts
const { token, expiresAt } = await activekit.subjects.createSession({
  subjectId: user.id,
});
```

The lifetime is the platform's to set and is not a parameter. A caller choosing
it could choose badly, and a token that outlives its purpose is the thing this
mechanism exists to avoid.

### Verify a webhook

```ts
const event = await activekit.webhooks.verify(
  await request.text(),                       // raw body, see below
  request.headers.get("activekit-signature")!,
  process.env.ACTIVEKIT_WEBHOOK_SECRET!,
);
```

Pass the **raw** request body, byte for byte. `JSON.stringify(await
request.json())` re-serializes with different key order or spacing and the
signature will not match. It is the most common integration failure, and it
looks like a bad secret rather than a re-serialized body.

Verification is async because it uses Web Crypto rather than `node:crypto`.
There is no synchronous variant on purpose: a sync API would have to reach for
Node's crypto and would die the first time it was deployed to an edge runtime.

Signatures older than 300 seconds are rejected. Without that window a captured
signature stays valid forever, and replaying a `grant.created` webhook means
fulfilling the same reward twice. Adjust with `{ toleranceSeconds }` if your
queue's retry delay genuinely exceeds it.

Multiple `v1=` values in one header are accepted, which is what makes rotating
a signing secret a non-event.

### Handle a webhook

`on` registers a handler per event type; `dispatch` verifies one delivery and
runs what is registered for it. Registration on its own receives nothing, and
`dispatch` is `verify` plus a lookup rather than a second signature
implementation, so everything above holds here unchanged.

```ts
activekit.webhooks.on("grant.created", async (event) => {
  if (await alreadyProcessed(event.id)) return;      // deliveries repeat
  const { grant } = event.data;
  await credits.add(grant.subject.externalId, grant.reward);
  await markProcessed(event.id);
});

// in your route
const result = await activekit.webhooks.dispatch(
  await request.text(),
  request.headers.get("activekit-signature")!,
  process.env.ACTIVEKIT_WEBHOOK_SECRET!,
);
return new Response(null, { status: 204 });          // handled or ignored
```

Every event arrives in one envelope:

```ts
{ id: "whd_…", type: "grant.created", createdAt: "…", data: { grant } }
```

`id` is the delivery's own id and the key to dedupe on. Delivery is at least
once, so a receiver that answered slowly, or a queue that replayed, sees the
same `id` again. `data` carries the payload for the type; for `grant.created`
that is the same grant shape `grants.list` returns.

Three behaviours worth knowing before you deploy:

- **An unregistered type is ignored, not an error.** `dispatch` answers
  `{ status: "ignored", event, handlers: 0 }`. The platform sends
  `webhook.test` today, from the dashboard's send-test button, and will add
  types as the product grows. Answer 2xx either way: the delivery arrived, and
  asking for a retry of an event you do not handle produces the same non-event
  four more times.
- **A failing handler throws.** `dispatch` rejects with `WebhookHandlerError`,
  carrying the `event` and every rejection in `errors`. The platform retries a
  non-2xx on a schedule, so let it propagate or catch it and answer 500. A
  receiver that swallows the failure and answers 200 never sees that grant
  again.
- **Handlers for one type run concurrently, and all of them run.** One failing
  never skips a sibling.

Receiving needs a signing secret, not an API key. A process that only fulfills
grants can hold the router on its own:

```ts
import { createWebhookRouter } from "activekit";

const webhooks = createWebhookRouter();
webhooks.on("grant.created", fulfill);
```

## Errors

Every non-2xx throws `ActiveKitError` with `status`, `code` and `requestId`.
429s and 5xx retry twice by default (`maxRetries`), honoring `Retry-After`.
`WebhookVerificationError` covers every verification failure and never says
which check failed; `WebhookHandlerError` means your own handler rejected.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
