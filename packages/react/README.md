# @activekit/react

React bindings for [ActiveKit](https://activekit.app) — provider, hooks, and
the embeddable progress widget. React 18 and 19.

**Read-only.** These components read a subject's own campaign progress and
grants. Recording events and issuing grants happen on your server with the
[`activekit`](https://www.npmjs.com/package/activekit) package — anything the
browser can write, the browser's owner can forge.

```bash
pnpm add @activekit/react
```

## Usage

Mint a subject token on your server with the
[`activekit`](https://www.npmjs.com/package/activekit) SDK, then:

```tsx
import { createClient } from "@activekit/js";
import { ActiveKitProvider, ActiveKitWidget } from "@activekit/react";

// Outside render. Building the client inside remounts every widget on every
// render, which is a network request per keystroke on a busy page.
const client = createClient({ token });

export function Rewards() {
  return (
    <ActiveKitProvider client={client}>
      <ActiveKitWidget slot="main" />
    </ActiveKitProvider>
  );
}
```

`slot` picks which campaign to draw: `main` is the week's chain, `daily` today's
objective, `side` a one-off and `event` a limited-time one. `campaignId` names
one exactly and wins over it. Without either, the card draws the live main quest
when there is one, and the first live campaign in any slot when there is not.

There is no `onGrant` prop, because nothing here issues a grant and there is
nothing to claim. The platform issues the grant a completion pays and tells
your backend with a signed webhook; fulfilling it from your own credit ledger
is your backend's job.

### Hooks

```tsx
import { useProgress } from "@activekit/react";

function Campaigns() {
  const { data, error, loading, refresh } = useProgress();

  if (loading) return <Skeleton />;
  if (error) return <Retry onClick={refresh} />;

  return (
    <ul>
      {data?.campaigns.map((p) => (
        <li key={p.id}>
          {p.title ?? "Your progress"}: {p.goal.achieved} of {p.goal.target}
        </li>
      ))}
    </ul>
  );
}
```

`useProgress` is deliberately not a cache. Already running TanStack Query or
SWR? Call `client.progress()` inside your own query instead, with the client
from `useActiveKit()`. Reimplementing invalidation here would only get it
subtly wrong.

## Shell

The floating corner embed. It renders nothing and appends itself to
`document.body`, so put it anywhere inside the provider.

```tsx
import { ActiveKitShell } from "@activekit/react";

<ActiveKitShell label="Rewards" />
```

Drive it from your own UI with a ref:

```tsx
const rewards = useRef<ShellHandle>(null);

<ActiveKitShell ref={rewards} />
<button onClick={() => rewards.current?.open()}>Rewards</button>
```

The token and API root come from the provider's client. `onOpen`, `onClose` and
`onError` can be inline arrow functions — they are held in a ref so a new
function on each render does not rebuild the frame.

Mount one per page — two shells means two bubbles in the same corner.

## Next.js

Every export is a client component; the package carries `"use client"`. Import
it from a client component, or from a server component that renders one — the
widget touches the DOM and can never render on the server.

## Server-side

Use the [`activekit`](https://www.npmjs.com/package/activekit) package in route
handlers and server actions. It is a different package because it takes an API
key, and an API key must never reach a browser.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
