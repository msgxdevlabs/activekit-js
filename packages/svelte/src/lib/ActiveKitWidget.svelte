<script lang="ts">
	/**
	 * The progress widget.
	 *
	 * Renders an empty host element and hands it to `@activekit/js`, which owns
	 * everything inside — the widget lives in a shadow root, so Svelte never
	 * reconciles its internals. One implementation of the UI, identical under
	 * every framework.
	 *
	 * Read-only. There is no `onGrant` because nothing here can issue a grant:
	 * that is a write, and writes happen on your server.
	 */
	import { mountWidget } from "@activekit/js";
	import type { ActiveKitClient, MountOptions } from "@activekit/js";

	interface Props extends MountOptions {
		/** Build it once with `createClient(...)`, outside the component. */
		client: ActiveKitClient;
		class?: string;
	}

	let { client, programKey, theme, class: className = "" }: Props = $props();

	let host = $state<HTMLDivElement | undefined>();

	$effect(() => {
		if (!host) return;

		const handle = mountWidget(host, client, {
			...(programKey ? { programKey } : {}),
			...(theme ? { theme } : {}),
		});

		return () => handle.destroy();
	});
</script>

<div bind:this={host} class={className}></div>
