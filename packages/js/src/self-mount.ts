/**
 * The `data-*` contract for the inline widget's CDN build.
 *
 * The shell build reads its own, shorter set: it mounts an app rather than a
 * campaign card, so almost none of these apply to it.
 */
import { createClient } from "./client.js";
import type { ActiveKitClient } from "./client.js";
import type { WidgetColors } from "./colors.js";

export interface ScriptConfig {
	/** The client, already built from `data-token` and `data-api-url`. */
	client: ActiveKitClient;
	/** Options `mountWidget` accepts. */
	common: {
		campaignId?: string;
		label?: string;
		theme?: "light" | "dark" | "auto";
		colors?: WidgetColors;
	};
	/** The tag itself, for the attributes only one build cares about. */
	script: HTMLScriptElement;
}

/**
 * Read the current `<script>`'s configuration, or `null` when it carries no
 * `data-token` — the deliberate "I will mount it myself" path for pages that
 * fetch the token asynchronously.
 *
 * Must be called during the script's own synchronous execution, which is the
 * only time `document.currentScript` is the tag we mean.
 */
export const readScript = (): ScriptConfig | null => {
	const script = document.currentScript as HTMLScriptElement | null;
	const token = script?.dataset["token"];
	if (!script || !token) return null;

	const apiUrl = script.dataset["apiUrl"];
	const campaignId = script.dataset["campaign"];
	const label = script.dataset["label"];
	const theme = script.dataset["theme"] as "light" | "dark" | "auto" | undefined;

	// `data-brand-color` / `data-accent-color` cover the script tag's needs;
	// the full per-theme `colors` shape is for callers with code.
	const brand = script.dataset["brandColor"];
	const accent = script.dataset["accentColor"];
	const colors =
		brand || accent ? { ...(brand ? { brand } : {}), ...(accent ? { accent } : {}) } : undefined;

	return {
		client: createClient({ token, ...(apiUrl ? { apiUrl } : {}) }),
		common: {
			...(campaignId ? { campaignId } : {}),
			...(label ? { label } : {}),
			...(theme ? { theme } : {}),
			...(colors ? { colors } : {}),
		},
		script,
	};
};
