---
"@activekit/js": patch
"@activekit/react": patch
"@activekit/vue": patch
"@activekit/svelte": patch
"@activekit/elements": patch
---

The inline widget now reads the platform's real progress shape: the goal's `achieved` and `target`, `status: "live"` for the default pick, and the reward union for the earned pill. `campaignKey` is now `campaignId`, since the wire carries ids, and a new `label` option names the card — the platform never sends a campaign name to a subject, so the card no longer pretends it did.
