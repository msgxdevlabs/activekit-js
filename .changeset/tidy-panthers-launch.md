---
"@activekit/js": minor
---

Add `mountLauncher`: a floating corner launcher with two open states, a
compact panel highlighting one campaign and an expanded view of the subject's
stats, every campaign's progress, and their reward history. The bubble wears
a progress ring and a reward-ready dot; `Esc` closes; `auto` theme follows
`prefers-color-scheme` live. It self-mounts from its own script-tag build,
`activekit-launcher.js`. Read-only like everything else in the package: the
expanded view reports grants, it cannot claim them.

Both the widget and the launcher also gain a `colors` option for brand
theming: `brand`, `onBrand`, `accent`, `ring`, `background`, `foreground`,
`muted`, `track`, with per-theme `light`/`dark` refinements. Values are
validated; hex pairs that measurably fail WCAG contrast log a console
warning. Both script-tag builds take `data-brand-color` and
`data-accent-color`.
