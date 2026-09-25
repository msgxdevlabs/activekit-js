/**
 * To `node --test` a name that matches nothing is not an error: a glob with no
 * file behind it exits 0 with `1..0`, and a named file that does not exist is
 * skipped beside the ones that do (node 22.22.2 here, node 24 in CI). So a
 * package whose `test/` directory was renamed stayed green through `pnpm check`,
 * and a root file misspelled in the `test` script would have dropped out of the
 * run with no line to say so. `.changeset/shell-reads-ground-after-config.md`
 * recorded the first as found and left; this file, added 2026-09-25, closes it.
 *
 * Everything is read off the manifests, so a package that gains a suite is
 * covered the day it lands, and a script that says `--test` but is not the
 * runner as node would read it is red naming the package rather than skipped,
 * since a package that silently leaves this check is the same silence the check
 * exists to break. A `test` script that never says `--test` is not node's
 * runner and is outside this file's reach.
 *
 * What it cannot prove: that a matched file holds a test. A file with no
 * `test()` call contributes nothing to the run, and the runner's own `# tests`
 * summary line is where that shows.
 */

import assert from "node:assert/strict";
import { globSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

/** Quotes in a script are the shell's, there so it leaves a glob's expansion to node. */
const unquote = (word) => word.replace(/^(["'])(.*)\1$/, "$2");

/**
 * Node flags that take their value as the next word when not joined with `=`,
 * so `--test-reporter spec` does not read `spec` as a pattern. A flag missing
 * here in that form has its value read as a pattern and reds naming it.
 */
const VALUE_FLAGS = new Set([
	"--test-reporter", "--test-reporter-destination", "--test-name-pattern", "--test-skip-pattern",
	"--test-concurrency", "--test-shard", "--test-timeout", "--test-isolation",
	"--test-coverage-include", "--test-coverage-exclude", "--test-coverage-branches",
	"--test-coverage-functions", "--test-coverage-lines",
	"--import", "--require", "-r", "--loader", "--experimental-loader", "--conditions", "-C",
	"--env-file", "--env-file-if-exists",
]);

/**
 * What one shell command hands `node --test`: `{ patterns }` for the runner,
 * null for a command that is something else, and `{ unreadable }` with the
 * reason when the command says `--test` but is not the runner.
 */
const runnerOf = (command) => {
	const argv = (command.match(/"[^"]*"|'[^']*'|\S+/g) ?? []).map(unquote);
	const unreadable = (reason) => (argv.includes("--test") ? { unreadable: reason } : null);
	// `NODE_OPTIONS=… node --test`: a leading assignment is the shell's.
	while (/^\w+=/.test(argv[0] ?? "")) argv.shift();
	if (argv[0] !== "node") return unreadable(`the command is \`${argv[0] ?? ""}\`, not \`node\``);
	const patterns = [];
	let runner = false;
	for (let i = 1; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--test") {
			runner = true;
		} else if (arg.startsWith("-")) {
			if (!arg.includes("=") && VALUE_FLAGS.has(arg)) i += 1;
		} else if (runner) {
			patterns.push(arg);
		} else {
			// Node runs the first positional as a script, so a `--test` after it
			// is that script's argument.
			return unreadable(`\`${arg}\` comes before \`--test\`, so node would run it as a script`);
		}
	}
	return runner ? { patterns } : null;
};

/** The same across a `&&` chain: the first unreadable command, else the first runner, else null. */
const runnerOfScript = (script) => {
	const results = script.split("&&").map(runnerOf);
	return results.find((result) => result?.unreadable) ?? results.find(Boolean) ?? null;
};

test("the parser reads every shape a test script takes, or says which it cannot", () => {
	const glob = "test/**/*.test.mjs";
	const cases = [
		['node --test "test/**/*.test.mjs"', { patterns: [glob] }],
		["node --test 'test/**/*.test.mjs'", { patterns: [glob] }],
		["node --test", { patterns: [] }],
		['node --test --test-reporter=spec "test/**/*.test.mjs"', { patterns: [glob] }],
		['node --test --test-reporter spec "test/**/*.test.mjs"', { patterns: [glob] }],
		['node --test-reporter=spec --test "test/**/*.test.mjs"', { patterns: [glob] }],
		['node --import tsx --test "test/**/*.test.ts"', { patterns: ["test/**/*.test.ts"] }],
		['node --experimental-strip-types --test "test/**/*.test.ts"', { patterns: ["test/**/*.test.ts"] }],
		['pnpm build && node --test "test/**/*.test.mjs"', { patterns: [glob] }],
		["node --test test/a.test.mjs test/b.test.mjs", { patterns: ["test/a.test.mjs", "test/b.test.mjs"] }],
		["vitest run", null],
		['NODE_OPTIONS=--enable-source-maps node --test "test/**/*.test.mjs"', { patterns: [glob] }],
		['node  --test "test/**/*.test.mjs"', { patterns: [glob] }],
		['npx tsx --test "test/**/*.test.mjs"', { unreadable: "the command is `npx`, not `node`" }],
		["node run.mjs --test", { unreadable: "`run.mjs` comes before `--test`, so node would run it as a script" }],
		["node run.mjs", null],
	];
	for (const [script, expected] of cases) {
		assert.deepEqual(runnerOfScript(script), expected, `script: ${script}`);
	}
});

/** The runner excludes `node_modules` by name, so a dependency's own tests never stand in for the package's. */
const resolve = (patterns, cwd) => globSync(patterns, { cwd, exclude: (name) => name === "node_modules" });

/** Read off `pnpm-workspace.yaml` so a second package folder is covered without an edit here. */
const workspaceGlobs = (/^packages:\n((?:[ \t]+-[^\n]*\n)+)/m.exec(readFileSync(join(root, "pnpm-workspace.yaml"), "utf8"))?.[1] ?? "")
	.split("\n")
	.map((line) => unquote(line.trim().replace(/^-\s*/, "")))
	.filter(Boolean);

const suite = (name, dir, script) => ({ name, dir, script, runner: script ? runnerOfScript(script) : null });

const packages = resolve(workspaceGlobs.map((glob) => `${glob}/package.json`), root)
	.sort()
	.map((manifestPath) => {
		const { name, scripts } = JSON.parse(readFileSync(join(root, manifestPath), "utf8"));
		return suite(name, dirname(join(root, manifestPath)), scripts?.test);
	})
	.filter((pkg) => pkg.runner);

const rootSuite = suite("root", root, JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts.test);

test("at least one package runs node --test, so the check below is over something", () => {
	assert.ok(packages.length > 0, "no workspace package has a `node --test` test script; nothing below would be checked");
});

for (const { name, dir, script, runner } of [...packages, rootSuite].filter((s) => s.runner)) {
	test(`${name}: the test script hands node --test a glob`, () => {
		assert.ok(
			!runner.unreadable,
			`${name}'s test script \`${script}\` says --test but ${runner.unreadable}; red rather than skipped`,
		);
		assert.ok(
			runner.patterns.length > 0,
			`${name}'s test script \`${script}\` hands node --test no pattern, so it would run node's default ` +
				'globs that no manifest declares; declare the glob, `node --test "test/**/*.test.mjs"`',
		);
	});
	for (const pattern of runner.patterns ?? []) {
		test(`${name}: \`${pattern}\` matches at least one file`, () => {
			assert.ok(
				resolve(pattern, dir).length > 0,
				`${name}'s test script names \`${pattern}\` and it matches no file; node --test exits 0 without it`,
			);
		});
	}
}
