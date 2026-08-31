---
"activekit": minor
---

`webhooks.on` arrives, and `events.record` becomes `events.track`.

**Receiving a webhook is now two calls.** `webhooks.on(type, handler)`
registers; `webhooks.dispatch(rawBody, signatureHeader, secret)` verifies one
delivery and runs what is registered for it. `dispatch` is `verify` plus a
lookup rather than a second signature implementation, so the `ts:body`
construction, the tolerance window and multiple `v1` values during a rotation
all hold here unchanged. It takes raw text rather than a `Request`, because
text is the one input every runtime and every framework can produce, and
because nothing between the wire and a handler may re-serialize the body.

Every event arrives in the envelope the platform actually posts:
`{ id, type, createdAt, data }`, with a `grant.created` payload under
`data.grant` in the same shape `grants.list` returns. `id` is the delivery's
own id and the key to dedupe on, since delivery is at least once. Handlers are
typed per event type, `grant.created` and `webhook.test` today.

Three behaviours are the design, and each is pinned by a test:

- An unregistered type answers `{ status: "ignored" }` rather than throwing.
  `webhook.test` is a real second type, sent by the dashboard's send-test
  button, and more are coming; a receiver that threw would break on the
  platform's release rather than on its own deploy.
- A failing handler throws `WebhookHandlerError`, carrying the event and every
  rejection. The platform retries a non-2xx on a schedule, and a receiver that
  swallowed the failure would never see that grant again.
- Handlers for one type run concurrently and all of them run, so one failing
  never skips a sibling.

`createWebhookRouter()` is exported for a process that receives webhooks and
makes no API calls: receiving needs a signing secret, not an organization-wide
API key.

**`events.record` is now `events.track`,** which is what the platform's own
route, the roadmap and the landing page all call it. `record` is the same
function reference under its former name. It is deprecated in the types, it
still works, and it is not going away in a `1.x`.

New type exports for shapes the public methods already returned and nobody
could name: `Reward`, `RecordedEvent`, `PendingEvent`, `EventsApi`,
`TrackEventInput`, plus the webhook envelope types. `Page` is deprecated,
because `GET /v1/grants` answers `{ grants }` with no cursor and nothing has
ever returned one.

The runtime claim now has a check behind it: no module in the source, and
neither built artifact, may import a Node builtin or reach a Node global.
Nothing in the suite runs on Workers, Bun or Deno, so it proves the property
the claim rests on rather than the claim itself.
