# activekit

## 0.2.0-alpha.0

### Minor Changes

- 19f91ec: Rename the campaign surface and retheme the embeds to the ActiveKit design
  system.

  The vocabulary is now the platform's: `CampaignProgress`, `campaignKey`,
  `Grant.campaignId`, `SubjectSnapshot.campaigns`, the `campaign` element
  attribute, and `data-campaign` on the CDN tag. These packages are unpublished
  placeholders, so the old `program` names are gone with no alias.

  The widget and launcher drop the placeholder palette for the ActiveKit design
  system's values in both themes: teal fills white text can be read on, ink and
  slate text rungs, canvas and slate grounds, the system's radii, elevation,
  motion, and tabular figures on every number. The launcher's expanded state is
  now a centered modal over the dimmed host page: a slate sidebar with the
  subject's avatar and three sections. Overview holds stat values, the nearest
  goal, and the active-campaign grid; Campaigns lists every campaign with
  progress and what completing it earns; Rewards is the grant history. Escape
  and the scrim close it, and focus stays inside while it is open.
  `CampaignProgress` gains an optional `reward` preview, and the launcher gains
  a `subjectLabel` option (`data-subject-label` on the CDN tag) for the
  sidebar's display name.

## 0.1.0

### Minor Changes

- 1ef7d09: First public release.

  Server SDK (`activekit`): event recording with idempotency keys, grant reads,
  subject token minting, and Web Crypto webhook verification that runs unchanged
  on Node, Workers, Bun and Deno.

  Browser client (`@activekit/js`): read-only, zero-dependency client with retry
  and `Retry-After` handling, plus a shadow-DOM widget that cannot leak styles
  into — or inherit them from — the host page. It reads a subject's own progress
  and grants and issues nothing but `GET`s: anything the browser can write, the
  browser's owner can forge, so recording events stays on the server side of the
  API key. Test-enforced, not just documented.

  Bindings (`@activekit/react`, `@activekit/svelte`, `@activekit/elements`):
  lifecycle glue over the same widget. No logic of their own.
