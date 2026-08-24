/**
 * The shell: a bubble in the corner of the customer's page that opens the
 * ActiveKit app in a frame on ActiveKit's own origin.
 *
 * Two states, not three. The bubble is pressed and the app opens; there is no
 * compact panel in between. That middle state was the one thing that could not
 * live cleanly on either side of the origin boundary — too substantial to draw
 * natively without reimplementing what the app renders, too small to justify
 * creating a document and animating a resize for.
 *
 * What runs here is deliberately almost nothing: a button, a frame, a skeleton
 * and a versioned message protocol. Every screen with content in it lives in
 * the app, which means this file never grows a dashboard and the customer's
 * page never downloads one.
 *
 * The other side of that boundary is built in `msgxdevlabs/activekit-play`,
 * where `docs/contracts/shell.md` pins the frame geometry, the entry URL, the
 * handshake and the theme parameter, and lists what this file owes it next.
 * Read that contract before changing any of them; nothing in this repo's CI
 * can see the app, so a mismatch ships silently.
 */
import { el, svg } from "./dom.js";

/**
 * The five colors the shell itself paints. Everything the *app* renders is
 * themed server-side from the tenant's saved preset, so it is deliberately not
 * configurable here — a mount call on someone else's page is the wrong place
 * to decide what our product looks like, and an option in this API can never
 * be removed.
 */
export interface ShellColors {
	/** Bubble fill. */
	brand?: string;
	/** Icon color on the bubble. */
	onBrand?: string;
	/** The unseen dot, drawn on the bubble. */
	ring?: string;
	/** Frame and skeleton ground. */
	background?: string;
	/** Close-button and skeleton foreground. */
	foreground?: string;
}

export interface ShellOptions {
	/** Subject token, minted by your server with the `activekit` server SDK. */
	token: string;
	/** Origin serving the app. Default `https://app.activekit.app`. */
	appUrl?: string;
	/** API root, used only for the unseen check. Default `https://api.activekit.app/v1`. */
	apiUrl?: string;
	/** Which corner to dock in. Default `bottom-right`. */
	position?: "bottom-right" | "bottom-left";
	/** `auto` follows the host page's `prefers-color-scheme`, and keeps following it. */
	theme?: "light" | "dark" | "auto";
	/** The bubble's accessible name, and the frame's title. Default `Rewards`. */
	label?: string;
	/**
	 * When to create the frame. Default `hover`.
	 *
	 * - `hover` builds it on the first pointer contact with the bubble — mouse
	 *   enter on a desktop, pointer down on a touch screen. A few hundred
	 *   milliseconds of lead time, and nothing at all for the majority of
	 *   visitors who never go near it.
	 * - `idle` builds it once the page settles. The click is instant, and every
	 *   page view loads an app document whether or not anyone opens it.
	 * - `none` waits for the click. The skeleton carries the wait.
	 *
	 * `hover` is the default because the alternative asks the customer's users
	 * to download a whole second document, on every page, for a panel most of
	 * them will not open. Switch to `idle` when a customer's own data says the
	 * open rate justifies it.
	 */
	prefetch?: "idle" | "hover" | "none";
	/** How often to re-check the unseen dot, in ms. Default 60000. `0` disables it. */
	pollInterval?: number;
	/** Bubble and frame colors. */
	colors?: ShellColors;
	/** Stacking order. Default `2147482000` — clears most host chrome, stays below a host that must win. */
	zIndex?: number;
	/** Fired after the app is open and has signalled ready. */
	onOpen?: () => void;
	/** Fired after the frame is dismissed. */
	onClose?: () => void;
	/** Fired when the app reports a problem, or fails to boot. */
	onError?: (error: Error) => void;
}

export interface ShellHandle {
	/** Open the app. Resolves once it has signalled ready, or the load times out. */
	open(): Promise<void>;
	/** Dismiss it. Escape and the scrim do the same. */
	close(): void;
	/** Open if closed, close if open. */
	toggle(): void;
	/** Re-check the unseen dot, and tell the app to re-fetch if it is open. */
	refresh(): Promise<void>;
	/** Swap in a rotated subject token, in place, without reloading the app. */
	setToken(token: string): void;
	/** Whether the app is currently open. */
	readonly isOpen: boolean;
	/** Remove the shell and release its listeners. Idempotent. */
	destroy(): void;
}

