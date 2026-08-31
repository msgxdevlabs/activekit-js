# Customer demo — Acme Learn

A complete, runnable picture of what integrating ActiveKit looks like from a
customer's side: a fictional language-learning app ("Acme Learn") with the
ActiveKit shell docked in the corner of its page, a backend that opens
subject sessions and records events, and buttons that simulate the user doing
things so you can watch a goal move and a grant land.

Production (`api.activekit.app`) is not live yet, so the demo server also runs
an in-memory stand-in for it. That mock is the one part of this folder a real
customer never writes.

The mock is shaped by the platform, never by the SDKs in front of it. A mock
reshaped to satisfy its caller agrees with that caller's bugs, and this folder
is the reference integration a developer copies, so where the two disagree the
platform wins.

## Run it

```bash
pnpm install   # repo root
pnpm demo      # builds, then serves → http://localhost:4173
```

The demo is checked, not just published:

```bash
node --test examples/customer-demo/demo.test.mjs   # after pnpm build
```

`pnpm check` runs the same file. It boots this server on a free port and drives
it through the SDKs a customer ships, because the version of this demo that
shipped broken for two merges would have passed any check that only imported
the files.

There is no separate dev mode: the demo intentionally serves the **built**
`@activekit/js` from `packages/js/dist` — the exact minified file a customer
ships — and the server imports the built `activekit` SDK. After editing SDK
source, re-run `pnpm demo` (or `pnpm --filter @activekit/js build` and refresh
the page; the demo server itself needs no restart for SDK-only changes).

## What you're looking at

```
 browser (public/)                 Acme's backend (server.mjs)          mock ActiveKit API
┌───────────────────────┐        ┌───────────────────────────┐        ┌───────────────────┐
│ @activekit/js         │        │ activekit (server SDK)    │        │ /v1/… (in-memory) │
│  createClient(token) ─┼─GET──▶ │                           │        │                   │
│  mountShell(...)      │        │ subjects.createSession ─────┼─POST─▶ │ opens a session   │
│                       │        │ events.track ─────────────┼─POST─▶ │ advances campaigns,│
│ "do thing" buttons ───┼─POST─▶ │  (holds the API key)      │        │ issues grants     │
└───────────────────────┘        └───────────────────────────┘        └───────────────────┘
```

- The browser client is **read-only**: it fetches `/v1/me/progress` and
  `/v1/me/grants` with a short-lived subject token, the shell adds
  `/v1/me/badge` for its dot, and that is all either of them can do.
- Progress only ever moves because **Acme's backend** records an event with
  the API key. The demo buttons go through it; nothing writes from the page.
- The mock enforces that rather than trusting it. Every method but `GET` and
  `HEAD` under `/v1/me` is refused with a 405 before a credential is read, so
  there is no acknowledge call for a browser to make and no shape of request
  that could add one.

## What the mock reproduces, and why

Four platform behaviours are here because a developer has to handle them, and a
mock that skips them teaches a client that breaks the first time it meets the
real thing.

| Behaviour | What the demo would get wrong without it |
| --- | --- |
| **Events are idempotent per `idempotencyKey`.** A retry answers 200 with the original event rather than writing a second one. | A timeout followed by a retry doubles a streak day, and for a referral that is a double grant against a real budget. |
| **An unconfirmed event name answers 202 `pending_confirmation`.** The delivery is dropped rather than recorded. | A client that reads every 2xx as recorded believes in events the platform never kept. `public/app.js` checks for it before it reads any progress. |
| **Acknowledgment happens inside `GET /v1/me/grants`.** The read stamps it, and `firstShown` is true exactly once, on the answer that stamped it. | A browser that has to write to clear its own dot needs a write path, and the whole read-only boundary goes with it. |
| **A grant snapshots its reward at issuance.** Progress reports `{ source: "campaign" }` for the published offer and `{ source: "grant", status }` once one is issued. | A reward read off a grant is history and one read off a campaign is an offer. Reading the second as the first is how a reversal gets celebrated. |

## Two states, and a real origin boundary

The shell has two: a bubble, and the app. Pressing the bubble opens
`http://localhost:4174` in a frame over the dimmed page — a genuinely different
origin from the customer page on `:4173`.

That second port is the point. A same-origin iframe can reach into `parent`
directly, which would make the boundary imaginary and leave the message
protocol untested. Here the only way across is `postMessage`, exactly as in
production, where the app is on `play.activekit.app` and the customer is on
theirs.

Worth watching in the network tab: the frame's URL carries `theme` and a
protocol version, and no token. The subject token crosses by `postMessage`
after the app posts `ready`, because a URL reaches the referrer header, browser
history and every proxy log on the way.

`examples/dummy-app` is a stand-in for the real ActiveKit app — fake data, real
handshake. Every message the shell can send is answered there, and every
message the shell expects is sent.

## Which files are "the integration"

| File | Role | Copy into a real app? |
| --- | --- | --- |
| `public/app.js` | Frontend: token fetch → `createClient` → `mountShell` | **Yes** — this is the whole frontend integration. |
| `server.mjs`, ⭐ routes | Backend: `subjects.createSession`, `events.track` | **Yes** — swap the demo user for your session user and drop `apiUrl`. |
| `server.mjs`, the rest | Static file serving, demo reset | No — your framework already does this. |
| `mock-activekit.mjs` | Stand-in for api.activekit.app | **Never** — this side is ActiveKit's job. |
| `demo.test.mjs` | Boots this server and drives every route it serves | No. It exists so this folder cannot rot again. |

Two things the demo does that production should not:

- `apiUrl` points at the local mock. A real integration omits it everywhere.
- The daily check-in uses a random idempotency key per click, so you can
  simulate a week of logins in ten seconds. Production would use
  `${subjectId}:practice:${today}` so the same day never counts twice.
