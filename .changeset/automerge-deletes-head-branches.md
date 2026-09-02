---
---

Repository plumbing only, so nothing here releases: `automerge.yml` deletes the
head branch after the squash merge it just made, and `scripts/automerge-workflow.test.mjs`
drives that tail against a stub `gh`. The review round that followed pinned the
merge to the commit whose checks were read, put the delete behind a branch-shape
rule rather than a protected read this plan cannot answer, and guarded the
`gh pr ready` call that could end a run red on an ordinary outcome.
