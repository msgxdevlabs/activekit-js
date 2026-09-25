---
---

Repository plumbing only, so nothing here releases: `scripts/tests-exist.test.mjs`
reads every package `pnpm-workspace.yaml` lists and the root `test` script,
resolves each pattern a `node --test` command carries with `fs.globSync` against
the package it belongs to, `node_modules` excluded by name the way the runner
does, and is red naming the package and the pattern when it matches no file.
The runner itself exits 0 with `1..0` on a glob with nothing behind it and skips
a named file that does not exist beside the ones that do, so a package whose
`test/` directory was renamed stayed green through `pnpm check`. The parser
reads the shapes a test script takes, a leading `NAME=value`, flags before or
after `--test` with their value joined or as the next word, a glob in either
quote, a `&&` chain, and reds by name on the two it will not read rather than
dropping the package: a `node --test` with no pattern, and a command that
mentions `--test` but is not `node`. Planted by renaming `packages/server/test`
away, which turned `pnpm test` red at `activekit` and its glob with every other
suite green; by setting that package's script to a bare `node --test` and to
`node --test-reporter=tap --test "…"` with the directory away, each red naming
`activekit`; and by misspelling a root file in the list, which named the file;
all restored byte-exact. Renaming `packages/js/test` reds `pnpm test` one step
earlier, at `@activekit/elements`, whose suite imports a double from that
directory, and the guard run alone under the same rename names `@activekit/js`.
The root `engines.node` moves from `>=20` to `>=22`, since `fs.globSync` is
node 22 and under node 20 the guard throws before it checks; the six shipped
packages keep `>=20`, which describes their consumers. This closes the line
`shell-reads-ground-after-config.md` left under found and left as it is.
