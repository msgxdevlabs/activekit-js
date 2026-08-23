<script lang="ts">
	/**
	 * The floating launcher.
	 *
	 * Renders nothing. The launcher appends itself to `document.body` and
	 * floats over the page, so there is no host element for Svelte to place —
	 * put this component anywhere and it will be in the corner.
	 *
	 * Drive it from your own UI by binding to the instance:
	 *
	 * ```svelte
	 * <ActiveKitLauncher bind:this={rewards} {client} campaignKey="daily-login" />
	 * <button onclick={() => rewards.expand()}>Rewards</button>
	 * ```
	 *
	 * Read-only. There is no `onGrant` because nothing here can issue a grant:
	 * that is a write, and writes happen on your server.
	 */
	import { mountLauncher } from "@activekit/js";
	import type { ActiveKitClient, LauncherHandle, LauncherOptions } from "@activekit/js";

	interface Props extends LauncherOptions {
		/** Build it once with `createClient(...)`, outside the component. */
		client: ActiveKitClient;
	}

	let {
		client,
		campaignKey,
		theme,
		position,
		title,
		subjectLabel,
		defaultOpen,
		colors,
		zIndex,
	}: Props = $props();

	let handle: LauncherHandle | null = null;

	// Object-valued props are compared by identity, so an inline
	// `colors={{ brand: "#..." }}` would be a new object on every update and
	// remount the embed each time. Tracking the value keeps the inline form
	// behaving as meant.
	const colorsKey = $derived(colors ? JSON.stringify(colors) : "");

	$effect(() => {
		// Read every parameter so the effect re-runs when any of them changes.
		void colorsKey;
		const next = mountLauncher(client, {
			...(campaignKey ? { campaignKey } : {}),
			...(theme ? { theme } : {}),
			...(position ? { position } : {}),
			...(title ? { title } : {}),
			...(subjectLabel ? { subjectLabel } : {}),
			...(defaultOpen ? { defaultOpen } : {}),
			...(colors ? { colors } : {}),
			...(zIndex !== undefined ? { zIndex } : {}),
		});
		handle = next;

		return () => {
			next.destroy();
			handle = null;
		};
	});

	/** Show the compact panel. */
	export function open(): void {
		handle?.open();
	}
	/** Collapse everything back to the bubble. */
	export function close(): void {
		handle?.close();
	}
	/** Open the expanded view. */
	export function expand(): void {
		handle?.expand();
	}
	/** Shrink the expanded view back to the compact panel. */
	export function collapse(): void {
		handle?.collapse();
	}
	/** Re-fetch and repaint. */
	export async function refresh(): Promise<void> {
		await handle?.refresh();
	}
</script>
