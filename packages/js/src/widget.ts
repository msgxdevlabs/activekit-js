import { el } from "./dom.js";
import { applyColors } from "./colors.js";
import type { WidgetColors } from "./colors.js";
import type { ActiveKitClient } from "./client.js";
import type { CampaignProgress, CampaignSlot, SubjectSnapshot } from "./types.js";

export interface MountOptions {
	/** Which campaign to render, by its id. Omit to render the first live one. */
	campaignId?: string;
	/**
	 * Which slot of the customer's game to render from, when no `campaignId`
	 * names one exactly: the first live campaign filling that slot. `main` is
	 * the week's chain, `daily` today's objective, `side` a one-off and
	 * `event` a limited-time one. Ignored when `campaignId` is set.
	 *
	 * Without either, the card renders the first live campaign in the answer,
	 * which is a reasonable default for a page running one campaign and a
	 * coin toss for a page running a whole game.
	 */
	slot?: CampaignSlot;
	/**
	 * The card's title, overriding whatever the campaign carries.
	 *
	 * The platform sends a player-facing `title` per campaign, frozen into the
	 * published version, and that is what the card draws by default. It still
	 * never sends the operator's own campaign name. Pass this when the words
	 * on your page should win over the words in the dashboard; a campaign
	 * published before titles existed carries none, and the card says
	 * "Your progress".
	 */
	label?: string;
	/** `auto` follows the host page's `prefers-color-scheme`. */
	theme?: "light" | "dark" | "auto";
	/**
	 * Brand color overrides. The inline widget uses `brand`, `accent`,
	 * `background`, `foreground`, `muted` and `track`. The built-ins are
	 * WCAG-tuned; overriding moves that responsibility to you, and hex pairs
	 * that measurably fail log a console warning.
	 *
	 * This is the one embed that keeps colors as a mount option, because a card
	 * sitting inside someone's layout genuinely has to match it. The shell's
	 * app themes itself from the tenant's saved preset instead.
	 */
	colors?: WidgetColors;
}

export interface WidgetHandle {
	/** Re-fetch progress and repaint. */
	refresh(): Promise<void>;
	/** Remove the widget and release its listeners. Idempotent. */
	destroy(): void;
}

/**
 * Styles live inside a shadow root, so the host page's CSS cannot reach in and
 * ours cannot leak out. This is not politeness — an embed that inherits a
 * customer's `* { box-sizing }` or leaks a `button` rule is a support burden
 * that scales with every customer.
 *
 * Every value is the ActiveKit design system's, copied rather than imported
 * because the embed inlines its CSS and lives under a byte budget. Light
 * theme: ink `#102033` and ink-mute `#607087` on canvas white (16.45:1 and
 * 5.04:1), hairline `#dbe6ef`, the applied CTA ramp `#087f7a → #04605c` as
 * the progress fill, radius-card 12px, space-lg 16px padding. Dark theme:
 * the slate ladder — panel `#0b1220`, white text (18.72:1), white-alpha
 * hairlines (the system's documented exception on slate), and
 * `#15c6bc → #00a7a0` fills, the teal pair the system uses for dark-surface
 * accents (8.77:1 on the panel). Type: caption 13px at -0.39px tracking with
 * tabular figures on every number, per the brand's tnum rule. The font stays
 * the system stack — a third-party embed must not make the host page pay for
 * a font download.
 */
const STYLES = `
:host{all:initial;display:block;font-family:ui-sans-serif,system-ui,sans-serif}
.ak{--ak-fg:#102033;--ak-muted:#607087;--ak-bg:#fff;--ak-track:#dbe6ef;--ak-fill:#087f7a;--ak-fill2:#04605c;--ak-accent:#087f7a;
color:var(--ak-fg);background:var(--ak-bg);border-radius:12px;padding:16px;border:1px solid var(--ak-track);display:grid;gap:10px}
.ak[data-theme=dark]{--ak-fg:#fff;--ak-muted:rgba(255,255,255,.72);--ak-bg:#0b1220;--ak-track:rgba(255,255,255,.14);--ak-fill:#15c6bc;--ak-fill2:#00a7a0;--ak-accent:#15c6bc}
.ak-name{font-size:14px;font-weight:600;margin:0}
.ak-meta{font-size:13px;letter-spacing:-.39px;font-feature-settings:"tnum","zero";color:var(--ak-muted);margin:0}
.ak-track{height:6px;border-radius:9999px;background:var(--ak-track);overflow:hidden}
.ak-fill{height:100%;background:linear-gradient(135deg,var(--ak-fill),var(--ak-fill2));transition:width 320ms cubic-bezier(.2,0,0,1)}
.ak-pill{justify-self:start;font-size:11px;font-weight:600;color:var(--ak-accent);border:1px solid var(--ak-accent);border-radius:9999px;padding:3px 8px}
.ak-pill[hidden],.ak-track[hidden]{display:none}
@media (prefers-reduced-motion:reduce){.ak-fill{transition:none}}
`;

