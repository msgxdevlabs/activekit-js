---
"@activekit/js": major
"@activekit/react": patch
"@activekit/vue": patch
"@activekit/svelte": patch
"@activekit/elements": patch
---

The wire types and the inline card learn the game model. `CampaignProgress` carries the platform's `title`, `slot`, `cadence`, `periodKey`, `periodEndsAt`, `xp` and `completedAt`; `SubjectSnapshot` carries `game` and the level band `levelFloorXp` and `nextLevelXp`; `GoalProgress` is the discriminated union the platform answers, so a `checklist` goal's `steps` narrow into view and `longest` belongs to a streak instead of to every goal. The unused `Campaign` type is gone, which with the goal change is what makes this a major.

The card takes its name from the campaign's own frozen title, with `label` still overriding it. A new `slot` option picks which campaign it draws, as `data-slot` on the script tag, `campaign-slot` on `<activekit-widget>` and a `slot` prop in the React, Vue and Svelte bindings. A checklist reads "3 of 5 done", counted off its steps. With nothing to draw the card says so and hides the track, rather than showing a bar at zero.
