Skeletons for first loads. Mirror the real layout: same widths, same gaps, same card shells, so nothing jumps when data lands.

```jsx
<Skeleton variant="title" />
<Skeleton variant="text" lines={3} />
<Skeleton variant="chart" />
<Skeleton variant="text" lines={2} tone="dark" />
```

Notes
- Use skeletons for **first** loads only. A refresh of data already on screen keeps the old content and shows a `Spinner` or a `ProgressBar`, because replacing loaded content with grey bars reads as a failure.
- Keep the real container. Put skeletons inside the actual card, with the real padding and hairline, and swap only the contents.
- The last line of a multi-line block is 64% wide, which is why `lines` exists instead of hand-stacking bars.
- Shimmer is decorative, so it stops under `prefers-reduced-motion`. The bars stay, so layout never shifts.
- Never animate a skeleton and a spinner in the same region. Pick one signal per area.
