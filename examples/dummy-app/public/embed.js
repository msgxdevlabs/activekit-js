/*
 * The app side of the shell protocol.
 *
 * This is a stand-in for the hosted ActiveKit app on `play.activekit.app`: same
 * origin boundary, same handshake, same messages, fixed data. What matters here
 * is not the content — it is that every message the shell can send is answered,
 * and every message the shell expects is sent, from a genuinely different
 * origin.
 *
 * It draws the two views every widget template draws and no others: Home, the
 * main quest board with its week strip, today's objective and the side quests;
 * and Map, the goal strip and the route. A template changes the dressing and
 * never the views, which is why the palette below has two blocks and the markup
 * has one.
 *
 * Nothing here is decided by chance, there is no claim control, and nothing is
 * celebrated with confetti: a grant acknowledges itself server side, and the
 * browser has no write path to offer a button for.
 *
 * The numbers are fixed fiction. They do not come from the demo's mock — the
 * mock is on the customer's origin and this app never reaches it — so what this
 * demonstrates is the frame, the handshake and the shape of the two views.
 *
 * ⭐ marks the parts that are the protocol rather than the demo.
 */

const PROTOCOL = 1; // ⭐ must match the shell's

/**
 * The widget template this app is dressed in, and the frame background that
 * goes with it.
 *
 * The template decides the ground and the host page's theme does not: the host
 * theme owns the bubble and the scrim, and the frame follows whatever is
 * rendering inside it. The shell paints its frame from the value posted on
 * `ready` below, so a light host page framing a dark template no longer fades
 * in against white and then snaps.
 *
 * Six lowercase hex digits, because the shell validates the shape before the
 * string becomes a CSS value on the host page and refuses a three-digit form.
 */
const GROUNDS = { "activekit-dark": "#0b1220", "activekit-light": "#ffffff" };

const template =
	new URLSearchParams(location.search).get("template") === "activekit-light"
		? "activekit-light"
		: "activekit-dark";
document.documentElement.dataset.template = template;

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
			load();
			break;
		case "token":
			token = data.token;
			break;
		case "theme":
			// Answered and deliberately not acted on. The shell sends the host
			// page's theme because the protocol carries it, and the template
			// inside the frame is what decides this app's dressing, so a host
			// toggling to light does not repaint the app or its ground.
			break;
		case "refresh":
			// A real app re-reads `/v1/me/progress` here. This one advances its
			// fixed fiction by one objective instead, so a walk can watch a goal
			// move without a claim control to press.
			advance();
			load();
			break;
		case "open":
			// ⭐ The shell revealed us, so the dot goes out. A real app reads its
			// grants here and the platform stamps acknowledgment inside that
			// read; there is no acknowledge call to make, because a browser
			// holding a subject token cannot write. Posted on `open` and not on
			// every paint: the frame is built on first hover, and a badge posted
			// then would clear the dot for someone who never opened anything.
			toHost({ type: "badge", value: false });
			break;
		case "close":
			// The shell is dismissing us; nothing to tear down in the demo.
			break;
	}
});

// ⭐ Escape inside the frame has to reach the shell — the host cannot see
// keystrokes in here, so a user pressing Escape would otherwise be stuck.
addEventListener("keydown", (event) => {
	if (event.key === "Escape") toHost({ type: "escape" });
});

// ---------------------------------------------------------------------------
// The fiction
// ---------------------------------------------------------------------------

/** What the platform pays per completion, by slot. Constants, never settings. */
const SLOT_XP = { daily: 20, main: 30, side: 50, event: 80 };
const MAIN_CHAIN_XP = 100;
const LEVEL_BASE_XP = 100;

const xpForLevel = (level) => (LEVEL_BASE_XP * (level - 1) * level) / 2;

const state = {
	xp: 340,
	streak: 4,
	// The limited-time event, the only slot with a hard end.
	event: {
		title: "Five sprint sessions before the sprint ends",
		reward: "2,000 coins",
		achieved: 2,
		target: 5,
		endsIn: "3d",
	},
	// The main quest: one chain per week, drawn as a checklist of ticks.
	chain: {
		title: "Finish this week's practice plan",
		reward: "500 coins",
		steps: [
			{ key: "grammar", label: "Work through a grammar lesson", done: true },
			{ key: "listening", label: "Finish a listening exercise", done: false },
			{ key: "speaking", label: "Run a speaking drill", done: false },
		],
	},
	// Today's daily objectives. Pays XP and never touches the customer's ledger.
	today: [{ label: "Practice for five minutes", done: false }],
	sideQuests: [
		{ label: "Practice seven days running", achieved: 4, target: 7, reward: "1,500 coins" },
		{ label: "Bring three friends along", achieved: 1, target: 3, reward: "Recruiter badge" },
	],
};

