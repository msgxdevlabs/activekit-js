---
---

Point the shell at its contract in `activekit-play`.

The frame this repo paints and the app that renders inside it are built in two
repositories that cannot see each other, and CI here runs on this repo alone,
so a mismatch between them ships silently. `docs/contracts/shell.md` in
`msgxdevlabs/activekit-play` is the written boundary: frame geometry, entry
URL, token handshake, theme parameter, and a pending-adjustments section
naming what each side owes the other next.

Nothing was discoverable from this side, so the README and the header of
`packages/js/src/shell.ts` now name it, and the contributing rules add it
beside the no-write rule. Documentation only; no package changes.

One adjustment is already waiting there. The play widget's template now decides
its own ground, so the frame ground this shell paints from `theme` can be the
wrong color at open — a light-template tenant inside a dark host page, or the
reverse. The fix on this side is for the app's `ready` message to carry its
ground and the shell to paint `--ak-bg` from it, keeping the theme default
until it arrives.
