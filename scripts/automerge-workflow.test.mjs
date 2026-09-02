/**
 * The head branch delete in `.github/workflows/automerge.yml`, driven rather
 * than read.
 *
 * ## Why this file exists
 *
 * A squash merge does not delete the branch it merged, and the repository
 * setting that would, "Automatically delete head branches", is a per-repository
 * checkbox no file in the repository can assert or even read. So every merged
 * branch survived on origin until somebody cleared it by hand. The workflow
 * deletes the head ref itself now, which puts five guards in front of a
 * destructive call: the merge must have succeeded, the head must be named and
 * in this repository, it must not be the base branch, it must carry one of the
 * branch shapes this loop creates, and it must not be protected.
 *
 * The shape rule is the one that decides, and it is here because the review of
 * the first round found the protected read inert: branch protection is a paid
 * feature for private repositories and this org is on the free plan, so the
 * branches endpoint answers `protected: false` for every branch in these three
 * repositories, and the only ref GitHub itself refuses to delete is the default
 * branch. `main` and `release-*` were therefore deletable by one labeled
 * merge-back pull request. Two tests below are that finding, kept as tests.
 *
 * A guard that stops guarding is not a changed message, it is a `DELETE` that
 * should never have been made. So the merge-and-delete tail is sliced out of
 * the shipped `run:` block and executed against a stub `gh` on `PATH` that
 * records every call it is handed, and the assertions are about that log. What
 * runs here is the workflow's own bytes rather than a copy of them, which is
 * the only version of this test worth having: a copy proves the copy. The same
 * slicing covers the draft arm, whose unguarded `gh pr ready` was the other
 * defect the review found: under `set -euo pipefail` a 403 from a fork's
 * read-only token ended the whole run red, and a grep for `exit [1-9]` cannot
 * see that, which is why the case is driven rather than read.
 *
 * ## What it cannot prove, said plainly
 *
 * Nothing here reaches GitHub. Whether the real `gh` spells its refusal 422,
 * whether the branches endpoint reports `protected` for a ruleset as well as
 * for classic branch protection, and whether the Actions token may delete a ref
 * at all are properties of the API, not of this file. What is proven is that
 * the shipped bytes make exactly the calls the guards allow, and no others.
 *
 * The same file ships byte-identical in activekit-io and activekit-play, and io
 * additionally pins the `on:` triggers in `test/automerge-workflow.test.ts`.
 */

import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test, { after } from "node:test";

const workflow = readFileSync(
  fileURLToPath(new URL("../.github/workflows/automerge.yml", import.meta.url)),
  "utf8",
);

/** The step's `run:` body, dedented to column zero as the runner hands it to bash. */
const runBlock = (() => {
  const marker = "        run: |\n";
  const start = workflow.indexOf(marker);
  if (start < 0) throw new Error("automerge.yml no longer declares a `run: |` step body");
  const body = workflow.slice(start + marker.length);
  const indent = body.match(/^ +/)?.[0];
  if (!indent) throw new Error("automerge.yml's run block is no longer indented");
  return body
    .split("\n")
    .map((line) => (line.startsWith(indent) ? line.slice(indent.length) : line))
    .join("\n");
})();

/**
 * The draft arm: the labeled-draft check through its closing `fi`. Sliced the
 * same way and for the same reason as the tail below it.
 */
const draftReady = (() => {
  const start = runBlock.indexOf('  if [ "$(jq -r .draft');
  if (start < 0) throw new Error("automerge.yml no longer marks a labeled draft ready");
  const close = "\n  fi\n";
  const end = runBlock.indexOf(close, start);
  if (end < 0) throw new Error("automerge.yml's draft arm no longer closes with fi");
  return runBlock.slice(start, end + close.length);
})();

/**
 * The merge-and-delete tail: the conditional merge through the end of the
 * per-pull-request loop. Wrapped below in a one-iteration `for` so `continue`
 * means in the harness exactly what it means in the workflow, which is what
 * every skip in this half is built out of.
 */
const mergeAndDelete = (() => {
  const start = runBlock.indexOf("  if gh api -X PUT");
  if (start < 0) throw new Error("automerge.yml no longer merges with a conditional gh api -X PUT");
  const end = runBlock.lastIndexOf("\ndone");
  if (end < start) throw new Error("automerge.yml's per-pull-request loop no longer closes with done");
  return runBlock.slice(start, end + 1);
})();

