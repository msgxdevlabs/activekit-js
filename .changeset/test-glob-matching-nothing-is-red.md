---
---

Repository plumbing only, so nothing here releases: `scripts/tests-exist.test.mjs`
reads every `packages/*/package.json` and the root `test` script, resolves each
pattern a `node --test` command carries with `fs.globSync` against the package it
belongs to, and is red naming the package and the pattern when it matches no
file. The runner itself exits 0 with `1..0` on a glob with nothing behind it and
skips a named file that does not exist beside the ones that do, so a package
whose `test/` directory was renamed stayed green through `pnpm check`. Planted by
renaming `packages/server/test` away, which turned `pnpm test` red at `activekit`
and its glob with every other suite green, and by misspelling a root file in the
list, which named the file; both restored byte-exact. Renaming `packages/js/test`
reds `pnpm test` one step earlier, at `@activekit/elements`, whose suite imports
a double from that directory, and the guard run alone under the same rename names
`@activekit/js`. This closes the line `shell-reads-ground-after-config.md` left
under found and left as it is.
