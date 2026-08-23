/**
 * CDN entry point — the floating launcher's `<script>` tag build.
 *
 *   <script
 *     src="https://cdn.activekit.app/v1.0.0/activekit-launcher.js"
 *     integrity="sha384-…"
 *     crossorigin="anonymous"
 *     data-token="SUBJECT_JWT"
 *     data-campaign="daily-login"
 *     data-subject-label="Pat"
 *     defer
 *   ></script>
 *
 * No `data-target`, and no `data-mode`: loading this file is the choice. The
 * launcher floats over the page, so the host gives up no layout for it.
 *
 * Separate from `activekit.js` on purpose — see the note there. A page that
 * wants both the inline widget and the launcher should install `@activekit/js`
 * and let a bundler share the client between them, rather than loading two
 * script tags.
 */
import { createClient } from "./client.js";
import { mountLauncher } from "./launcher.js";
import { ActiveKitError } from "./types.js";
import { readScript } from "./self-mount.js";

export { createClient, mountLauncher, ActiveKitError };

const config = readScript();

if (config) {
	const position = config.script.dataset["position"] as "bottom-right" | "bottom-left" | undefined;
	const title = config.script.dataset["title"];
	const subjectLabel = config.script.dataset["subjectLabel"];

	mountLauncher(config.client, {
		...config.common,
		...(position ? { position } : {}),
		...(title ? { title } : {}),
		...(subjectLabel ? { subjectLabel } : {}),
	});
}
