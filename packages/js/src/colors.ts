/**
 * Brand color overrides for the widget and the launcher.
 *
 * The shadow root seals the embed off from the host page's CSS on purpose, so
 * theming crosses the boundary the same way everything else does: as an
 * option. Values land as inline custom properties on the embed's root
 * element, which beat the stylesheet's defaults and nothing else.
 */

export interface WidgetColorTokens {
	/** Primary brand color: the bubble and every progress fill. */
	brand?: string;
	/** Reward color on the panel: the "Reward ready" pill and fulfilled chips. */
	accent?: string;
	/**
	 * The progress ring and reward dot, drawn on the *bubble* — the opposite
	 * ground from the panel, so one color rarely suits both. Defaults to
	 * `accent` when that is set, else the built-in.
	 */
	ring?: string;
	/** Panel background. */
	background?: string;
	/** Primary text. */
	foreground?: string;
	/** Secondary text. */
	muted?: string;
	/** Progress tracks, borders, dividers. */
	track?: string;
}

export interface WidgetColors extends WidgetColorTokens {
	/** Applied on top of the base values in the light theme only. */
	light?: WidgetColorTokens;
	/** Applied on top of the base values in the dark theme only. */
	dark?: WidgetColorTokens;
}

/** Order matters: `accent` seeds the ring, a later `ring` entry overrides it. */
const TOKENS: ReadonlyArray<[keyof WidgetColorTokens, readonly string[]]> = [
	["brand", ["--ak-fill"]],
	["accent", ["--ak-accent", "--ak-ring"]],
	["ring", ["--ak-ring"]],
	["background", ["--ak-bg"]],
	["foreground", ["--ak-fg"]],
	["muted", ["--ak-muted"]],
	["track", ["--ak-track"]],
];

/** The built-in palette, for filling in the unchanged side of a contrast pair. */
const DEFAULTS: Record<"light" | "dark", Required<WidgetColorTokens>> = {
	light: {
		brand: "#111111", accent: "#15803d", ring: "#22c55e",
		background: "#ffffff", foreground: "#111111", muted: "#666666", track: "#eeeeee",
	},
	dark: {
		brand: "#f5f5f5", accent: "#4ade80", ring: "#15803d",
		background: "#111111", foreground: "#f5f5f5", muted: "#999999", track: "#333333",
	},
};

/** WCAG relative luminance, hex colors only. Anything else returns null and skips the check. */
const hexLuminance = (color: string): number | null => {
	const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
	if (!match) return null;
	const hex =
		match[1]!.length === 3 ? [...match[1]!].map((c) => c + c).join("") : match[1]!;
	const channel = (offset: number): number => {
		const v = parseInt(hex.slice(offset, offset + 2), 16) / 255;
		return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
};

const contrast = (a: number, b: number): number =>
	(Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * The defaults are WCAG-tuned; an override moves that responsibility to the
 * caller. Warn — loudly enough to be seen in development, cheaply enough to
 * be harmless in production — when a supplied pair measurably fails. Hex
 * values only: parsing every CSS color space is not worth its bytes here.
 */
const warnContrast = (
	set: Partial<WidgetColorTokens>,
	theme: "light" | "dark",
): void => {
	const value = (name: keyof WidgetColorTokens): string =>
		set[name] ?? (name === "ring" ? (set.accent ?? DEFAULTS[theme][name]) : DEFAULTS[theme][name]);
	const pairs: ReadonlyArray<[keyof WidgetColorTokens, keyof WidgetColorTokens, number]> = [
		["foreground", "background", 4.5],
		["accent", "background", 4.5],
		["ring", "brand", 3],
	];
	for (const [fore, back, minimum] of pairs) {
		if (set[fore] === undefined && set[back] === undefined && !(fore === "ring" && set.accent !== undefined)) continue;
		const a = hexLuminance(value(fore));
		const b = hexLuminance(value(back));
		if (a === null || b === null) continue;
		const measured = contrast(a, b);
		if (measured >= minimum) continue;
		console.warn(
			`[ActiveKit] colors: ${fore} (${value(fore)}) on ${back} (${value(back)}) measures ` +
				`${measured.toFixed(2)}:1 in the ${theme} theme — below WCAG's ${minimum}:1.`,
		);
	}
};

/**
 * Resolve `colors` for `theme` and write them onto `target` as inline custom
 * properties, clearing any previous override first (theme switches re-apply).
 * Invalid values are ignored loudly — a typo'd brand color that silently
 * falls back reads as our rendering bug, not the caller's.
 */
export const applyColors = (
	target: HTMLElement,
	colors: WidgetColors | undefined,
	theme: "light" | "dark",
): void => {
	for (const [, properties] of TOKENS) {
		for (const property of properties) target.style.removeProperty(property);
	}
	if (!colors) return;

	const themed = colors[theme];
	const applied: Partial<WidgetColorTokens> = {};
	for (const [name, properties] of TOKENS) {
		const value = themed?.[name] ?? colors[name];
		if (value === undefined) continue;
		if (!CSS.supports("color", value)) {
			console.warn(`[ActiveKit] colors.${name}: ${JSON.stringify(value)} is not a valid CSS color — ignored.`);
			continue;
		}
		applied[name] = value;
		for (const property of properties) target.style.setProperty(property, value);
	}
	warnContrast(applied, theme);
};
