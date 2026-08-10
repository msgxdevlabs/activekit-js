<script lang="ts">
	/**
	 * The progress widget.
	 *
	 * Renders an empty host element and hands it to `@activekit/js`, which owns
	 * everything inside — the widget lives in a shadow root, so Svelte never
	 * reconciles its internals. One implementation of the UI, identical under
	 * every framework.
	 */
	import { mountWidget } from "@activekit/js";
	import type { ActiveKitClient, MountOptions } from "@activekit/js";

	interface Props extends MountOptions {
		/** Build it once with `createClient(...)`, outside the component. */
		client: ActiveKitClient;
		class?: string;
	}

	let { client, programKey, theme, onGrant, class: className = "" }: Props = $props();

	let host = $state<HTMLDivElement | undefined>();

	$effect(() => {
		if (!host) return;

		const handle = mountWidget(host, client, {
			...(programKey ? { programKey } : {}),
			...(theme ? { theme } : {}),
			...(onGrant ? { onGrant } : {}),
		});

		return () => handle.destroy();
	});
</script>

<div bind:this={host} class={className}></div>
