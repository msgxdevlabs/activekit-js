Site-wide footer on white, caption type in `--ink-mute`, 64px vertical padding.

```jsx
<Footer
  tagline="Growth loops that pay out, metered against your own credit ledger."
  columns={[
    { title: 'Product', links: ['Campaigns', 'Outcomes', 'Pricing'] },
    { title: 'Developers', links: ['SDK', 'API reference', 'Webhooks'] },
  ]}
  legalLinks={['Privacy', 'Terms', 'Status']}
/>
```

Notes
- Column headings are `micro-cap` all caps; links are muted caption size.
- No social icon glyphs ship with the system, so pass your own nodes if you need them.
