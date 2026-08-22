Inline text link. Teal is a CTA and link colour only, never a body-text colour, so keep links to real links.

```jsx
<Link href="/docs">Read the SDK guide</Link>
<Link tone="muted" size="sm" href="/legal">Terms</Link>
```

Notes
- Rest is `--primary` with no underline; hover darkens to `--primary-deep` and underlines.
- Use `tone="muted"` in the footer, where link colour is `--ink-mute` per `footer-light`.
