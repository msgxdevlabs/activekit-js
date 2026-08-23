import { el, svg } from "./dom.js";
import { applyColors } from "./colors.js";
import type { WidgetColors } from "./colors.js";
import type { ActiveKitClient } from "./client.js";
import type { CampaignProgress, Grant, SubjectSnapshot } from "./types.js";

export interface LauncherOptions {
	/** Which campaign the bubble ring and compact panel highlight. Omit for the first active one. */
	campaignKey?: string;
	/** `auto` follows the host page's `prefers-color-scheme`, and keeps following it. */
	theme?: "light" | "dark" | "auto";
	/** Which corner to dock in. Default `bottom-right`. */
	position?: "bottom-right" | "bottom-left";
	/** Panel header title and the bubble's accessible name. Default `Your rewards`. */
	title?: string;
	/**
	 * Display name shown beside the avatar in the expanded view. The API never
	 * returns one — a subject is an ID — so pass the name your app already
	 * knows. Omitted, the expanded view shows the title and no initial.
	 */
	subjectLabel?: string;
	/** Mount with the compact panel already open. Default `false`. */
	defaultOpen?: boolean;
	/**
	 * Brand color overrides. Base values apply in both themes; `light`/`dark`
	 * sub-objects refine per theme — one brand color rarely survives both
	 * grounds. The built-ins are WCAG-tuned; overriding moves that
	 * responsibility to you (hex pairs that measurably fail log a warning).
	 * The expanded view's slate sidebar is ActiveKit chrome and keeps its
	 * colors in both themes.
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
	/** Open the expanded view: overview, every campaign, reward history. */
	expand(): void;
	/** Shrink the expanded view back to the compact panel. */
	collapse(): void;
	/** Re-fetch progress (and reward history, once it has been shown) and repaint. */
	refresh(): Promise<void>;
	/** Remove the launcher and release its listeners. Idempotent. */
	destroy(): void;
}

/*
 * Same shadow-root reasoning as the widget: the host page's CSS cannot reach
 * in, ours cannot leak out. The launcher additionally floats over the page, so
 * its position and z-index are set as inline styles on the host element —
 * inline wins over any page stylesheet short of `!important`, and a launcher
 * that a reset sheet can knock into the document flow is a support ticket.
 *
 * `.ak` keeps pointer-events off because the container spans the panel's box
 * even while the panel is hidden, and a transparent element still hit-tests —
 * without it the launcher is an invisible click-shield over the host page.
 * Interactive pieces opt back in.
 *
 * Every value is the ActiveKit design system's, copied not imported: the
 * embed inlines its CSS under a byte budget and must never bundle `design/`.
 * The mapping, so the next edit keeps faith with the tokens:
 *
 * - Light: ink #102033 and ink-mute #607087 on canvas #ffffff (16.45:1,
 *   5.04:1); canvas-soft #f7fbff as the expanded view's ground; hairline
 *   #dbe6ef for borders and tracks. Brand fill = the applied CTA ramp
 *   #087f7a → #04605c (--cta-gradient; white on the stops 4.85:1 and 7.41:1).
 *   Accent = primary-deep #087f7a (4.85:1 on white, 4.67:1 on canvas-soft).
 *   Ring and dot on the bubble: white (4.85:1 on the fill).
 * - Dark: the slate ladder — cards #0b1220 (brand-dark-900) on ground
 *   #080e1a (brand-dark-950), white text (18.72:1), white-alpha hairlines
 *   and muted text (the system's documented exception on slate; .72 reads
 *   9.95:1). Brand fill = #15c6bc → #00a7a0 (primary-soft → primary) with
 *   slate #0b1220 on top (8.77:1, 6.27:1). Accent = primary-soft (8.77:1).
 * - The expanded view's sidebar is the app shell's dark chrome in both
 *   themes: --sidebar-gradient (#17253d → #0b1220 46% → #080e1a) under
 *   --sidebar-glow, nav text at white .70/.92, --nav-active-gradient
 *   (teal .22 → purple .10) behind the active item with the --nav-active-bar
 *   (#15c6bc → #6b4cf6) beside it.
 * - The 3px rule across the modal top is --cta-gradient-bold
 *   (#087f7a → #0a6cb8 60% → #6b4cf6): the one bold ramp this view gets.
 * - Shadows: --elevation-modal under floating panels, --elevation-cta under
 *   the bubble, --elevation-1 under cards; scrim = --scrim-modal
 *   rgba(11,18,32,.55).
 * - Shape: radius-card 12px, radius-md 8px, radius-sm 6px, pills 9999px;
 *   spacing on the 8px scale; tracks at 6px (--progress-track-md).
 * - Motion: 120ms color transitions, 200ms panel enter with ease-standard
 *   cubic-bezier(.2,0,0,1), 320ms modal enter with ease-out
 *   cubic-bezier(.16,1,.3,1) matching the ak-modal-in keyframes, 320ms fills.
 * - Type: 15/600 panel titles, 18/600 the modal title (heading-sm), 14/600
 *   names, caption 13 at -0.39px and micro 11 for support text, micro-cap
 *   10/uppercase/+0.1px eyebrows, heading-lg 22/600/-0.22px stat values;
 *   tabular figures "tnum","zero" on every number. The font stays the system
 *   stack: a third-party embed must not make the host pay for a font download.
 */
