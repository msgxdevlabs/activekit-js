#!/usr/bin/env node
// Brotli size budgets, enforced.
//
// The embed drops into a customer's page and competes with their LCP, so a
// size regression is a failing build rather than a follow-up ticket. Budgets
// live in each package.json under `activekit.sizeLimit`, keyed by the built
// artifact and written either as a bare limit:
//
//   { "dist/index.js": "8 kB" }
//
// or, better, with the entry point's audience spelled out:
//
//   { "dist/index.js": { "limit": "8 kB", "pays": "bundler — ceiling" } }
//
// Budget per entry point, not per package. One number for a package that
// ships several entries measures a bundle nobody downloads: `dist/index.js`
// is the union of every export, and `sideEffects: false` means a bundler
// hands the customer only the subset they imported. So its budget is a
// ceiling on the library, while the script-tag builds — which have no
// bundler to shake anything out — are billed for every byte, and get the
// tight budgets. `pays` is what the table prints, so the person who trips a
// budget can see whose page load they were about to spend.
//
// Deliberately dependency-free: node's own brotli is the same algorithm a CDN
// serves with, and a size check that pulls in a dependency tree to measure a
// dependency tree is a joke at our own expense.

import { brotliCompressSync, constants } from "node:zlib";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const packagesDir = join(root, "packages");

// ---------------------------------------------------------------------------
// The design-system firewall. `design/` at the repo root is the vendored
// ActiveKit design system: a reference whose *values* are hand-copied into the
// embeds, never a dependency. Importing it would drag a whole export past the
// byte budgets and into customers' pages, so a `design/` import in any
// package's src fails the build, and `design/` must be absent from every dist
// and every published `files` set.
// ---------------------------------------------------------------------------

const SOURCE_EXT = /\.(ts|tsx|mts|js|mjs|jsx|svelte|css)$/;
const DESIGN_IMPORT = /\b(?:from|import|require)\s*\(?\s*["'][^"']*\bdesign\//;

const walk = (dir) => {
	const files = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...walk(path));
		else files.push(path);
	}
	return files;
};

const guardDesignSystem = () => {
	const offenses = [];
	for (const dir of readdirSync(packagesDir)) {
		const pkgDir = join(packagesDir, dir);
		const pkgPath = join(pkgDir, "package.json");
		if (!existsSync(pkgPath)) continue;
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));

		const srcDir = join(pkgDir, "src");
		if (existsSync(srcDir)) {
			for (const file of walk(srcDir).filter((f) => SOURCE_EXT.test(f))) {
				const lines = readFileSync(file, "utf8").split("\n");
				for (const [index, line] of lines.entries()) {
					if (DESIGN_IMPORT.test(line)) {
						offenses.push(`${relative(root, file)}:${index + 1} imports from design/`);
					}
				}
			}
		}

		for (const entry of pkg.files ?? []) {
			if (/(^|\/)design(\/|$)/.test(entry)) {
				offenses.push(`${pkg.name}: "files" publishes ${entry}`);
			}
		}

		const distDir = join(pkgDir, "dist");
		if (existsSync(distDir)) {
			for (const file of walk(distDir)) {
				if (/(^|\/)design(\/|$)/.test(relative(distDir, file))) {
					offenses.push(`${relative(root, file)} ships a design/ path in dist`);
				}
			}
		}
	}
	if (offenses.length > 0) {
		console.error("✗ design/ is a reference, not a dependency:");
		for (const offense of offenses) console.error(`  ${offense}`);
		process.exit(1);
	}
};

guardDesignSystem();

/** Highest-quality brotli — what a CDN serves for a static asset. */
const brotli = (buf) =>
	brotliCompressSync(buf, {
		params: {
			[constants.BROTLI_PARAM_QUALITY]: 11,
			[constants.BROTLI_PARAM_SIZE_HINT]: buf.length,
		},
	}).length;

const parseLimit = (text) => {
	const match = /^([\d.]+)\s*kB$/i.exec(String(text).trim());
	if (!match) throw new Error(`Unparseable size limit: ${text} (expected e.g. "8 kB")`);
	return Number(match[1]) * 1000;
};

/** Accepts `"8 kB"` and `{ limit: "8 kB", pays: "…" }` alike. */
const parseBudget = (value) => {
	const text = typeof value === "string" ? value : value?.limit;
	if (text === undefined) {
		throw new Error(`Size budget needs a limit: got ${JSON.stringify(value)}`);
	}
	return { bytes: parseLimit(text), text: String(text).trim(), pays: value?.pays ?? "" };
};

let failed = false;
const rows = [];

for (const dir of readdirSync(packagesDir)) {
	const pkgPath = join(packagesDir, dir, "package.json");
	let pkg;
	try {
		pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
	} catch {
		continue;
	}

	const limits = pkg.activekit?.sizeLimit;
	if (!limits) continue;

	for (const [file, budgetValue] of Object.entries(limits)) {
		const target = join(packagesDir, dir, file);
		const budget = parseBudget(budgetValue);
		let bytes;
		try {
			bytes = brotli(readFileSync(target));
		} catch {
			console.error(`✗ ${pkg.name}: ${file} is missing — run \`pnpm build\` first`);
			failed = true;
			continue;
		}
		const over = bytes > budget.bytes;
		if (over) failed = true;
		rows.push({
			package: pkg.name,
			file: relative(root, target),
			"who pays": budget.pays,
			brotli: `${(bytes / 1000).toFixed(2)} kB`,
			budget: budget.text,
			used: `${Math.round((bytes / budget.bytes) * 100)}%`,
			ok: over ? "✗" : "✓",
		});
	}
}

if (rows.length === 0) {
	console.error("No size budgets found. Every published bundle needs one.");
	process.exit(1);
}

console.table(rows);

if (failed) {
	console.error(
		"\nOver budget. Shrink the bundle or raise the limit deliberately in package.json —\n" +
			"raising it is a decision about someone else's page load, so say why in the PR.",
	);
	process.exit(1);
}

console.log("\nAll bundles within budget.");
