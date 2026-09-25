---
"@activekit/js": minor
---

The shell reads the ground after the config. The hosted app posts `ready` before it knows which widget template it is dressed in, so the ground on `ready` arrived as the dark default for every template and the frame followed it. The app now posts a second message after its config read, and again on a template change, `{ v: 1, type: "ground", ground: "#rrggbb" }`, and the shell repaints `--ak-bg` from it through the same path `ready` uses. It is held to the same rules: the app's origin and the frame's own window as the sender, six hex digits or it is ignored, and only after `ready`, so a `ground` ahead of the handshake is dropped rather than held. `docs/contracts/shell.md` in `activekit-play` pins the message; this is the half that reads it.

Driven rather than read: `packages/js/test/shell.test.mjs` mounts the built shell on a DOM double and hands it messages with an origin and a source, and each of the five rules above has a case that goes red when its line is removed. The grep in `exports.test.mjs` that placed `ground` beside the shape guard is gone, since the guard is one function now and the behavior is what the new file proves.

The demo, in the same change. The mock's seven-day streak milestone counted every check-in, so a second press of the practice button on one day read 6 of 7 beside an activity streak still at 5; it now folds the days its criteria matched the way the platform's `foldStreak` does, consecutive and broken by a gap, so both read one number however often the button is pressed. The demo page's streak chip was `Day 4` in the markup; it is drawn from the `streak` the progress read serves, at zero rather than hidden. The stand-in app posts `ground` after `init`, so the demo walks the new path. `docs/short-owners.md` is rewritten into the walk card format of 2026-09-25, steps only, and `scripts/short-owners.test.mjs` holds the cards to it.

The `ground` case costs bytes in the shell's script tag build, brotli at quality 11: 6.17 to 6.20 kB of its 6.5 kB budget. `@activekit/js`'s `index.js` stays at 6.06 kB of 7 and the inline card's build does not carry the shell.
