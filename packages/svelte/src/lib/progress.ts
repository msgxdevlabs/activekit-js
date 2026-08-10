import { writable } from "svelte/store";
import type { Readable } from "svelte/store";

import type { ActiveKitClient, SubjectSnapshot } from "@activekit/js";

export interface ProgressState {
	data: SubjectSnapshot | null;
	error: Error | null;
	loading: boolean;
}

export interface ProgressStore extends Readable<ProgressState> {
	/** Re-fetch. Resolves when the store has settled. */
	refresh(): Promise<void>;
}

/**
 * A store of the subject's progress, for driving your own markup instead of
 * the packaged widget.
 *
 * Fetches on first subscription rather than on creation, so a store built at
 * module scope in SSR does not fire a request on the server.
 */
export function createProgressStore(client: ActiveKitClient): ProgressStore {
	const initial: ProgressState = { data: null, error: null, loading: true };
	let generation = 0;

	const refresh = async (): Promise<void> => {
		const current = ++generation;
		store.update((state) => ({ ...state, loading: true }));
		try {
			const data = await client.progress();
			// A slow first response must not overwrite a fast second one.
			if (generation !== current) return;
			store.set({ data, error: null, loading: false });
		} catch (caught) {
			if (generation !== current) return;
			store.set({
				data: null,
				error: caught instanceof Error ? caught : new Error(String(caught)),
				loading: false,
			});
		}
	};

	const store = writable<ProgressState>(initial, () => {
		void refresh();
		return () => {
			// Last subscriber gone: invalidate anything in flight.
			generation++;
		};
	});

	return { subscribe: store.subscribe, refresh };
}
