# @activekit/svelte

Svelte 5 bindings for [ActiveKit](https://activekit.app) — widget component,
action, and progress store.

**Read-only.** These read a subject's own campaign progress and grants.
Recording events and issuing grants happen on your server with the
[`activekit`](https://www.npmjs.com/package/activekit) package — anything the
browser can write, the browser's owner can forge.

```bash
pnpm add @activekit/svelte
```

Svelte 5 only. Svelte 4 users can use
[`@activekit/js`](https://www.npmjs.com/package/@activekit/js) directly in
`onMount` — it is four lines and no worse.

## Component

```svelte
<script lang="ts">
  import { createClient } from "@activekit/js";
  import { ActiveKitWidget } from "@activekit/svelte";

  const client = createClient({ token });
</script>

<ActiveKitWidget {client} campaignKey="daily-login" />
```

## Action

For when the surrounding markup is yours and only the widget is ours:

```svelte
<script lang="ts">
  import { activekit } from "@activekit/svelte";
</script>

<div use:activekit={{ client, campaignKey: "daily-login" }}></div>
```

## Store

For driving your own markup instead of the packaged widget:

```svelte
<script lang="ts">
  import { createProgressStore } from "@activekit/svelte";

  const progress = createProgressStore(client);
</script>

{#if $progress.loading}
  <Skeleton />
{:else if $progress.error}
  <button onclick={() => progress.refresh()}>Retry</button>
{:else}
  {#each $progress.data?.campaigns ?? [] as p (p.campaign.id)}
    <li>{p.current} / {p.target}</li>
  {/each}
{/if}
```

The store fetches on first subscription rather than on creation, so building
one at module scope does not fire a request during SSR.

## SvelteKit

The widget touches the DOM. The component and the action handle that themselves
— both mount in an effect, which never runs on the server — so no `browser`
guard is needed.

Mint subject tokens in a server load function or form action with the
[`activekit`](https://www.npmjs.com/package/activekit) package. It takes an API
key, which must never reach a browser.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
