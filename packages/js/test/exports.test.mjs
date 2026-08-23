// The public surface, pinned. The embed's API is append-only within a major —
// a rename is a major, always — so an export that disappears is a red build
// here before it is a broken customer page.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import * as pkg from "../dist/index.js";

const dist = (file) => readFileSync(new URL(`../dist/${file}`, import.meta.url), "utf8");

/** Every artifact a customer can load. */
const BUNDLES = ["index.js", "activekit.global.iife.js", "activekit-shell.global.iife.js"];

test("the package entry exports the full public surface", () => {
	assert.equal(typeof pkg.createClient, "function");
	assert.equal(typeof pkg.ActiveKitClient, "function");
	assert.equal(typeof pkg.mountWidget, "function");
	assert.equal(typeof pkg.mountShell, "function");
	assert.equal(typeof pkg.ActiveKitError, "function");
});

test("mountLauncher is gone, and stays gone", () => {
	// The native launcher was replaced by the shell: the app renders the rich
	// surface now, and keeping a second implementation of it in the SDK is the
	// exact drift this repo's rules exist to prevent.
	assert.equal(pkg.mountLauncher, undefined);
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
	const shell = dist("activekit-shell.global.iife.js");

	// `.ak-btn`/the frame are the shell's alone; `data-target` is the widget's.
	assert.doesNotMatch(widget, /ak-scrim/, "the widget build carries shell CSS");
	assert.match(shell, /ak-scrim/, "the shell build is missing its own CSS");
	assert.match(widget, /activekit/i, "the widget build looks empty");

	// Both self-mount, so both must read the token attribute off their tag.
	for (const [name, bundle] of [
		["widget", widget],
		["shell", shell],
	]) {
		assert.match(bundle, /currentScript/, `the ${name} build cannot self-mount`);
	}
});

test("the shell never posts a message to a wildcard origin", () => {
	// `postMessage(data, "*")` would hand the subject token to whatever document
	// happened to be in the frame. Every send has to name the app's origin.
	const shell = dist("activekit-shell.global.iife.js");
	assert.doesNotMatch(
		shell,
		/postMessage\([^)]*,\s*["']\*["']\s*\)/,
		"the shell posts to a wildcard origin",
	);
});

test("the shell keeps the token out of the frame URL", () => {
	// A URL reaches the referrer header, browser history and every proxy log on
	// the way. The token crosses by postMessage, after the app's handshake.
	const shell = dist("activekit-shell.global.iife.js");
	const src = /\.src\s*=\s*`([^`]*)`/.exec(shell);
	assert.ok(src, "could not find the iframe src assignment");
	assert.doesNotMatch(src[1], /token/i, `the frame URL carries a token: ${src[1]}`);
});

test("the shipped bundles carry the ActiveKit palette, not the placeholder one", () => {
	const bundle = dist("index.js");
	// The design system's values: teal-deep/deeper fills, primary-soft on dark,
	// ink, and the slate ladder. `#f7fbff` (canvas-soft) is deliberately absent
	// — it was the launcher's expanded-view ground, and no embed has that
	// surface now that the app owns it.
	for (const value of ["#087f7a", "#04605c", "#15c6bc", "#00a7a0", "#102033", "#0b1220"]) {
		assert.ok(bundle.includes(value), `expected brand value ${value} in index.js`);
	}
	// The shell paints five tokens of its own, on both grounds.
	for (const value of ["#14b8a8", "#101a26", "#e8eef5"]) {
		assert.ok(bundle.includes(value), `expected shell value ${value} in index.js`);
	}
	// The retired generic palette must not resurface.
	for (const value of ["#22c55e", "#15803d", "#4ade80"]) {
		assert.ok(!bundle.includes(value), `stale placeholder color ${value} in index.js`);
	}
});
