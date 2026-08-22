Every list, table, and page that can be empty gets one of these. An empty region with no explanation is a bug, not a state.

```jsx
<EmptyState
  size="lg"
  frame="dashed"
  icon="campaigns"
  title="No campaigns yet"
  description="Campaigns run referral, streak, and win-back loops against your credit ledger. Launch one and payouts start landing in the ledger within a day."
  actions={<><Button variant="primary" iconLeft={<Icon name="plus" size="sm" />}>New campaign</Button><Button variant="secondary">Read the docs</Button></>}
  hint="Templates cover the three loops, so most teams launch in about ten minutes."
/>
```

Which one to write
- **First run**, nothing has ever existed: explain what the thing is, then the action. This is the only empty state that gets `size="lg"` and two buttons.
- **No results** after a search or filter: name the query, offer "Clear filters", `size="sm"`, one button. Never show the first-run explanation here, because the user already knows what a campaign is.
- **Cleared or done**, the queue emptied on purpose: `icon="check"`, one line, no action.
- **Error**, the fetch failed: `tone="danger"` and `icon="alert"`, say what failed, action is "Try again". The danger tone only changes the medallion, so a failed region still reads as the same component.

Notes
- Copy follows the house voice: title is a plain statement, description is one to two sentences that end in what to do. No "Oops", no "Nothing to see here".
- The medallion carries `--medallion-gradient` and a soft `--medallion-glow`. That glow is the wash at component scale, and it is what keeps an empty page branded rather than blank.
- `tone="dark"` for empty states on slate chrome, for example an empty sidebar section or a dark ledger panel. `danger` and `dark` are one axis, so there is no danger tone for slate chrome yet.
- No illustrations. The system ships no illustration set, so an empty state is a medallion and words.