const workdir = mkdtempSync(join(tmpdir(), "automerge-delete-"));
after(() => rmSync(workdir, { recursive: true, force: true }));

const harness = join(workdir, "merge-and-delete.sh");
writeFileSync(harness, `set -euo pipefail\nfor n in "$PR_NUMBER"; do\n${mergeAndDelete}done\n`);

// The sentinel stands where the check-runs read does in the workflow: reaching
// it means the draft arm let the loop continue, and not reaching it means the
// arm skipped the pull request rather than ending the run.
const draftHarness = join(workdir, "draft-ready.sh");
writeFileSync(
  draftHarness,
  `set -euo pipefail\nfor n in "$PR_NUMBER"; do\n${draftReady}  echo "went on to read the checks"\ndone\n`,
);

/**
 * A `gh` that answers the three calls this tail makes and records every one,
 * first on `PATH` so it wins over anything installed.
 */
const stub = join(workdir, "gh");
writeFileSync(
  stub,
  `#!/usr/bin/env bash
printf '%s\\n' "$*" >> "$GH_CALLS"
case "$*" in
  "pr ready"*) exit "\${STUB_READY_EXIT:-0}" ;;
  *"-X PUT"*"/merge"*) exit "\${STUB_MERGE_EXIT:-0}" ;;
  *"-X DELETE"*"/git/refs/heads/"*)
    if [ -n "\${STUB_DELETE_ERROR:-}" ]; then printf '%s\\n' "\${STUB_DELETE_ERROR}" >&2; fi
    exit "\${STUB_DELETE_EXIT:-0}" ;;
  *"/branches/"*)
    if [ "\${STUB_PROTECTED-false}" = unreadable ]; then exit 1; fi
    printf '%s\\n' "\${STUB_PROTECTED-false}" ;;
  *) printf 'the workflow made a gh call this stub does not answer: %s\\n' "$*" >&2; exit 1 ;;
esac
`,
);
chmodSync(stub, 0o755);

/**
 * The head commit, one constant because the fixture and the environment have to
 * agree about it: `$sha` is what the earlier half of the step read the checks
 * for, and the merge is pinned to it.
 */
const headSha = "962ddbf0e4b1f2a7c8d9e0a1b2c3d4e5f6a7b8c9";

let fixtures = 0;

/**
 * Runs the extracted tail over one pull request, with the loop's own variables
 * supplied the way the earlier half of the step would have set them: `$pr` is
 * the API response, `$base` the base ref it already checked, `$REPO` the
 * repository. The stub's answers are the three things that vary in production.
 */
const run = (pull, stubbed = {}, script = harness) => {
  fixtures += 1;
  const calls = join(workdir, `gh-calls-${fixtures}.log`);
  writeFileSync(calls, "");

  const result = spawnSync("bash", [script], {
    encoding: "utf8",
    env: {
      // The stub first so it answers rather than a real gh, the inherited
      // PATH after it because the tail also runs jq.
      PATH: `${workdir}:${process.env.PATH ?? ""}`,
      GH_CALLS: calls,
      PR_NUMBER: String(pull.number),
      REPO: "msgxdevlabs/activekit-js",
      base: pull.base,
      sha: headSha,
      pr: JSON.stringify({
        number: pull.number,
        state: "open",
        draft: pull.draft ?? false,
        base: { ref: pull.base },
        head: {
          ref: pull.headRef,
          sha: headSha,
          repo: pull.headRepo === null ? null : { full_name: pull.headRepo },
        },
        labels: [{ name: "automerge" }],
      }),
      ...(stubbed.ready === undefined ? {} : { STUB_READY_EXIT: String(stubbed.ready) }),
      ...(stubbed.merge === undefined ? {} : { STUB_MERGE_EXIT: String(stubbed.merge) }),
      ...(stubbed.protectedAs === undefined ? {} : { STUB_PROTECTED: stubbed.protectedAs }),
      ...(stubbed.deleteExit === undefined ? {} : { STUB_DELETE_EXIT: String(stubbed.deleteExit) }),
      ...(stubbed.deleteError === undefined ? {} : { STUB_DELETE_ERROR: stubbed.deleteError }),
    },
  });

  return {
    calls: readFileSync(calls, "utf8").split("\n").filter(Boolean),
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
    status: result.status ?? -1,
  };
};

