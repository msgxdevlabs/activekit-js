// Acme Learn's frontend integration with ActiveKit.
//
// The ⭐ blocks are the entire integration — everything else on this page is
// demo scaffolding (toasts, theme toggle, simulate buttons).

// ⭐ 1. Import the SDK.
//    In a real app:  import { createClient, mountLauncher } from "@activekit/js";
//    Here the built file is served by the demo server instead of a bundler.
import { createClient, mountLauncher } from "/sdk/index.js";

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
			rotateBefore(next.expiresAt);
		} catch {
			rotateBefore(new Date(Date.now() + 90_000).toISOString()); // retry soon
		}
	}, ms);
};
rotateBefore(expiresAt);

// ⭐ 4. Mount the floating launcher. Compact panel highlights one program;
//    the maximize button opens the full stats dashboard.
//
//    `colors` re-brands the widget: Acme's indigo for the bubble and fills,
//    per-theme variants, and a white progress ring — the ring sits on the
//    (now indigo) bubble, where the default green would fail contrast.
const ACME_COLORS = {
	brand: "#5b5bd6",
	ring: "#ffffff",
	dark: { brand: "#7b7bec" },
};
const theme = () => document.documentElement.dataset.theme === "dark" ? "dark" : "light";
const mountAcmeLauncher = (mode) =>
	mountLauncher(client, {
		programKey: "daily-practice",
		title: "Your rewards",
		theme: mode,
		colors: ACME_COLORS,
	});
let launcher = mountAcmeLauncher(theme());

// --- demo scaffolding from here down ---------------------------------------

const toasts = document.getElementById("toasts");
const toast = (message) => {
	const node = document.createElement("div");
	node.className = "toast";
	node.textContent = message;
	toasts.append(node);
	setTimeout(() => node.remove(), 3800);
};

const LABELS = {
	practice: "practice.checkin",
	lesson: "lesson.completed",
	refer: "referral.converted",
};

document.addEventListener("click", async (event) => {
	const action = event.target.closest("[data-action]")?.dataset.action;
	if (!action) return;

	if (action === "reset") {
		await fetch("/api/demo/reset", { method: "POST" });
		await launcher.refresh();
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

	// ⭐ 5. After your backend records an event, one read is all it takes:
	//    the launcher subscribes to the client and repaints on every
	//    successful progress() — whoever triggered it.
	try {
		await client.progress();
	} catch {
		toast("Recorded, but refreshing the widget failed — it will catch up on the next read.");
		return;
	}

	toast(
		result.advanced.length > 0
			? `Recorded ${LABELS[action]} → advanced: ${result.advanced.join(", ")}`
			: `Recorded ${LABELS[action]} (no program advanced)`,
	);
});

// Theme toggle. The launcher's `auto` theme follows prefers-color-scheme; this
// page's toggle is its own thing, so we remount with an explicit theme to match.
document.getElementById("theme-toggle").addEventListener("click", () => {
	const next = theme() === "dark" ? "light" : "dark";
	document.documentElement.dataset.theme = next;
	document.getElementById("theme-toggle").textContent = next === "dark" ? "☀️" : "🌙";
	launcher.destroy();
	launcher = mountAcmeLauncher(next);
});
