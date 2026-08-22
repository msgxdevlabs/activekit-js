# Customer demo — Acme Learn

A complete, runnable picture of what integrating ActiveKit looks like from a
customer's side: a fictional language-learning app ("Acme Learn") with the
floating launcher widget in the corner of its page, a backend that mints
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
│  mountLauncher(...)   │        │ subjects.createToken ─────┼─POST─▶ │ mints token       │
│                       │        │ events.record ────────────┼─POST─▶ │ advances campaigns,│
│ "do thing" buttons ───┼─POST─▶ │  (holds the API key)      │        │ issues grants     │
└───────────────────────┘        └───────────────────────────┘        └───────────────────┘
```

- The browser client is **read-only**: it fetches `/v1/me/progress` and
  `/v1/me/grants` with a short-lived subject token, and that is all it can do.
- Progress only ever moves because **Acme's backend** records an event with
  the API key. The demo buttons go through it; nothing writes from the page.

## The launcher's three states

- **Bubble** (closed): a small circular button docked bottom-right, wearing a
  progress ring for the highlighted campaign and a dot when a reward is
  ready. Click to open.
- **Compact panel**: one campaign's progress — the same content as the inline
  widget, in a card above the bubble.
- **Expanded view**: the panel's maximize button opens a centered modal over
  the dimmed page — a slate sidebar with Overview (stat values, the nearest
  goal, the active-campaign grid), Campaigns (every campaign, its progress,
  and what completing it earns), and Rewards (the grant history).

`Esc` and the scrim close it. The theme toggle in the demo nav remounts it in
dark mode.

## Which files are "the integration"

| File | Role | Copy into a real app? |
| --- | --- | --- |
| `public/app.js` | Frontend: token fetch → `createClient` → `mountLauncher` | **Yes** — this is the whole frontend integration. |
| `server.mjs`, ⭐ routes | Backend: `subjects.createToken`, `events.record` | **Yes** — swap the demo user for your session user and drop `apiUrl`. |
| `server.mjs`, the rest | Static file serving, demo reset | No — your framework already does this. |
| `mock-activekit.mjs` | Stand-in for api.activekit.app | **Never** — this side is ActiveKit's job. |

Two things the demo does that production should not:

- `apiUrl` points at the local mock. A real integration omits it everywhere.
- The daily check-in uses a random idempotency key per click, so you can
  simulate a week of logins in ten seconds. Production would use
  `${userId}:practice:${today}` so the same day never counts twice.
