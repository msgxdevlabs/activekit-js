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
 * 1. Every package `pnpm-workspace.yaml` lists whose `test` script runs
 *    `node --test` has each pattern it hands the runner resolved against that
 *    package with `fs.globSync`, excluding `node_modules` by name the way the
 *    runner does, and a pattern that matches no file is red naming the package
 *    and the pattern.
 * 2. Every pattern the root `test` script hands `node --test` is resolved the
 *    same way against the repository root, so a misspelled name is red too.
 *
 * The parser reads the shapes a `node --test` script takes in the wild: a
 * leading `NAME=value`, flags before or after `--test`, a flag's value joined
 * with `=` or given as the next word, a glob in double or single quotes, and a
 * `&&` chain with the runner anywhere in it. Two shapes it does not read are
 * red by name rather than dropped from coverage, because a package that
 * silently leaves this check is the same silence the check exists to break: a
 * `node --test` with no pattern, which would run node's default globs that no
 * manifest declares, and a command that mentions `--test` but is not a `node`
 * invocation this parser understands. A `test` script that never says
 * `--test` is not node's runner and is outside this file's reach.
 *
 * A further assertion keeps the whole thing from going vacuous: at least one
 * package has to run `node --test`, or the loop runs over nothing and would
 * pass a repository with no package suites at all.
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
 * Splits a shell command into its words, honoring double and single quotes so
 * a quoted glob is one word with its quotes gone, which is how the shell hands
 * it to node. Null when a quote never closes.
 */
const words = (command) => {
	const out = [];
	let word = "";
	let inWord = false;
	let quote = null;
	for (const char of command) {
		if (quote) {
			if (char === quote) quote = null;
			else word += char;
		} else if (char === '"' || char === "'") {
			quote = char;
			inWord = true;
		} else if (/\s/.test(char)) {
			if (inWord) out.push(word);
			word = "";
			inWord = false;
		} else {
			word += char;
			inWord = true;
		}
	}
	if (quote) return null;
	if (inWord) out.push(word);
	return out;
};

/**
 * Node flags that take their value as the next word when not joined with `=`,
 * so `--test-reporter spec` does not read `spec` as a pattern. A flag outside
 * this set in that form has its value read as a pattern and reds naming it,
 * which is the cue to add the flag here.
 */
const VALUE_FLAGS = new Set([
	"--test-reporter",
	"--test-reporter-destination",
	"--test-name-pattern",
	"--test-skip-pattern",
	"--test-concurrency",
	"--test-shard",
	"--test-timeout",
	"--test-isolation",
	"--test-coverage-include",
	"--test-coverage-exclude",
	"--test-coverage-branches",
	"--test-coverage-functions",
	"--test-coverage-lines",
	"--import",
	"--require",
	"-r",
	"--loader",
	"--experimental-loader",
	"--conditions",
	"-C",
	"--env-file",
	"--env-file-if-exists",
]);

/**
 * What one shell command hands `node --test`: `{ patterns }` for the runner,
 * null for a command that is something else (`pnpm build`, `vitest run`), and
 * `{ unreadable }` with the reason when the command mentions `--test` but is
 * not a `node` invocation this parser can read.
 */
const runnerOf = (command) => {
	const mentionsTest = /(^|\s)--test(\s|$)/.test(command);
	const unreadable = (reason) => (mentionsTest ? { unreadable: reason } : null);
	const argv = words(command);
	if (argv === null) return unreadable("a quote never closes");
	// `NODE_OPTIONS=… node --test`: a leading assignment is the shell's.
	while (argv.length > 0 && /^[A-Za-z_][A-Za-z0-9_]*=/.test(argv[0])) argv.shift();
	if (argv[0] !== "node") return unreadable(`the command is \`${argv[0] ?? ""}\`, not \`node\``);
	const patterns = [];
	let runner = false;
	for (let i = 1; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--test") {
			runner = true;
		} else if (arg.startsWith("-")) {
			if (!arg.includes("=") && VALUE_FLAGS.has(arg)) i += 1;
		} else if (!runner) {
			// Node reads the first positional as the script to run, so a `--test`
			// after it is that script's argument and not the runner.
			return unreadable(`\`${arg}\` comes before \`--test\`, so node would run it as a script`);
		} else {
			patterns.push(arg);
		}
	}
	return runner ? { patterns } : null;
};

/**
 * What a whole `test` script hands `node --test`, across its `&&` chain: the
 * first runner's patterns, the first unreadable command, or null when no
 * command in it is the runner.
 */
