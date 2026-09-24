// `<activekit-widget>`'s attribute reader, over the card double the
// `@activekit/js` suite draws on. The element mounts that package's card, so
// the double that runs the card there runs it here.
import assert from "node:assert/strict";
import test from "node:test";

import {
	answering,
	campaign,
	find,
	installDom,
	makeElement,
	snapshotOf,
} from "../../js/test/card-double.mjs";

installDom();

// Just enough of HTMLElement for the element to read its attributes and
// mount the card into itself.
globalThis.HTMLElement = class {
	constructor() {
		Object.assign(this, makeElement("activekit-widget"));
	}
	getAttribute(name) {
		return this.attributes[name] ?? null;
	}
};

const { ActiveKitWidgetElement } = await import("../dist/index.js");

globalThis.fetch = answering(
	snapshotOf([
		campaign({ id: "campaign_daily", slot: "daily", title: "Today" }),
		campaign({ id: "campaign_main", slot: "main" }),
	]),
);

/** Connect an element carrying `attributes`, let it draw, and hand back the card's root. */
const connect = async (attributes) => {
	const element = new ActiveKitWidgetElement();
	for (const [name, value] of Object.entries({ token: "subject_token", theme: "light", ...attributes })) {
		element.setAttribute(name, value);
	}
	element.connectedCallback();
	await element.refresh();
	return find(element, "ak");
};

test("`campaign-slot` picks the slot", async () => {
	const root = await connect({ "campaign-slot": "daily" });

	assert.equal(find(root, "ak-name").textContent, "Today");
});

test("a `campaign-slot` that names no slot is dropped, and the card keeps its default", async () => {
	// A typo in markup nobody typechecked. Passed through, it searches a slot
	// nothing can fill; dropped, the card draws what it draws with no
	// `campaign-slot` at all.
	const root = await connect({ "campaign-slot": "weekly" });

	assert.equal(find(root, "ak-name").textContent, "Finish the week");
});
