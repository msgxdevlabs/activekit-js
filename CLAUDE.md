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
to ask twice.

Pull request bodies obey the same rule in their own shape: what changed, why,
and how it was checked, the way a developer writes one, and no restatement of
anything the diff already says. Docs and code comments are the exception and
keep the fullness the work requires, because they are read cold, months later,
by someone with none of this context.

Be decisive. Weighing a choice means giving the recommendation, not the survey;
a fact already established in the session is not re-derived, a decision the
owner has made is not reopened, and an option that will not be taken is not
narrated.

An ID never travels alone in a reply. A walk, an epic, a story, a milestone or
a lane item is named with its short title beside the code every time it is
said: "P01, give the demo its two secrets", "E50, the dashboard redesign",
"item 3, close the golden loop's webhook leg". The code is for the loop; the
title is what the owner reads. Written down on 2026-09-09 because a reply full
of bare codes read as noise and the owner had to ask what each one was.

## Am I done

```bash
pnpm check   # build, typecheck, test, publint, bundle budget, in that order
```

That is the same list `ci.yml` runs, so a green `check` is the mechanical
answer. It is not the whole proof: nothing here exercises the SDK against a
deployed API, and a person still walks the demo before anything is called
shipped. `docs/short-owners.md` is that lane in one screen: every walk that is
a person's, `J01` onward, numbered steps and a pass checklist, and a walk
added or finished changes it in the same pull request.

Staging is the only tier the owner walks. Dev and staging are both a session's
to deploy to and to check its own work against, but anything the owner is asked
to look at goes to staging, whatever it touches, and the ask carries the steps
for testing it. Written down on 2026-09-24, on his word that staging is the only
environment he tests. This repository deploys no Worker of its own, so the rule
reaches it through the walk lane above. The canonical statement is
`activekit-io`'s, in `LOOP.md` section 13, "Continuous shipping and the walk
lane"; no checkout of this repository carries that file, which is why the rule
is written out here rather than pointed at.

`pnpm test` names its files rather than globbing them, so a new test file at
the root is also a one-line edit to the root `test` script. A package may glob
its own: `packages/js` runs `node --test "test/**/*.test.mjs"`, so a file added
there is picked up without an edit. Either way the rule is the same one: a test
no runner names is not a test, so check which of the two applies before
assuming you are covered.

A green `check` is also the merge. With review findings fixed and the pull
request's own CI green, the session labels its pull request `automerge` itself
and `automerge.yml` squash-merges it into `main`. No owner word stands in front
of that, and the demo walk above is feedback that follows shipping rather than
a gate before it. Written down on 2026-09-08 because the loop sat twenty hours
on three finished, green pull requests waiting for a merge word the owner never
meant to hold; his words were that the only approval he wants is the production
releases, which in this repository means the npm publish and nothing else.

## Changesets

Every pull request carries one, `pnpm changeset`. An empty changeset
(`pnpm changeset --empty`) is the right answer for repository plumbing that
ships nothing, and the CI job that checks for one accepts it. Releases go
through `release.yml`, never `pnpm publish` from a laptop, and that dispatch is
the owner's: `release.yml` with `confirm=RELEASE` puts packages on npm under the
`@activekit` scope, so a session never runs it and never pushes `main` directly.
Merging a pull request is a session's; publishing what it merged is not.

## Three repositories

The short name is the first column because it is what the owner says:

| Short | Repo | Role |
|---|---|---|
| **js** | `activekit-js` (this repo, public) | The SDKs customers install |
| **io** | `activekit-io` (private) | The platform: dashboard, public API, landing page |
| **play** | `activekit-play` (private) | The hosted player app and the content pipeline |

Answer in the same shorthand. Chat only: anything written down and read
somewhere else keeps the full name, and a pull request reference stays
qualified so it resolves from any repository, `msgxdevlabs/activekit-js#21`
and never `js#21`.

Types come from the published OpenAPI contract, never a workspace import
across repositories. `.github/workflows/automerge.yml` ships byte-identical in
all three: change it here and the same bytes land there, or not at all.

## Regenerating the wire types

`packages/js/src/types.ts` is a hand transcription of the read-only slice of
that contract, so it goes stale silently: nothing in this repository fails when
the platform adds a field, and the first sign is a customer reading `undefined`
off a shape our own `.d.ts` swore was complete. The step, whenever a story here
says the wire moved:

1. Read the wire, not a memory of it. Either `docs/contracts/platform.md` in
   `activekit-play`, which pins which parts the widget consumes and names what
   is served and what is only asked for, or the dev tier's own document at
   `GET /v1/openapi.json`. The document wins where the two disagree, and the
   contract file is the one that says whether a field has actually landed.
2. Change the types, the demo's stand-in and the tests in the same commit.
   `examples/customer-demo/mock-activekit.mjs` answers the shape the SDK claims
   and the fixtures in `packages/js/test/` assert against it, so a type that
   moves without them leaves three descriptions of one payload and no way to
   tell which is current. One exception, and it has to be named in the pull
   request that takes it: a plan story may own the stand-in separately, as
   story 7.3 of `activekit-io`'s `docs/v2-alignment.md` owns it for the game
   model, in which case the types move first and the story that owns the
   stand-in closes the gap. An unnamed split is the failure this step exists
   to catch.
3. Never invent a field. A field the document does not serve is not a type
   here, however clearly the roadmap says it is coming: the SDK is downstream
   of the published API, and a type it does not answer is a promise we cannot
   keep.
