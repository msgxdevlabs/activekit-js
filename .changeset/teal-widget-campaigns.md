---
"@activekit/js": minor
"@activekit/elements": minor
"@activekit/react": minor
"@activekit/vue": minor
"@activekit/svelte": minor
"activekit": minor
---

Rename the campaign surface and retheme the embeds to the ActiveKit design
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