const STYLES = `
:host{all:initial;font-family:ui-sans-serif,system-ui,sans-serif;pointer-events:none}
.ak{--ak-fg:#102033;--ak-muted:#607087;--ak-bg:#fff;--ak-bg2:#f7fbff;--ak-track:#dbe6ef;--ak-fill:#087f7a;--ak-fill2:#04605c;--ak-on-fill:#fff;--ak-accent:#087f7a;--ak-ring:#fff;color-scheme:light;pointer-events:none;display:flex;flex-direction:column;align-items:flex-end;gap:12px;color:var(--ak-fg)}
.ak[data-theme=dark]{--ak-fg:#fff;--ak-muted:rgba(255,255,255,.72);--ak-bg:#0b1220;--ak-bg2:#080e1a;--ak-track:rgba(255,255,255,.14);--ak-fill:#15c6bc;--ak-fill2:#00a7a0;--ak-on-fill:#0b1220;--ak-accent:#15c6bc;--ak-ring:#0b1220;color-scheme:dark}
.ak[data-position=bottom-left]{align-items:flex-start}
.ak-bubble{pointer-events:auto;position:relative;width:56px;height:56px;border-radius:9999px;border:0;padding:0;cursor:pointer;background:linear-gradient(135deg,var(--ak-fill),var(--ak-fill2));color:var(--ak-on-fill);display:grid;place-items:center;box-shadow:rgba(8,127,122,.22) 0 1px 2px,rgba(8,127,122,.16) 0 6px 16px;transition:transform 120ms ease}
.ak-bubble:hover{transform:scale(1.06)}
.ak-bubble:focus-visible{outline:2px solid var(--ak-fill);outline-offset:2px}
.ak-ring{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.ak-dot{position:absolute;top:1px;right:1px;width:12px;height:12px;border-radius:9999px;background:var(--ak-ring);border:2px solid var(--ak-bg)}
.ak-dot[hidden]{display:none}
.ak-panel{width:min(340px,calc(100vw - 32px));background:var(--ak-bg);border:1px solid var(--ak-track);border-radius:12px;overflow:hidden;max-height:calc(100vh - 128px);max-height:calc(100dvh - 128px);box-shadow:rgba(16,32,51,.18) 0 24px 60px,rgba(16,32,51,.1) 0 4px 12px;display:flex;flex-direction:column;opacity:0;transform:translateY(8px) scale(.98);visibility:hidden;pointer-events:none;transition:opacity 200ms cubic-bezier(.2,0,0,1),transform 200ms cubic-bezier(.2,0,0,1),visibility 0s linear 200ms}
.ak[data-view=panel] .ak-panel{opacity:1;transform:none;visibility:visible;pointer-events:auto;transition-delay:0s}
.ak-head{display:flex;align-items:center;gap:4px;padding:12px 12px 12px 16px;border-bottom:1px solid var(--ak-track)}
.ak-ttl{font-size:15px;font-weight:600;margin:0;flex:1;overflow-wrap:anywhere}
.ak-icon{border:0;background:none;color:var(--ak-muted);cursor:pointer;padding:5px;border-radius:6px;display:grid;place-items:center;transition:background 120ms ease,color 120ms ease}
.ak-icon:hover{color:var(--ak-fg);background:var(--ak-track)}
.ak-icon:focus-visible{outline:2px solid var(--ak-fg);outline-offset:1px}
.ak-body{padding:16px;display:grid;gap:10px;overflow-y:auto;min-height:0}
.ak-foot{padding:8px 16px;border-top:1px solid var(--ak-track);font-size:11px;color:var(--ak-muted);text-align:center}
.ak-name{font-size:14px;font-weight:600;margin:0;overflow-wrap:anywhere}
.ak-meta{font-size:13px;letter-spacing:-.39px;font-feature-settings:"tnum","zero";color:var(--ak-muted);margin:0;white-space:nowrap}
.ak-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.ak-track{height:6px;border-radius:9999px;background:var(--ak-track);overflow:hidden}
.ak-fill{height:100%;background:linear-gradient(135deg,var(--ak-fill),var(--ak-fill2));transition:width 320ms cubic-bezier(.2,0,0,1)}
.ak-pill{justify-self:start;font-size:11px;font-weight:600;color:var(--ak-accent);border:1px solid var(--ak-accent);border-radius:9999px;padding:3px 8px}
.ak-pill[hidden]{display:none}
.ak-chip{justify-self:start;font-size:10px;font-weight:600;letter-spacing:.1px;color:var(--ak-muted);border:1px solid var(--ak-track);border-radius:9999px;padding:2px 8px;text-transform:capitalize;white-space:nowrap}
.ak-chip[data-status=fulfilled]{color:var(--ak-accent);border-color:var(--ak-accent)}
.ak-chip[data-status=revoked]{text-decoration:line-through}
.ak-empty{font-size:13px;letter-spacing:-.39px;color:var(--ak-muted);margin:0}
.ak-solo{display:grid;gap:8px}
.ak-ovl{position:fixed;inset:0;background:rgba(11,18,32,.55);display:grid;place-items:center;padding:24px;opacity:0;visibility:hidden;pointer-events:none;transition:opacity 200ms ease,visibility 0s linear 200ms}
.ak[data-view=dashboard] .ak-ovl{opacity:1;visibility:visible;pointer-events:auto;transition-delay:0s}
.ak-mdl{position:relative;width:min(1120px,92vw);height:88vh;height:88dvh;max-height:100%;background:var(--ak-bg2);border-radius:12px;box-shadow:rgba(16,32,51,.18) 0 24px 60px,rgba(16,32,51,.1) 0 4px 12px;overflow:hidden;display:grid;grid-template-columns:248px 1fr}
.ak[data-view=dashboard] .ak-mdl{animation:mdl 320ms cubic-bezier(.16,1,.3,1)}
@keyframes mdl{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
.ak-mdl::after{content:"";position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(135deg,#087f7a 0%,#0a6cb8 60%,#6b4cf6 100%)}
.ak-sb{display:flex;flex-direction:column;gap:16px;padding:16px;background:linear-gradient(180deg,#17253d 0%,#0b1220 46%,#080e1a 100%);position:relative;min-width:0}
.ak-sb::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(120% 56% at 0% 0%,rgba(21,198,188,.26) 0%,rgba(107,76,246,.16) 46%,rgba(11,18,32,0) 78%)}
.ak-id{display:flex;align-items:center;gap:10px;position:relative}
.ak-ava{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;flex:none;background:linear-gradient(135deg,#15c6bc,#00a7a0);color:#0b1220;font-size:14px;font-weight:600}
.ak-who{font-size:14px;font-weight:600;color:#fff;margin:0;overflow-wrap:anywhere}
.ak-nav{display:grid;gap:4px;position:relative;align-content:start}
.ak-tab{position:relative;display:flex;align-items:center;gap:10px;border:0;background:none;color:rgba(255,255,255,.7);font:inherit;font-size:14px;font-weight:600;padding:10px 12px;border-radius:8px;cursor:pointer;text-align:left;white-space:nowrap;transition:background 120ms ease,color 120ms ease}
.ak-tab:hover{color:rgba(255,255,255,.92);background:linear-gradient(90deg,rgba(255,255,255,.09) 0%,rgba(255,255,255,.03) 100%)}
.ak-tab[aria-current]{color:#fff;background:linear-gradient(90deg,rgba(21,198,188,.22) 0%,rgba(107,76,246,.1) 100%)}
.ak-tab[aria-current]::before{content:"";position:absolute;left:0;top:8px;bottom:8px;width:3px;border-radius:9999px;background:linear-gradient(180deg,#15c6bc 0%,#6b4cf6 100%)}
.ak-tab:focus-visible{outline:2px solid #15c6bc;outline-offset:1px}
.ak-sb-foot{margin-top:auto;position:relative;font-size:11px;color:rgba(255,255,255,.72)}
.ak-main{display:flex;flex-direction:column;min-height:0;min-width:0}
.ak-mhead{display:flex;align-items:center;gap:4px;padding:12px 12px 12px 24px;border-bottom:1px solid var(--ak-track);background:var(--ak-bg)}
.ak-mttl{font-size:18px;font-weight:600;margin:0;flex:1;overflow-wrap:anywhere}
.ak-cnt{padding:24px;overflow-y:auto;min-height:0;display:grid;gap:24px;align-content:start;overscroll-behavior:contain}
.ak-sec{display:grid;gap:12px;align-content:start}
.ak-sec[hidden]{display:none}
.ak-h{font-size:10px;font-weight:600;letter-spacing:.1px;text-transform:uppercase;color:var(--ak-muted);margin:0}
.ak-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px}
.ak-card{background:var(--ak-bg);border:1px solid var(--ak-track);border-radius:12px;padding:16px;display:grid;gap:8px;align-content:start;box-shadow:rgba(31,63,94,.08) 0 1px 3px}
.ak-stat-n{font-size:22px;font-weight:600;letter-spacing:-.22px;font-feature-settings:"tnum","zero";margin:0}
.ak-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
.ak-earn{font-size:13px;letter-spacing:-.39px;font-feature-settings:"tnum","zero";color:var(--ak-accent);margin:0}
.ak-when{font-size:11px;color:var(--ak-muted);margin:0}
.ak-grant{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--ak-track)}
.ak-grant:first-of-type{border-top:0;padding-top:0}
.ak-grant:last-of-type{padding-bottom:0}
@media (max-width:720px){
.ak-mdl{grid-template-columns:1fr;grid-template-rows:auto 1fr}
.ak-sb{flex-direction:row;align-items:center;padding:10px 16px;overflow-x:auto}
.ak-nav{display:flex}
.ak-who,.ak-sb-foot{display:none}
.ak-cnt{padding:16px}
}
@media (prefers-reduced-motion:reduce){
.ak-bubble,.ak-panel,.ak-fill,.ak-ovl{transition:none}
.ak[data-view=dashboard] .ak-mdl{animation:none}
}
`;

