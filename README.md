# ActiveKit SDKs for JavaScript

Every npm package ActiveKit publishes. Server SDK, browser client, embeddable
widget, and one thin binding per framework.

> **Status: pre-release.** Published on npm under the
> [`@activekit` scope](https://www.npmjs.com/org/activekit) — see each package's
> page for its current version. Production, `api.activekit.app/v1`, is not live
> yet; staging is, and these packages are exercised against it end to end by the
> hosted demo in
> [`activekit-play`](https://github.com/msgxdevlabs/activekit-play). Treat the
> wire types as a contract that is settled but still pre-1.0.

| Package | Install | Source | What it is |
| --- | --- | --- | --- |
| [`activekit`](https://www.npmjs.com/package/activekit) | `pnpm add activekit` | [`packages/server`](packages/server) | Server SDK. Track events, read grants, mint subject tokens, verify and handle webhooks. |
| [`@activekit/js`](https://www.npmjs.com/package/@activekit/js) | `pnpm add @activekit/js` | [`packages/js`](packages/js) | Browser client and widget. Read-only, zero dependencies. |
| [`@activekit/react`](https://www.npmjs.com/package/@activekit/react) | `pnpm add @activekit/react` | [`packages/react`](packages/react) | Provider, hooks, widget component. |
| [`@activekit/vue`](https://www.npmjs.com/package/@activekit/vue) | `pnpm add @activekit/vue` | [`packages/vue`](packages/vue) | Plugin, composables, widget component. Vue 3. |
| [`@activekit/svelte`](https://www.npmjs.com/package/@activekit/svelte) | `pnpm add @activekit/svelte` | [`packages/svelte`](packages/svelte) | Component, action, progress store. Svelte 5. |
| [`@activekit/elements`](https://www.npmjs.com/package/@activekit/elements) | `pnpm add @activekit/elements` | [`packages/elements`](packages/elements) | `<activekit-widget>`. Angular, Astro, Rails, Laravel, HTMX, plain HTML. |

There is no `@activekit/bun`, and no need for one: the server SDK runs
unchanged on Node, Cloudflare Workers, Bun and Deno — `bun add activekit` is
the whole setup. Runtimes are not frameworks; only things that own the DOM get
a binding.

Every published tarball carries a
[provenance attestation](https://docs.npmjs.com/generating-provenance-statements),
linking it to the commit and workflow that built it.

Everything is public and MIT. Architecture and registry decisions live in
[`activekit-io/docs/packaging.md`](https://github.com/msgxdevlabs/activekit-io/blob/develop/docs/packaging.md).

## The shape of it

One client, many wrappers.

```
             ┌──────────────────┐
             │  @activekit/js   │  transport · retry · auth · widget DOM
             └────────┬─────────┘
       ┌───────────┬──┴────────┬───────────┐
       ▼           ▼           ▼           ▼
  @activekit/ @activekit/ @activekit/ @activekit/
    react        vue       svelte     elements
```

The bindings hold no logic. Every one is lifecycle glue: mount the widget on
attach, tear it down on detach, and get out of the way. If a bug is fixable in
a binding, it was in the wrong place — that rule is what keeps adding the next
framework a day's work rather than a quarter's.

`activekit` (the server SDK) shares nothing with them by design. It runs where
an API key is safe; the others run where it isn't.

### The client packages cannot write

`@activekit/js` and its bindings read a subject's own progress and grants. They
have no `track`, no `claim`, and no code path that issues anything but a `GET`.

That is a security boundary, not an unfinished feature. Anything the browser can
write, the browser's owner can forge — a subject who can record their own events
can mint streak days and referrals at whatever rate their console allows, and
server-side re-derivation does not help when the *event* is the lie. For a
product whose job is recording what people earned, that is the integrity of the
grant record.

So events are recorded by the organization's server, holding an API key, through
`activekit`. The browser only ever asks what already happened. `pnpm check`
enforces it: the suite walks the client's prototype chain for write-shaped
methods and asserts every request it makes is a `GET` with no body.

### The shell answers to a contract in another repo

The shell draws a frame; the app inside it is built in
`msgxdevlabs/activekit-play`. Neither side can see the other's code, and CI
here runs on this repo alone, so nothing mechanical catches a mismatch between
the frame we paint and the app that renders in it.

`docs/contracts/shell.md` in `activekit-play` is what does. It pins the frame
geometry, the entry URL, the token handshake and the theme parameter, and it
carries a **pending adjustments** section naming what this repo has to change
next. **Read it before touching `packages/js/src/shell.ts`'s frame, URL or
message protocol,** and add the entry there in the same change when this side
moves first.

## Quick start

Mint a subject token on your server. Never put an API key in a browser — it
grants organization-wide access, and there is no scoping that makes that safe.

```ts
// your server
import { ActiveKit } from "activekit";

const activekit = new ActiveKit({ apiKey: process.env.ACTIVEKIT_API_KEY! });
const { token } = await activekit.subjects.createSession({ subjectId: user.id });
```

Then, in the browser:

<details open>
<summary><b>React</b></summary>

```tsx
import { createClient } from "@activekit/js";
import { ActiveKitProvider, ActiveKitWidget, useProgress } from "@activekit/react";

// Outside render — building it inside remounts every widget on every render.
const client = createClient({ token });

export function Rewards() {
  return (
    <ActiveKitProvider client={client}>
      <ActiveKitWidget campaignId="campaign_123" />
    </ActiveKitProvider>
  );
}
```
</details>

<details>
<summary><b>Vue</b></summary>

```ts
// main.ts
import { createClient } from "@activekit/js";
import { createActiveKit } from "@activekit/vue";

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
</details>

<details>
<summary><b>Svelte</b></summary>

```svelte
<script lang="ts">
  import { createClient } from "@activekit/js";
  import { ActiveKitWidget } from "@activekit/svelte";

  const client = createClient({ token });
</script>

<ActiveKitWidget {client} campaignId="campaign_123" />
```
</details>

<details>
<summary><b>Angular, Astro, Rails, Laravel, HTMX, plain HTML</b></summary>

```html
<script type="module">
  import "@activekit/elements/auto";
</script>

<activekit-widget token="SUBJECT_JWT" campaign="campaign_123"></activekit-widget>
```
</details>

<details>
<summary><b>A script tag, no build step</b></summary>

> Not live yet. `cdn.activekit.app` is the planned host for the `<script>` build;
> until it exists, use `@activekit/js` through a bundler.

```html
<div id="activekit"></div>
<script
  src="https://cdn.activekit.app/v<version>/activekit.js"
  integrity="sha384-…"
  crossorigin="anonymous"
  data-token="SUBJECT_JWT"
  data-campaign="campaign_123"
  defer
></script>
```

Pin the exact version and its hash. A floating `/v1/` path is also planned, and
updating it pushes code to every customer's page without them deploying — which
is exactly why it will be gated like a production deploy.

The shell is a second file, `activekit-shell.js`, loaded the same way and
needing no container. Two builds rather than one with a switch: a script tag
has no bundler to shake out the half you did not ask for, so the inline widget
stays 2.9 kB brotli instead of carrying the shell's 5.8 kB.
</details>

## See it running

[`examples/customer-demo`](examples/customer-demo) is a complete fake customer
— an "Acme Learn" page with the shell docked in its corner, a backend that
mints subject tokens and records events with the server SDK, an in-memory
stand-in for the not-yet-live API, and a stand-in ActiveKit app served from a
second port, so the whole loop and the origin boundary both run locally:

```bash
pnpm install
pnpm demo   # builds, then serves → http://localhost:4173 (app on :4174)
```

Buttons on the page simulate the user doing things; you watch progress move, a
streak complete, and the reward land in the app. The app is on its own port on
purpose — a same-origin iframe would make the boundary imaginary and leave the
message protocol untested.

## Develop

```bash
pnpm install
pnpm check      # build → typecheck → test → publint → size budgets
```

`pnpm check` is what CI runs, and the order matters: the bindings resolve
`@activekit/js` through its exports map to `dist/index.d.ts`, so nothing
downstream of it typechecks until it has been built. Everything in it fails the
build, including the size budgets:

| Entry point | Who pays it | Budget (brotli) |
| --- | --- | --- |
| `@activekit/js` | bundler — ceiling on the library | 7 kB |
| `@activekit/js` CDN, inline widget | every script-tag page | 3.5 kB |
| `@activekit/js` CDN, shell | every script-tag page | 6.5 kB |
| `@activekit/react` | bundler | 4 kB |
| `@activekit/vue` | bundler | 4 kB |
| `@activekit/svelte` | bundler | 4 kB |
| `@activekit/elements` | bundler | 3 kB |
| `activekit` | server — dependency creep, not page load | 5 kB |

The embed lands on customers' pages and competes with their LCP, so a size
regression is a red build, not a follow-up ticket. Raising a budget is a
decision about someone else's page load — say why in the PR.

Budgets are per entry point, because that is the unit a customer downloads.
The package entries are ceilings: `sideEffects: false` means a bundler ships
only the subset that was imported, so `@activekit/js` at 5.7 kB is what the
whole library weighs, not what any one page pays. The script-tag builds get the
tight budgets because they have no bundler to shake anything out: whatever is
in the file is on the page.

Both are held tight on purpose, and the shell's number is the one that should
stay flat forever. It is a button, a frame, a skeleton and a message protocol —
nothing in it scales with how large the product gets, because every screen with
content in it is served from the app's own origin. A shell that grows is a
shell that has started reimplementing the app, which is the drift this
architecture exists to prevent.

Tests cover the two packages where logic actually lives: transport and retry in
`@activekit/js`; HMAC verification, webhook dispatch and the wire shapes in
`activekit`. The bindings are covered by typecheck and build; browser-level
tests arrive with the API they need.

`activekit` also carries the check behind its own runtime claim: nothing in its
source, and nothing in either artifact built from it, may import a Node builtin
or reach a Node global. That is what makes one build run on Node, Workers, Bun
and Deno, and it is one import away from being false at any time. What the check
does not do is run anything on the three non-Node runtimes, and its header says
so.

`minimumReleaseAge` in `pnpm-workspace.yaml` refuses any dependency version
published in the last three days. If an install fails on it, that is the
control working — pin an older version rather than lowering the setting.

## Release

Every PR that changes a package carries a changeset:

```bash
pnpm changeset          # pick packages, pick a bump, describe the change
pnpm changeset --empty  # for docs/CI/test changes that release nothing
```

CI fails without one. A version bump nobody wrote is how a breaking change
ships as a patch.

Publishing is manual, from `main`: **Actions → Release → Run workflow**, type
`RELEASE` into the confirmation box. That workflow versions the packages, pushes
the version commit and tags, and publishes.

### The prerelease channel

Until `api.activekit.app/v1` is live, these packages ship as prereleases and
`latest` does not move. Two things enforce that: the repo is in changesets
**pre mode** (`.changeset/pre.json`, tag `alpha`), so `changeset version`
produces `0.2.0-alpha.0` rather than `0.2.0`; and `pnpm release` publishes
with `--tag next`, so `npm install @activekit/js` keeps resolving to the last
stable version instead of a moving target. A prerelease version is also
excluded from `^` and `~` ranges, so nobody picks one up by accident.

Everything published before the API exists is deprecated on npm, pointing at
this state. Neither the deprecation nor the tag is permanent — `npm deprecate
<pkg>@<range> ""` clears a message, and a stable release is three steps:

```bash
pnpm changeset pre exit   # commit this; versions go back to 0.2.0
# drop --tag next from the root `release` script
# release, then move the tag: npm dist-tag add @activekit/js@0.2.0 latest
```

There is no npm token anywhere in it. Publishing uses OIDC trusted publishing —
GitHub mints a short-lived identity token, npm verifies it came from this repo,
this workflow and the `npm` environment, and issues a credential good for that
one publish. Provenance attestations are generated automatically, which is why
this repo is public: npm never generates them from a private one.

If `npm token list` on the ActiveKit account is ever non-empty, something has
regressed.

### Adding a new package

A new package cannot ride the workflow until it exists on npm and has a
trusted publisher, so its first version is a one-time human step: publish
`0.0.0` locally, attach the trusted publisher with the `npm trust` CLI —
never the npmjs.com form — and `npm logout`. Exact commands, the trusted
publisher's field values, and the reasons are in
[`docs/packaging.md`](docs/packaging.md).

## Contributing

Bug reports and PRs welcome. Two things to know before opening one:

- **The embed's public API is append-only within a major.** It runs on pages we
  don't deploy and can't force-refresh. A rename is a major, always.
- **Logic goes in `@activekit/js`.** A fix that lands in a binding is a fix that
  every other binding still needs.
- **No client package may write.** A PR adding a non-`GET` request to any
  browser package will fail CI, and should — see above.
- **The shell's boundary is under contract.** Frame, URL, handshake and
  protocol changes are agreed in `docs/contracts/shell.md` in `activekit-play`
  first — see above.

MIT © MSGX Dev Labs
