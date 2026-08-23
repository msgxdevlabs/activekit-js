# @activekit/vue

Vue 3 bindings for [ActiveKit](https://activekit.app) — plugin, composables,
and the embeddable progress widget.

**Read-only.** These components read a subject's own campaign progress and
grants. Recording events and issuing grants happen on your server with the
[`activekit`](https://www.npmjs.com/package/activekit) package — anything the
browser can write, the browser's owner can forge.

```bash
pnpm add @activekit/vue
```

## Usage

Mint a subject token on your server with the
[`activekit`](https://www.npmjs.com/package/activekit) SDK, then:

```ts
// main.ts
import { createApp } from "vue";
import { createClient } from "@activekit/js";
import { createActiveKit } from "@activekit/vue";

import App from "./App.vue";

// Once, at app setup. Creating a client per component remounts every widget
// that uses it.
const client = createClient({ token });

createApp(App).use(createActiveKit(client)).mount("#app");
```

```vue
<script setup lang="ts">
import { ActiveKitWidget } from "@activekit/vue";
</script>

<template>
  <ActiveKitWidget campaign-key="daily-login" />
</template>
```

`class` and `style` fall through to the widget's host element — no wrapper
needed. There is no `onGrant` prop, because nothing here issues a grant. When
`progress.eligible` is true, render your own button and post to your own
backend — that route calls the server SDK, which is the only thing that can
write.

For a client scoped to part of the app instead of all of it, call
`provideActiveKit(client)` in an ancestor's `setup`.

### Composables

```vue
<script setup lang="ts">
import { useActiveKit, useProgress } from "@activekit/vue";

const { data, error, loading, refresh } = useProgress();
const client = useActiveKit();
</script>

<template>
  <Skeleton v-if="loading" />
  <Retry v-else-if="error" @click="refresh" />
  <ul v-else>
    <li v-for="p in data?.campaigns" :key="p.campaign.id">{{ p.current }}/{{ p.target }}</li>
  </ul>
</template>
```

`useProgress` is deliberately not a cache. Already running TanStack Query or
Pinia Colada? Call `client.progress()` inside your own query instead —
reimplementing invalidation here would only get it subtly wrong.

## Shell

The floating corner embed. It renders nothing and appends itself to
`document.body`, so put it anywhere under the provider.

```vue
<script setup lang="ts">
import { ref } from "vue";
import { ActiveKitShell } from "@activekit/vue";

const rewards = ref();
</script>

<template>
  <ActiveKitShell ref="rewards" label="Rewards" @open="track('rewards_opened')" />
  <button @click="rewards.open()">Rewards</button>
</template>
```

`open`, `close`, `toggle`, `refresh` and `setToken` are exposed on the instance,
and `open` / `close` / `error` are emitted as events. Mount one per page — two
shells means two bubbles in the same corner.

## Nuxt

The widget touches the DOM and can never render on the server. `useProgress`
fetches in `onMounted`, so SSR fires no request — but the widget itself must
render client-side: wrap it in `<ClientOnly>`, or mount it from a
`.client.vue` component.

## Server-side

Use the [`activekit`](https://www.npmjs.com/package/activekit) package in
server routes and Nitro handlers. It is a different package because it takes an
API key, and an API key must never reach a browser.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
