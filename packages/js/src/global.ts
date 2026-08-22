/**
 * CDN entry point — the `<script>` tag build.
 *
 * Served from `cdn.activekit.app`, not a public mirror: customers put this on
 * pages we do not deploy, so it has to be a host we control, on a version they
 * can pin and hash.
 *
 *   <script
 *     src="https://cdn.activekit.app/v1.0.0/activekit.js"
 *     integrity="sha384-…"
 *     crossorigin="anonymous"
 *     data-token="SUBJECT_JWT"
 *     data-program="daily-login"
 *     data-target="#activekit"
 *     defer
 *   ></script>
 *
 * With `data-token` present it self-mounts. Without it, nothing happens until
 * the page calls `ActiveKit.createClient(...)` — which is the path to take when
 * the token is fetched asynchronously.
 *
 * `data-mode="launcher"` mounts the floating corner launcher instead of the
 * inline widget; it needs no target because it floats over the page.
 */
import { createClient } from "./client.js";
import { mountWidget } from "./widget.js";
import { mountLauncher } from "./launcher.js";
import { ActiveKitError } from "./types.js";

export { createClient, mountWidget, mountLauncher, ActiveKitError };

const script = document.currentScript as HTMLScriptElement | null;
const token = script?.dataset["token"];

if (token) {
	const apiUrl = script?.dataset["apiUrl"];
	const programKey = script?.dataset["program"];
	const theme = script?.dataset["theme"] as "light" | "dark" | "auto" | undefined;

	if (script?.dataset["mode"] === "launcher") {
		const position = script.dataset["position"] as "bottom-right" | "bottom-left" | undefined;
		const title = script.dataset["title"];

		mountLauncher(createClient({ token, ...(apiUrl ? { apiUrl } : {}) }), {
			...(programKey ? { programKey } : {}),
			...(theme ? { theme } : {}),
			...(position ? { position } : {}),
			...(title ? { title } : {}),
		});
	} else {
		const selector = script?.dataset["target"] ?? "#activekit";
		const target = document.querySelector(selector);

		if (!target) {
			// Loud, because a silent no-op here looks like our bug and is almost
			// always a missing container in the host page.
			console.error(`[ActiveKit] No element matches "${selector}" — widget not mounted.`);
		} else {
			mountWidget(target, createClient({ token, ...(apiUrl ? { apiUrl } : {}) }), {
				...(programKey ? { programKey } : {}),
				...(theme ? { theme } : {}),
			});
		}
	}
}
