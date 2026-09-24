// What the card draws, asserted over `dist/` like every other test here, on
// the DOM double in `card-double.mjs`.
import assert from "node:assert/strict";
import test from "node:test";

import { campaign, find, installDom, makeElement, snapshotOf } from "./card-double.mjs";

installDom();

const { isCampaignSlot, mountWidget } = await import("../dist/index.js");

/** Mount, let the one queued answer land, and hand back the root element. */
const render = async (campaigns, options = {}, game) => {
	const target = makeElement("div");
	const client = { progress: async () => snapshotOf(campaigns, game) };
	const handle = mountWidget(target, client, { theme: "light", ...options });
	await handle.refresh();
	return find(target, "ak");
};

const steps = (done) =>
	["mon", "tue", "wed", "thu", "fri"].map((key, index) => ({
		key,
		achieved: index < done ? 1 : 0,
		target: 1,
		done: index < done,
	}));

test("a checklist says how many of its steps are done", async () => {
	// The one goal kind whose `achieved` is a tick count rather than a
	// quantity. "3 of 5" alone would read as three events out of seven.
	const root = await render([
		campaign({ goal: { kind: "checklist", achieved: 3, target: 5, steps: steps(3) } }),
	]);

	assert.equal(find(root, "ak-meta").textContent, "3 of 5 done");
	assert.equal(find(root, "ak-fill").style.width, "60%");
});

test("a checklist counts the steps rather than trusting the total", async () => {
	// `achieved` and the ticked steps are two derivations of one fact, so both
	// the line and the bar are drawn from the steps and cannot disagree with a
	// list beside them, or with each other.
	const root = await render([
		campaign({ goal: { kind: "checklist", achieved: 0, target: 5, steps: steps(4) } }),
	]);

	assert.equal(find(root, "ak-meta").textContent, "4 of 5 done");
	assert.equal(find(root, "ak-fill").style.width, "80%");
});

test("a reward of kind none shows no pill, however complete the campaign is", async () => {
	// The commonest reward the game model writes: every daily objective and
	// every step of a main chain pays it, and it records no grant, so there is
	// nothing for the card to celebrate.
	const root = await render([
		campaign({ completed: true, reward: { source: "campaign", reward: { kind: "none" } } }),
	]);

	assert.equal(find(root, "ak-pill").hidden, true);
});

test("a reward that pays something still shows its pill on completion", async () => {
	const root = await render([campaign({ completed: true })]);

	assert.equal(find(root, "ak-pill").hidden, false);
});

test("every other goal kind keeps the plain count", async () => {
	const root = await render([campaign({})]);

	assert.equal(find(root, "ak-meta").textContent, "2 of 7");
});

test("the card takes its name from the campaign's own title", async () => {
	const root = await render([campaign({})]);

	assert.equal(find(root, "ak-name").textContent, "Finish the week");
});

test("`label` wins over the title, and both over the fallback", async () => {
	const named = await render([campaign({})], { label: "This week" });
	assert.equal(find(named, "ak-name").textContent, "This week");

	const untitled = await render([campaign({ title: null })]);
	assert.equal(find(untitled, "ak-name").textContent, "Your progress");
});

test("`campaignId` names one campaign exactly, and `slot` does not override it", async () => {
	const root = await render(
		[campaign({ id: "campaign_main", slot: "main" }), campaign({ id: "campaign_daily", slot: "daily", title: "Today" })],
		{ campaignId: "campaign_main", slot: "daily" },
	);

	assert.equal(find(root, "ak-name").textContent, "Finish the week");
});

const NO_GAME = null;

/** A daily objective listed before the main quest, so "first live" and `main` disagree. */
const dailyThenMain = () => [
	campaign({ id: "campaign_daily", slot: "daily", title: "Today" }),
	campaign({ id: "campaign_main", slot: "main" }),
];

test("with no slot named, the card draws the live main quest, not the first live campaign", async () => {
	// Before the default, the card drew whichever live campaign came first,
	// so which one a page showed depended on the order the platform answered.
	const root = await render(dailyThenMain());

	assert.equal(find(root, "ak-name").textContent, "Finish the week");
});

/**
 * The default is keyed on the data, never on `game`: a live main quest in the
 * answer is drawn, and without one the first live campaign in any slot is.
 * A draft game has published nothing, so it has no main quest to draw, and
 * the card must not claim it does. An explicit slot wins in every world.
 */
