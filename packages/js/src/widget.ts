import type { ActiveKitClient } from "./client.js";
import type { ProgramProgress } from "./types.js";

export interface MountOptions {
	/** Which program to render. Omit to render the first active one. */
	programKey?: string;
	/** `auto` follows the host page's `prefers-color-scheme`. */
	theme?: "light" | "dark" | "auto";
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
 */
const STYLES = `
:host { all: initial; display: block; font-family: ui-sans-serif, system-ui, sans-serif; }
.ak { --ak-fg: #111; --ak-muted: #666; --ak-bg: #fff; --ak-track: #eee; --ak-fill: #111;
      color: var(--ak-fg); background: var(--ak-bg); border-radius: 12px; padding: 16px;
      border: 1px solid var(--ak-track); display: grid; gap: 10px; }
.ak[data-theme="dark"] { --ak-fg: #f5f5f5; --ak-muted: #999; --ak-bg: #111;
      --ak-track: #333; --ak-fill: #f5f5f5; }
.ak-name { font-size: 14px; font-weight: 600; margin: 0; }
.ak-meta { font-size: 12px; color: var(--ak-muted); margin: 0; }
.ak-track { height: 6px; border-radius: 999px; background: var(--ak-track); overflow: hidden; }
.ak-fill { height: 100%; background: var(--ak-fill); transition: width .3s ease; }
.ak-pill { justify-self: start; font-size: 11px; font-weight: 600; letter-spacing: .02em;
      border: 1px solid var(--ak-fill); border-radius: 999px; padding: 3px 8px; }
.ak-pill[hidden] { display: none; }
@media (prefers-reduced-motion: reduce) { .ak-fill { transition: none; } }
`;

const el = <K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className?: string,
	text?: string,
): HTMLElementTagNameMap[K] => {
	const node = document.createElement(tag);
	if (className) node.className = className;
	// textContent, never innerHTML. Program names are organization-authored and
	// this runs on the organization's own page — but "trusted today" is how
	// stored XSS gets shipped.
	if (text !== undefined) node.textContent = text;
	return node;
};

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
	root.dataset["theme"] =
		options.theme === "auto" || options.theme === undefined
			? matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light"
			: options.theme;

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

	const paint = (progress: ProgramProgress | undefined): void => {
		if (!progress) {
			name.textContent = "No active program";
			meta.textContent = "";
			fill.style.width = "0%";
			pill.hidden = true;
			return;
		}
		const pct = progress.target > 0 ? Math.min(progress.current / progress.target, 1) * 100 : 0;
		name.textContent = progress.program.name;
		meta.textContent = `${progress.current} of ${progress.target}`;
		fill.style.width = `${pct}%`;
		track.setAttribute("role", "progressbar");
		track.setAttribute("aria-valuenow", String(progress.current));
		track.setAttribute("aria-valuemin", "0");
		track.setAttribute("aria-valuemax", String(progress.target));
		track.setAttribute("aria-label", progress.program.name);
		// A statement of fact, not a control. Nothing here can act on it.
		pill.hidden = !progress.eligible;
	};

	const refresh = async (): Promise<void> => {
		try {
			const snapshot = await client.progress();
			if (destroyed) return;
			paint(
				options.programKey
					? snapshot.programs.find((p) => p.program.key === options.programKey)
					: snapshot.programs.find((p) => p.program.status === "active"),
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
