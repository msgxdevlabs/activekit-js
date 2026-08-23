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
      <ActiveKitWidget campaignKey="daily-login" />
    </ActiveKitProvider>
  );
}
```

There is no `onGrant` prop, because nothing here issues a grant. When
`progress.eligible` is true, render your own button and post to your own
backend — that route calls the server SDK, which is the only thing that can
write.

### Hooks

```tsx
import { useActiveKit, useProgress } from "@activekit/react";

function Streak() {
  const { data, error, loading, refresh } = useProgress();
  const client = useActiveKit();

  if (loading) return <Skeleton />;
  if (error) return <Retry onClick={refresh} />;

  return <ul>{data?.campaigns.map((p) => <li key={p.campaign.id}>{p.current}/{p.target}</li>)}</ul>;
}
```

`useProgress` is deliberately not a cache. Already running TanStack Query or
SWR? Call `client.progress()` inside your own query instead — reimplementing
invalidation here would only get it subtly wrong.

## Next.js

Every export is a client component; the package carries `"use client"`. Import
it from a client component, or from a server component that renders one — the
widget touches the DOM and can never render on the server.

## Server-side

Use the [`activekit`](https://www.npmjs.com/package/activekit) package in route
handlers and server actions. It is a different package because it takes an API
key, and an API key must never reach a browser.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
