// Acme Learn's frontend integration with ActiveKit.
//
// The ⭐ blocks are the entire integration — everything else on this page is
// demo scaffolding (toasts, theme toggle, simulate buttons).

// ⭐ 1. Import the SDK.
//    In a real app:  import { createClient, mountShell } from "@activekit/js";
//    Here the built file is served by the demo server instead of a bundler.
import { createClient, mountShell } from "/sdk/index.js";

// ⭐ 2. Ask *your own backend* for a subject token. The browser never sees an
//    API key — the token is short-lived and scoped to the logged-in user.
const { token, expiresAt } = await (await fetch("/api/activekit/token")).json();

// ⭐ 3. One client per page. `apiUrl` points at the demo's mock API; a real
//    integration omits it and gets api.activekit.app/v1.
const client = createClient({ token, apiUrl: `${location.origin}/v1` });

// ⭐ 3½. Tokens expire. Rotate a fresh one in before that happens — otherwise
//    every read starts failing with 401 after `expiresAt` and the widget
//    sticks at "Unavailable". `setToken` exists for exactly this.
const rotateBefore = (expiresAt) => {
	const ms = Math.max(new Date(expiresAt).getTime() - Date.now() - 60_000, 30_000);
	setTimeout(async () => {
		try {
			const next = await (await fetch("/api/activekit/token")).json();
			client.setToken(next.token);
			shell.setToken(next.token); // ⭐ the shell holds its own copy — it polls the dot
			rotateBefore(next.expiresAt);
		} catch {
			rotateBefore(new Date(Date.now() + 90_000).toISOString()); // retry soon
		}
	}, ms);
};
rotateBefore(expiresAt);

// ⭐ 4. Mount the shell: a bubble in the corner that opens the ActiveKit app.
//
//    Two states. The bubble is pressed and the app opens — there is no compact
//    panel in between, because a corner panel is too big to draw natively
//    without reimplementing the app and too small to be worth its own document.
//
//    Almost nothing runs on this page: a button, a frame, and a message
//    protocol. Every screen with content in it is served from `appUrl`, on
//    ActiveKit's origin, which is why Acme's CSP needs `frame-src` and not
//    permission to execute our code.
//
//    In production `appUrl` and `apiUrl` are both omitted and default to
//    play.activekit.app and api.activekit.app/v1. Here they point at the
//    demo's stand-in app on :4174 and the mock API on this origin.
const theme = () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
const mountAcmeShell = (mode) =>
	mountShell({
		token,
		appUrl: "http://localhost:4174",
		apiUrl: `${location.origin}/v1`,
		label: "Your rewards",
		theme: mode,
		// prefetch defaults to "hover": the frame is built on first pointer
		// contact with the bubble, so visitors who never open it pay nothing.
		// Only the bubble and the frame chrome. What the *app* looks like is
		// the widget template selected in the ActiveKit dashboard, not a mount
		// option — and the frame's own ground follows that template, which is
		// why the app names its ground when it signals ready.
		colors: { brand: "#5b5bd6" },
		onError: (error) => console.warn(error.message),
	});
let shell = mountAcmeShell(theme());

// ⭐ 4½. The streak chip in Acme's own nav. `snapshot.streak` is the activity
//    streak the platform serves on every progress read, the consecutive days
//    a daily objective paid XP, and it is drawn at zero rather than hidden:
//    a streak that vanishes on the day it breaks is one the player cannot
//    see start again. The hosted app draws the same number in its own chip.
const streakChip = document.getElementById("streak-chip");
const paintStreak = (snapshot) => {
	const days = snapshot.streak.current;
	streakChip.textContent = `🔥 ${days}`;
	streakChip.setAttribute("aria-label", `${days} day streak`);
};
const readAndPaint = async () => {
	try {
		paintStreak(await client.progress());
	} catch {
		// The chip keeps what it had. A failed read is the platform having a
		// bad minute, and nothing on Acme's page should break over it.
	}
};
await readAndPaint();