/** Bumped only for a breaking change to the message shapes below. */
const PROTOCOL = 1;

/**
 * How long to wait for the app's `ready` before showing the offline state.
 * Long enough for a cold frame on a slow connection, short enough that a dead
 * host does not leave someone watching a skeleton.
 */
const READY_TIMEOUT = 8000;

const DEFAULT_APP = "https://app.activekit.app";
const DEFAULT_API = "https://api.activekit.app/v1";

/*
 * Colors, and why there are so few of them.
 *
 * Light: teal #087f7a carries white at 5.04:1. Ink #102033 on canvas #ffffff
 * is 16.45:1. Dark: the fill lifts to #14b8a8 and the ground drops to the
 * slate ladder, which keeps the same relationships on the other ground.
 */
const DEFAULTS: Record<"light" | "dark", Required<ShellColors>> = {
	light: {
		brand: "#087f7a",
		onBrand: "#ffffff",
		ring: "#ffffff",
		background: "#ffffff",
		foreground: "#102033",
	},
	dark: {
		brand: "#14b8a8",
		onBrand: "#04241f",
		ring: "#04241f",
		background: "#101a26",
		foreground: "#e8eef5",
	},
};

const CSS = `
:host{all:initial}
*{box-sizing:border-box}
.ak{position:fixed;inset:0;pointer-events:none;font:400 14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
.ak-btn{position:absolute;bottom:20px;width:56px;height:56px;padding:0;border:0;border-radius:50%;background:var(--ak-brand);color:var(--ak-on-brand);cursor:pointer;pointer-events:auto;display:grid;place-items:center;box-shadow:rgba(16,32,51,.24) 0 6px 20px,rgba(16,32,51,.12) 0 2px 6px;transition:transform 140ms cubic-bezier(.2,0,0,1),box-shadow 140ms}
.ak[data-pos=bottom-right] .ak-btn{right:20px}
.ak[data-pos=bottom-left] .ak-btn{left:20px}
.ak-btn:hover{transform:translateY(-2px);box-shadow:rgba(16,32,51,.28) 0 10px 26px,rgba(16,32,51,.14) 0 3px 8px}
.ak-btn:active{transform:translateY(0)}
.ak-btn:focus-visible{outline:2px solid var(--ak-brand);outline-offset:3px}
.ak-btn svg{width:26px;height:26px;display:block}
.ak-dot{position:absolute;top:2px;right:2px;width:13px;height:13px;border-radius:50%;background:#e11d48;border:2.5px solid var(--ak-ring);opacity:0;transform:scale(.4);transition:opacity 160ms,transform 160ms cubic-bezier(.2,0,1.4,1)}
.ak[data-unseen=true] .ak-dot{opacity:1;transform:none}
.ak-scrim{position:absolute;inset:0;background:rgba(11,20,31,.55);opacity:0;visibility:hidden;pointer-events:none;transition:opacity 200ms,visibility 0s linear 200ms}
.ak-modal{position:absolute;inset:0;display:grid;place-items:center;padding:24px;opacity:0;visibility:hidden;pointer-events:none;transform:scale(.985);transition:opacity 200ms cubic-bezier(.2,0,0,1),transform 200ms cubic-bezier(.2,0,0,1),visibility 0s linear 200ms}
.ak[data-open=true] .ak-scrim,.ak[data-open=true] .ak-modal{opacity:1;visibility:visible;transition-delay:0s}
.ak[data-open=true] .ak-modal{transform:none}
/* The modal is a centering box that spans the viewport, so it must never take
   a click: it sits above the scrim and would swallow every dismiss. Clicks
   belong to the scrim below it and the frame inside it, nothing between. */
.ak[data-open=true] .ak-scrim,.ak[data-open=true] .ak-frame{pointer-events:auto}
.ak-frame{position:relative;width:min(1080px,100%);height:min(760px,100%);background:var(--ak-bg);border-radius:16px;overflow:hidden;pointer-events:none;box-shadow:rgba(11,20,31,.3) 0 32px 80px}
@media (max-width:640px){.ak-modal{padding:0}.ak-frame{width:100%;height:100%;border-radius:0}}
.ak-frame iframe{width:100%;height:100%;border:0;display:block;background:var(--ak-bg);opacity:0;transition:opacity 180ms}
.ak[data-ready=true] .ak-frame iframe{opacity:1}
.ak-x{position:absolute;top:12px;right:12px;width:34px;height:34px;padding:0;border:0;border-radius:9px;background:rgba(127,140,158,.16);color:var(--ak-fg);cursor:pointer;display:grid;place-items:center;transition:background 140ms}
.ak-x:hover{background:rgba(127,140,158,.28)}
.ak-x:focus-visible{outline:2px solid var(--ak-brand);outline-offset:2px}
.ak-x svg{width:16px;height:16px;display:block}
.ak-skel{position:absolute;inset:0;padding:56px 40px;display:flex;flex-direction:column;gap:16px;background:var(--ak-bg);transition:opacity 180ms}
.ak[data-ready=true] .ak-skel{opacity:0;pointer-events:none}
.ak-bar{border-radius:8px;background:linear-gradient(90deg,rgba(127,140,158,.1) 25%,rgba(127,140,158,.2) 37%,rgba(127,140,158,.1) 63%);background-size:400% 100%;animation:ak-sweep 1.4s ease-in-out infinite}
.ak-bar.t{height:26px;width:38%}
.ak-bar.r{height:88px}
.ak-bar.s{height:16px;width:64%}
@keyframes ak-sweep{0%{background-position:100% 50%}100%{background-position:0 50%}}
.ak-off{position:absolute;inset:0;display:none;flex-direction:column;gap:6px;align-items:center;justify-content:center;padding:32px;text-align:center;background:var(--ak-bg);color:var(--ak-fg)}
.ak[data-state=offline] .ak-off{display:flex}
.ak[data-state=offline] .ak-skel{display:none}
.ak-off b{font-weight:600;font-size:15px}
.ak-off span{opacity:.62;font-size:13.5px;max-width:34ch}
.ak-sentinel{position:absolute;width:1px;height:1px;opacity:0}
@media (prefers-reduced-motion:reduce){.ak-btn,.ak-dot,.ak-scrim,.ak-modal,.ak-frame iframe,.ak-skel,.ak-bar{transition:none;animation:none}}
`;

