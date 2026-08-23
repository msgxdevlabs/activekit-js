<script lang="ts">
	/**
	 * The shell: a bubble in the corner that opens the ActiveKit app.
	 *
	 * Renders nothing. The shell appends itself to `document.body` and floats
	 * over the page, so there is no host element for Svelte to place — put this
	 * component anywhere and it will be in the corner.
	 *
	 * Drive it from your own UI by binding to the instance:
	 *
	 * ```svelte
	 * <ActiveKitShell bind:this={rewards} {client} label="Rewards" />
	 * <button onclick={() => rewards.open()}>Rewards</button>
	 * ```
	 *
	 * The token and API root come from the client. Everything with content in
	 * it is served from the app's own origin, which is why this file stays
	 * short no matter how large the product gets.
	 */
	import { mountShell } from "@activekit/js";
	import type { ActiveKitClient, ShellHandle, ShellOptions } from "@activekit/js";

	interface Props extends Omit<ShellOptions, "token" | "apiUrl"> {
		/** Build it once with `createClient(...)`, outside the component. */
		client: ActiveKitClient;
	}

	let {
		client,
		appUrl,
		position,
		theme,
		label,
		prefetch,
		pollInterval,
		colors,
		zIndex,
		onOpen,
		onClose,
		onError,
	}: Props = $props();

	let handle: ShellHandle | null = null;

	// Object-valued props are compared by identity, so an inline
	// `colors={{ brand: "#..." }}` would be a new object on every update and
	// remount the embed each time. Tracking the value keeps the inline form
	// behaving as meant.
	const colorsKey = $derived(colors ? JSON.stringify(colors) : "");

	$effect(() => {
		// Read every parameter so the effect re-runs when any of them changes.
		void colorsKey;
		const next = mountShell({
			token: client.token,
			apiUrl: client.apiUrl,
			...(appUrl ? { appUrl } : {}),
			...(position ? { position } : {}),
			...(theme ? { theme } : {}),
			...(label ? { label } : {}),
			...(prefetch ? { prefetch } : {}),
			...(pollInterval !== undefined ? { pollInterval } : {}),
			...(colors ? { colors } : {}),
			...(zIndex !== undefined ? { zIndex } : {}),
			// Read through the props rather than captured once: a caller passing
			// a new arrow function on each update should not rebuild the frame.
			onOpen: () => onOpen?.(),
			onClose: () => onClose?.(),
			onError: (error) => onError?.(error),
		});
		handle = next;

		return () => {
			next.destroy();
			handle = null;
		};
	});

	/** Open the app. */
	export async function open(): Promise<void> {
		await handle?.open();
	}
	/** Dismiss it. */
	export function close(): void {
		handle?.close();
	}
	/** Open if closed, close if open. */
	export function toggle(): void {
		handle?.toggle();
	}
	/** Re-check the unseen dot, and tell the app to re-fetch. */
	export async function refresh(): Promise<void> {
		await handle?.refresh();
	}
	/** Swap in a rotated subject token. */
	export function setToken(next: string): void {
		handle?.setToken(next);
	}
</script>
