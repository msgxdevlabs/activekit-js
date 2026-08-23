/**
 * The `data-*` contract the two CDN builds share.
 *
 * Both script-tag builds read the same attributes off their own `<script>`;
 * only what they mount differs. Parsing lives here so the two entries cannot
 * drift apart — an attribute honored by one build and ignored by the other is
 * the kind of bug a customer reports as "the docs are wrong".
 */
import { createClient } from "./client.js";
import type { ActiveKitClient } from "./client.js";
import type { WidgetColors } from "./colors.js";

export interface ScriptConfig {
	/** The client, already built from `data-token` and `data-api-url`. */
	client: ActiveKitClient;
	/** Options both `mountWidget` and `mountLauncher` accept. */
	common: {
		campaignKey?: string;
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
	const campaignKey = script.dataset["campaign"];
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
			...(campaignKey ? { campaignKey } : {}),
			...(theme ? { theme } : {}),
			...(colors ? { colors } : {}),
		},
		script,
	};
};