const ICON_SPARK =
	"M12 2.6l2.2 5.3 5.3 2.1-5.3 2.2-2.2 5.3-2.2-5.3-5.3-2.2 5.3-2.1zM18.6 15.4l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9z";
const ICON_X = "M4 4l8 8M12 4l-8 8";

/** Same-origin `allow-same-origin` would hand the frame our page. Cross-origin it is required. */
const SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox";

const originOf = (url: string): string => {
	try {
		return new URL(url, location.href).origin;
	} catch {
		return "";
	}
};

/**
 * Mount the shell. It appends itself to `document.body` and floats over the
 * page, so there is no target element and your layout gives up nothing.
 *
 * ```ts
 * const shell = mountShell({ token, label: "Rewards" });
 * shell.open();
 * ```
 *
 * The token is handed to the app over `postMessage` after its handshake, never
 * in the frame's URL — a URL reaches the referrer header, browser history and
 * every proxy log on the way, and a subject token has no business in any of
 * them.
 */
export const mountShell = (options: ShellOptions): ShellHandle => {
	const appUrl = options.appUrl ?? DEFAULT_APP;
	const appOrigin = originOf(appUrl);
	const apiUrl = (options.apiUrl ?? DEFAULT_API).replace(/\/$/, "");
	const label = options.label ?? "Rewards";
	const prefetch = options.prefetch ?? "hover";
	const pollInterval = options.pollInterval ?? 60000;

	if (!appOrigin) throw new Error(`[ActiveKit] appUrl is not a valid URL: ${appUrl}`);
	if (appOrigin === location.origin) {
		// Not fatal — a customer proxying the app under their own domain is a
		// legitimate setup — but the sandbox stops being a boundary, so say so.
		console.warn(
			"[ActiveKit] The app is being served from this page's own origin. " +
				"The frame is no longer isolated from the host document.",
		);
	}

	let token = options.token;
	let theme = options.theme ?? "auto";
	let open = false;
	let ready = false;
	let destroyed = false;
	let frame: HTMLIFrameElement | null = null;
	let readyTimer: ReturnType<typeof setTimeout> | undefined;
	let pollTimer: ReturnType<typeof setInterval> | undefined;
	let returnFocus: Element | null = null;
	let scrollLock = "";
	let resolveOpen: (() => void) | undefined;

	// --- shadow root -------------------------------------------------------
	//
	// Position and z-index go on the *host* element as inline styles, not on
	// anything inside the shadow root. `position: fixed` makes the host its own
	// stacking context, so a z-index set within it only orders our own children
	// — the host would still sit wherever the page's own stacked content put it,
	// and a header with a z-index would paint straight over the scrim. Inline
	// also wins over any host stylesheet short of `!important`, which matters on
	// pages whose reset would otherwise drop us into the document flow.
	const host = el("div");
	host.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${
		options.zIndex ?? 2147482000
	}`;
	const shadow = host.attachShadow({ mode: "open" });
	const sheet = el("style");
	sheet.textContent = CSS;

	const root = el("div", "ak");
	root.dataset["pos"] = options.position ?? "bottom-right";
	root.dataset["open"] = "false";
	root.dataset["ready"] = "false";

	// --- bubble ------------------------------------------------------------
	const button = el("button", "ak-btn");
	button.type = "button";
	button.setAttribute("aria-label", label);
	button.setAttribute("aria-expanded", "false");
	button.setAttribute("aria-haspopup", "dialog");
	const icon = svg("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" });
	icon.append(svg("path", { d: ICON_SPARK, fill: "currentColor" }));
	button.append(icon, el("span", "ak-dot"));

	// --- modal -------------------------------------------------------------
	const scrim = el("div", "ak-scrim");
	const modal = el("div", "ak-modal");
	modal.setAttribute("role", "dialog");
	modal.setAttribute("aria-modal", "true");
	modal.setAttribute("aria-label", label);

	const shellFrame = el("div", "ak-frame");

	// A skeleton, not a spinner: with the compact panel gone, a cold click opens
	// straight into this, and a shaped surface reads as loading where an empty
	// rectangle reads as broken.
	const skeleton = el("div", "ak-skel");
	skeleton.setAttribute("aria-hidden", "true");
	skeleton.append(
		el("div", "ak-bar t"),
		el("div", "ak-bar r"),
		el("div", "ak-bar s"),
		el("div", "ak-bar r"),
	);

	const offline = el("div", "ak-off");
	offline.append(
		el("b", undefined, "Rewards are unavailable"),
		el("span", undefined, "We could not reach ActiveKit. Nothing on this page is affected — try again in a moment."),
	);

	const close = el("button", "ak-x");
	close.type = "button";
	close.setAttribute("aria-label", "Close");
	const xIcon = svg("svg", { viewBox: "0 0 16 16", "aria-hidden": "true" });
	xIcon.append(
		svg("path", {
			d: ICON_X,
			stroke: "currentColor",
			"stroke-width": "1.8",
			"stroke-linecap": "round",
			fill: "none",
		}),
	);
	close.append(xIcon);

	// Focus cannot be trapped *inside* a cross-origin frame from out here, so
	// the boundary is guarded from both sides: these bounce a tab that escapes
	// the frame back to the top of the dialog.
	const sentinelStart = el("div", "ak-sentinel");
	const sentinelEnd = el("div", "ak-sentinel");
	sentinelStart.tabIndex = 0;
	sentinelEnd.tabIndex = 0;

	shellFrame.append(sentinelStart, skeleton, offline, close, sentinelEnd);
	modal.append(shellFrame);
	root.append(scrim, modal, button);
	shadow.append(sheet, root);

	// --- theme -------------------------------------------------------------
	const media = matchMedia("(prefers-color-scheme: dark)");

	const resolved = (): "light" | "dark" =>
		theme === "auto" ? (media.matches ? "dark" : "light") : theme;

	const paint = (): void => {
		const mode = resolved();
		const c = { ...DEFAULTS[mode], ...options.colors };
		root.style.setProperty("--ak-brand", c.brand);
		root.style.setProperty("--ak-on-brand", c.onBrand);
		root.style.setProperty("--ak-ring", c.ring);
		root.style.setProperty("--ak-bg", c.background);
		root.style.setProperty("--ak-fg", c.foreground);
	};

	const onScheme = (): void => {
		if (theme !== "auto") return;
		paint();
		post({ type: "theme", theme: resolved() });
	};
	media.addEventListener("change", onScheme);
	paint();

	// --- protocol ----------------------------------------------------------
	const post = (message: Record<string, unknown>): void => {
		// Targeted at the app's origin, never `*`: a wildcard would deliver the
		// subject token to whatever document happened to be in the frame.
		frame?.contentWindow?.postMessage({ v: PROTOCOL, ...message }, appOrigin);
	};

	const fail = (error: Error): void => {
		root.dataset["state"] = "offline";
		clearTimeout(readyTimer);
		resolveOpen?.();
		resolveOpen = undefined;
		options.onError?.(error);
	};

	const onMessage = (event: MessageEvent): void => {
		// Both checks matter. The origin says who sent it; the source says it
		// came from our frame rather than another window on the same origin.
		if (event.origin !== appOrigin) return;
		if (!frame || event.source !== frame.contentWindow) return;

		const data = event.data as { v?: number; type?: string; [k: string]: unknown } | null;
		if (!data || data.v !== PROTOCOL) return;

		switch (data.type) {
			case "ready":
				clearTimeout(readyTimer);
				ready = true;
				root.dataset["ready"] = "true";
				delete root.dataset["state"];
				post({ type: "init", token, theme: resolved(), locale: navigator.language });
				if (open) {
					options.onOpen?.();
					resolveOpen?.();
					resolveOpen = undefined;
				}
				break;
			case "badge":
				// While the app is loaded it knows better than the poller does.
				root.dataset["unseen"] = String(Boolean(data["value"]));
				break;
			case "close":
			case "escape":
				dismiss();
				break;
			case "error":
				options.onError?.(
					new Error(
						`[ActiveKit] ${String(data["message"] ?? "app error")}${
							data["requestId"] ? ` (request ${String(data["requestId"])})` : ""
						}`,
					),
				);
				break;
		}
	};

	// --- frame -------------------------------------------------------------
	const build = (): void => {
		if (frame || destroyed) return;
		frame = el("iframe");
		// Theme and locale ride the URL so the app can paint the right ground on
		// its first frame. Neither is a secret; the token is, and does not.
		frame.src = `${appUrl.replace(/\/$/, "")}/embed?v=${PROTOCOL}&theme=${resolved()}`;
		frame.title = label;
		frame.setAttribute("sandbox", SANDBOX);
		frame.setAttribute("referrerpolicy", "no-referrer");
		frame.setAttribute("loading", "eager");
		frame.addEventListener("error", () => fail(new Error("[ActiveKit] The app failed to load.")));
		shellFrame.insertBefore(frame, close);
	};

	const armReadyTimeout = (): void => {
		clearTimeout(readyTimer);
		if (ready) return;
		readyTimer = setTimeout(
			() => fail(new Error("[ActiveKit] The app did not respond in time.")),
			READY_TIMEOUT,
		);
	};

	// --- unseen dot --------------------------------------------------------
	//
	// The one request the shell makes on its own, and the obvious question is
	// why a hollow shell talks to the API at all.
	//
	// The dot has to be right *before* the app has loaded, or it cannot do its
	// job of earning the click. The alternatives are worse: prefetching the app
	// on every page view to learn one boolean means downloading a whole second
	// document for a panel most visitors never open, and dropping the dot
	// entirely costs the only re-engagement signal the bubble has.
	//
	// So: one cacheable boolean, on the same subject token the inline widget
	// already reads with. Customers need `connect-src https://api.activekit.app`
	// alongside `frame-src` — the same grant `@activekit/js` has always needed.
	const check = async (): Promise<void> => {
		if (destroyed || open) return;
		try {
			const response = await fetch(`${apiUrl}/me/badge`, {
				headers: { authorization: `Bearer ${token}` },
			});
			if (!response.ok) return;
			const body = (await response.json()) as { unseen?: boolean };
			root.dataset["unseen"] = String(Boolean(body.unseen));
		} catch {
			// A dot that fails to load is a dot that stays as it was. Nothing on
			// the customer's page should notice our API having a bad minute.
		}
	};

	/** Opening is the acknowledgement, and it has to survive a reload to mean anything. */
	const acknowledge = async (): Promise<void> => {
		try {
			await fetch(`${apiUrl}/me/badge/seen`, {
				method: "POST",
				headers: { authorization: `Bearer ${token}` },
			});
		} catch {
			// The dot is already off locally. A failed acknowledgement means it
			// comes back on the next poll, which is the right way to be wrong.
		}
	};

	const onVisible = (): void => {
		if (document.visibilityState === "visible") void check();
	};

	// --- open / close ------------------------------------------------------
	const present = (): Promise<void> => {
		if (open || destroyed) return Promise.resolve();
		open = true;
		build();
		armReadyTimeout();
		root.dataset["open"] = "true";
		root.dataset["unseen"] = "false";
		void acknowledge();
		button.setAttribute("aria-expanded", "true");
		returnFocus = document.activeElement;
		scrollLock = document.documentElement.style.overflow;
		document.documentElement.style.overflow = "hidden";
		close.focus({ preventScroll: true });
		post({ type: "open" });

		if (ready) {
			options.onOpen?.();
			return Promise.resolve();
		}
		return new Promise<void>((resolve) => {
			resolveOpen = resolve;
		});
	};

	const dismiss = (): void => {
		if (!open) return;
		open = false;
		root.dataset["open"] = "false";
		button.setAttribute("aria-expanded", "false");
		document.documentElement.style.overflow = scrollLock;
		post({ type: "close" });
		clearTimeout(readyTimer);
		resolveOpen?.();
		resolveOpen = undefined;
		// Focus goes back where it came from, unless the page moved it while we
		// were open — stealing focus from wherever they are now would be worse.
		if (returnFocus instanceof HTMLElement && returnFocus.isConnected) {
			returnFocus.focus({ preventScroll: true });
		} else {
			button.focus({ preventScroll: true });
		}
		returnFocus = null;
		options.onClose?.();
	};

	// --- listeners ---------------------------------------------------------
	button.addEventListener("click", () => (open ? dismiss() : void present()));
	close.addEventListener("click", dismiss);
	scrim.addEventListener("click", dismiss);
	sentinelStart.addEventListener("focus", () => close.focus({ preventScroll: true }));
	sentinelEnd.addEventListener("focus", () => close.focus({ preventScroll: true }));

	// `pointerenter` covers a mouse; `pointerdown` is the touch equivalent and
	// fires before `click`, so a tap still starts the load a beat early. Both
	// are once-only, and `build` is idempotent, so whichever lands first wins.
	const onIntent = (): void => {
		if (prefetch === "hover") build();
	};
	button.addEventListener("pointerenter", onIntent, { once: true });
	button.addEventListener("pointerdown", onIntent, { once: true });

	const onKey = (event: KeyboardEvent): void => {
		// Only ours to handle, and only if nobody else claimed it first. A host
		// page with its own Escape handling keeps it.
		if (event.key !== "Escape" || !open || event.defaultPrevented || event.isComposing) return;
		event.preventDefault();
		dismiss();
	};
	document.addEventListener("keydown", onKey);
	window.addEventListener("message", onMessage);
	document.addEventListener("visibilitychange", onVisible);

	// --- start -------------------------------------------------------------
	const attach = (): void => {
		if (destroyed) return;
		document.body.append(host);
		if (prefetch === "idle") {
			const idle = (globalThis as { requestIdleCallback?: (cb: () => void) => void })
				.requestIdleCallback;
			// Behind idle, so a frame we may never need cannot compete with the
			// customer's own page for the first seconds of its life.
			idle ? idle(build) : setTimeout(build, 1200);
		}
		void check();
		if (pollInterval > 0) pollTimer = setInterval(() => void check(), pollInterval);
	};

	if (document.body) attach();
	else document.addEventListener("DOMContentLoaded", attach, { once: true });

	return {
		open: present,
		close: dismiss,
		toggle: () => void (open ? dismiss() : present()),
		refresh: async () => {
			post({ type: "refresh" });
			await check();
		},
		setToken: (next: string) => {
			token = next;
			post({ type: "token", token: next });
		},
		get isOpen() {
			return open;
		},
		destroy: () => {
			if (destroyed) return;
			destroyed = true;
			if (open) dismiss();
			clearTimeout(readyTimer);
			clearInterval(pollTimer);
			media.removeEventListener("change", onScheme);
			document.removeEventListener("keydown", onKey);
			window.removeEventListener("message", onMessage);
			document.removeEventListener("visibilitychange", onVisible);
			document.removeEventListener("DOMContentLoaded", attach);
			host.remove();
			frame = null;
		},
	};
};
