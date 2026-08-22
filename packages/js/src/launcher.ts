import { el, svg } from "./dom.js";
import { applyColors } from "./colors.js";
import type { WidgetColors } from "./colors.js";
import type { ActiveKitClient } from "./client.js";
import type { Grant, ProgramProgress, SubjectSnapshot } from "./types.js";

export interface LauncherOptions {
	/** Which program the bubble ring and compact panel highlight. Omit for the first active one. */
	programKey?: string;
	/** `auto` follows the host page's `prefers-color-scheme`, and keeps following it. */
	theme?: "light" | "dark" | "auto";
	/** Which corner to dock in. Default `bottom-right`. */
	position?: "bottom-right" | "bottom-left";
	/** Panel header title and the bubble's accessible name. Default `Your rewards`. */
	title?: string;
	/** Mount with the compact panel already open. Default `false`. */
	defaultOpen?: boolean;
	/**
	 * Brand color overrides. Base values apply in both themes; `light`/`dark`
	 * sub-objects refine per theme — one brand color rarely survives both
	 * grounds. The built-ins are WCAG-tuned; overriding moves that
	 * responsibility to you (hex pairs that measurably fail log a warning).
	 */
	colors?: WidgetColors;
	/**
	 * Stacking order for the floating UI. Default `2147482000` — high enough to
	 * clear most host chrome, low enough that a host that must sit above us can.
	 */
	zIndex?: number;
}

export interface LauncherHandle {
	/** Show the compact panel. */
	open(): void;
	/** Collapse everything back to the bubble. */
	close(): void;
	/** Show the maximized dashboard (stats, all programs, reward history). */
	expand(): void;
	/** Shrink the dashboard back to the compact panel. */
	collapse(): void;
	/** Re-fetch progress (and reward history, once it has been shown) and repaint. */
	refresh(): Promise<void>;
	/** Remove the launcher and release its listeners. Idempotent. */
	destroy(): void;
}

/**
 * Same shadow-root reasoning as the widget: the host page's CSS cannot reach
 * in, ours cannot leak out. The launcher additionally floats over the page, so
 * its position and z-index are set as inline styles on the host element —
 * inline wins over any page stylesheet short of `!important`, and a launcher
 * that a reset sheet can knock into the document flow is a support ticket.
 */