/**
 * Advance the fiction by one objective, in the order a player would meet them:
 * this week's chain first, then today's objective, then the event, then a side
 * quest. XP follows the platform's economy — a chain step pays `SLOT_XP.main`
 * the moment it ticks, the chain pays {@link MAIN_CHAIN_XP} once when its last
 * step closes, and everything else pays its slot's constant on completion.
 */
const advance = () => {
	const step = state.chain.steps.find((s) => !s.done);
	if (step) {
		step.done = true;
		state.xp += SLOT_XP.main;
		if (state.chain.steps.every((s) => s.done)) state.xp += MAIN_CHAIN_XP;
		return;
	}
	const objective = state.today.find((o) => !o.done);
	if (objective) {
		objective.done = true;
		state.streak += 1;
		state.xp += SLOT_XP.daily;
		return;
	}
	if (state.event.achieved < state.event.target) {
		state.event.achieved += 1;
		if (state.event.achieved === state.event.target) state.xp += SLOT_XP.event;
		return;
	}
	const quest = state.sideQuests.find((q) => q.achieved < q.target);
	if (quest) {
		quest.achieved += 1;
		if (quest.achieved === quest.target) state.xp += SLOT_XP.side;
	}
};

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Monday-first index of today, which is the cell the week strip pulses. */
const todayIndex = () => (new Date().getDay() + 6) % 7;

const svgTick = () =>
	`<svg viewBox="0 0 12 12" fill="none" stroke="var(--teal)" stroke-width="2" aria-hidden="true"><path d="M2.5 6.4 4.8 8.7 9.5 3.6"/></svg>`;

/** A row: a tick, what it is, and what it pays where the wire says what. */
const objectiveRow = (label, done, trailing) => {
	const row = document.createElement("div");
	row.className = "obj";
	const tick = document.createElement("span");
	tick.className = "tick";
	tick.dataset.s = done ? "done" : "todo";
	if (done) tick.innerHTML = svgTick();
	const name = document.createElement("b");
	name.textContent = label;
	row.append(tick, name);
	if (trailing) {
		const pill = document.createElement("span");
		pill.className = trailing.coin ? "coin" : "xp";
		pill.textContent = trailing.text;
		row.append(pill);
	}
	return row;
};

const renderBand = () => {
	const level = (() => {
		let n = 1;
		while (xpForLevel(n + 1) <= state.xp) n += 1;
		return n;
	})();
	const floor = xpForLevel(level);
	const ceiling = xpForLevel(level + 1);
	$("level").textContent = `Lv ${level}`;
	// Drawn at zero rather than hidden: a streak that vanishes on the day it
	// breaks is a streak the player cannot see start again.
	$("streak-n").textContent = String(state.streak);
	$("ladder-n").textContent = `${state.xp - floor} / ${ceiling - floor}`;
	$("ladder-bar").style.width = `${((state.xp - floor) / (ceiling - floor)) * 100}%`;
};

const renderHome = () => {
	// The event banner, and nothing at all when no event is running: a region
	// with nothing on the wire behind it draws nothing rather than a placeholder.
	const banner = $("banner");
	banner.hidden = !state.event;
	if (state.event) {
		$("banner-eyebrow").textContent = `Event · ends in ${state.event.endsIn}`;
		$("banner-title").textContent = state.event.title;
		$("banner-reward").textContent = state.event.reward;
		$("banner-count").textContent = `${state.event.achieved} / ${state.event.target}`;
		$("banner-bar").style.width = `${(state.event.achieved / state.event.target) * 100}%`;
	}

	$("chain-title").textContent = state.chain.title;
	$("chain-reward").textContent = state.chain.reward;

	// The week strip. A step is read as the weekday of its own position,
	// Monday first, because the wire does not yet say which day a step is
	// pinned to; when it does, the strip reads that instead of counting.
	const week = $("week");
	for (const old of [...week.querySelectorAll(".day")]) old.remove();
	const now = todayIndex();
	DAYS.forEach((label, index) => {
		const step = state.chain.steps[index];
		const cell = document.createElement("div");
		cell.className = "day";
		cell.dataset.s = step?.done
			? "done"
			: index === now
				? "now"
				: step && index < now
					? "missed"
					: "todo";
		const disc = document.createElement("div");
		disc.className = "c";
		if (step?.done) disc.innerHTML = svgTick();
		const name = document.createElement("div");
		name.className = "l";
		name.textContent = label;
		cell.append(disc, name);
		week.append(cell);
	});
	const done = state.chain.steps.filter((s) => s.done).length;
	$("week-prog").style.width = `calc((100% - 36px) * ${done / (DAYS.length - 1)})`;

	// No XP pill beside a chain step: what one objective of a chain pays is not
	// on the wire, and a figure nothing serves is left off rather than typed in.
	const steps = $("chain-steps");
	steps.replaceChildren(
		...state.chain.steps.map((step) => objectiveRow(step.label, step.done)),
	);

	$("today-left").textContent = "resets at midnight UTC";
	$("today").replaceChildren(
		...state.today.map((objective) =>
			objectiveRow(objective.label, objective.done, { text: `+${SLOT_XP.daily} XP` }),
		),
	);

	$("side").replaceChildren(
		...state.sideQuests.map((quest) => {
			const wrap = document.createElement("div");
			wrap.style.display = "grid";
			wrap.style.gap = "6px";
			wrap.append(
				objectiveRow(quest.label, quest.achieved >= quest.target, {
					coin: true,
					text: quest.reward,
				}),
			);
			const line = document.createElement("div");
			line.className = "ladder";
			const bar = document.createElement("div");
			bar.className = "bar";
			const fill = document.createElement("i");
			fill.style.width = `${Math.min(100, (quest.achieved / quest.target) * 100)}%`;
			bar.append(fill);
			const count = document.createElement("span");
			count.textContent = `${quest.achieved} / ${quest.target}`;
			line.append(bar, count);
			wrap.append(line);
			return wrap;
		}),
	);
};

