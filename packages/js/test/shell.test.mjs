// What the shell paints from the app's messages, driven over `dist/` on the
// double in `shell-double.mjs`: `mountShell` is mounted, opened so the frame
// exists, and handed messages as the browser would hand them, with an origin
// and a source. The grep tests in `exports.test.mjs` pin that the guard is in
// the bundle; these pin what it does.
import assert from "node:assert/strict";
import test from "node:test";

import { find } from "./card-double.mjs";
import { APP_URL, installShellDom } from "./shell-double.mjs";

const { mountShell } = await import("../dist/index.js");

/** The dark theme's frame ground, which every ground in these tests differs from. */
const THEME_DEFAULT = "#101a26";

/**
 * Mount on a fresh double, open so the frame is built, and hand back the
 * frame's ground, a sender for the app's messages, and the handle to destroy.
 * Dark and explicit, so the theme default is not the `#ffffff` the tests post.
 */
const mount = () => {
	const dom = installShellDom();
	const handle = mountShell({
		token: "subject_token",
		appUrl: APP_URL,
		apiUrl: "https://api.example/v1",
		theme: "dark",
		prefetch: "none",
		pollInterval: 0,
	});
	// Not awaited: it resolves on `ready`, which each test sends, or not, itself.
	void handle.open();
	const [frame] = dom.frames;
	assert.ok(frame, "opening built no frame");
	const root = find(dom.body, "ak");
	return {
		handle,
		bg: () => root.style.get("--ak-bg"),
		/** A message from the app: its origin, its own window as the source. */
		fromApp: (data, origin = APP_URL) =>
			dom.deliver({ origin, source: frame.contentWindow, data: { v: 1, ...data } }),
	};
};

test("the theme default stands until the app names a ground", () => {
	const { handle, bg } = mount();
	assert.equal(bg(), THEME_DEFAULT);
	handle.destroy();
});

test("a ground on ready repaints the frame", () => {
	const { handle, bg, fromApp } = mount();
	fromApp({ type: "ready", ground: "#0b1220" });
	assert.equal(bg(), "#0b1220");
	handle.destroy();
});

test("a ground message after ready repaints the frame", () => {
	// The app posts `ready` before it has read its template, so the ground on
	// it is one default for every template; the message after the config read
	// is the one that carries the template's own.
	const { handle, bg, fromApp } = mount();
	fromApp({ type: "ready", ground: "#0b1220" });
	fromApp({ type: "ground", ground: "#ffffff" });
	assert.equal(bg(), "#ffffff");
	handle.destroy();
});

test("a second ground message repaints again", () => {
	// A template change inside the app posts another, and the frame follows.
	const { handle, bg, fromApp } = mount();
	fromApp({ type: "ready", ground: "#0b1220" });
	fromApp({ type: "ground", ground: "#ffffff" });
	fromApp({ type: "ground", ground: "#1a0b22" });
	assert.equal(bg(), "#1a0b22");
	handle.destroy();
});

test("a ground message before ready is ignored", () => {
	const { handle, bg, fromApp } = mount();
	fromApp({ type: "ground", ground: "#ffffff" });
	assert.equal(bg(), THEME_DEFAULT);
	// And `ready` without a ground of its own leaves the default too: the
	// early message was dropped, not held.
	fromApp({ type: "ready" });
	assert.equal(bg(), THEME_DEFAULT);
	handle.destroy();
});

test("a ground message from another origin is ignored", () => {
	const { handle, bg, fromApp } = mount();
	fromApp({ type: "ready", ground: "#0b1220" });
	fromApp({ type: "ground", ground: "#ffffff" }, "https://evil.example");
	assert.equal(bg(), "#0b1220");
	handle.destroy();
});

test("a three-digit ground is ignored", () => {
	// The same shape rule `ready` is held to: a string from inside the frame
	// becomes a CSS value on the host page, so six hex digits or nothing.
	const { handle, bg, fromApp } = mount();
	fromApp({ type: "ready", ground: "#0b1220" });
	fromApp({ type: "ground", ground: "#fff" });
	assert.equal(bg(), "#0b1220");
	handle.destroy();
});
