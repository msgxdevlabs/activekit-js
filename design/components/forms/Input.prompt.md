Standard ActiveKit form field. Use `numeric` for anything holding credits, counts, or currency so the value picks up tabular figures.

```jsx
<Input label="Work email" placeholder="you@company.com" hint="We send the API key here." />
<Input label="Monthly credit cap" numeric prefix="$" defaultValue="25,000" />
<Input label="Webhook URL" error="Must be https." defaultValue="http://hooks.local" />
```

Notes
- Border is `--hairline-input` at rest and `--primary` on focus. `focused` forces the focus skin for specimens.
- Fields hold a 40px minimum height, matching the responsive floor in DESIGN.md.
- `error` uses `--ruby`, the only place ruby touches a UI border. DESIGN.md defines no semantic error colour for marketing surfaces, so this is flagged in readme "Gaps filled".
