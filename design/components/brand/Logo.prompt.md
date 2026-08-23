# Logo

The ActiveKit lockup. One component, so the mark never gets redrawn per surface.

- **Tile plus wordmark by default.** `markOnly` drops the wordmark for dense chrome or anywhere the name already appears next to it.
- **Tone follows the surface, not the page.** `onLight` on white and `canvas-soft`; `onDark` on `brand-dark-900` chrome. The tile itself never changes, because the bold ramp reads on both.
- **The tile counts against the one-bold-ramp-per-view budget.** If a view already spends `--cta-gradient-bold` on a hero CTA or a modal rule, the logo is that view's exception, not a second spend: keep the hero CTA on `--cta-gradient` instead.
- **The mark is Icon's `campaigns` star, filled.** Changing one means changing both, on purpose. `assets/logo.svg` is the standalone tile for favicons and anything outside the bundle.
- **Never re-colour the wordmark halves.** Purple tail on light, teal-soft tail on dark, both from the spec's "wordmark second half" note.

```jsx
<Logo size="lg" href="/" />
<Logo tone="onDark" />
<Logo markOnly size="sm" />
```
