/**
 * Brand color overrides for the inline widget.
 *
 * The shadow root seals the embed off from the host page's CSS on purpose, so
 * theming crosses the boundary the same way everything else does: as an
 * option. Values land as inline custom properties on the embed's root
 * element, which beat the stylesheet's defaults and nothing else.
 *
 * The built-in defaults are the ActiveKit design system's values, transcribed
 * rather than imported: the embed inlines all its CSS and pays for every byte,
 * so it carries the handful of tokens it needs and nothing else. The design
 * system itself lives with the app that uses it, not in this repo.
 * Every default pair below is measured against WCAG 4.5:1 for text and 3:1
 * for graphics; the ratios are noted where a value was chosen for one.
 */

export interface WidgetColorTokens {
	/** Primary brand color: the bubble and every progress fill. */
	brand?: string;
	/**
	 * Icon and label color on top of `brand` fills (the bubble). The defaults
	 * are tuned for the built-in teal fills: white in the light theme, deep
	 * slate in the dark one. Override it when `brand` changes polarity.
	 */
	onBrand?: string;
	/** Reward color on the panel: the "Reward ready" pill and fulfilled chips. */
	accent?: string;
	/**
	 * The progress ring and reward dot, drawn on the *bubble* — the opposite
	 * ground from the panel, so one color rarely suits both. Defaults to
	 * `accent` when that is set, else the built-in.
	 */
	ring?: string;
	/** Panel and card background. Also the expanded view's content ground. */
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

/**
 * Order matters: `accent` seeds the ring, a later `ring` entry overrides it.
 * `brand` writes both gradient stops, so an override flattens the built-in
 * brand gradient to one color instead of mixing with half of ours.
 */
const TOKENS: ReadonlyArray<[keyof WidgetColorTokens, readonly string[]]> = [
	["brand", ["--ak-fill", "--ak-fill2"]],
	["onBrand", ["--ak-on-fill"]],
	["accent", ["--ak-accent", "--ak-ring"]],
	["ring", ["--ak-ring"]],
	["background", ["--ak-bg", "--ak-bg2"]],
	["foreground", ["--ak-fg"]],
	["muted", ["--ak-muted"]],
	["track", ["--ak-track"]],
];

/**
 * The built-in palette, for filling in the unchanged side of a contrast pair.
 * Light: ink #102033 and ink-mute #607087 on canvas #ffffff (16.45:1, 5.04:1),
 * primary-deep #087f7a as accent (4.85:1) and brand fill (white on it 4.85:1),
 * hairline #dbe6ef for tracks. Dark: the brand-dark slate ladder — panel
 * #0b1220 with white text (18.72:1) and the design system's white-alpha
 * convention for muted text and hairlines; primary-soft #15c6bc as brand and
 * accent (8.77:1 on the panel), with slate #0b1220 back on top of it (8.77:1).
 */
const DEFAULTS: Record<"light" | "dark", Required<WidgetColorTokens>> = {
	light: {
		brand: "#087f7a", onBrand: "#ffffff", accent: "#087f7a", ring: "#ffffff",
		background: "#ffffff", foreground: "#102033", muted: "#607087", track: "#dbe6ef",
	},
	dark: {
		brand: "#15c6bc", onBrand: "#0b1220", accent: "#15c6bc", ring: "#0b1220",
		background: "#0b1220", foreground: "#ffffff",
		muted: "rgba(255,255,255,.72)", track: "rgba(255,255,255,.14)",
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
	// Ring and onBrand sit at 3:1 — they carry graphics, never text.
	const pairs: ReadonlyArray<[keyof WidgetColorTokens, keyof WidgetColorTokens, number]> = [
		["foreground", "background", 4.5],
		["accent", "background", 4.5],
		["ring", "brand", 3],
		["onBrand", "brand", 3],
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
				`${measured.toFixed(2)}:1 in the ${theme} theme, below WCAG's ${minimum}:1.`,
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
			console.warn(`[ActiveKit] colors.${name}: ${JSON.stringify(value)} is not a valid CSS color, ignored.`);
			continue;
		}
		applied[name] = value;
		for (const property of properties) target.style.setProperty(property, value);
	}
	warnContrast(applied, theme);
};
