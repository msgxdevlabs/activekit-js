One spinner for the whole system. Use it inline, never as a full-page blocker: a page that is loading structure shows `Skeleton`, an action that is running shows `Button loading`, and `Spinner` covers everything in between.

```jsx
<Spinner />
<Spinner size="lg" label="Loading campaigns" />
<Spinner tone="onDark" size="sm" />
```

Notes
- 720ms linear, teal ring on a 20% teal track. Tone `onDark` switches to `--primary-soft` on a white-alpha track for slate chrome.
- The spinner ignores `prefers-reduced-motion` on purpose. Decorative motion (shimmer, pulse) stops; progress indicators keep moving, because a frozen one reads as a hung interface.
- `size="sm"` is the in-row size and matches the spinner `Button` draws when `loading` is set.
- Pair with a label whenever the wait can exceed about a second, so the user knows what is loading rather than that something is.
