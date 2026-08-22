Pricing tier card. One per column in the pricing grid; mark exactly one tier `featured` to invert it to deep slate.

```jsx
<PricingCard
  tierName="Growth"
  price="$249"
  priceSuffix="/mo"
  description="For teams running always-on acquisition loops."
  features={['25,000 credits / mo', '10 live campaigns', 'Webhook + SDK access']}
  ctaLabel="Start free"
/>

<PricingCard featured tierName="Scale" price="$899" priceSuffix="/mo" … />
```

Notes
- The featured card is the only pricing column with a filled teal pill; the standard tiers use `secondary`.
- Price and feature lines render with `font-feature-settings: "tnum","zero"`, so credits and counts never lose the slashed zero.
- Grid collapses 4-up → 2-up → 1-up at 1024 / 768.
