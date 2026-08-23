/**
 * Svelte bindings.
 *
 * Three ways in, deliberately: a component for the common case, an action for
 * mounting into an element you already have, and a store for driving your own
 * markup. All three are thin — the client, the transport and the widget itself
 * live in `@activekit/js`.
 *
 * Svelte 5 only. Runes are the reason the component is eight lines.
 */
export { default as ActiveKitWidget } from "./ActiveKitWidget.svelte";
export { default as ActiveKitLauncher } from "./ActiveKitLauncher.svelte";
export { activekit } from "./action.js";
export type { ActiveKitActionParams } from "./action.js";
export { createProgressStore } from "./progress.js";
export type { ProgressState, ProgressStore } from "./progress.js";

export type {
	ActiveKitClient,
	Grant,
	LauncherHandle,
	LauncherOptions,
	MountOptions,
	CampaignProgress,
	SubjectSnapshot,
	WidgetColors,
} from "@activekit/js";