/** The one call this file exists to allow or refuse. */
const deletes = (result) => result.calls.filter((call) => call.includes("-X DELETE"));

/** A pull request whose head is an ordinary branch in this repository. */
const ownBranch = {
  number: 21,
  headRepo: "msgxdevlabs/activekit-js",
  headRef: "wt/js-automerge-delete",
  base: "main",
};

test("merges the commit whose checks were read, not whatever the head is by then", () => {
  // Without the `sha` pin GitHub squashes the head at the moment of the call,
  // so a push landing between the check read and the merge ships a commit no
  // check ever ran on, and the delete below then removes the branch that held
  // it. The pin makes GitHub answer 409 instead, which the failure arm handles.
  const result = run(ownBranch);
  assert.equal(result.status, 0);
  assert.deepEqual(
    result.calls.filter((call) => call.includes("-X PUT")),
    [
      `api -X PUT repos/msgxdevlabs/activekit-js/pulls/21/merge -f merge_method=squash -f sha=${headSha}`,
    ],
  );
});

test("deletes the branch it just merged, which the merge itself does not do", () => {
  const result = run(ownBranch);
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), [
    "api -X DELETE repos/msgxdevlabs/activekit-js/git/refs/heads/wt/js-automerge-delete",
  ]);
  assert.match(result.output, /head branch wt\/js-automerge-delete deleted/);
});

test("deletes nothing when the merge did not happen", () => {
  // The ordering is the whole guarantee: a conflict, or a base that moved under
  // the run, leaves a pull request open, and a branch deleted under an open
  // pull request is work destroyed rather than tidied.
  const result = run(ownBranch, { merge: 1 });
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), []);
  assert.match(result.output, /did not merge/);
});

test("leaves a fork's branch alone, since it is in a repository this token cannot write", () => {
  const result = run({ ...ownBranch, headRepo: "someone-else/activekit-js" });
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), []);
  assert.match(result.output, /not ours to delete/);
});

test("leaves a head branch alone when the fork it came from is gone", () => {
  // GitHub answers `head.repo: null` for a pull request whose fork was deleted.
  // `jq -r .head.repo.full_name` alone would print the string "null" there,
  // which is not this repository either, but the `// ""` is what keeps the
  // comparison from depending on that spelling.
  const result = run({ ...ownBranch, headRepo: null });
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), []);
  // And it says so. A bare `$head_repo` printed "came from ; its branch is
  // not ours to delete", a sentence with a hole in it that a run log cannot
  // tell from a truncated variable.
  assert.match(result.output, /came from a repository GitHub no longer names/);
});

test("leaves a pull request alone when it names no head branch at all", () => {
  const result = run({ ...ownBranch, headRef: null });
  assert.equal(result.status, 0);
  assert.deepEqual(result.calls, [
    `api -X PUT repos/msgxdevlabs/activekit-js/pulls/21/merge -f merge_method=squash -f sha=${headSha}`,
  ]);
  assert.match(result.output, /names no head branch/);
});

test("refuses to delete the base branch", () => {
  const result = run({ ...ownBranch, headRef: "main" });
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), []);
  assert.match(result.output, /head is main itself/);
});

test("refuses a release branch, which the protected read cannot refuse here", () => {
  // The finding this guard exists for. Branch protection is paid on private
  // repositories and this org is on the free plan, so the branches endpoint
  // answers false for `release-0.3` as it does for everything else; without a
  // name rule a labeled merge-back pull request deletes a release branch.
  const result = run({ ...ownBranch, headRef: "release-0.3" });
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), []);
  assert.match(result.output, /release-0\.3 is not a disposable branch shape/);
});

test("refuses main even when main is not the base, and asks nothing to say so", () => {
  // The base guard covers the default branch only. `main` reaching here as a
  // head, which a merge-back pull request is, was the case that made this a
  // bug rather than a tidiness gap.
  const result = run({ ...ownBranch, headRef: "main", base: "develop" });
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), []);
  assert.equal(result.calls.filter((call) => call.includes("/branches/")).length, 0);
  assert.match(result.output, /main is not a disposable branch shape/);
});

