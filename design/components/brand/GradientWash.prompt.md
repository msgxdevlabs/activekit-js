Wrap any marketing hero in this. DESIGN.md treats the wash as non-negotiable, so a bare-canvas hero is off-brand.

```jsx
<GradientWash>
  <NavBar items={['Outcomes', 'Campaigns', 'Developers', 'Pricing']} />
  <header style={{ maxWidth: 'var(--container-max)', margin: '0 auto', padding: 'var(--space-huge) var(--space-xl)' }}>
    <h1 className="ak-display-xxl">Growth loops that pay out.</h1>
  </header>
</GradientWash>
```

Notes
- Orbs are organic blobs, heavily blurred, at low opacity. If you can see where one stop ends and the next begins, drop `opacity` or widen `blur`.
- It covers the upper third only. Content below returns to plain `--canvas`.
- Text sits directly on the wash. No scrim, no protection gradient, because the wash is already pale.
- This is elevation level 3. Do not stack a literal shadow on the same element.
