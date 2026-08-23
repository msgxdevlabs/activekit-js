Subdued teal tag for statuses, eyebrows, and table chips. Always all caps at 10px, never larger.

```jsx
<Pill dot>Live</Pill>
<Pill tone="outline">Draft</Pill>
<Pill tone="onDark">Beta</Pill>
```

Notes
- Text is `--primary-deep` on `--primary-bg-subdued-hover`, per `pill-tag-soft`.
- The `onDark` tone is an addition for slate surfaces, since the spec defines only the light tag. See readme "Gaps filled".
- Pills never carry an icon font. `dot` is the only decoration.