test("deletes each of the branch shapes this loop creates", () => {
  for (const headRef of ["wt/js-something", "feature/something", "claude/pr-1-review-abc"]) {
    const result = run({ ...ownBranch, headRef });
    assert.equal(result.status, 0);
    assert.deepEqual(deletes(result), [
      `api -X DELETE repos/msgxdevlabs/activekit-js/git/refs/heads/${headRef}`,
    ]);
  }
});

test("leaves a protected head branch alone", () => {
  const result = run({ ...ownBranch, headRef: "wt/covered-by-a-ruleset" }, { protectedAs: "true" });
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), []);
  assert.match(result.output, /protected=true/);
});

test("keeps the branch when protection cannot be read at all", () => {
  // An unreadable answer is the case a guard written as `!= true` would get
  // wrong, and it is the likelier one in production: a rate limit, a scope, an
  // outage. Only a plain false may proceed.
  const result = run(ownBranch, { protectedAs: "unreadable" });
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), []);
  assert.match(result.output, /protected=unreadable/);
});

test("keeps the branch when protection reads back empty", () => {
  // `gh` exiting zero having printed nothing is the third case the comment
  // names, and the only reason the `${protected:-empty}` default is there. It
  // was untested, so a rewrite to `[ -n "$protected" ] && [ "$protected" !=
  // true ]` would have deleted on it with every test still green.
  const result = run(ownBranch, { protectedAs: "" });
  assert.equal(result.status, 0);
  assert.deepEqual(deletes(result), []);
  assert.match(result.output, /protected=empty/);
});

test("stays green when the ref is already gone, which GitHub answers 422", () => {
  const result = run(ownBranch, { deleteExit: 1 });
  assert.equal(result.status, 0);
  assert.match(result.output, /was not deleted/);
  assert.match(result.output, /the merge stands/);
});

test("says why a delete failed, because nothing ever retries it", () => {
  // The merge closed the pull request, so the state guard skips it on every
  // later event: a delete refused for a systematic reason fails once and
  // forever. `>/dev/null 2>&1` printed the same sentence for a 403 on a token
  // scope, a 422 from a ruleset and a ref already gone.
  const result = run(ownBranch, { deleteExit: 1, deleteError: "HTTP 403: Resource not accessible" });
  assert.equal(result.status, 0);
  assert.match(result.output, /the merge stands: HTTP 403: Resource not accessible/);
});

test("adds no permission, because the merge had already been granted the one it needs", () => {
  // A ref delete and a merge are both `contents: write`. Asserting the whole
  // block rather than one line is what makes a fourth scope, added later
  // without an argument for it, arrive here as a diff.
  const start = workflow.indexOf("\npermissions:\n");
  const end = workflow.indexOf("\n\njobs:", start);
  assert.ok(start >= 0 && end > start, "automerge.yml still declares a permissions block");
  const scopes = workflow
    .slice(start, end)
    .split("\n")
    .filter((line) => line.startsWith("  "))
    .map((line) => line.trim());
  assert.deepEqual(scopes, ["contents: write", "pull-requests: write", "checks: read"]);
});

test("skips rather than ending the run when a labeled draft cannot be marked ready", () => {
  // The defect a grep cannot see. `gh pr ready` ran bare under `set -euo
  // pipefail`, so the 403 a fork's read-only token gives, or a rate limit on
  // an in-repo pull request, took the whole run red on an outcome this file
  // calls ordinary.
  const result = run({ ...ownBranch, draft: true }, { ready: 1 }, draftHarness);
  assert.equal(result.status, 0);
  assert.match(result.output, /could not be marked ready for review/);
  assert.doesNotMatch(result.output, /went on to read the checks/);
});

test("marks a labeled draft ready and carries on when it can", () => {
  const result = run({ ...ownBranch, draft: true }, {}, draftHarness);
  assert.equal(result.status, 0);
  assert.deepEqual(result.calls, ["pr ready 21 -R msgxdevlabs/activekit-js"]);
  assert.match(result.output, /went on to read the checks/);
});

test("exits green on every skip, so nobody is trained to ignore a red merge gate", () => {
  // Not anchored to the start of a line: every skip in this block is a one-line
  // `|| { echo ...; continue; }`, so the shape a regression takes is `; exit 1;
  // }` mid-line, and an anchored pattern reads clean over exactly that.
  assert.doesNotMatch(runBlock, /\bexit\s+[1-9]/);
  assert.doesNotMatch(runBlock, /::error::/);
});
