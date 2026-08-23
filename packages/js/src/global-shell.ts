/**
 * CDN entry point — the shell's `<script>` tag build.
 *
 *   <script
 *     src="https://cdn.activekit.app/v1.0.0/activekit-shell.js"
 *     integrity="sha384-…"
 *     crossorigin="anonymous"
 *     data-token="SUBJECT_JWT"
 *     defer
 *   ></script>
 *
 * No container element: the shell docks itself in a corner. With `data-token`
 * present it mounts on load; without it nothing happens until the page calls
 * `ActiveKit.mountShell(...)`, which is the path for a token fetched
 * asynchronously.
 *
 * Separate from `activekit.js` because a script tag has no bundler to shake
 * out the half you did not ask for, and a page that only wants the inline
 * progress card should not download an iframe host and a message protocol.
 */
import { createClient } from "./client.js";
import { mountWidget } from "./widget.js";
import { mountShell } from "./shell.js";
import { ActiveKitError } from "./types.js";

export { createClient, mountWidget, mountShell, ActiveKitError };

const script = document.currentScript as HTMLScriptElement | null;
const token = script?.dataset["token"];

if (script && token) {
	const d = script.dataset;
	mountShell({
		token,
		...(d["appUrl"] ? { appUrl: d["appUrl"] } : {}),
		...(d["apiUrl"] ? { apiUrl: d["apiUrl"] } : {}),
		...(d["position"] ? { position: d["position"] as "bottom-right" | "bottom-left" } : {}),
		...(d["theme"] ? { theme: d["theme"] as "light" | "dark" | "auto" } : {}),
		...(d["label"] ? { label: d["label"] } : {}),
		...(d["prefetch"] ? { prefetch: d["prefetch"] as "idle" | "hover" | "none" } : {}),
		...(d["brandColor"] ? { colors: { brand: d["brandColor"] } } : {}),
	});
}
