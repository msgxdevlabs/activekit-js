Surface container for the three light-card treatments: feature explanation on white, violet interlude band, dashboard-mockup chrome.

```jsx
<Card variant="feature" eyebrow="Campaigns" title="Ship a growth loop in a day">
  <p>Every campaign is a small program: a trigger, a reward, a payout ledger.</p>
</Card>

<Card variant="violet">…chromatic interlude between teal / white sections…</Card>

<Card variant="mockup">…composited product UI: logic row + metric grid + chart card…</Card>
```

Notes
- `feature` and `violet` pad at 32px; `mockup` pads at 24px and turns on `tnum`/`zero` for every number inside it.
- `mockup` carries level-2 shadow, so reserve it for faux product UI, not for text cards.
- Radius is always `--radius-lg` (12px). Use `--radius-xl` (16px) only for outer dashboard chrome you build inside a mockup card.
- `title` renders display-md; don't push Space Grotesk below 26px anywhere else.
