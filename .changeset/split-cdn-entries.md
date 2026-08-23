---
"@activekit/js": minor
---

Split the script-tag build in two, and budget by entry point.

`activekit.js` now carries the inline widget alone; the floating launcher
ships as `activekit-launcher.js`, exported as `@activekit/js/global/launcher`.
A script tag has no bundler to shake out the half a page did not ask for, so
the old single file put the expanded view's markup and CSS on every embed:
the inline widget is 2.9 kB brotli where it used to be 7.4 kB. Loading
`activekit.js` with `data-mode="launcher"` now logs an error naming the file
to load instead. Pages that want both embeds should install the package and
let a bundler share the client between them.

Size budgets move from one number per package to one per entry point, since
that is the unit a customer actually downloads. `dist/index.js` keeps its 8 kB
as a ceiling on the whole library — `sideEffects: false` means a bundler ships
only the imported subset — while the script-tag builds, which have no such
escape, get 3.5 kB and 7.5 kB. `activekit.sizeLimit` entries may now be
`{ "limit": "3.5 kB", "pays": "…" }`, and the size table prints who pays.
