The house icon set: 30 geometric line glyphs on a 24 grid, 1.75 stroke, round caps and joins.

```jsx
<Icon name="campaigns" />
<Icon name="credits" size="sm" />
<Button variant="primary" iconLeft={<Icon name="plus" size="sm" />}>New campaign</Button>
```

Notes
- Icons draw in `currentColor`. Set the parent's `color` rather than passing `color`, so an icon inside a button or a nav item tracks its state automatically.
- Sizes: `sm` 16 beside `body-sm` and `button-sm`, `md` 20 for nav and `button-md`, `lg` 24 for page headers, `xl` 28 inside empty-state medallions.
- Line weight is fixed at 1.75 across sizes. Raising it on small sizes makes the glyphs read as filled shapes and breaks the pairing with Inter 400.
- Icons are decorative by default (`aria-hidden`). Pass `title` only when the icon is the sole label, for example an icon-only close button.
- Add a glyph by adding one entry to `GLYPHS` in `Icon.jsx`. Keep it to strokes on the 24 grid with no fills, and no glyph that carries a logo or a brand mark.
