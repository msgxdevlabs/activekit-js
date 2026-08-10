#!/usr/bin/env node
// Brotli size budgets, enforced.
//
// The embed drops into a customer's page and competes with their LCP, so a
// size regression is a failing build rather than a follow-up ticket. Budgets
// live in each package.json under `activekit.sizeLimit`, as
// { "<path relative to the package>": "<n> kB" }.
//
// Deliberately dependency-free: node's own brotli is the same algorithm a CDN
// serves with, and a size check that pulls in a dependency tree to measure a
// dependency tree is a joke at our own expense.

import { brotliCompressSync, constants } from "node:zlib";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const packagesDir = join(root, "packages");

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

	for (const [file, limitText] of Object.entries(limits)) {
		const target = join(packagesDir, dir, file);
		let bytes;
		try {
			bytes = brotli(readFileSync(target));
		} catch {
			console.error(`✗ ${pkg.name}: ${file} is missing — run \`pnpm build\` first`);
			failed = true;
			continue;
		}
		const limit = parseLimit(limitText);
		const over = bytes > limit;
		if (over) failed = true;
		rows.push({
			package: pkg.name,
			file: relative(root, target),
			brotli: `${(bytes / 1000).toFixed(2)} kB`,
			budget: limitText,
			used: `${Math.round((bytes / limit) * 100)}%`,
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
