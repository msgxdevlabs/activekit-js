/*
 * The app side of the shell protocol.
 *
 * This is a stand-in for the real ActiveKit app: same origin boundary, same
 * handshake, same messages, fake data. What matters here is not the content —
 * it is that every message the shell can send is answered, and every message
 * the shell expects is sent, from a genuinely different origin.
 *
 * ⭐ marks the parts that are the protocol rather than the demo.
 */

const PROTOCOL = 1; // ⭐ must match the shell's

// ---------------------------------------------------------------------------
// ⭐ Protocol
// ---------------------------------------------------------------------------

/** The shell's origin, learned from the first message it sends us. */
let hostOrigin = null;
let token = null;

/** ⭐ Post upward, to the shell's origin only — never `*`. */
const toHost = (message) => {
	if (!hostOrigin) return;
	parent.postMessage({ v: PROTOCOL, ...message }, hostOrigin);
};

window.addEventListener("message", (event) => {
	// ⭐ It has to come from the window that framed us. Anything else is a page
	// that happens to know our URL.
	if (event.source !== parent) return;
	const data = event.data;
	if (!data || data.v !== PROTOCOL) return;

	// The real app pins this to the tenant's configured host origins rather
	// than trusting the first sender; for the demo, first contact wins.
	hostOrigin ??= event.origin;

	switch (data.type) {
		case "init":
			token = data.token;
			applyTheme(data.theme);
			boot(data.locale);
			break;
		case "token":
			token = data.token;
			break;
		case "theme":
			applyTheme(data.theme);
			break;
		case "refresh":
			load();
			break;
		case "open":
			// The shell revealed us. A real app would re-check for staleness here.
			break;
		case "close":
			// The shell is dismissing us; nothing to tear down in the demo.
			break;
	}
});

const applyTheme = (theme) => {
	document.documentElement.dataset.theme = theme === "dark" ? "dark" : "light";
};

// ⭐ Escape inside the frame has to reach the shell — the host cannot see
// keystrokes in here, so a user pressing Escape would otherwise be stuck.
addEventListener("keydown", (event) => {
	if (event.key === "Escape") toHost({ type: "escape" });
});

// The URL carries theme so the first paint is right, before any handshake.
applyTheme(new URLSearchParams(location.search).get("theme"));

// ---------------------------------------------------------------------------
// Fake data
// ---------------------------------------------------------------------------

const state = {
	name: "Pat",
	level: 4,
	xp: 340,
	xpNext: 500,
	coins: 1240,
	streak: 12,
	nodes: [
		{ label: "First login", note: "Done", state: "done" },
		{ label: "First image", note: "Done", state: "done" },
		{ label: "Five in a day", note: "3 / 5", state: "now" },
		{ label: "Share one", note: "Locked", state: "locked" },
		{ label: "Invite a friend", note: "Locked", state: "locked" },
	],
	quests: [
		{ name: "Daily streak", now: 12, goal: 14, reward: "250 coins", kind: "" },
		{ name: "Generate 100 images", now: 63, goal: 100, reward: "Gold frame", kind: "" },
		{ name: "Try three styles", now: 3, goal: 3, reward: "Ready to claim", kind: "a" },
		{ name: "Invite a teammate", now: 0, goal: 1, reward: "500 coins", kind: "" },
	],
	badges: [
		{ icon: "🔥", name: "Streak 7", note: "Earned", locked: false },
		{ icon: "🎨", name: "Stylist", note: "Earned", locked: false },
		{ icon: "⚡", name: "Fast start", note: "Earned", locked: false },
		{ icon: "🏆", name: "Century", note: "63 / 100", locked: true },
		{ icon: "🤝", name: "Recruiter", note: "Locked", locked: true },
		{ icon: "🌙", name: "Night owl", note: "Locked", locked: true },
	],
};

const $ = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const RING = 2 * Math.PI * 40;

