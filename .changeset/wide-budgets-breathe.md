---
---

Raise the `@activekit/js` budgets to 10 kB and give every package one.

The launcher sat at 94% of 7.5 kB, which is a tripwire rather than a limit —
the next small change trips it and the person who trips it has no way to tell
a regression from a feature. Raising it is a decision about someone else's
page load, so: the bytes were measured before the number moved. Renaming every
`ak-*` class to two characters saves 102 bytes, CSS minification saves 2, and
the expanded view is 43% of the bundle. There is nothing to shave; 7.07 kB is
what a modal with a sidebar, three sections and a grant history costs. The
package ceiling moves with it, because the launcher cannot grow past a ceiling
that sits below it.

The inline widget stays at 3.5 kB. It is what most script-tag pages load and
the whole reason the CDN build was split, so it keeps the tight number.

`@activekit/svelte` and `activekit` had no budget at all — the filed gap. Both
have one now, the server's guarding dependency creep rather than page load.

Releases nothing on its own.
