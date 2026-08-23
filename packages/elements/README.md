# @activekit/elements

[ActiveKit](https://activekit.app) as a custom element. One package for Angular,
Astro, Vue, Rails, Laravel, HTMX, Alpine, plain HTML — and whatever framework
arrives next.

**Read-only.** The element reads a subject's own campaign progress. Recording
events and issuing grants happen on your server with the
[`activekit`](https://www.npmjs.com/package/activekit) package — anything the
browser can write, the browser's owner can forge.

```bash
pnpm add @activekit/elements
```

## Usage

```html
<script type="module">
  import "@activekit/elements/auto";
</script>

<activekit-widget token="SUBJECT_JWT" campaign="daily-login"></activekit-widget>
```

Or register it yourself, under whatever tag name you like:

```ts
import { defineActiveKitElements } from "@activekit/elements";

defineActiveKitElements();              // <activekit-widget>
defineActiveKitElements("acme-streak"); // <acme-streak>
```

`defineActiveKitElements` is safe to call twice — two copies of this package on
one page is a normal thing to survive, not a reason to throw during the host's
render.

## Attributes

| Attribute | Required | Notes |
| --- | --- | --- |
| `token` | yes | Subject JWT, minted server-side. Set it late and the widget mounts then. |
| `campaign` | no | Campaign key. Omit to render the first active campaign. |
| `theme` | no | `light`, `dark`, or `auto` (default) |
| `api-url` | no | Override the API host |

All four are live: change one and the widget rebuilds.

Rendering the element before your auth resolves is expected — it waits quietly
for `token` rather than warning.

## Reacting to eligibility

The element emits no events, because nothing in it acts. To drive your own UI
off a subject's state, read it directly and render whatever you like:

```js
import { createClient } from "@activekit/js";

const { campaigns } = await createClient({ token }).progress();
if (campaigns.some((p) => p.eligible)) showYourOwnClaimButton();
```

That button posts to your backend, which calls the server SDK. It is the only
path that can write.

## Angular

```ts
@NgModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })
```

Then use `<activekit-widget [attr.token]="token">` in any template.

## Why this instead of a per-framework package

Hand-written bindings for Angular, Astro and Rails are three packages, three
test matrices and three release cadences for the same behaviour. A custom
element is one package that works in all of them, forever. That is why it ships
before a Vue binding, not after.

MIT © MSGX Dev Labs · [source](https://github.com/msgxdevlabs/activekit-js)
