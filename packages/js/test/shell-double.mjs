// The shell's test double: the smallest DOM `mountShell` can run against, and
// a way to hand it a message as if the app in its frame had posted one.
//
// Built on the card double's elements, with what the shell reaches for and the
// card does not: an inline `style` string on the host, a properties map on the
// root so `--ak-bg` can be read back, focus, `insertBefore`, listeners, and a
// `contentWindow` on the frame so a message's `source` can be the frame's own
// window, which is the second of the shell's two sender checks.
//
// What it cannot express: layout, the crossfade, a real `MessageEvent`. What it
// can: which messages the shell acts on and what it paints from them, which is
// what the tests over it assert.

import { makeElement } from "./card-double.mjs";

/** The app's origin in every test, distinct from the host page's. */
export const APP_URL = "https://play.example";
const HOST_ORIGIN = "https://acme.example";

const makeShellElement = (tag) => {
	const node = makeElement(tag);
	const props = new Map();
	node.style = {
		cssText: "",
		overflow: "",
		setProperty: (name, value) => props.set(name, value),
		removeProperty: (name) => props.delete(name),
		/** What `setProperty` was last given for `name`, for reading a token back. */
		get: (name) => props.get(name),
	};
	node.addEventListener = () => {};
	node.removeEventListener = () => {};
	node.insertBefore = (child) => {
		node.children.push(child);
	};
	node.focus = () => {};
	node.isConnected = true;
	if (tag === "iframe") {
		node.contentWindow = { postMessage() {} };
	}
	return node;
};

/**
 * Give Node the globals the shell reaches for, fresh for each mount, and hand
 * back what a test reads: the body the shell appends itself to, the frames it
 * built, and `deliver`, which calls the shell's `message` listener the way the
 * browser would for a message from `origin` sent by `source`.
 */
export const installShellDom = () => {
	const body = makeShellElement("body");
	const frames = [];
	const windowListeners = {};
	globalThis.document = {
		body,
		documentElement: makeShellElement("html"),
		activeElement: null,
		visibilityState: "visible",
		createElement: (tag) => {
			const node = makeShellElement(tag);
			if (tag === "iframe") frames.push(node);
			return node;
		},
		createElementNS: (_ns, tag) => makeShellElement(tag),
		addEventListener() {},
		removeEventListener() {},
	};
	globalThis.window = globalThis;
	globalThis.addEventListener = (type, fn) => {
		windowListeners[type] = fn;
	};
	globalThis.removeEventListener = () => {};
	globalThis.location = { origin: HOST_ORIGIN, href: `${HOST_ORIGIN}/` };
	// `auto` would read this; the tests mount with an explicit theme, and the
	// listener is what `destroy` removes.
	globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
	// The unseen check runs on mount; an answer that is not ok leaves the dot
	// as it was, which is all a test here needs of it.
	globalThis.fetch = async () => ({ ok: false });
	// `dismiss` asks whether the element to return focus to is one; the double's
	// elements are not, and the check needs the name to exist.
	globalThis.HTMLElement = class {};
	if (!globalThis.navigator) globalThis.navigator = { language: "en" };

	return {
		body,
		frames,
		deliver: (message) => windowListeners["message"]?.(message),
	};
};
