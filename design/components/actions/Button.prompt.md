Pill-shaped ActiveKit button. `primary` for the CTA in a band, `secondary` for the outline alternative beside it, `brand` for the one hero CTA that carries the full gradient, `onDark` on slate chrome, `ghost` in dense product toolbars.

```jsx
<Button variant="brand" iconRight={<Icon name="arrowRight" size="sm" />}>Start free</Button>
<Button variant="primary">Launch campaign</Button>
<Button variant="secondary">Read the docs</Button>
<Button variant="primary" loading loadingLabel="Launching">Launch campaign</Button>
```

Notes
- Geometry never changes: `--radius-pill` (9999px) and `8px 16px` padding at md, `8px 12px` at sm. Never below that, because the tight pill is part of the brand.
- Fills are gradients, not flat colour. `primary` runs `--cta-gradient` (teal soft → deep), `brand` runs `--cta-gradient-bold` (teal → blue → purple). Press flattens to solid `--primary-press` so the control reads as depressed.
- **One `brand` button per view, one `primary` per band.** Two gradient pills competing in the same band is the failure mode this variant is easiest to abuse into.
- Filled variants carry `--elevation-cta`, a teal-tinted shadow that lifts on hover. Secondary and ghost stay flat until hover.
- `loading` replaces the left icon with a spinner, keeps the label (or `loadingLabel`), blocks clicks, and sets `aria-busy`. Keep the label rather than emptying the button, so the pill does not change width mid-action.
- `disabled` dims to 40% opacity (not defined in DESIGN.md, see readme "Gaps filled").
- Icons go in `iconLeft` / `iconRight`, normally `<Icon name="…" size="sm" />`.
