---
"@activekit/js": minor
---

The frame ground follows the widget template, not the host theme. The app names the ground it is actually rendering on in its `ready` message, and the shell paints `--ak-bg` from that value, so a tenant on a light template inside a dark host page no longer crossfades against the wrong color at every open. Until `ready` arrives the theme default stands, exactly as before.

The value is a string from inside the frame that becomes a CSS value on the host page, so it is checked for shape and not trusted: six hex digits after a `#` or it is ignored. It is held rather than written once, because a `prefers-color-scheme` change repaints and a repaint that fell back to the theme default would undo it, and it outranks `colors.background` once it arrives, since the frame is about to show that exact color.

`ground` has ridden on `ready` from the app's side since 2026-08-27; this is the half that reads it. `docs/contracts/shell.md` in `activekit-play` is where the field is pinned.
