Sidebar for every product screen. Edit this one file and all app templates follow.

```jsx
<AppSidebar
  workspace={{ initials: 'PQ', name: 'Parseq', plan: 'Scale' }}
  items={[
    { section: 'Workspace' },
    { label: 'Overview', active: true },
    { label: 'Campaigns', badge: '4' },
    'Ledger', 'Reports',
    { section: 'Build' },
    'Developers', 'Credits', 'Settings'
  ]}
  meter={{ label: 'Credit balance', value: '18,240', note: '73% of 25,000 monthly cap', pct: 73 }}
  user={{ initials: 'DW', name: 'Dana Whitlock', role: 'Owner' }}
/>
```

Notes
- Not a DESIGN.md family. It exists so the product templates share one sidebar; see readme "Intentional additions".
- The column is branded, not plain slate: a gradient logo tile, a vertical `--sidebar-gradient` ramp, and one `--sidebar-glow` bleeding out of the top-left corner. That glow is the marketing wash at app scale, and it is the only place the dark track shows brand colour at size.
- **Icons are inferred from the label**, so `'Campaigns'` gets the campaigns glyph with no extra props. Pass `icon` to override, and add the mapping in `ICON_BY_LABEL` when a new label recurs.
- The active item takes `--nav-active-gradient` plus a 2px `--nav-active-bar` (teal into purple) on the left edge, and its icon turns `--primary-soft`. Hover gets the quieter white ramp. Only one item is ever active.
- `{ section: 'Label' }` breaks the list into micro-cap groups. Use it past about six items, not before.
- `badge` is for counts, running tabular. Keep them short: `4`, `18k`, `New`.
- `meter.value` and `meter.note` render with `tnum`/`zero`, since they always hold credit figures, and the fill bar uses `--progress-gradient` so it matches `ProgressBar` elsewhere.
- Chrome is the slate ramp; the content column beside it stays `--canvas-soft` with white cards.
