// The card's test double, shared by every suite that draws the inline card:
// this package's own, and `@activekit/elements`, whose element mounts the same
// card and has no DOM of its own to test against.
//
// Node has no DOM, so this is the smallest one `mountWidget` can run against:
// elements that remember a class, a text and a hidden flag, a shadow root that
// accepts children, and nothing else. A real headless browser would be a
// heavier dependency than the thing under test, and the card's rendering is
// text into three elements; a double that cannot express a layout bug is
// still the right double for asserting what those three elements say.

/** One element. `style` is a plain object, which is all `applyColors` needs. */
export const makeElement = (tag) => {
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

/**
 * Give Node the two globals the card reaches for. `matchMedia` answers light,
 * because the script tag and the element mount with the `auto` theme unless
 * told otherwise.
 */
export const installDom = () => {
	globalThis.document = { createElement: makeElement };
	globalThis.matchMedia = () => ({ matches: false });
};

/** A `fetch` that answers every request with `body`, as the client reads it. */
export const answering = (body) => async () => ({ ok: true, status: 200, json: async () => body });

/** Let every queued answer land and the card paint from it. */
export const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Depth-first search for the one element carrying a class, shadow roots included. */
export const find = (node, className) => {
	if (node.className === className) return node;
	for (const child of [...(node.shadowRoot ? [node.shadowRoot] : []), ...node.children]) {
		const hit = find(child, className);
		if (hit) return hit;
	}
	return undefined;
};

export const campaign = (overrides) => ({
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

export const snapshotOf = (campaigns, game = { id: "game_1", status: "live" }) => ({
	environment: "production",
	campaigns,
	campaignCount: campaigns.length,
	wallets: [],
	currencyCount: 0,
	progression: { xp: 340, level: 4, levelFloorXp: 300, nextLevelXp: 500 },
	game,
	streak: { current: 0, longest: 0 },
});
