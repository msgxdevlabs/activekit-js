---
"@activekit/react": minor
"@activekit/vue": minor
"@activekit/svelte": minor
"@activekit/elements": minor
---

Wrap `mountLauncher` in every binding, and stop dropping `colors`.

Each binding gains a launcher alongside its widget: `<ActiveKitLauncher>` in
react, vue and svelte, and `<activekit-launcher>` in elements. All four render
nothing — the launcher appends itself to `document.body` and floats over the
page — and all four expose `open`, `close`, `expand`, `collapse` and `refresh`
through their framework's own idiom: a forwarded `ref` in react, `expose()` in
vue, instance methods via `bind:this` in svelte, and methods on the element in
elements. Lifecycle glue only; the launcher itself still lives in
`@activekit/js`.

The custom element's heading attribute is `panel-title` rather than `title`,
because `title` is a global HTML attribute and would hang a browser tooltip
off the element as a side effect.

The widget bindings also forward `colors`, which they were silently dropping:
their props extended `MountOptions`, so the option typechecked and then never
reached `mountWidget`. `<activekit-widget>` gains `brand-color` and
`accent-color` for the same reason.