const STYLES = `
:host { all: initial; font-family: ui-sans-serif, system-ui, sans-serif; pointer-events: none; }
/* The container spans the panel's box even while the panel is hidden, and a
   transparent element still hit-tests — without this, the launcher is an
   invisible click-shield over the host page. Interactive pieces opt back in. */
.ak { --ak-fg: #111; --ak-muted: #666; --ak-bg: #fff; --ak-track: #eee; --ak-fill: #111;
      --ak-accent: #15803d; --ak-ring: #22c55e; color-scheme: light; pointer-events: none;
      display: flex; flex-direction: column; align-items: flex-end; gap: 12px; color: var(--ak-fg); }
/* --ak-accent sits on the panel (var(--ak-bg)); --ak-ring sits on the bubble
   (var(--ak-fill)), which is the *opposite* ground — one green cannot pass
   WCAG contrast on both. Measured: accent 5.0:1 / 10.8:1 on the panel,
   ring 8.3:1 / 4.6:1 on the bubble, light / dark. */
.ak[data-theme="dark"] { --ak-fg: #f5f5f5; --ak-muted: #999; --ak-bg: #111;
      --ak-track: #333; --ak-fill: #f5f5f5; --ak-accent: #4ade80; --ak-ring: #15803d; color-scheme: dark; }
.ak[data-position="bottom-left"] { align-items: flex-start; }

.ak-bubble { pointer-events: auto; position: relative; width: 56px; height: 56px; border-radius: 50%; border: 0; padding: 0;
      cursor: pointer; background: var(--ak-fill); color: var(--ak-bg); display: grid; place-items: center;
      box-shadow: 0 4px 16px rgba(0,0,0,.2); transition: transform .15s ease; }
.ak-bubble:hover { transform: scale(1.06); }
.ak-bubble:focus-visible { outline: 2px solid var(--ak-fill); outline-offset: 2px; }
.ak-ring { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.ak-dot { position: absolute; top: 1px; right: 1px; width: 12px; height: 12px; border-radius: 50%;
      background: var(--ak-ring); border: 2px solid var(--ak-bg); }
.ak-dot[hidden] { display: none; }

.ak-panel { width: min(340px, calc(100vw - 32px)); background: var(--ak-bg);
      border: 1px solid var(--ak-track); border-radius: 16px; overflow: hidden;
      max-height: calc(100vh - 128px); max-height: calc(100dvh - 128px);
      box-shadow: 0 12px 40px rgba(0,0,0,.18); display: flex; flex-direction: column;
      opacity: 0; transform: translateY(8px) scale(.98); visibility: hidden; pointer-events: none;
      transition: opacity .18s ease, transform .18s ease, width .2s ease, visibility 0s linear .18s; }
.ak[data-view="panel"] .ak-panel, .ak[data-view="dashboard"] .ak-panel {
      opacity: 1; transform: none; visibility: visible; pointer-events: auto; transition-delay: 0s; }
.ak[data-view="dashboard"] .ak-panel { width: min(400px, calc(100vw - 32px)); }

.ak-head { display: flex; align-items: center; gap: 4px; padding: 12px 12px 12px 16px;
      border-bottom: 1px solid var(--ak-track); }
.ak-title { font-size: 14px; font-weight: 700; margin: 0; flex: 1; overflow-wrap: anywhere; }
.ak-icon { border: 0; background: none; color: var(--ak-muted); cursor: pointer; padding: 5px;
      border-radius: 6px; display: grid; place-items: center; }
.ak-icon:hover { color: var(--ak-fg); background: var(--ak-track); }
.ak-icon:focus-visible { outline: 2px solid var(--ak-fg); outline-offset: 1px; }
.ak-icon[hidden] { display: none; }

/* min-height: 0 lets the body shrink inside the height-capped flex panel, so
   in a short viewport (landscape phone, keyboard up) the body scrolls and the
   header's Close/Minimize stay on screen instead of being pushed past the top. */
.ak-body { padding: 16px; display: grid; gap: 16px; overflow-y: auto; min-height: 0; }
.ak[data-view="dashboard"] .ak-body { max-height: min(65vh, 560px); }
.ak-dash { display: none; }
.ak[data-view="dashboard"] .ak-dash { display: grid; gap: 8px; }
.ak[data-view="dashboard"] .ak-solo { display: none; }

.ak-solo { display: grid; gap: 10px; }
.ak-h { font-size: 11px; font-weight: 700; color: var(--ak-muted); text-transform: uppercase;
      letter-spacing: .06em; margin: 0 0 2px; }
.ak-tiles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.ak-tile { border: 1px solid var(--ak-track); border-radius: 12px; padding: 10px; display: grid; gap: 2px; }
.ak-tile-n { font-size: 18px; font-weight: 700; }
.ak-tile-l { font-size: 10px; color: var(--ak-muted); text-transform: uppercase; letter-spacing: .04em; }

.ak-prog { display: grid; gap: 6px; padding: 10px 0; border-top: 1px solid var(--ak-track); }
.ak-prog:first-of-type { border-top: 0; padding-top: 2px; }
.ak-row { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.ak-name { font-size: 13px; font-weight: 600; margin: 0; overflow-wrap: anywhere; }
.ak-meta { font-size: 12px; color: var(--ak-muted); margin: 0; white-space: nowrap; }
.ak-track { height: 6px; border-radius: 999px; background: var(--ak-track); overflow: hidden; }
.ak-fill { height: 100%; background: var(--ak-fill); transition: width .3s ease; }
.ak-pill { justify-self: start; font-size: 11px; font-weight: 600; letter-spacing: .02em;
      color: var(--ak-accent); border: 1px solid var(--ak-accent); border-radius: 999px; padding: 3px 8px; }
.ak-pill[hidden] { display: none; }

.ak-grant { display: flex; justify-content: space-between; align-items: center; gap: 10px;
      padding: 9px 0; border-top: 1px solid var(--ak-track); }
.ak-grant:first-of-type { border-top: 0; padding-top: 2px; }
.ak-grant-label { font-size: 13px; font-weight: 600; margin: 0; overflow-wrap: anywhere; }
.ak-grant-sub { font-size: 11px; color: var(--ak-muted); margin: 2px 0 0; }
.ak-chip { font-size: 10px; font-weight: 600; color: var(--ak-muted); border: 1px solid var(--ak-track);
      border-radius: 999px; padding: 2px 8px; text-transform: capitalize; white-space: nowrap; }
.ak-chip[data-status="fulfilled"] { color: var(--ak-accent); border-color: var(--ak-accent); }
.ak-chip[data-status="revoked"] { text-decoration: line-through; }
.ak-empty { font-size: 12px; color: var(--ak-muted); margin: 0; }

.ak-foot { padding: 8px 16px; border-top: 1px solid var(--ak-track); font-size: 10px;
      color: var(--ak-muted); text-align: center; }

@media (prefers-reduced-motion: reduce) {
  .ak-bubble, .ak-panel, .ak-fill { transition: none; }
}
`;

