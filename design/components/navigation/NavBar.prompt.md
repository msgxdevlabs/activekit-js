Marketing top nav. It floats transparent over the gradient wash and goes solid canvas on scroll.

```jsx
<NavBar
  items={['Outcomes', 'Campaigns', 'Developers', 'Pricing']}
  activeItem="Campaigns"
  ctaLabel="Start free"
/>
```

Notes
- The nav CTA is the hero band's one filled teal pill, so the hero body below it should use `secondary` buttons.
- Section labels stay single nouns: Outcomes. Campaigns. Developers. Pricing.
- `onDark` switches the wordmark's second half to `--primary-soft` for slate app chrome.
