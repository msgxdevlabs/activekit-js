One dialog shell covers modals, confirms, and prompts. Change `tone`, `size`, and what goes in `children`, not the shell.

```jsx
// Confirm
<Modal
  tone="brand" icon="campaigns"
  title="Launch Refer a builder?"
  description="Enrolment opens immediately and payouts draw from your credit balance."
  actions={<><Button variant="ghost" size="sm">Cancel</Button><Button variant="primary" size="sm">Launch campaign</Button></>}
  footnote="You can pause a campaign at any time."
/>

// Prompt
<Modal size="sm" tone="neutral" title="Name this campaign" dismissible
  actions={<><Button variant="ghost" size="sm">Cancel</Button><Button variant="primary" size="sm">Save</Button></>}>
  <Input label="Campaign name" defaultValue="Win-back, lapsed 30 days" fullWidth />
</Modal>

// Destructive
<Modal tone="danger" icon="alert" size="sm" dismissible={false}
  title="Delete this campaign?"
  description="Deleting removes the campaign and its enrolment history. Payouts already made stay in the ledger."
  actions={<><Button variant="ghost" size="sm">Keep it</Button><Button variant="primary" size="sm" style={{background:'var(--ruby)',boxShadow:'none'}}>Delete campaign</Button></>}
/>
```

Notes
- **Titles are questions or statements, never labels.** "Delete this campaign?" not "Confirm deletion". Buttons repeat the verb from the title, so "Delete campaign" beats "OK", and the safe choice sits on the left.
- The 3px gradient rule at the top is the only brand colour on the panel. Tone drives it: brand runs the full ramp, danger runs ruby into purple.
- Sizes map to intent: `sm` prompt, `md` confirm, `lg` a real form. A dialog that needs more than `lg` should be a page.
- `dismissible={false}` for a dialog with consequences you cannot undo, so it cannot be dismissed by a stray scrim click.
- `inline` renders the dialog in its container rather than over the viewport, which is how the specimen cards show three at once.
- One dialog at a time. A dialog that opens another dialog is a flow that wants a wizard, and `templates/app-create-campaign` is that pattern.