// --- demo scaffolding from here down ---------------------------------------

/**
 * What one campaign now reads, in the goal's own unit.
 *
 * A checklist is a list of ticks rather than a quantity, so it counts the steps
 * that are done and names them; every other goal kind counts in one number. A
 * campaign published before titles existed carries none, which is a cue to fall
 * back rather than an empty line to draw.
 */
const describe = (campaign) => {
	const title = campaign.title ?? "Your progress";
	const goal = campaign.goal;
	if (goal.kind !== "checklist") return `${title}: ${goal.achieved} of ${goal.target}.`;
	const done = goal.steps.filter((step) => step.done);
	const named = done.length > 0 ? ` (${done.map((step) => step.key).join(", ")})` : "";
	return `${title}: ${done.length} of ${goal.steps.length} done${named}.`;
};

const toasts = document.getElementById("toasts");
const toast = (message) => {
	const node = document.createElement("div");
	node.className = "toast";
	node.textContent = message;
	toasts.append(node);
	setTimeout(() => node.remove(), 3800);
};

document.addEventListener("click", async (event) => {
	const action = event.target.closest("[data-action]")?.dataset.action;
	if (!action) return;

	if (action === "reset") {
		await fetch("/api/demo/reset", { method: "POST" });
		await shell.refresh();
		await readAndPaint();
		toast("Demo state reset.");
		return;
	}

	// The user did something in Acme's product → Acme's backend records it.
	const res = await fetch(`/api/actions/${action}`, { method: "POST" });
	const result = await res.json();
	if (!res.ok) {
		toast(`Backend error: ${result.error}`);
		return;
	}

	// ⭐ 5. A 2xx is not the same as recorded. An event name the platform has not
	//    confirmed for this app is answered `pending_confirmation` and dropped,
	//    so nothing moved and there is nothing to re-read. Treating every 2xx as
	//    recorded is how a client ends up believing in events that were never
	//    kept.
	if (result.status === "pending_confirmation") {
		toast(`${result.name} is not a confirmed event name. Nothing was recorded.`);
		return;
	}

	// ⭐ 6. Once your backend has recorded one, a single read brings the page up
	//    to date. Every subscriber repaints from the snapshot this emits.
	let snapshot;
	try {
		snapshot = await client.progress();
	} catch {
		toast("Recorded, but the read that follows it failed. It will catch up next time.");
		return;
	}

	paintStreak(snapshot);

	// ⭐ 7. The app in the frame reads the same wire this page just re-read, so
	//    tell it to read again. Without this an open app keeps painting the
	//    snapshot it fetched before your backend recorded anything.
	await shell.refresh();

	// Find the campaigns the way a subject-facing surface has to: by the event
	// names their criteria listen for. One event can advance several — a
	// check-in moves today's objective and the streak beside it. What each one
	// is called comes from its own `title`, the player-facing sentence the
	// platform freezes into the published version; the campaign's operator name
	// is never sent to a subject.
	const moved = snapshot.campaigns.filter((campaign) => campaign.events.includes(result.name));
	if (moved.length === 0) {
		toast(`Recorded ${result.name}. No campaign listens for it.`);
		return;
	}
	const also = moved.length > 1 ? ` And ${moved.length - 1} more.` : "";
	toast(`Recorded ${result.name}. ${describe(moved[0])}${also}`);
});

// Theme toggle. The shell's `auto` theme follows prefers-color-scheme; this
// page's toggle is its own thing, so we remount with an explicit theme to match.
document.getElementById("theme-toggle").addEventListener("click", () => {
	const next = theme() === "dark" ? "light" : "dark";
	document.documentElement.dataset.theme = next;
	document.getElementById("theme-toggle").textContent = next === "dark" ? "☀️" : "🌙";
	shell.destroy();
	shell = mountAcmeShell(next);
});