/**
 * Render the progress widget into `target`.
 *
 * Read-only, like the client behind it. The widget reports what the server
 * says and offers no control that writes — when a subject becomes eligible it
 * says so and stops there, because issuing the grant is the organization's
 * server's job. If you want a claim button, render your own and point it at
 * your own backend.
 *
 * Synchronous by design: it paints a loading state immediately and fills in
 * when the network answers, so the host page never has to await a layout.
 *
 * Which campaign it draws: `campaignId` when one is named, else the first live
 * campaign filling `slot`, else the first live one. What it calls that
 * campaign: `label` when the caller gives one, else the campaign's own frozen
 * title, else "Your progress".
 */
export function mountWidget(
	target: Element,
	client: ActiveKitClient,
	options: MountOptions = {},
): WidgetHandle {
	const host = el("div");
	const shadow = host.attachShadow({ mode: "open" });

	const style = document.createElement("style");
	style.textContent = STYLES;

	const root = el("div", "ak");
	const theme =
		options.theme === "auto" || options.theme === undefined
			? matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light"
			: options.theme;
	root.dataset["theme"] = theme;
	applyColors(root, options.colors, theme);

	const name = el("p", "ak-name", "Loading…");
	const meta = el("p", "ak-meta", "");
	const track = el("div", "ak-track");
	const fill = el("div", "ak-fill");
	const pill = el("span", "ak-pill", "Reward earned");
	pill.hidden = true;

	fill.style.width = "0%";
	track.append(fill);
	root.append(name, track, meta, pill);
	shadow.append(style, root);
	target.append(host);

	let destroyed = false;

	/**
	 * The first live campaign the options select: one named by id, else the
	 * first filling the named slot, else simply the first live one.
	 */
	const select = (snapshot: SubjectSnapshot): CampaignProgress | undefined =>
		options.campaignId
			? snapshot.campaigns.find((p) => p.id === options.campaignId)
			: snapshot.campaigns.find(
					(p) => p.status === "live" && (!options.slot || p.slot === options.slot),
				);

	const paint = (progress: CampaignProgress | undefined): void => {
		if (!progress) {
			// Nothing rather than a placeholder: a track drawn at zero reads as a
			// campaign nobody has started, which is a different and wronger thing
			// to say than that there is no campaign here.
			name.textContent = "No campaign to show";
			meta.textContent = "";
			track.hidden = true;
			pill.hidden = true;
			return;
		}
		track.hidden = false;
		const goal = progress.goal;
		const { achieved, target } = goal;
		// A checklist's bar reads the steps the meta line below counts, for the
		// reason that line gives: one goal cannot be allowed to draw two
		// different amounts of progress.
		const done = goal.kind === "checklist" ? goal.steps.filter((step) => step.done).length : achieved;
		const whole = goal.kind === "checklist" ? goal.steps.length : target;
		const pct = whole > 0 ? Math.min(done / whole, 1) * 100 : 0;
		const label = options.label ?? progress.title ?? "Your progress";
		name.textContent = label;
		// A checklist is a list of ticks rather than a quantity, so it says how
		// many of its steps are done. Counted off the steps themselves, so the
		// line and a list drawn from the same goal cannot disagree.
		meta.textContent = goal.kind === "checklist" ? `${done} of ${whole} done` : `${achieved} of ${target}`;
		fill.style.width = `${pct}%`;
		track.setAttribute("role", "progressbar");
		track.setAttribute("aria-valuenow", String(achieved));
		track.setAttribute("aria-valuemin", "0");
		track.setAttribute("aria-valuemax", String(target));
		track.setAttribute("aria-label", label);
		// A statement of fact, not a control. Nothing here can act on it. A
		// voided or reversed grant is a record, never a celebration, so the
		// pill stays hidden for those, and so is a reward of kind `none`: it
		// writes no grant row at all, which is what every daily objective and
		// every step of a main chain pays.
		const reward = progress.reward;
		const stands = reward.source !== "grant" || reward.status === "pending" || reward.status === "fulfilled";
		const pays = reward.reward.kind !== "none";
		pill.hidden = !(progress.completed && stands && pays);
	};

	const refresh = async (): Promise<void> => {
		try {
			const snapshot = await client.progress();
			if (destroyed) return;
			paint(select(snapshot));
		} catch {
			if (destroyed) return;
			// A widget that renders an error stack on a customer's landing page is
			// worse than one that renders nothing. Callers who need the detail can
			// call `client.progress()` themselves and catch it.
			name.textContent = "Unavailable";
			meta.textContent = "";
			track.hidden = true;
			pill.hidden = true;
		}
	};

	void refresh();

	return {
		refresh,
		destroy(): void {
			if (destroyed) return;
			destroyed = true;
			host.remove();
		},
	};
}
