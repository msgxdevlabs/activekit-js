# Customer demo — Acme Learn

A complete, runnable picture of what integrating ActiveKit looks like from a
customer's side: a fictional language-learning app ("Acme Learn") with the
ActiveKit shell docked in the corner of its page, a backend that mints
subject tokens and records events, and buttons that simulate the user doing
things so you can watch progress move and rewards land.

The real API (`api.activekit.app`) is not live yet, so the demo server also
runs an in-memory stand-in for it. That mock is the one part of this folder a
real customer never writes.

## Run it

```bash
pnpm install   # repo root
pnpm demo      # builds, then serves → http://localhost:4173
```

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
│  mountShell(...)      │        │ subjects.createSession ─────┼─POST─▶ │ mints token       │
│                       │        │ events.track ─────────────┼─POST─▶ │ advances campaigns,│
│ "do thing" buttons ───┼─POST─▶ │  (holds the API key)      │        │ issues grants     │
└───────────────────────┘        └───────────────────────────┘        └───────────────────┘
```

- The browser client is **read-only**: it fetches `/v1/me/progress` and
  `/v1/me/grants` with a short-lived subject token, and that is all it can do.
- Progress only ever moves because **Acme's backend** records an event with
  the API key. The demo buttons go through it; nothing writes from the page.

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

Two things the demo does that production should not:

- `apiUrl` points at the local mock. A real integration omits it everywhere.
- The daily check-in uses a random idempotency key per click, so you can
  simulate a week of logins in ten seconds. Production would use
  `${subjectId}:practice:${today}` so the same day never counts twice.
