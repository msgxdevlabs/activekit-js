---
"@activekit/js": major
"@activekit/react": minor
"@activekit/vue": minor
"@activekit/svelte": minor
"@activekit/elements": minor
---

The inline card draws the main quest by default. With no `campaignId` and no `slot`, the card drew the first live campaign in the answer, so a page on an app running a whole game showed whichever campaign the platform happened to list first. Now it draws the live campaign filling the main quest when the answer carries one, the same one on every load, and the first live campaign in any slot when it does not. The default reads the campaigns rather than `game`: an app with no game, a draft game that has published nothing and a live game before its first main quest materializes have no live main quest, and in each the card still draws a directly authored side quest or event exactly as it did. A paused game is read the same way, by whether a live main quest is in the answer. An explicit `slot` wins over the default, and `campaignId` over both.

With nothing live in a `slot` you named, the card names it, "No main quest to show" or "No event to show", where it said "No campaign to show". Everywhere else it has nothing to draw it reads "Nothing to show": without a `slot` it searched every slot, and naming the main quest would claim the app has one due, which a draft game or an app with no game does not; beside a `campaignId` the answer does not carry, it searched no slot at all.

A slot read from markup is checked. `data-slot` on the script tag and `campaign-slot` on `<activekit-widget>` drop a value that names none of the four slots, so a typo falls back to the default rather than searching a slot nothing can fill. The check is exported as `isCampaignSlot`, and the card itself never paints a slot name it does not know: a value cast past the type reads "Nothing to show".

Still a major for `@activekit/js`: a mount with no options now draws a different campaign whenever a live main quest is not the first live campaign in the answer, and the empty text a page may match on has changed. The bindings take a minor, which is this repository's bump for a binding whose 0.x behavior breaks, since `<activekit-widget>` without `campaign-slot` and the React, Vue and Svelte widgets without `slot` change with it. Neither costs a release of its own: this line is already carrying a major for `@activekit/js` and a minor for each binding, and `changeset status` names the same bump for every package with this changeset and without it.

Documentation in the same change. The React, Vue and Svelte READMEs' progress samples read `p.campaign.id`, `p.current` and `p.target`, a shape the wire has never served; they now read `p.id`, `p.title` and `p.goal`, and each typechecks against the types this release ships. Every passage that suggested rendering your own claim or fulfillment button and posting it to your backend now says so no longer: `mountWidget`'s doc, the React and Vue widget components' docs and READMEs, `@activekit/js`'s README and `@activekit/elements`' README. Each says there is nothing to claim: the platform issues the grant a completion pays and sends your backend a signed webhook, and your backend fulfills it from your own credit ledger.

The default, the check and the slot names cost bytes in every build that carries the card, brotli at quality 11: the inline card's script tag 3.10 to 3.22 kB of its 3.5 kB budget, the shell's script tag 6.09 to 6.17 kB of 6.5, `@activekit/js` 5.94 to 6.06 kB of 7, and `@activekit/elements` 0.70 to 0.74 kB of 3. The size figures in the root README and `@activekit/js`'s README are re-derived to match.