/** Icon paths. Compile-time constants, drawn with `stroke: currentColor`. */
const ICON_EXPAND = "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7";
const ICON_COLLAPSE = "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7";
const ICON_CLOSE = "M18 6L6 18M6 6l12 12";
const STAR =
	"M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 7.1-1.01z";

const iconButton = (label: string, d: string): HTMLButtonElement => {
	const button = el("button", "ak-icon");
	button.type = "button";
	button.setAttribute("aria-label", label);
	const icon = svg("svg", {
		viewBox: "0 0 24 24",
		width: "15",
		height: "15",
		fill: "none",
		stroke: "currentColor",
		"stroke-width": "2",
		"stroke-linecap": "round",
		"stroke-linejoin": "round",
		"aria-hidden": "true",
	});
	icon.append(svg("path", { d }));
	button.append(icon);
	return button;
};

interface Bar {
	track: HTMLDivElement;
	fill: HTMLDivElement;
}

const makeBar = (): Bar => {
	const track = el("div", "ak-track");
	const fill = el("div", "ak-fill");
	fill.style.width = "0%";
	track.append(fill);
	return { track, fill };
};

const pctOf = (progress: ProgramProgress): number =>
	progress.target > 0 ? Math.min(progress.current / progress.target, 1) * 100 : 0;

const BAR_ARIA = ["role", "aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-label"] as const;

const setBar = (bar: Bar, progress: ProgramProgress): void => {
	bar.fill.style.width = `${pctOf(progress)}%`;
	bar.track.setAttribute("role", "progressbar");
	// Clamped like the visual fill: the contract does not forbid a server
	// reporting current > target, and valuenow outside min..max is invalid ARIA.
	bar.track.setAttribute(
		"aria-valuenow",
		String(Math.min(Math.max(progress.current, 0), progress.target)),
	);
	bar.track.setAttribute("aria-valuemin", "0");
	bar.track.setAttribute("aria-valuemax", String(progress.target));
	bar.track.setAttribute("aria-label", progress.program.name);
};

/** The empty state has no progressbar — stale ARIA would announce a program that is gone. */
const clearBar = (bar: Bar): void => {
	bar.fill.style.width = "0%";
	for (const attr of BAR_ARIA) bar.track.removeAttribute(attr);
};

const grantDate = (iso: string): string => {
	const date = new Date(iso);
	return Number.isFinite(date.getTime())
		? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
		: "";
};

/**
 * Mount the floating launcher: a corner bubble that opens into a compact
 * progress panel, which maximizes into a dashboard of the subject's stats —
 * every program's progress and the rewards they have earned.
 *
 * Appends itself to `document.body`; there is no target element because the
 * whole point is that the host page gives up no layout for it.
 *
 * Read-only, like everything in this package. The dashboard *reports* stats
 * and grants; it offers no claim button and no control that writes, for the
 * reasons documented on the client. It repaints on every successful
 * `client.progress()` — including ones the host page triggers itself — so
 * after your backend records an event, calling `client.progress()` is enough
 * to update the launcher.
 */
