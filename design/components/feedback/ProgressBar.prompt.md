Progress for anything with a known or unknown duration: credit caps, CSV imports, campaign launches.

```jsx
<ProgressBar value={73} label="Credit balance" hint="18,240 of 25,000 this month" showValue />
<ProgressBar label="Enrolling members" />
<ProgressBar value={40} tone="dark" size="sm" />
```

Notes
- Omit `value` for the indeterminate sweep. Use it for work in flight with no count, and switch to determinate the moment a real count exists.
- The fill is `--progress-gradient` (teal soft → teal → blue). This is the only moving gradient in the system, which is what makes progress read as progress.
- Numbers in `hint` and the percentage run tabular, so the width does not jitter as the value climbs.
- `tone="dark"` for slate chrome, for example the sidebar credit meter.
- Do not stack more than two bars in one view. Three or more competing bars stop reading as progress and start reading as a chart.
