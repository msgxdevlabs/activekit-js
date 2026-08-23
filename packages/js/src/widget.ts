import { el } from "./dom.js";
import { applyColors } from "./colors.js";
import type { WidgetColors } from "./colors.js";
import type { ActiveKitClient } from "./client.js";
import type { CampaignProgress } from "./types.js";

export interface MountOptions {
	/** Which campaign to render. Omit to render the first active one. */
	campaignKey?: string;
	/** `auto` follows the host page's `prefers-color-scheme`. */
	theme?: "light" | "dark" | "auto";
	/**
	 * Brand color overrides — same shape and same contrast caveat as the
	 * launcher's. The inline widget uses `brand`, `accent`, `background`,
	 * `foreground`, `muted` and `track`; `ring` and `onBrand` only paint
	 * launcher surfaces.
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
.ak-pill[hidden]{display:none}
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
	const pill = el("span", "ak-pill", "Reward ready");
	pill.hidden = true;

	fill.style.width = "0%";
	track.append(fill);
	root.append(name, track, meta, pill);
	shadow.append(style, root);
	target.append(host);

	let destroyed = false;

	const paint = (progress: CampaignProgress | undefined): void => {
		if (!progress) {
			name.textContent = "No active campaign";
			meta.textContent = "";
			fill.style.width = "0%";
			pill.hidden = true;
			return;
		}
		const pct = progress.target > 0 ? Math.min(progress.current / progress.target, 1) * 100 : 0;
		name.textContent = progress.campaign.name;
		meta.textContent = `${progress.current} of ${progress.target}`;
		fill.style.width = `${pct}%`;
		track.setAttribute("role", "progressbar");
		track.setAttribute("aria-valuenow", String(progress.current));
		track.setAttribute("aria-valuemin", "0");
		track.setAttribute("aria-valuemax", String(progress.target));
		track.setAttribute("aria-label", progress.campaign.name);
		// A statement of fact, not a control. Nothing here can act on it.
		pill.hidden = !progress.eligible;
	};

	const refresh = async (): Promise<void> => {
		try {
			const snapshot = await client.progress();
			if (destroyed) return;
			paint(
				options.campaignKey
					? snapshot.campaigns.find((p) => p.campaign.key === options.campaignKey)
					: snapshot.campaigns.find((p) => p.campaign.status === "active"),
			);
		} catch {
			if (destroyed) return;
			// A widget that renders an error stack on a customer's landing page is
			// worse than one that renders nothing. Callers who need the detail can
			// call `client.progress()` themselves and catch it.
			name.textContent = "Unavailable";
			meta.textContent = "";
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
