---
"@activekit/js": patch
"@activekit/elements": patch
"@activekit/react": patch
"@activekit/svelte": patch
"@activekit/vue": patch
---

Documentation only, and every sample in it was wrong. The bindings' READMEs showed a `campaignKey` prop that has never existed, the element documented a `campaign` attribute and not the `campaign-slot` one that picks which slot of a game to draw from, and four of them told a reader to branch on `progress.eligible`, a field the wire does not serve and the types have never carried. They now show `slot` and `campaignId`, and `completed` with `reward.source` beside it, which is what the platform answers.

The inline card's marker reads "Reward earned" and has since the card learned the reward kinds; `ShellColors.accent` and two READMEs still called it "Reward ready". The size figures in `@activekit/js`'s README and the root README were a release behind and are re-derived: the client and inline widget at 3.1 kB brotli and the shell at 6.1 kB.

No behavior changes, and no public API moves.