const runnerOfScript = (script) => {
	const results = script.split("&&").map((command) => runnerOf(command.trim()));
	return results.find((result) => result?.unreadable) ?? results.find((result) => result) ?? null;
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
		['node --test "test/**/*.test.mjs', { unreadable: "a quote never closes" }],
		['npx tsx --test "test/**/*.test.mjs"', { unreadable: "the command is `npx`, not `node`" }],
		["node run.mjs --test", { unreadable: "`run.mjs` comes before `--test`, so node would run it as a script" }],
		["node run.mjs", null],
	];
	for (const [script, expected] of cases) {
		assert.deepEqual(runnerOfScript(script), expected, `script: ${script}`);
	}
});

/**
 * The runner walks the package with `node_modules` excluded by name; the same
 * exclusion here keeps a dependency's own test files from standing in for a
 * package's.
 */
const resolve = (pattern, cwd) => globSync(pattern, { cwd, exclude: (name) => name === "node_modules" });

/**
 * The package globs `pnpm-workspace.yaml` declares under `packages:`, read
 * off the file rather than assumed. A `!` exclusion is refused rather than
 * ignored, since a package it hid would be one this guard silently skipped.
 */
const workspaceGlobs = () => {
	const file = readFileSync(join(root, "pnpm-workspace.yaml"), "utf8");
	const block = /^packages:\n((?:[ \t]+-[^\n]*\n)+)/m.exec(file);
	assert.ok(block, "pnpm-workspace.yaml has no `packages:` list");
	return block[1]
		.split("\n")
		.map((line) => line.trim().replace(/^-\s*/, "").replace(/^(["'])(.*)\1$/, "$2"))
		.filter(Boolean)
		.map((glob) => {
			assert.ok(!glob.startsWith("!"), `pnpm-workspace.yaml excludes \`${glob}\`, which this guard does not read`);
			return glob;
		});
};

/** The manifest of every package the workspace holds, with what its test script says. */
const packages = globSync(
	workspaceGlobs().map((glob) => `${glob}/package.json`),
	{ cwd: root, exclude: (name) => name === "node_modules" },
)
	.sort()
	.map((manifestPath) => {
		const manifest = JSON.parse(readFileSync(join(root, manifestPath), "utf8"));
		const script = manifest.scripts?.test;
		return {
			name: manifest.name,
			dir: dirname(join(root, manifestPath)),
			runner: typeof script === "string" ? runnerOfScript(script) : null,
			script,
		};
	});

const covered = packages.filter((pkg) => pkg.runner !== null);

test("at least one package runs node --test, so the check below is over something", () => {
	assert.ok(
		covered.length > 0,
		"no workspace package has a `node --test` test script; nothing below would be checked",
	);
});

for (const pkg of covered) {
	if (pkg.runner.unreadable) {
		test(`${pkg.name}: the test script is a \`node --test\` this guard can read`, () => {
			assert.fail(
				`${pkg.name}'s test script \`${pkg.script}\` mentions --test but ${pkg.runner.unreadable}; ` +
					"this guard cannot resolve its patterns, so it is red rather than skipped",
			);
		});
		continue;
	}
	test(`${pkg.name}: \`node --test\` declares its glob`, () => {
		assert.ok(
			pkg.runner.patterns.length > 0,
			`${pkg.name}'s test script \`${pkg.script}\` hands node --test no pattern, so it would run node's ` +
				"default globs that no manifest declares; declare the glob, `node --test \"test/**/*.test.mjs\"`",
		);
	});
	for (const pattern of pkg.runner.patterns) {
		test(`${pkg.name}: \`${pattern}\` matches at least one file`, () => {
			assert.ok(
				resolve(pattern, pkg.dir).length > 0,
				`${pkg.name}'s test script globs \`${pattern}\` and it matches no file under ` +
					`${relative(root, pkg.dir)}; node --test would exit 0 with 1..0`,
			);
		});
	}
}

const rootScript = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts.test;
const rootRunner = runnerOfScript(rootScript);

test("the root test script hands node --test a list of files", () => {
	assert.ok(rootRunner, "the root `test` script no longer runs `node --test` with named files");
	assert.ok(!rootRunner.unreadable, `the root \`test\` script mentions --test but ${rootRunner.unreadable}`);
	assert.ok(rootRunner.patterns.length > 0, "the root `test` script runs `node --test` with no files named");
});

for (const pattern of rootRunner?.patterns ?? []) {
	test(`root: \`${pattern}\` exists`, () => {
		assert.ok(
			resolve(pattern, root).length > 0,
			`the root test script names ${pattern} and no such file exists; node --test skips it silently`,
		);
	});
}
