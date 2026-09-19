// What the card draws, asserted over `dist/` like every other test here.
//
// Node has no DOM, so the file brings the smallest one `mountWidget` can run
// against: elements that remember a class, a text and a hidden flag, a shadow
// root that accepts children, and nothing else. A real headless browser would
// be a heavier dependency than the thing under test, and the card's rendering
// is text into three elements — a double that cannot express a layout bug is
// still the right double for asserting what those three elements say.
import assert from "node:assert/strict";
import test from "node:test";

/** One element. `style` is a plain object, which is all `applyColors` needs. */
const makeElement = (tag) => {
	const node = {
		tagName: tag,
		className: "",
		textContent: "",
		hidden: false,
		dataset: {},
		children: [],
		attributes: {},
		style: { setProperty() {}, removeProperty() {} },
		append(...kids) {
			node.children.push(...kids);
		},
		setAttribute(name, value) {
			node.attributes[name] = value;
		},
		attachShadow() {
			// Kept on the host so the search below can walk into it. A real
			// shadow root is reachable the same way, through `host.shadowRoot`.
			node.shadowRoot = makeElement("#shadow-root");
			return node.shadowRoot;
		},
		remove() {},
	};
	return node;
};

globalThis.document = { createElement: makeElement };

const { mountWidget } = await import("../dist/index.js");

/** Depth-first search for the one element carrying a class, shadow roots included. */
const find = (node, className) => {
	if (node.className === className) return node;
	for (const child of [...(node.shadowRoot ? [node.shadowRoot] : []), ...node.children]) {
		const hit = find(child, className);
		if (hit) return hit;
	}
	return undefined;
};

const campaign = (overrides) => ({
	id: "campaign_1",
	status: "live",
	publishedVersion: 1,
	title: "Finish the week",
	slot: "main",
	cadence: "weekly",
	periodKey: "2026-W38",
	periodEndsAt: "2026-09-21T00:00:00.000Z",
	xp: 100,
	startsAt: null,
	endsAt: null,
	enrollment: "enrolled",
	events: ["image.generated"],
	goal: { kind: "count", achieved: 2, target: 7 },
	completed: false,
	completedAt: null,
	reward: { source: "campaign", reward: { kind: "credits", amount: 40 } },
	...overrides,
});

const snapshotOf = (campaigns) => ({
	environment: "production",
	campaigns,
	campaignCount: campaigns.length,
	wallets: [],
	currencyCount: 0,
	progression: { xp: 340, level: 4, levelFloorXp: 300, nextLevelXp: 500 },
	game: { id: "game_1", status: "live" },
});

/** Mount, let the one queued answer land, and hand back the root element. */
const render = async (campaigns, options = {}) => {
	const target = makeElement("div");
	const client = { progress: async () => snapshotOf(campaigns) };
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

test("`slot` picks the campaign the card is standing beside", async () => {
	const root = await render(
		[
			campaign({ id: "campaign_main", slot: "main" }),
			campaign({ id: "campaign_daily", slot: "daily", title: "Today", goal: { kind: "count", achieved: 1, target: 3 } }),
		],
		{ slot: "daily" },
	);

	assert.equal(find(root, "ak-name").textContent, "Today");
	assert.equal(find(root, "ak-meta").textContent, "1 of 3");
});

test("`campaignId` names one campaign exactly, and `slot` does not override it", async () => {
	const root = await render(
		[campaign({ id: "campaign_main", slot: "main" }), campaign({ id: "campaign_daily", slot: "daily", title: "Today" })],
		{ campaignId: "campaign_main", slot: "daily" },
	);

	assert.equal(find(root, "ak-name").textContent, "Finish the week");
});

test("no campaign draws no track, rather than a track at zero", async () => {
	// An empty bar reads as a campaign nobody has started. Saying nothing is
	// the honest answer when there is nothing to say.
	const root = await render([campaign({ slot: "main" })], { slot: "event" });

	assert.equal(find(root, "ak-name").textContent, "No campaign to show");
	assert.equal(find(root, "ak-meta").textContent, "");
	assert.equal(find(root, "ak-track").hidden, true);
	assert.equal(find(root, "ak-pill").hidden, true);
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
