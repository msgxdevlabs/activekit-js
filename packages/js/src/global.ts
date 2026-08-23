/**
 * CDN entry point — the inline widget's `<script>` tag build.
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
 *     data-campaign="daily-login"
 *     data-target="#activekit"
 *     defer
 *   ></script>
 *
 * With `data-token` present it self-mounts. Without it, nothing happens until
 * the page calls `ActiveKit.createClient(...)` — which is the path to take when
 * the token is fetched asynchronously.
 *
 * This file carries the inline widget and nothing else. The floating embed is
 * a separate build, `activekit-shell.js`, because a page that only wants the
 * inline card should not download an iframe host and a message protocol: over
 * a script tag there is no bundler to shake it out, so whatever ships here is
 * what every customer pays.
 */
import { createClient } from "./client.js";
import { mountWidget } from "./widget.js";
import { ActiveKitError } from "./types.js";
import { readScript } from "./self-mount.js";

export { createClient, mountWidget, ActiveKitError };

const config = readScript();

if (config) {
	if (config.script.dataset["mode"] === "launcher") {
		// Loud rather than silent: this attribute mounted a launcher back when
		// both embeds were one file, so the failure has to name its own fix.
		console.error(
			'[ActiveKit] data-mode="launcher" is gone — the floating embed is now ' +
				"the shell. Load activekit-shell.js instead of activekit.js.",
		);
	} else {
		const selector = config.script.dataset["target"] ?? "#activekit";
		const target = document.querySelector(selector);

		if (!target) {
			// Loud, because a silent no-op here looks like our bug and is almost
			// always a missing container in the host page.
			console.error(`[ActiveKit] No element matches "${selector}" — widget not mounted.`);
		} else {
			mountWidget(target, config.client, config.common);
		}
	}
}
