/**
 * `docs/short-owners.md`, held to the walk card format of 2026-09-25.
 *
 * A card is a runbook the owner reads cold: an ID and a title, one note with
 * three fields, a numbered table of steps, a pass checklist, and at most a
 * warning or an important banner of one sentence each under it. The format is
 * described in the file's own header; this file is what keeps a later edit
 * from drifting back to prose, because the version before it did, card by
 * card, until the lane read as an essay with checkboxes in it.
 *
 * Only the cards are held, everything after `## Walks`. The header above it
 * carries the rules and the tier table, which are prose on purpose.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const file = readFileSync(new URL("../docs/short-owners.md", import.meta.url), "utf8");

const walksAt = file.indexOf("\n## Walks\n");
assert.ok(walksAt >= 0, "docs/short-owners.md no longer has a `## Walks` section");

/** The cards, split on their headings, each with the ID and title read off it. */
const cards = file
	.slice(walksAt + "\n## Walks\n".length)
	.split(/\n(?=### )/)
	.map((text) => text.trim())
	.filter(Boolean)
	.map((text) => {
		const heading = /^### (J\d\d)\. (.+)$/m.exec(text);
		return { text, id: heading?.[1], title: heading?.[2], lines: text.split("\n") };
	});

/** Every banner in a card: its kind and the lines of its body. */
const banners = (card) => {
	const found = [];
	for (let i = 0; i < card.lines.length; i += 1) {
		const kind = /^> \[!(NOTE|WARNING|IMPORTANT|TIP|CAUTION)\]$/.exec(card.lines[i])?.[1];
		if (!kind) continue;
		const body = [];
		for (let j = i + 1; j < card.lines.length && card.lines[j].startsWith(">"); j += 1) {
			body.push(card.lines[j].replace(/^>\s?/, ""));
		}
		found.push({ kind, body });
	}
	return found;
};

test("there is at least one card, and every card has an ID and a title", () => {
	assert.ok(cards.length > 0, "no cards under `## Walks`");
	for (const card of cards) {
		assert.ok(card.id, `a card has no \`### Jnn. Title\` heading: ${card.lines[0]}`);
		assert.ok(card.title?.trim(), `${card.id} has no title`);
	}
});

test("IDs run J01 onward, in order, and none repeats", () => {
	// The letter is the repository and the number never comes back, so a reader
	// can say "J02 failed at step 4" and be understood from any of the three.
	const ids = cards.map((card) => card.id);
	assert.deepEqual(
		ids,
		ids.map((_, index) => `J${String(index + 1).padStart(2, "0")}`),
	);
});

test("each card carries one note with Tier, Needs and Holds, and nothing else in it", () => {
	for (const card of cards) {
		const notes = banners(card).filter((banner) => banner.kind === "NOTE");
		assert.equal(notes.length, 1, `${card.id} has ${notes.length} notes, not one`);
		const [note] = notes;
		assert.equal(note.body.length, 1, `${card.id}'s note runs to ${note.body.length} lines`);
		assert.match(
			note.body[0],
			/^\*\*Tier:\*\* .+ · \*\*Needs:\*\* .+ · \*\*Holds:\*\* .+$/,
			`${card.id}'s note is not \`**Tier:** … · **Needs:** … · **Holds:** …\``,
		);
	}
});

test("every other banner is a warning or an important, one sentence long", () => {
	for (const card of cards) {
		for (const banner of banners(card)) {
			if (banner.kind === "NOTE") continue;
			assert.ok(
				banner.kind === "WARNING" || banner.kind === "IMPORTANT",
				`${card.id} carries a ${banner.kind} banner; only WARNING and IMPORTANT go under a card`,
			);
			assert.equal(banner.body.length, 1, `${card.id}'s ${banner.kind} banner runs to ${banner.body.length} lines`);
			// One sentence: one terminal stop, at the end. A semicolon joins two
			// clauses of one sentence and is allowed; a second full stop is not.
			const stops = banner.body[0].match(/[.!?](?=\s|$)/g) ?? [];
			assert.equal(stops.length, 1, `${card.id}'s ${banner.kind} banner is not one sentence: ${banner.body[0]}`);
		}
	}
});

test("each card has a numbered step table with a Where column", () => {
	for (const card of cards) {
		const header = card.lines.indexOf("| # | Step | Where |");
		assert.ok(header >= 0, `${card.id} has no \`| # | Step | Where |\` table`);
		assert.equal(card.lines[header + 1], "|---|---|---|", `${card.id}'s table has no separator row`);
		const rows = [];
		for (let i = header + 2; i < card.lines.length && card.lines[i].startsWith("|"); i += 1) {
			const cells = card.lines[i].split(/(?<!\\)\|/).slice(1, -1).map((cell) => cell.trim());
			assert.equal(cells.length, 3, `${card.id} step row has ${cells.length} cells: ${card.lines[i]}`);
			rows.push(cells);
		}
		assert.ok(rows.length > 0, `${card.id}'s table has no steps`);
		assert.deepEqual(
			rows.map((row) => row[0]),
			rows.map((_, index) => String(index + 1)),
			`${card.id}'s steps are not numbered 1 onward`,
		);
		for (const [number, step, where] of rows) {
			assert.ok(step, `${card.id} step ${number} is empty`);
			assert.ok(where, `${card.id} step ${number} has no Where`);
			// Prose creeps back in as a trailing explanation. One sentence, no stop
			// inside it, and none at the end either: a table cell is not a paragraph.
			assert.doesNotMatch(step, /[.!?](?=\s)/, `${card.id} step ${number} is more than one sentence: ${step}`);
		}
	}
});

test("each card has a pass checklist of facts, with no should in it", () => {
	for (const card of cards) {
		const pass = card.lines.indexOf("**Pass**");
		assert.ok(pass >= 0, `${card.id} has no **Pass** checklist`);
		const items = [];
		for (let i = pass + 1; i < card.lines.length; i += 1) {
			const line = card.lines[i];
			if (line.startsWith("- [ ] ")) items.push(line.slice("- [ ] ".length));
			else if (line.startsWith(">") || line.startsWith("### ")) break;
		}
		assert.ok(items.length > 0, `${card.id}'s pass checklist is empty`);
		for (const item of items) {
			assert.doesNotMatch(item, /\bshould\b/i, `${card.id} pass item hedges with "should": ${item}`);
			assert.match(item, /[.!?]$/, `${card.id} pass item is not a sentence: ${item}`);
		}
	}
});

test("every URL in a card is in angle brackets", () => {
	// A bare URL renders as a link on GitHub and as text everywhere else, and
	// the angle brackets are what the format asks for so a card reads the same
	// in both.
	for (const card of cards) {
		for (const match of card.text.matchAll(/https?:\/\/[^\s)>`|]+/g)) {
			const before = card.text[match.index - 1];
			assert.ok(
				before === "<" || before === "`",
				`${card.id} carries a URL that is neither in angle brackets nor in code: ${match[0]}`,
			);
		}
	}
});

test("no em dash, no emoji and none of the chat glyphs, in any card", () => {
	for (const card of cards) {
		assert.doesNotMatch(card.text, /—/, `${card.id} carries an em dash`);
		assert.doesNotMatch(card.text, /[✅◑○⚠]/, `${card.id} carries a chat glyph`);
		assert.doesNotMatch(card.text, /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u, `${card.id} carries an emoji`);
	}
});
