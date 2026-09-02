# Working in this repository

`activekit-js` is what customers install: the server SDK `activekit`, the
browser client `@activekit/js`, the framework bindings, and the shell that
draws the bubble and opens the hosted app. Everything here ships to npm under
the `@activekit` scope, so a bundle budget is a product decision and not a
preference.

## Answering the owner

Answer the question asked, first, in one or two lines, with no preamble and no
restating of the question. Caveats come after the answer and only when they
change what the owner would do. No summary, no table, no structured write-up
unless asked for one; detail on request, not by default. A follow-up question
wants the answer, not a fuller version of the last reply. Written down on
2026-09-02 because "be concise" was read as "a shorter essay" and the owner had
to ask twice. Chat only: pull request bodies, docs and code comments keep the
fullness the work requires.

## Am I done

```bash
pnpm check   # build, typecheck, test, publint, bundle budget, in that order
```

That is the same list `ci.yml` runs, so a green `check` is the mechanical
answer. It is not the whole proof: nothing here exercises the SDK against a
deployed API, and a person still walks the demo before anything is called
shipped.

`pnpm test` names its files rather than globbing them, so a new test file is
also a one-line edit to the root `test` script. A test no runner names is not
a test.

## Changesets

Every pull request carries one, `pnpm changeset`. An empty changeset
(`pnpm changeset --empty`) is the right answer for repository plumbing that
ships nothing, and the CI job that checks for one accepts it. Releases go
through `release.yml`, never `pnpm publish` from a laptop.

## Three repositories

| Repo | Role |
|---|---|
| `activekit-js` (this repo, public) | The SDKs customers install |
| `activekit-io` (private) | The platform: dashboard, public API, landing page |
| `activekit-play` (private) | The hosted player app and the content pipeline |

Types come from the published OpenAPI contract, never a workspace import
across repositories. `.github/workflows/automerge.yml` ships byte-identical in
all three: change it here and the same bytes land there, or not at all.