const side = () => campaign({ id: "campaign_side", slot: "side", title: "Share a render" });
const WORLDS = [
	{
		world: "a live main quest beside a side quest",
		campaigns: () => [side(), campaign({ id: "campaign_main", slot: "main" })],
		game: { id: "game_1", status: "live" },
		bare: "Finish the week",
		asMain: "Finish the week",
		asSide: "Share a render",
	},
	{
		world: "a side quest alone, under a draft game",
		campaigns: () => [side()],
		game: { id: "game_1", status: "draft" },
		bare: "Share a render",
		asMain: "No main quest to show",
		asSide: "Share a render",
	},
	{
		world: "a side quest alone, with no game",
		campaigns: () => [side()],
		game: NO_GAME,
		bare: "Share a render",
		asMain: "No main quest to show",
		asSide: "Share a render",
	},
	{
		world: "nothing live, under a live game",
		campaigns: () => [campaign({ status: "ended" })],
		game: { id: "game_1", status: "live" },
		bare: "Nothing to show",
		asMain: "No main quest to show",
		asSide: "No side quest to show",
	},
	{
		world: "nothing live, with no game",
		campaigns: () => [campaign({ status: "ended" })],
		game: NO_GAME,
		bare: "Nothing to show",
		asMain: "No main quest to show",
		asSide: "No side quest to show",
	},
];

for (const { world, campaigns, game, bare, asMain, asSide } of WORLDS) {
	test(`the default and an explicit slot, in ${world}`, async () => {
		for (const [options, expected] of [
			[{}, bare],
			[{ slot: "main" }, asMain],
			[{ slot: "side" }, asSide],
		]) {
			const root = await render(campaigns(), options, game);
			assert.equal(find(root, "ak-name").textContent, expected, JSON.stringify(options));
		}
	});
}

test("a campaign in no slot is drawn by default only while no main quest is live", async () => {
	// Published before the game model, so it fills no slot. A live main quest
	// outranks it; without one it is the first live campaign like any other.
	const legacy = () => campaign({ id: "campaign_legacy", slot: null, title: "Legacy" });

	const beside = await render([legacy(), campaign({ id: "campaign_main", slot: "main" })]);
	assert.equal(find(beside, "ak-name").textContent, "Finish the week");

	const alone = await render([legacy()]);
	assert.equal(find(alone, "ak-name").textContent, "Legacy");
});

test("no campaign draws no track, rather than a track at zero, and names the slot it looked in", async () => {
	// An empty bar reads as a campaign nobody has started. Saying nothing is
	// the honest answer when there is nothing to say, and naming the slot
	// tells the page which part of its game is empty. Every slot, because a
	// wrong name for one of them is the kind of slip nobody sees until a
	// player does.
	const names = { main: "main quest", daily: "daily objective", side: "side quest", event: "event" };
	for (const [slot, word] of Object.entries(names)) {
		const other = slot === "main" ? "side" : "main";
		const root = await render([campaign({ slot: other })], { slot });

		assert.equal(find(root, "ak-name").textContent, `No ${word} to show`, slot);
		assert.equal(find(root, "ak-meta").textContent, "", slot);
		assert.equal(find(root, "ak-track").hidden, true, slot);
		assert.equal(find(root, "ak-pill").hidden, true, slot);
	}
});

test("a `campaignId` the answer does not carry names no slot", async () => {
	// `slot` is ignored beside `campaignId`, so naming it here would describe
	// a search the card never ran.
	const root = await render([campaign({})], { campaignId: "campaign_gone", slot: "daily" });

	assert.equal(find(root, "ak-name").textContent, "Nothing to show");
	assert.equal(find(root, "ak-track").hidden, true);
});

test("a slot cast past the type never reaches the player as a word", async () => {
	// The markup readers drop a value that names no slot. A caller with code
	// can still force one through, and the card must not paint "undefined".
	const root = await render([campaign({})], { slot: "weekly" });

	assert.equal(find(root, "ak-name").textContent, "Nothing to show");
});

test("isCampaignSlot knows the four slots and nothing else", () => {
	for (const slot of ["main", "daily", "side", "event"]) assert.equal(isCampaignSlot(slot), true, slot);
	for (const value of ["weekly", "Main", "", "toString", "hasOwnProperty", null, undefined, 1]) {
		assert.equal(isCampaignSlot(value), false, String(value));
	}
});

test("a failed read says so and draws no progress", async () => {
	const target = makeElement("div");
	const client = {
		progress: async () => {
			throw new Error("network");
		},
	};
	const handle = mountWidget(target, client, { theme: "light" });
	await handle.refresh();
	const root = find(target, "ak");

	assert.equal(find(root, "ak-name").textContent, "Unavailable");
	assert.equal(find(root, "ak-track").hidden, true);
});
