export { ActiveKitClient, createClient } from "./client.js";
export type { ActiveKitOptions } from "./client.js";

export { mountWidget } from "./widget.js";
export type { MountOptions, WidgetHandle } from "./widget.js";

export { mountShell } from "./shell.js";
export type { ShellColors, ShellHandle, ShellOptions } from "./shell.js";

export type { WidgetColors, WidgetColorTokens } from "./colors.js";

export { ActiveKitError } from "./types.js";
export type {
	ActiveKitEvents,
	Campaign,
	CampaignProgress,
	Grant,
	Reward,
	SubjectSnapshot,
} from "./types.js";