/** Where each station sits on the route, as a share of the panel. */
const STATION_SPOTS = [
	[22, 84],
	[50, 63],
	[26, 42],
	[58, 24],
	[80, 50],
];

const renderMap = () => {
	const left = state.chain.steps.filter((s) => !s.done).length;
	$("goal-name").textContent = state.chain.title;
	$("goal-sub").textContent = "Main quest, this week";
	$("goal-left").textContent = String(left);

	// The route is every station a player can walk to: today's objective, the
	// event while it runs, and the side quests. No season and no tier bands,
	// because nothing on the wire carries a season yet and an empty region
	// draws nothing.
	const stations = [
		...state.today.map((objective) => ({
			label: objective.label,
			note: `+${SLOT_XP.daily} XP`,
			done: objective.done,
		})),
		{
			label: state.event.title,
			note: `${state.event.achieved} of ${state.event.target}`,
			done: state.event.achieved >= state.event.target,
		},
		...state.sideQuests.map((quest) => ({
			label: quest.label,
			note: `${quest.achieved} of ${quest.target}`,
			done: quest.achieved >= quest.target,
		})),
	].slice(0, STATION_SPOTS.length);

	const route = $("route");
	for (const old of [...route.querySelectorAll(".station")]) old.remove();
	// The first station not yet finished is the hot one, and it is the one
	// moving thing on this screen.
	const hot = stations.findIndex((station) => !station.done);
	stations.forEach((station, index) => {
		const [x, y] = STATION_SPOTS[index];
		const node = document.createElement("div");
		node.className = "station";
		node.dataset.s = station.done ? "done" : index === hot ? "hot" : "todo";
		node.style.left = `${x}%`;
		node.style.top = `${y}%`;
		const disc = document.createElement("div");
		disc.className = "n";
		if (station.done) disc.innerHTML = svgTick();
		else disc.textContent = String(index + 1);
		const name = document.createElement("b");
		name.textContent = station.label;
		const note = document.createElement("span");
		note.textContent = station.note;
		node.append(disc, name, note);
		route.append(node);
	});

	const points = STATION_SPOTS.slice(0, stations.length)
		.map(([x, y]) => `${x},${y}`)
		.join(" ");
	$("route-path").setAttribute("viewBox", "0 0 100 100");
	$("route-path").setAttribute("preserveAspectRatio", "none");
	$("route-path").innerHTML =
		`<polyline points="${points}" fill="none" stroke="var(--rail)" stroke-width="0.6" ` +
		`stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" />`;
};

const render = () => {
	renderBand();
	renderHome();
	renderMap();
};

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

$("nav").addEventListener("click", (event) => {
	const button = event.target.closest("button[data-view]");
	if (!button) return;
	for (const other of $("nav").querySelectorAll("button")) {
		other.setAttribute("aria-current", String(other === button));
	}
	for (const view of document.querySelectorAll(".view")) {
		view.dataset.on = String(view.dataset.view === button.dataset.view);
	}
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

// ⭐ Announce readiness, and name the ground the rendering template is on. The
// shell will not send `init` — and therefore not the token — until it sees
// this, so nothing is handed over before we can hear it.
if (parent !== window) {
	parent.postMessage({ v: PROTOCOL, type: "ready", ground: GROUNDS[template] }, "*");
} else {
	// Opened directly rather than framed: render something rather than nothing.
	render();
}
