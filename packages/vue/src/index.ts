/**
 * Vue bindings.
 *
 * A wrapper, not a fork. Transport, retry, auth and rendering all live in
 * `@activekit/js`; everything here is lifecycle glue. If a bug is fixable in
 * this file, it was almost certainly filed against the wrong package.
 *
 * Plain `defineComponent` + `h()`, no SFC — nothing here a template would make
 * clearer, and skipping the Vue compiler lets this package build with the same
 * tsdown pipeline as the react binding.
 */
import {
	defineComponent,
	h,
	inject,
	onMounted,
	onUnmounted,
	provide,
	ref,
	shallowRef,
	watch,
} from "vue";
import type { App, InjectionKey, Plugin, PropType, Ref } from "vue";

import { mountWidget } from "@activekit/js";
import type {
	ActiveKitClient,
	Grant,
	MountOptions,
	ProgramProgress,
	SubjectSnapshot,
	WidgetHandle,
} from "@activekit/js";

const ActiveKitKey: InjectionKey<ActiveKitClient> = Symbol("activekit");

/**
 * App-wide client: `app.use(createActiveKit(client))`.
 *
 * Build the client once with `createClient(...)`, outside any component —
 * creating it per component remounts every widget that uses it.
 */
export function createActiveKit(client: ActiveKitClient): Plugin {
	return {
		install(app: App): void {
			app.provide(ActiveKitKey, client);
		},
	};
}

/** Subtree-scoped client, for when one part of the app needs its own. */
export function provideActiveKit(client: ActiveKitClient): void {
	provide(ActiveKitKey, client);
}

/** The client from the nearest provider. Throws if there isn't one. */
export function useActiveKit(): ActiveKitClient {
	const client = inject(ActiveKitKey, null);
	if (!client) {
		throw new Error(
			"useActiveKit: no ActiveKit client provided. " +
				"Call app.use(createActiveKit(client)) or provideActiveKit(client) in an ancestor.",
		);
	}
	return client;
}

export interface UseProgressResult {
	data: Ref<SubjectSnapshot | null>;
	error: Ref<Error | null>;
	loading: Ref<boolean>;
	refresh: () => Promise<void>;
}

/**
 * Subject progress, fetched on mount and whenever `refresh()` is called.
 *
 * The first fetch happens in `onMounted`, not during setup, so SSR never fires
 * a request on the server.
 *
 * Deliberately not a cache. Anyone already running TanStack Query or Pinia
 * Colada should call `client.progress()` inside their own query —
 * reimplementing invalidation here would only get it subtly wrong.
 */
export function useProgress(): UseProgressResult {
	const client = useActiveKit();
	const data = shallowRef<SubjectSnapshot | null>(null);
	const error = shallowRef<Error | null>(null);
	const loading = ref(true);

	// Guards against a slow first response landing after a fast second one, and
	// against writing refs after unmount.
	let generation = 0;

	const refresh = async (): Promise<void> => {
		const current = ++generation;
		loading.value = true;
		try {
			const snapshot = await client.progress();
			if (generation !== current) return;
			data.value = snapshot;
			error.value = null;
		} catch (caught) {
			if (generation !== current) return;
			error.value = caught instanceof Error ? caught : new Error(String(caught));
		} finally {
			if (generation === current) loading.value = false;
		}
	};

	onMounted(() => {
		void refresh();
	});
	onUnmounted(() => {
		// Bump the generation so any in-flight response is ignored.
		generation++;
	});

	return { data, error, loading, refresh };
}

/**
 * The progress widget.
 *
 * Renders an empty host element and lets `@activekit/js` own everything inside
 * it — the widget lives in a shadow root, so Vue never sees or patches its
 * internals. That is the point: one implementation of the UI, rendered
 * identically under every framework.
 *
 * `class` and `style` are not props; Vue's attribute fallthrough lands them on
 * the host element. Read-only, like everything else in this package — there is
 * no `onGrant`, because nothing here can issue a grant. Render your own button
 * and post to your own backend.
 */
export const ActiveKitWidget = defineComponent({
	name: "ActiveKitWidget",
	props: {
		/** Which program to render. Omit to render the first active one. */
		programKey: { type: String, required: false, default: undefined },
		/** `auto` follows the host page's `prefers-color-scheme`. */
		theme: {
			type: String as PropType<"light" | "dark" | "auto">,
			required: false,
			default: undefined,
		},
	},
	setup(props) {
		const client = useActiveKit();
		const host = ref<HTMLDivElement | null>(null);
		let handle: WidgetHandle | null = null;

		const remount = (): void => {
			handle?.destroy();
			handle = null;
			if (!host.value) return;
			handle = mountWidget(host.value, client, {
				...(props.programKey ? { programKey: props.programKey } : {}),
				...(props.theme ? { theme: props.theme } : {}),
			});
		};

		// `flush: "post"` runs after the DOM is patched, so the template ref is
		// attached by the time we mount — including on first render, where the
		// ref going null → element is itself the trigger. Rebuilding on any
		// change is cheap and correct for every parameter; diffing the params
		// would be the optimisation that introduces the bug.
		watch([host, () => props.programKey, () => props.theme], remount, {
			flush: "post",
		});

		onUnmounted(() => {
			handle?.destroy();
			handle = null;
		});

		return () => h("div", { ref: host });
	},
});

export type { ActiveKitClient, Grant, MountOptions, ProgramProgress, SubjectSnapshot };
