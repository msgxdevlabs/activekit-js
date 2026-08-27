import { mountWidget } from "@activekit/js";
import type { ActiveKitClient, MountOptions } from "@activekit/js";

export interface ActiveKitActionParams extends MountOptions {
	client: ActiveKitClient;
}

/**
 * Mount the widget into an element you already have.
 *
 *   <div use:activekit={{ client, campaignKey: "daily-login" }}></div>
 *
 * The idiomatic Svelte answer to "attach a third-party thing to this node" —
 * useful when the surrounding markup is yours and only the widget is ours.
 */
export function activekit(node: HTMLElement, params: ActiveKitActionParams) {
	let handle = mountWidget(node, params.client, params);

	return {
		update(next: ActiveKitActionParams): void {
			// Cheap enough to rebuild, and correct for every parameter including a
			// swapped client. Diffing the params would be the optimization that
			// introduces the bug.
			handle.destroy();
			handle = mountWidget(node, next.client, next);
		},
		destroy(): void {
			handle.destroy();
		},
	};
}
