/**
 * Every test runner in this repository either names its files or globs them,
 * and to `node --test` a name that matches nothing is not an error. A glob with
 * no file behind it exits 0 with `1..0`, and a named file that does not exist
 * is skipped beside the ones that do, on node 22.22.2 here and node 24 in CI.
 * So a package whose `test/` directory was renamed or deleted stayed green
 * through `pnpm check`, and a root file misspelled in the `test` script would
 * have dropped out of the run with no line to say so. The changeset
 * `.changeset/shell-reads-ground-after-config.md` recorded the first of these
 * as found and left as it is; this file, added 2026-09-25, closes it.
 *
 * Both checks read the manifests rather than a list kept here, so a package
 * that gains a suite is covered the day it lands:
 *
 * 1. Every `packages/*` whose `test` script is `node --test` followed by
 *    patterns has each pattern resolved against that package with
 *    `fs.globSync`, the same resolution the runner uses, and a pattern that
 *    matches no file is red naming the package and the pattern.
 * 2. Every pattern the root `test` script hands `node --test` is resolved the
 *    same way against the repository root, so a misspelled name is red too.
 *
 * A third assertion keeps the first from going vacuous: at least one package
 * has to declare a `node --test` script, or the loop runs over nothing and
 * would pass a repository with no package suites at all, which is the same
 * silence this file exists to break.
 *
 * What it cannot prove: that a matched file holds a test. A file the glob
 * finds with no `test()` call in it contributes nothing to the run, and the
 * runner's own `# tests` summary line is where that shows, not here.
 */

import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

/**
 * The patterns a `node --test …` command hands the runner, or null when the
 * command is something else. The quotes are the shell's, there so the shell
 * leaves a glob's expansion to node, and are stripped; an argument starting
 * with a dash is a flag, not a file.
 */
const testPatterns = (command) => {
	const match = /^node --test(?:\s+(.*))?$/.exec(command.trim());
	if (!match) return null;
	return (match[1] ?? "")
		.split(/\s+/)
		.filter(Boolean)
		.map((arg) => arg.replace(/^"(.*)"$/, "$1"))
		.filter((arg) => !arg.startsWith("-"));
};

/** The manifest of every package the workspace holds, with its test patterns. */
const packages = globSync("packages/*/package.json", { cwd: root })
	.sort()
	.map((manifestPath) => {
		const manifest = JSON.parse(readFileSync(join(root, manifestPath), "utf8"));
		const script = manifest.scripts?.test;
		return {
			name: manifest.name,
			dir: dirname(join(root, manifestPath)),
			patterns: typeof script === "string" ? testPatterns(script) : null,
		};
	});

const globbing = packages.filter((pkg) => pkg.patterns !== null);

test("at least one package runs node --test, so the check below is over something", () => {
	assert.ok(
		globbing.length > 0,
		"no packages/*/package.json has a `node --test` test script; nothing below would be checked",
	);
});

for (const pkg of globbing) {
	for (const pattern of pkg.patterns) {
		test(`${pkg.name}: \`${pattern}\` matches at least one file`, () => {
			const matched = globSync(pattern, { cwd: pkg.dir });
			assert.ok(
				matched.length > 0,
				`${pkg.name}'s test script globs \`${pattern}\` and it matches no file under ` +
					`${relative(root, pkg.dir)}; node --test would exit 0 with 1..0`,
			);
		});
	}
}

const rootScript = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts.test;
const rootPatterns = rootScript
	.split("&&")
	.map((command) => testPatterns(command))
	.find((patterns) => patterns !== null);

test("the root test script hands node --test a list of files", () => {
	assert.ok(rootPatterns, "the root `test` script no longer runs `node --test` with named files");
	assert.ok(rootPatterns.length > 0, "the root `test` script runs `node --test` with no files named");
});

for (const pattern of rootPatterns ?? []) {
	test(`root: \`${pattern}\` exists`, () => {
		const matched = globSync(pattern, { cwd: root });
		assert.ok(
			matched.length > 0,
			`the root test script names ${pattern} and no such file exists; node --test skips it silently`,
		);
	});
}