const render = () => {
	$("who").textContent = state.name;
	$("ini").textContent = state.name.slice(0, 1).toUpperCase();
	$("lvl").textContent = `Level ${state.level}`;
	$("lvlnum").textContent = String(state.level);
	$("xptitle").textContent = `Level ${state.level}`;
	$("xpsub").textContent = `${state.xp} / ${state.xpNext} XP to level ${state.level + 1}`;
	$("coins").textContent = state.coins.toLocaleString();
	$("streak").textContent = `${state.streak}d`;
	$("bcount").textContent = String(state.badges.filter((b) => !b.locked).length);
	$("season").textContent = "Season · Getting Started · 18 days left";

	// Ring, animated from empty on every paint.
	const ring = $("ring");
	ring.style.strokeDashoffset = String(RING);
	requestAnimationFrame(() =>
		requestAnimationFrame(() => {
			ring.style.strokeDashoffset = String(RING * (1 - state.xp / state.xpNext));
		}),
	);

	// Map.
	const track = $("track");
	track.replaceChildren();
	state.nodes.forEach((node, index) => {
		const wrap = document.createElement("div");
		wrap.className = "node";
		wrap.dataset.s = node.state;
		const dot = document.createElement("div");
		dot.className = "dot";
		dot.textContent = node.state === "done" ? "✓" : String(index + 1);
		const name = document.createElement("b");
		name.textContent = node.label;
		const note = document.createElement("span");
		note.textContent = node.note;
		wrap.append(dot, name, note);
		track.append(wrap);
	});
	const done = state.nodes.filter((n) => n.state === "done").length;
	const pct = (done / (state.nodes.length - 1)) * 100;
	requestAnimationFrame(() =>
		requestAnimationFrame(() => track.style.setProperty("--fill", `calc(${pct}% - 52px * ${pct / 100})`)),
	);

	// Quests.
	const list = $("qlist");
	list.replaceChildren();
	for (const quest of state.quests) {
		const card = document.createElement("article");
		card.className = "q";

		const head = document.createElement("header");
		const name = document.createElement("b");
		name.textContent = quest.name;
		const count = document.createElement("span");
		count.className = "n";
		count.textContent = `${quest.now} / ${quest.goal}`;
		head.append(name, count);

		const bar = document.createElement("div");
		bar.className = "bar";
		const fill = document.createElement("i");
		bar.append(fill);

		const foot = document.createElement("footer");
		const chip = document.createElement("span");
		chip.className = `chip ${quest.kind}`.trim();
		chip.textContent = quest.reward;
		foot.append(chip);

		card.append(head, bar, foot);
		list.append(card);
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				fill.style.width = `${Math.min(100, (quest.now / quest.goal) * 100)}%`;
			}),
		);
	}

	// Badges.
	const badges = $("blist");
	badges.replaceChildren();
	for (const badge of state.badges) {
		const cell = document.createElement("div");
		cell.className = "badge";
		cell.dataset.locked = String(badge.locked);
		const icon = document.createElement("em");
		icon.textContent = badge.icon;
		const name = document.createElement("b");
		name.textContent = badge.name;
		const note = document.createElement("span");
		note.textContent = badge.note;
		cell.append(icon, name, note);
		badges.append(cell);
	}

	// ⭐ Tell the shell whether the dot should be lit. While we are loaded, we
	// know better than its poller does.
	toHost({ type: "badge", value: state.quests.some((q) => q.now >= q.goal) });
};

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

$("nav").addEventListener("click", (event) => {
	const button = event.target.closest("button[data-p]");
	if (!button) return;
	for (const other of $("nav").querySelectorAll("button")) {
		other.setAttribute("aria-current", String(other === button));
	}
	for (const panel of document.querySelectorAll(".panel")) {
		panel.dataset.on = String(panel.dataset.panel === button.dataset.p);
	}
	// Re-run the entrance animations for whatever just became visible.
	render();
});

const confetti = () => {
	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	const fx = $("fx");
	const colors = ["#087f7a", "#14b8a8", "#f0a742", "#e11d48", "#3ddbc9"];
	for (let i = 0; i < 60; i++) {
		const bit = document.createElement("i");
		bit.style.left = `${50 + (Math.random() - 0.5) * 40}%`;
		bit.style.top = "34%";
		bit.style.background = colors[i % colors.length];
		bit.style.setProperty("--dx", `${(Math.random() - 0.5) * 460}px`);
		bit.style.setProperty("--rot", `${Math.random() * 900 - 450}deg`);
		bit.style.animationDelay = `${Math.random() * 0.18}s`;
		fx.append(bit);
		setTimeout(() => bit.remove(), 1800);
	}
};

$("claim").addEventListener("click", () => {
	const next = state.nodes.find((n) => n.state === "now");
	if (next) {
		next.state = "done";
		next.note = "Done";
		const after = state.nodes.find((n) => n.state === "locked");
		if (after) {
			after.state = "now";
			after.note = "In progress";
		}
	}
	state.xp = Math.min(state.xpNext, state.xp + 80);
	state.coins += 250;
	if (state.xp >= state.xpNext) {
		state.level += 1;
		state.xp = 40;
	}
	render();
	confetti();
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

const load = () => {
	// A real app fetches with the token here. The demo just re-renders, but the
	// token is genuinely present — proving it crossed the boundary.
	if (token) console.info("[app] holding a subject token of", token.length, "chars");
	render();
};

const boot = () => load();

// ⭐ Announce readiness. The shell will not send `init` — and therefore not the
// token — until it sees this, so nothing is handed over before we can hear it.
if (parent !== window) {
	parent.postMessage({ v: PROTOCOL, type: "ready" }, "*");
} else {
	// Opened directly rather than framed: render something rather than nothing.
	document.documentElement.dataset.theme = matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
	render();
}
