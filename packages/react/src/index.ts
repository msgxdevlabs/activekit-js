"use client";

/**
 * React bindings.
 *
 * A wrapper, not a fork. Transport, retry, auth and rendering all live in
 * `@activekit/js`; everything here is lifecycle glue. If a bug is fixable in
 * this file, it was almost certainly filed against the wrong package.
 *
 * `"use client"` is load-bearing — the widget touches the DOM, so it can never
 * render on the server. Without the directive a Next.js App Router user gets a
 * server-render crash on the first import.
 */
import {
	createContext,
	createElement,
	forwardRef,
	useCallback,
	useContext,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import type { ReactElement, ReactNode } from "react";

import { mountLauncher, mountWidget } from "@activekit/js";
import type {
	ActiveKitClient,
	LauncherHandle,
	LauncherOptions,
	MountOptions,
	SubjectSnapshot,
	WidgetColors,
} from "@activekit/js";

/**
 * Object-valued options are compared by identity, so a caller writing
 * `colors={{ brand: "#..." }}` inline would hand us a new object every render
 * and remount the embed each time — a visible flicker and a refetch. Keying on
 * the value instead costs one small `JSON.stringify` per render and makes the
 * inline form behave the way the caller obviously meant.
 */
const colorsKey = (colors: WidgetColors | undefined): string =>
	colors ? JSON.stringify(colors) : "";

const ActiveKitContext = createContext<ActiveKitClient | null>(null);

export interface ActiveKitProviderProps {
	/** Built once with `createClient(...)`. Creating it inside render remounts every widget. */
	client: ActiveKitClient;
	children?: ReactNode;
}

export function ActiveKitProvider({ client, children }: ActiveKitProviderProps): ReactElement {
	return createElement(ActiveKitContext.Provider, { value: client }, children);
}

/** The client from the nearest provider. Throws if there isn't one. */
export function useActiveKit(): ActiveKitClient {
	const client = useContext(ActiveKitContext);
	if (!client) {
		throw new Error("useActiveKit: no <ActiveKitProvider> above this component.");
	}
	return client;
}

export interface UseProgressResult {
	data: SubjectSnapshot | null;
	error: Error | null;
	loading: boolean;
	refresh: () => Promise<void>;
}

/**
 * Subject progress, refetched on mount and whenever `refresh()` is called.
 *
 * Deliberately not a cache. Anyone already running TanStack Query should call
 * `client.progress()` inside their own query — reimplementing invalidation here
 * would only get it subtly wrong.
 */
export function useProgress(): UseProgressResult {
	const client = useActiveKit();
	const [data, setData] = useState<SubjectSnapshot | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState(true);

	// Guards against a slow first response landing after a fast second one, and
	// against setting state on an unmounted component.
	const generation = useRef(0);

	const refresh = useCallback(async (): Promise<void> => {
		const current = ++generation.current;
		setLoading(true);
		try {
			const snapshot = await client.progress();
			if (generation.current !== current) return;
			setData(snapshot);
			setError(null);
		} catch (caught) {
			if (generation.current !== current) return;
			setError(caught instanceof Error ? caught : new Error(String(caught)));
		} finally {
			if (generation.current === current) setLoading(false);
		}
	}, [client]);

	useEffect(() => {
		void refresh();
		return () => {
			// Bump the generation so any in-flight response is ignored.
			generation.current++;
		};
	}, [refresh]);

	return { data, error, loading, refresh };
}

export interface ActiveKitWidgetProps extends MountOptions {
	/** Passed through to the wrapper element. */
	className?: string;
}

/**
 * The progress widget.
 *
 * Renders an empty host element and lets `@activekit/js` own everything inside
 * it — the widget lives in a shadow root, so React never sees or reconciles
 * its internals. That is the point: one implementation of the UI, rendered
 * identically under every framework.
 *
 * Read-only, like everything else in this package. There is no `onGrant`,
 * because nothing here can issue a grant — render your own button and post to
 * your own backend.
 */
export function ActiveKitWidget({
	className,
	campaignKey,
	theme,
	colors,
}: ActiveKitWidgetProps): ReactElement {
	const client = useActiveKit();
	const hostRef = useRef<HTMLDivElement>(null);
	const colorsId = colorsKey(colors);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		const handle = mountWidget(host, client, {
			...(campaignKey ? { campaignKey } : {}),
			...(theme ? { theme } : {}),
			...(colors ? { colors } : {}),
		});

		return () => handle.destroy();
		// `colorsId` stands in for `colors` — see the note on colorsKey.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [client, campaignKey, theme, colorsId]);

	return createElement("div", { ref: hostRef, ...(className ? { className } : {}) });
}

export interface ActiveKitLauncherProps extends LauncherOptions {}

/**
 * The floating launcher.
 *
 * Renders nothing. The launcher appends itself to `document.body` and floats
 * over the page, so there is no host element for React to place — put this
 * component anywhere inside the provider and it will be in the corner.
 *
 * Pass a ref to drive it from your own UI:
 *
 * ```tsx
 * const launcher = useRef<LauncherHandle>(null);
 * <ActiveKitLauncher ref={launcher} campaignKey="daily-login" />
 * <button onClick={() => launcher.current?.expand()}>Rewards</button>
 * ```
 *
 * Read-only, like everything else here: the expanded view reports grants, it
 * cannot claim them.
 */
export const ActiveKitLauncher = forwardRef<LauncherHandle, ActiveKitLauncherProps>(
	function ActiveKitLauncher(
		{ campaignKey, theme, position, title, subjectLabel, defaultOpen, colors, zIndex },
		ref,
	) {
		const client = useActiveKit();
		const handleRef = useRef<LauncherHandle | null>(null);
		const colorsId = colorsKey(colors);

		useEffect(() => {
			const handle = mountLauncher(client, {
				...(campaignKey ? { campaignKey } : {}),
				...(theme ? { theme } : {}),
				...(position ? { position } : {}),
				...(title ? { title } : {}),
				...(subjectLabel ? { subjectLabel } : {}),
				...(defaultOpen ? { defaultOpen } : {}),
				...(colors ? { colors } : {}),
				...(zIndex !== undefined ? { zIndex } : {}),
			});
			handleRef.current = handle;

			return () => {
				handle.destroy();
				handleRef.current = null;
			};
			// `colorsId` stands in for `colors` — see the note on colorsKey.
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [client, campaignKey, theme, position, title, subjectLabel, defaultOpen, colorsId, zIndex]);

		// Forwarded through a ref cell rather than the handle itself: the handle
		// is replaced on every remount, and a caller holding the old one would be
		// driving a launcher that no longer exists.
		useImperativeHandle(
			ref,
			(): LauncherHandle => ({
				open: () => handleRef.current?.open(),
				close: () => handleRef.current?.close(),
				expand: () => handleRef.current?.expand(),
				collapse: () => handleRef.current?.collapse(),
				refresh: async () => {
					await handleRef.current?.refresh();
				},
				destroy: () => handleRef.current?.destroy(),
			}),
			[],
		);

		return null;
	},
);

export type {
	ActiveKitClient,
	LauncherHandle,
	LauncherOptions,
	MountOptions,
	SubjectSnapshot,
	WidgetColors,
};
