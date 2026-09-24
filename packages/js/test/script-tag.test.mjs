// The script tag's `data-*` reader, run as a customer's page runs it: the
// inline card's CDN build evaluated with a `<script>` as `currentScript`,
// over the DOM double in `card-double.mjs`.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInThisContext } from "node:vm";

import { answering, campaign, find, installDom, makeElement, settle, snapshotOf } from "./card-double.mjs";

const build = readFileSync(new URL("../dist/activekit.global.iife.js", import.meta.url), "utf8");

/** Load the build under a tag carrying `dataset`, and hand back the card's root. */
const load = async (dataset, snapshot) => {
	installDom();
	const target = makeElement("div");
	globalThis.document.currentScript = { dataset: { token: "subject_token", theme: "light", ...dataset } };
	globalThis.document.querySelector = () => target;
	globalThis.fetch = answering(snapshot);
	runInThisContext(build);
	await settle();
	return find(target, "ak");
};

const dailyThenMain = snapshotOf([
	campaign({ id: "campaign_daily", slot: "daily", title: "Today" }),
	campaign({ id: "campaign_main", slot: "main" }),
]);

test("`data-slot` picks the slot", async () => {
	const root = await load({ slot: "daily" }, dailyThenMain);

	assert.equal(find(root, "ak-name").textContent, "Today");
});

test("a `data-slot` that names no slot is dropped, and the card keeps its default", async () => {
	// A typo in markup nobody typechecked. Passed through, it searches a slot
	// nothing can fill and the card says there is nothing to show; dropped, the
	// card draws what it draws with no `data-slot` at all.
	const root = await load({ slot: "weekly" }, dailyThenMain);

	assert.equal(find(root, "ak-name").textContent, "Finish the week");
});
