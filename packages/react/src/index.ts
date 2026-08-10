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
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import type { ReactElement, ReactNode } from "react";

import { mountWidget } from "@activekit/js";
import type { ActiveKitClient, MountOptions, SubjectSnapshot } from "@activekit/js";

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
 */
export function ActiveKitWidget({
	className,
	programKey,
	theme,
	onGrant,
}: ActiveKitWidgetProps): ReactElement {
	const client = useActiveKit();
	const hostRef = useRef<HTMLDivElement>(null);

	// The latest onGrant, without making it a mount dependency — a caller
	// passing an inline arrow would otherwise tear down and remount the widget
	// on every single render.
	const onGrantRef = useRef(onGrant);
	onGrantRef.current = onGrant;

	useEffect(() => {
		const host = hostRef.current;
		if (!host) return;

		const handle = mountWidget(host, client, {
			...(programKey ? { programKey } : {}),
			...(theme ? { theme } : {}),
			onGrant: () => onGrantRef.current?.(),
		});

		return () => handle.destroy();
	}, [client, programKey, theme]);

	return createElement("div", { ref: hostRef, ...(className ? { className } : {}) });
}

export type { ActiveKitClient, MountOptions, SubjectSnapshot };
