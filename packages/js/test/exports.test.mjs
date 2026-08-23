// The public surface, pinned. The embed's API is append-only within a major —
// a rename is a major, always — so an export that disappears is a red build
// here before it is a broken customer page.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import * as pkg from "../dist/index.js";

const dist = (file) => readFileSync(new URL(`../dist/${file}`, import.meta.url), "utf8");

/** Every artifact a customer can load. */
const BUNDLES = ["index.js", "activekit.global.iife.js", "activekit-launcher.global.iife.js"];

test("the package entry exports the full public surface", () => {
	assert.equal(typeof pkg.createClient, "function");
	assert.equal(typeof pkg.ActiveKitClient, "function");
	assert.equal(typeof pkg.mountWidget, "function");
	assert.equal(typeof pkg.mountLauncher, "function");
	assert.equal(typeof pkg.ActiveKitError, "function");
});

test("importing the entry touches no DOM", () => {
	// The module must be importable in Node — SSR frameworks import it and only
	// call mount* in the browser. Reaching this line at all is most of the
	// assertion; the check below guards against a future top-level document use.
	assert.equal(typeof globalThis.document, "undefined");
});

test("the shipped bundles say campaign, never program", () => {
	// The platform's vocabulary law, enforced on the artifact customers load:
	// the entity is `campaigns`. A `program` anywhere in the bundle is a
	// public-surface regression, not a style nit.
	for (const file of BUNDLES) {
		assert.doesNotMatch(dist(file), /program/i, `${file} contains "program"`);
	}
});

test("the script-tag builds carry one embed each", () => {
	// A script tag has no tree-shaking: whatever is in the file is on the
	// customer's page. Merging the two back into one build would silently
	// double what an inline-widget page downloads, so assert they stay apart.
	const widget = dist("activekit.global.iife.js");
	const launcher = dist("activekit-launcher.global.iife.js");

	// `.ak-bubble` is the launcher's alone; `data-target` is the widget's.
	assert.doesNotMatch(widget, /ak-bubble/, "the widget build carries launcher CSS");
	assert.match(launcher, /ak-bubble/, "the launcher build is missing its own CSS");
	assert.match(widget, /activekit/i, "the widget build looks empty");

	// Both self-mount, so both must read the shared token attribute.
	for (const [name, bundle] of [["widget", widget], ["launcher", launcher]]) {
		assert.match(bundle, /currentScript/, `the ${name} build cannot self-mount`);
	}
});

test("the shipped bundles carry the ActiveKit palette, not the placeholder one", () => {
	const bundle = dist("index.js");
	// The design system's values: teal-deep/deeper fills, primary-soft on dark,
	// ink, the slate ladder, the canvas-soft ground.
	for (const value of ["#087f7a", "#04605c", "#15c6bc", "#00a7a0", "#102033", "#0b1220", "#f7fbff"]) {
		assert.ok(bundle.includes(value), `expected brand value ${value} in index.js`);
	}
	// The retired generic palette must not resurface.
	for (const value of ["#22c55e", "#15803d", "#4ade80"]) {
		assert.ok(!bundle.includes(value), `stale placeholder color ${value} in index.js`);
	}
});