/** Icon paths. Compile-time constants, drawn with `stroke: currentColor`. */
const ICON_EXPAND = "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7";
const ICON_COLLAPSE = "M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7";
const ICON_CLOSE = "M18 6L6 18M6 6l12 12";
const ICON_GRID = "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z";
const ICON_FLAG = "M4 21V4m0 1h13l-2.5 4L17 13H4";
const ICON_AWARD = "M12 14a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm-3.5-1L7 22l5-3 5 3-1.5-9";
const STAR =
	"M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 7.1-1.01z";

const strokeSvg = (size: string, d: string): SVGElement => {
	const icon = svg("svg", {
		viewBox: "0 0 24 24",
		width: size,
		height: size,
		fill: "none",
		stroke: "currentColor",
		"stroke-width": "2",
		"stroke-linecap": "round",
		"stroke-linejoin": "round",
		"aria-hidden": "true",
	});
	icon.append(svg("path", { d }));
	return icon;
};

const iconButton = (label: string, d: string): HTMLButtonElement => {
	const button = el("button", "ak-icon");
	button.type = "button";
	button.setAttribute("aria-label", label);
	button.append(strokeSvg("15", d));
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

const pctOf = (progress: CampaignProgress): number =>
	progress.target > 0 ? Math.min(progress.current / progress.target, 1) * 100 : 0;

const BAR_ARIA = ["role", "aria-valuenow", "aria-valuemin", "aria-valuemax", "aria-label"] as const;

const setBar = (bar: Bar, progress: CampaignProgress): void => {
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
	bar.track.setAttribute("aria-label", progress.campaign.name);
};

/** The empty state has no progressbar — stale ARIA would announce a campaign that is gone. */
const clearBar = (bar: Bar): void => {
	bar.fill.style.width = "0%";
	for (const attr of BAR_ARIA) bar.track.removeAttribute(attr);
};

const fmtDate = (iso: string): string => {
	const date = new Date(iso);
	return Number.isFinite(date.getTime())
		? date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
		: "";
};

const UNAVAILABLE = "Unavailable right now.";

/**
 * Mount the floating launcher: a corner bubble that opens into a compact
 * progress panel, which expands into a centered modal — an overview of the
 * subject's stats, every campaign's progress with what completing it earns,
 * and the rewards they have earned — with the host page dimmed but visible
 * around it.
 *
 * Appends itself to `document.body`; there is no target element because the
 * whole point is that the host page gives up no layout for it.
 *
 * Read-only, like everything in this package. The expanded view *reports*
 * stats and grants; it offers no claim button and no control that writes, for
 * the reasons documented on the client. It repaints on every successful
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

	// --- compact panel -----------------------------------------------------
	const panel = el("div", "ak-panel");
	panel.setAttribute("role", "dialog");
	panel.setAttribute("aria-label", title);
	panel.tabIndex = -1;

	const head = el("div", "ak-head");
	const heading = el("p", "ak-ttl", title);
	const expandButton = iconButton("Maximize", ICON_EXPAND);
	const closeButton = iconButton("Close", ICON_CLOSE);
	head.append(heading, expandButton, closeButton);

	// Compact view: the one highlighted campaign, same content as the inline widget.
	const body = el("div", "ak-body");
	const solo = el("div", "ak-solo");
	const soloName = el("p", "ak-name", "Loading…");
	const soloBar = makeBar();
	const soloMeta = el("p", "ak-meta", "");
	const soloPill = el("span", "ak-pill", "Reward ready");
	soloPill.hidden = true;
	solo.append(soloName, soloBar.track, soloMeta, soloPill);
	body.append(solo);

	panel.append(head, body, el("div", "ak-foot", "Powered by ActiveKit"));

	// --- expanded view: scrim, modal, slate sidebar, three sections --------
	const overlay = el("div", "ak-ovl");
	const modal = el("div", "ak-mdl");
	modal.setAttribute("role", "dialog");
	modal.setAttribute("aria-modal", "true");
	modal.setAttribute("aria-label", title);
	modal.tabIndex = -1;

	const sidebar = el("div", "ak-sb");
	const identity = el("div", "ak-id");
	const avatar = el("span", "ak-ava");
	if (options.subjectLabel) avatar.textContent = options.subjectLabel.trim().charAt(0).toUpperCase();
	else avatar.append(strokeSvg("14", STAR));
	identity.append(avatar, el("p", "ak-who", options.subjectLabel ?? title));

	const nav = el("div", "ak-nav");
	nav.setAttribute("aria-label", "Sections");
	const content = el("div", "ak-cnt");
	const sections: HTMLDivElement[] = [];
	const tabs: HTMLButtonElement[] = [];
	const addSection = (label: string, icon: string): HTMLDivElement => {
		const section = el("div", "ak-sec");
		section.setAttribute("aria-label", label);
		section.hidden = sections.length > 0;
		sections.push(section);
		content.append(section);

		const tab = el("button", "ak-tab");
		tab.type = "button";
		tab.append(strokeSvg("16", icon), document.createTextNode(label));
		if (tabs.length === 0) tab.setAttribute("aria-current", "true");
		tab.addEventListener("click", () => {
			for (const other of tabs) other.removeAttribute("aria-current");
			tab.setAttribute("aria-current", "true");
			for (const other of sections) other.hidden = other !== section;
		});
		tabs.push(tab);
		nav.append(tab);
		return section;
	};
	const secOverview = addSection("Overview", ICON_GRID);
	const secCampaigns = addSection("Campaigns", ICON_FLAG);
	const secRewards = addSection("Rewards", ICON_AWARD);

	const sbFoot = el("div", "ak-sb-foot", "Powered by ActiveKit");
	sidebar.append(identity, nav, sbFoot);

	const main = el("div", "ak-main");
	const mainHead = el("div", "ak-mhead");
	const collapseButton = iconButton("Minimize", ICON_COLLAPSE);
	const modalCloseButton = iconButton("Close", ICON_CLOSE);
	mainHead.append(el("p", "ak-mttl", title), collapseButton, modalCloseButton);
	main.append(mainHead, content);
	modal.append(sidebar, main);
	overlay.append(modal);

	// Overview: stat values, the nearest goal, and the active-campaign grid.
	const stats = el("div", "ak-stats");
	const statValue = (label: string): HTMLParagraphElement => {
		const card = el("div", "ak-card");
		const value = el("p", "ak-stat-n", "–");
		card.append(value, el("p", "ak-h", label));
		stats.append(card);
		return value;
	};
	const earnedValue = statValue("Rewards earned");
	const activeValue = statValue("Active campaigns");
	const doneValue = statValue("Completions");

	const goalCard = el("div", "ak-card");
	const goalRow = el("div", "ak-row");
	const goalName = el("p", "ak-name");
	const goalMeta = el("p", "ak-meta");
	goalRow.append(goalName, goalMeta);
	const goalBar = makeBar();
	goalCard.append(el("p", "ak-h", "Next goal"), goalRow, goalBar.track);
	goalCard.hidden = true;

	const overviewGrid = el("div", "ak-grid");
	secOverview.append(stats, goalCard, el("p", "ak-h", "Active campaigns"), overviewGrid);

	// Campaigns: every campaign, whatever its status.
	const campaignsList = el("div", "ak-grid");
	secCampaigns.append(el("p", "ak-h", "All campaigns"), campaignsList);

	// Rewards: the grant history.
	const grantsCard = el("div", "ak-card");
	secRewards.append(el("p", "ak-h", "Reward history"), grantsCard);

	root.append(panel, bubble, overlay);
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

	const highlightOf = (s: SubjectSnapshot): CampaignProgress | undefined =>
		options.campaignKey
			? s.campaigns.find((p) => p.campaign.key === options.campaignKey)
			: s.campaigns.find((p) => p.campaign.status === "active");

	const paintSolo = (progress: CampaignProgress | undefined): void => {
		if (!progress) {
			soloName.textContent = "No active campaign";
			soloMeta.textContent = "";
			clearBar(soloBar);
			soloPill.hidden = true;
			return;
		}
		soloName.textContent = progress.campaign.name;
		soloMeta.textContent = `${progress.current} of ${progress.target}`;
		setBar(soloBar, progress);
		soloPill.hidden = !progress.eligible;
	};

	const paintStats = (): void => {
		// Revoked grants are history, not earnings — counting them would inflate
		// the number the subject cares about.
		earnedValue.textContent =
			grants === null ? "–" : String(grants.filter((g) => g.status !== "revoked").length);
		if (snapshot === null) return;
		activeValue.textContent = String(
			snapshot.campaigns.filter((p) => p.campaign.status === "active").length,
		);
		doneValue.textContent = String(snapshot.campaigns.filter((p) => p.completedAt).length);
	};

	/** The incomplete active campaign closest to its target. */
	const paintGoal = (s: SubjectSnapshot): void => {
		const open = s.campaigns
			.filter(
				(p) =>
					p.campaign.status === "active" && !p.completedAt && p.target > 0 && p.current < p.target,
			)
			.sort((a, b) => pctOf(b) - pctOf(a));
		const next = open[0];
		goalCard.hidden = !next;
		if (!next) return;
		goalName.textContent = next.campaign.name;
		goalMeta.textContent = `${next.current} of ${next.target}`;
		setBar(goalBar, next);
	};

	const campaignCard = (progress: CampaignProgress, withStatus: boolean): HTMLDivElement => {
		const card = el("div", "ak-card");
		const header = el("div", "ak-row");
		header.append(
			el("p", "ak-name", progress.campaign.name),
			el("p", "ak-meta", `${progress.current} of ${progress.target}`),
		);
		const bar = makeBar();
		setBar(bar, progress);
		card.append(header, bar.track);
		// The reward preview is optional in the contract; when the API omits it
		// the card says less instead of guessing.
		if (progress.reward?.label) card.append(el("p", "ak-earn", `Earns ${progress.reward.label}`));
		if (progress.eligible) card.append(el("span", "ak-pill", "Reward ready"));
		else if (progress.completedAt)
			card.append(el("p", "ak-when", `Completed ${fmtDate(progress.completedAt)}`));
		if (withStatus && progress.campaign.status !== "active") {
			card.append(el("span", "ak-chip", progress.campaign.status));
		}
		return card;
	};

	const paintCampaigns = (s: SubjectSnapshot): void => {
		const active = s.campaigns.filter((p) => p.campaign.status === "active");
		overviewGrid.replaceChildren(
			...(active.length > 0
				? active.map((p) => campaignCard(p, false))
				: [el("p", "ak-empty", "No active campaigns.")]),
		);
		campaignsList.replaceChildren(
			...(s.campaigns.length > 0
				? s.campaigns.map((p) => campaignCard(p, true))
				: [el("p", "ak-empty", "No campaigns yet.")]),
		);
	};

	const paintGrants = (): void => {
		if (grants === null) {
			grantsCard.replaceChildren(el("p", "ak-empty", "Loading…"));
			return;
		}
		if (grants.length === 0) {
			grantsCard.replaceChildren(
				el("p", "ak-empty", "Nothing earned yet. Campaign progress turns into rewards here."),
			);
			return;
		}
		const names = new Map(snapshot?.campaigns.map((p) => [p.campaign.id, p.campaign.name]));
		grantsCard.replaceChildren(
			...grants.map((grant) => {
				const row = el("div", "ak-grant");
				const left = el("div");
				const name = names.get(grant.campaignId);
				const when = fmtDate(grant.createdAt);
				left.append(
					el("p", "ak-name", grant.reward.label),
					el("p", "ak-when", name ? `${when} · ${name}` : when),
				);
				const chip = el("span", "ak-chip", grant.status);
				chip.dataset["status"] = grant.status;
				row.append(left, chip);
				return row;
			}),
		);
	};

	const paintSnapshot = (s: SubjectSnapshot): void => {
		snapshot = s;
		const highlight = highlightOf(s);
		paintSolo(highlight);
		ringArc.setAttribute("stroke-dasharray", `${highlight ? pctOf(highlight) : 0} 100`);
		dot.hidden = !s.campaigns.some((p) => p.eligible);
		paintGoal(s);
		paintCampaigns(s);
		paintStats();
		// Grants may have painted before the snapshot could name their campaigns.
		if (grants !== null) paintGrants();
	};

	const paintUnavailable = (): void => {
		// Same stance as the widget: an error stack on a customer's page is worse
		// than a quiet "Unavailable". Callers who need detail call the client.
		soloName.textContent = "Unavailable";
		soloMeta.textContent = "";
		soloPill.hidden = true;
		goalCard.hidden = true;
		overviewGrid.replaceChildren(el("p", "ak-empty", UNAVAILABLE));
		campaignsList.replaceChildren(el("p", "ak-empty", UNAVAILABLE));
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
				grantsCard.replaceChildren(el("p", "ak-empty", UNAVAILABLE));
			} finally {
				grantsInflight = null;
			}
		})();
		return grantsInflight;
	};

	// The launcher repaints on *every* successful progress() — its own and the
	// host page's. One subscription is the whole synchronization story; while
	// the expanded view is showing, that includes the reward history, so "one
	// progress() call keeps it current" stays true with the modal open.
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
		modal.focus({ preventScroll: true });
		void loadProgress();
		void loadGrants();
	};

	const collapse = (): void => {
		if (destroyed || view !== "dashboard") return;
		setView("panel");
		panel.focus({ preventScroll: true });
	};

	bubble.addEventListener("click", () => {
		if (view === "closed") open();
		else close();
	});
	expandButton.addEventListener("click", expand);
	collapseButton.addEventListener("click", collapse);
	const closeToBubble = (): void => {
		close();
		bubble.focus();
	};
	closeButton.addEventListener("click", closeToBubble);
	modalCloseButton.addEventListener("click", closeToBubble);
	// The scrim is part of the modal surface: clicking past the panel closes it.
	overlay.addEventListener("click", (event) => {
		if (event.target === overlay) closeToBubble();
	});

	// While the expanded view is up it is modal: Tab cycles inside it (every
	// interactive element in it is a <button>), and focus that lands outside —
	// the scrim, the host page — is pulled back in rather than left behind a
	// dimmed page.
	const trapTab = (event: KeyboardEvent): void => {
		const buttons = [...modal.querySelectorAll<HTMLButtonElement>("button")];
		const first = buttons[0];
		const last = buttons[buttons.length - 1];
		if (!first || !last) return;
		const active = shadow.activeElement;
		const inside = active instanceof HTMLElement && modal.contains(active);
		if (event.shiftKey ? active === first || !inside : active === last || !inside) {
			event.preventDefault();
			(event.shiftKey ? last : first).focus();
		}
	};

	// Escape belongs to the embed only when the keystroke happened inside it —
	// except while the expanded view is open, when the viewport is modal and
	// Escape closes it from anywhere. A user dismissing their own autocomplete,
	// IME composition, or a host modal that already consumed the key must not
	// have the *compact* panel close itself, let alone steal their focus.
	const onKeydown = (event: KeyboardEvent): void => {
		if (view === "dashboard" && event.key === "Tab") {
			trapTab(event);
			return;
		}
		if (event.key !== "Escape" || view === "closed") return;
		if (event.defaultPrevented || event.isComposing) return;
		if (view !== "dashboard" && !event.composedPath().includes(host)) return;
		closeToBubble();
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
