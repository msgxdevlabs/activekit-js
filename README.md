# ActiveKit SDKs for JavaScript

Every npm package ActiveKit publishes. Server SDK, browser client, embeddable
widget, and one thin binding per framework.

> **Status: pre-release.** Published on npm under the
> [`@activekit` scope](https://www.npmjs.com/org/activekit) — see each package's
> page for its current version. The API they call, `api.activekit.app/v1`, is not
> live yet, so nothing here talks to a running server. Treat the wire types as a
> contract under construction.

| Package | Install | Source | What it is |
| --- | --- | --- | --- |
| [`activekit`](https://www.npmjs.com/package/activekit) | `pnpm add activekit` | [`packages/server`](packages/server) | Server SDK. Record events, read grants, mint subject tokens, verify webhooks. |
| [`@activekit/js`](https://www.npmjs.com/package/@activekit/js) | `pnpm add @activekit/js` | [`packages/js`](packages/js) | Browser client and widget. Read-only, zero dependencies. |
| [`@activekit/react`](https://www.npmjs.com/package/@activekit/react) | `pnpm add @activekit/react` | [`packages/react`](packages/react) | Provider, hooks, widget component. |
| [`@activekit/svelte`](https://www.npmjs.com/package/@activekit/svelte) | `pnpm add @activekit/svelte` | [`packages/svelte`](packages/svelte) | Component, action, progress store. Svelte 5. |
| [`@activekit/elements`](https://www.npmjs.com/package/@activekit/elements) | `pnpm add @activekit/elements` | [`packages/elements`](packages/elements) | `<activekit-widget>`. Angular, Astro, Rails, Laravel, HTMX, plain HTML. |

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
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
   @activekit/   @activekit/   @activekit/
     react         svelte        elements
```

The bindings hold no logic. Every one is lifecycle glue: mount the widget on
attach, tear it down on detach, and get out of the way. If a bug is fixable in
a binding, it was in the wrong place — that rule is what keeps adding the fifth
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
ledger.

So events are recorded by the organization's server, holding an API key, through
`activekit`. The browser only ever asks what already happened. `pnpm check`
enforces it: the suite walks the client's prototype chain for write-shaped
methods and asserts every request it makes is a `GET` with no body.

## Quick start

Mint a subject token on your server. Never put an API key in a browser — it
grants organization-wide access, and there is no scoping that makes that safe.

```ts
// your server
import { ActiveKit } from "activekit";

const activekit = new ActiveKit({ apiKey: process.env.ACTIVEKIT_API_KEY! });
const { token } = await activekit.subjects.createToken({ subjectId: user.id });
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
      <ActiveKitWidget programKey="daily-login" />
    </ActiveKitProvider>
  );
}
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

<ActiveKitWidget {client} programKey="daily-login" />
```
</details>

<details>
<summary><b>Angular, Astro, Rails, Laravel, HTMX, plain HTML</b></summary>

```html
<script type="module">
  import "@activekit/elements/auto";
</script>

<activekit-widget token="SUBJECT_JWT" program="daily-login"></activekit-widget>
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
  data-program="daily-login"
  defer
></script>
```

Pin the exact version and its hash. A floating `/v1/` path is also planned, and
updating it pushes code to every customer's page without them deploying — which
is exactly why it will be gated like a production deploy.
</details>

## Develop

```bash
pnpm install
pnpm check      # build → typecheck → test → publint → size budgets
```

`pnpm check` is what CI runs, and the order matters: the bindings resolve
`@activekit/js` through its exports map to `dist/index.d.ts`, so nothing
downstream of it typechecks until it has been built. Everything in it fails the
build, including the size budgets:

| Bundle | Budget (brotli) |
| --- | --- |
| `@activekit/js` | 8 kB |
| `@activekit/js` CDN build | 8 kB |
| `@activekit/react` | 4 kB |
| `@activekit/elements` | 3 kB |

The embed lands on customers' pages and competes with their LCP, so a size
regression is a red build, not a follow-up ticket. Raising a budget is a
decision about someone else's page load — say why in the PR.

Tests cover the two packages where logic actually lives: transport and retry in
`@activekit/js`, HMAC verification in `activekit`. The bindings are covered by
typecheck and build; browser-level tests arrive with the API they need.

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

There is no npm token anywhere in it. Publishing uses OIDC trusted publishing —
GitHub mints a short-lived identity token, npm verifies it came from this repo,
this workflow and the `npm` environment, and issues a credential good for that
one publish. Provenance attestations are generated automatically, which is why
this repo is public: npm never generates them from a private one.

If `npm token list` on the ActiveKit account is ever non-empty, something has
regressed.

## Contributing

Bug reports and PRs welcome. Two things to know before opening one:

- **The embed's public API is append-only within a major.** It runs on pages we
  don't deploy and can't force-refresh. A rename is a major, always.
- **Logic goes in `@activekit/js`.** A fix that lands in a binding is a fix that
  the other four bindings still need.
- **No client package may write.** A PR adding a non-`GET` request to any
  browser package will fail CI, and should — see above.

MIT © MSGX Dev Labs
