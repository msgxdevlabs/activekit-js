// The public surface, pinned. The embed's API is append-only within a major —
// a rename is a major, always — so an export that disappears is a red build
// here before it is a broken customer page.
import assert from "node:assert/strict";
import test from "node:test";

import * as pkg from "../dist/index.js";

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