export function mountLauncher(
	client: ActiveKitClient,
	options: LauncherOptions = {},
): LauncherHandle {
	const position = options.position ?? "bottom-right";
	const title = options.title ?? "Your rewards";

	const host = el("div");
	// Inline, not :host rules — see the note on STYLES.
	host.style.position = "fixed";
	host.style.bottom = "20px";
	host.style[position === "bottom-left" ? "left" : "right"] = "20px";
	host.style.zIndex = String(options.zIndex ?? 2147482000);

	const shadow = host.attachShadow({ mode: "open" });
	const style = document.createElement("style");
	style.textContent = STYLES;

	const root = el("div", "ak");
	root.dataset["view"] = "closed";
	root.dataset["position"] = position;

	// --- bubble ------------------------------------------------------------
	const bubble = el("button", "ak-bubble");
	bubble.type = "button";
	bubble.setAttribute("aria-label", title);
	bubble.setAttribute("aria-haspopup", "dialog");
	bubble.setAttribute("aria-expanded", "false");

	const starIcon = svg("svg", {
		viewBox: "0 0 24 24",
		width: "22",
		height: "22",
		fill: "currentColor",
		"aria-hidden": "true",
	});
	starIcon.append(svg("path", { d: STAR }));

	const ring = svg("svg", { class: "ak-ring", viewBox: "0 0 36 36", "aria-hidden": "true" });
	const ringArc = svg("circle", {
		cx: "18",
		cy: "18",
		r: "15.9155",
		fill: "none",
		stroke: "var(--ak-ring)",
		"stroke-width": "2.5",
		"stroke-linecap": "round",
		"stroke-dasharray": "0 100",
		transform: "rotate(-90 18 18)",
	});
	ring.append(ringArc);

	const dot = el("span", "ak-dot");
	dot.hidden = true;

	bubble.append(starIcon, ring, dot);

	// --- panel -------------------------------------------------------------
	const panel = el("div", "ak-panel");
	panel.setAttribute("role", "dialog");
	panel.setAttribute("aria-label", title);
	panel.tabIndex = -1;

	const head = el("div", "ak-head");
	const heading = el("p", "ak-title", title);
	const expandButton = iconButton("Maximize", ICON_EXPAND);
	const collapseButton = iconButton("Minimize", ICON_COLLAPSE);
	collapseButton.hidden = true;
	const closeButton = iconButton("Close", ICON_CLOSE);
	head.append(heading, expandButton, collapseButton, closeButton);

	const body = el("div", "ak-body");

	// Compact view: the one highlighted program, same content as the inline widget.
	const solo = el("div", "ak-solo");
	const soloName = el("p", "ak-name", "Loading…");
	const soloBar = makeBar();
	const soloMeta = el("p", "ak-meta", "");
	const soloPill = el("span", "ak-pill", "Reward ready");
	soloPill.hidden = true;
	solo.append(soloName, soloBar.track, soloMeta, soloPill);

	// Dashboard: stat tiles, every program, reward history.
	const tilesSection = el("div", "ak-dash");
	const tiles = el("div", "ak-tiles");
	const tileValue = (label: string): HTMLParagraphElement => {
		const tile = el("div", "ak-tile");
		const value = el("p", "ak-tile-n", "–");
		value.style.margin = "0";
		const caption = el("p", "ak-tile-l", label);
		caption.style.margin = "0";
		tile.append(value, caption);
		tiles.append(tile);
		return value;
	};
	const earnedValue = tileValue("Rewards earned");
	const activeValue = tileValue("Active programs");
	const overallValue = tileValue("Overall progress");
	tilesSection.append(tiles);

	const programsSection = el("div", "ak-dash");
	const programsList = el("div");
	programsSection.append(el("p", "ak-h", "Programs"), programsList);

	const grantsSection = el("div", "ak-dash");
	const grantsList = el("div");
	grantsSection.append(el("p", "ak-h", "Reward history"), grantsList);

	body.append(solo, tilesSection, programsSection, grantsSection);

	const foot = el("div", "ak-foot", "Powered by ActiveKit");

	panel.append(head, body, foot);
	root.append(panel, bubble);
	shadow.append(style, root);
	// A <head> script without `defer` runs before <body> exists. The widget
	// path degrades gracefully in that placement; so must this one.
	const attach = (): void => {
		document.body.append(host);
	};
	if (document.body) attach();
	else document.addEventListener("DOMContentLoaded", attach, { once: true });

	// --- theme -------------------------------------------------------------
	const scheme = matchMedia("(prefers-color-scheme: dark)");
	const applyTheme = (): void => {
		const theme =
			options.theme === "light" || options.theme === "dark"
				? options.theme
				: scheme.matches
					? "dark"
					: "light";
		root.dataset["theme"] = theme;
		applyColors(root, options.colors, theme);
	};
	applyTheme();
	const followsScheme = options.theme === undefined || options.theme === "auto";
	if (followsScheme) scheme.addEventListener("change", applyTheme);

	// --- state and painting ------------------------------------------------
	let view: "closed" | "panel" | "dashboard" = "closed";
	let snapshot: SubjectSnapshot | null = null;
	let grants: Grant[] | null = null;
	let destroyed = false;

	const highlightOf = (s: SubjectSnapshot): ProgramProgress | undefined =>
		options.programKey
			? s.programs.find((p) => p.program.key === options.programKey)
			: s.programs.find((p) => p.program.status === "active");

	const paintSolo = (progress: ProgramProgress | undefined): void => {
		if (!progress) {
			soloName.textContent = "No active program";
			soloMeta.textContent = "";
			clearBar(soloBar);
			soloPill.hidden = true;
			return;
		}
		soloName.textContent = progress.program.name;
		soloMeta.textContent = `${progress.current} of ${progress.target}`;
		setBar(soloBar, progress);
		soloPill.hidden = !progress.eligible;
	};

	const paintStats = (): void => {
		earnedValue.textContent = grants === null ? "–" : String(grants.length);
		if (snapshot === null) return;
		const active = snapshot.programs.filter((p) => p.program.status === "active");
		activeValue.textContent = String(active.length);
		const overall =
			active.length === 0
				? 0
				: active.reduce((sum, p) => sum + pctOf(p), 0) / active.length;
		overallValue.textContent = `${Math.round(overall)}%`;
	};

	const paintPrograms = (s: SubjectSnapshot): void => {
		programsList.replaceChildren();
		if (s.programs.length === 0) {
			programsList.append(el("p", "ak-empty", "No programs yet."));
			return;
		}
		for (const progress of s.programs) {
			const row = el("div", "ak-prog");
			const header = el("div", "ak-row");
			header.append(
				el("p", "ak-name", progress.program.name),
				el("p", "ak-meta", `${progress.current} of ${progress.target}`),
			);
			const bar = makeBar();
			setBar(bar, progress);
			row.append(header, bar.track);
			if (progress.eligible) row.append(el("span", "ak-pill", "Reward ready"));
			programsList.append(row);
		}
	};

	const paintGrants = (): void => {
		grantsList.replaceChildren();
		if (grants === null) {
			grantsList.append(el("p", "ak-empty", "Loading…"));
			return;
		}
		if (grants.length === 0) {
			grantsList.append(el("p", "ak-empty", "Nothing earned yet — progress above turns into rewards here."));
			return;
		}
		for (const grant of grants) {
			const row = el("div", "ak-grant");
			const left = el("div");
			left.append(
				el("p", "ak-grant-label", grant.reward.label),
				el("p", "ak-grant-sub", grantDate(grant.createdAt)),
			);
			const chip = el("span", "ak-chip", grant.status);
			chip.dataset["status"] = grant.status;
			row.append(left, chip);
			grantsList.append(row);
		}
	};

	const paintSnapshot = (s: SubjectSnapshot): void => {
		snapshot = s;
		const highlight = highlightOf(s);
		paintSolo(highlight);
		ringArc.setAttribute("stroke-dasharray", `${highlight ? pctOf(highlight) : 0} 100`);
		dot.hidden = !s.programs.some((p) => p.eligible);
		paintPrograms(s);
		paintStats();
	};

	const paintUnavailable = (): void => {
		// Same stance as the widget: an error stack on a customer's page is worse
		// than a quiet "Unavailable". Callers who need detail call the client.
		soloName.textContent = "Unavailable";
		soloMeta.textContent = "";
		soloPill.hidden = true;
		programsList.replaceChildren(el("p", "ak-empty", "Unavailable right now."));
	};

	let grantsInflight: Promise<void> | null = null;
	const loadGrants = (): Promise<void> => {
		grantsInflight ??= (async () => {
			try {
				const fresh = await client.grants();
				if (destroyed) return;
				grants = fresh;
				paintGrants();
				paintStats();
			} catch {
				if (destroyed) return;
				grantsList.replaceChildren(el("p", "ak-empty", "Unavailable right now."));
			} finally {
				grantsInflight = null;
			}
		})();
		return grantsInflight;
	};

	// The launcher repaints on *every* successful progress() — its own and the
	// host page's. One subscription is the whole synchronization story; while
	// the dashboard is showing, that includes the reward history, so "one
	// progress() call keeps it current" stays true with the dashboard open.
	const unsubscribe = client.on("progress", (s) => {
		if (destroyed) return;
		paintSnapshot(s);
		if (view === "dashboard") void loadGrants();
	});

	const loadProgress = async (): Promise<void> => {
		try {
			await client.progress(); // the subscription above paints
		} catch {
			if (!destroyed) paintUnavailable();
		}
	};

	const setView = (next: "closed" | "panel" | "dashboard"): void => {
		view = next;
		root.dataset["view"] = next;
		bubble.setAttribute("aria-expanded", next === "closed" ? "false" : "true");
		expandButton.hidden = next === "dashboard";
		collapseButton.hidden = next !== "dashboard";
	};

	const open = (): void => {
		if (destroyed || view !== "closed") return;
		setView("panel");
		panel.focus({ preventScroll: true });
		void loadProgress();
	};

	const close = (): void => {
		if (destroyed || view === "closed") return;
		setView("closed");
	};

	const expand = (): void => {
		if (destroyed) return;
		setView("dashboard");
		void loadProgress();
		void loadGrants();
	};

	const collapse = (): void => {
		if (destroyed || view !== "dashboard") return;
		setView("panel");
	};

	bubble.addEventListener("click", () => {
		if (view === "closed") open();
		else close();
	});
	// The activated button hides when the view flips; a focused element going
	// display:none drops keyboard focus to <body>, ejecting the user from the
	// dialog. Hand focus to the counterpart before that happens.
	expandButton.addEventListener("click", () => {
		expand();
		collapseButton.focus();
	});
	collapseButton.addEventListener("click", () => {
		collapse();
		expandButton.focus();
	});
	closeButton.addEventListener("click", () => {
		close();
		bubble.focus();
	});

	// Escape belongs to the embed only when the keystroke happened inside it.
	// The panel is non-modal: a user dismissing their own autocomplete, IME
	// composition, or a host modal that already consumed the key must not have
	// this embed close itself — let alone steal their focus.
	const onKeydown = (event: KeyboardEvent): void => {
		if (event.key !== "Escape" || view === "closed") return;
		if (event.defaultPrevented || event.isComposing) return;
		if (!event.composedPath().includes(host)) return;
		close();
		bubble.focus();
	};
	window.addEventListener("keydown", onKeydown);

	void loadProgress();
	// No focus() here, unlike open(): nobody asked for focus at mount time, and
	// a third-party embed grabbing it on page load is focus theft.
	if (options.defaultOpen) setView("panel");

	return {
		open,
		close,
		expand,
		collapse,
		async refresh(): Promise<void> {
			const wantGrants = grants !== null || view === "dashboard";
			await Promise.all([loadProgress(), wantGrants ? loadGrants() : Promise.resolve()]);
		},
		destroy(): void {
			if (destroyed) return;
			destroyed = true;
			unsubscribe();
			window.removeEventListener("keydown", onKeydown);
			document.removeEventListener("DOMContentLoaded", attach);
			if (followsScheme) scheme.removeEventListener("change", applyTheme);
			host.remove();
		},
	};
}
