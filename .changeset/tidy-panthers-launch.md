---
"@activekit/js": minor
---

Add `mountLauncher`: a floating corner launcher with two open states — a
compact panel highlighting one program, and a maximized dashboard showing stat
tiles, every program's progress, and the subject's reward history. The bubble
wears a progress ring and a reward-ready dot; `Esc` closes; `auto` theme
follows `prefers-color-scheme` live. The CDN build self-mounts it with
`data-mode="launcher"`. Read-only like everything else in the package — the
dashboard reports grants, it cannot claim them.

Both the widget and the launcher also gain a `colors` option for brand
theming: `brand`, `accent`, `ring`, `background`, `foreground`, `muted`,
`track`, with per-theme `light`/`dark` refinements. Values are validated;
hex pairs that measurably fail WCAG contrast log a console warning. The CDN
build takes `data-brand-color` and `data-accent-color`.
