/**
 * Custom elements.
 *
 * The highest-leverage package in the repo: one implementation that works in
 * Angular, Astro, Rails and Laravel views, HTMX, Alpine, plain HTML — and in
 * whatever framework arrives next. Writing a hand binding per framework is
 * three packages, three test matrices and three release cadences for the same
 * behaviour.
 *
 *   <script type="module" src="…/@activekit/elements"></script>
 *   <activekit-widget token="SUBJECT_JWT" program="daily-login"></activekit-widget>
 */
import { createClient, mountWidget } from "@activekit/js";
import type { ActiveKitClient, WidgetHandle } from "@activekit/js";

const OBSERVED = ["token", "program", "theme", "api-url"] as const;

export class ActiveKitWidgetElement extends HTMLElement {
	static readonly observedAttributes = OBSERVED;

	#client: ActiveKitClient | null = null;
	#handle: WidgetHandle | null = null;
	#connected = false;

	connectedCallback(): void {
		this.#connected = true;
		this.#render();
	}

	disconnectedCallback(): void {
		this.#connected = false;
		this.#teardown();
	}

	attributeChangedCallback(_name: string, previous: string | null, next: string | null): void {
		if (previous === next || !this.#connected) return;
		// Any observed change rebuilds from scratch. A client costs nothing to
		// construct, and one code path beats four attribute-specific ones that
		// each have to be right.
		this.#render();
	}

	#teardown(): void {
		this.#handle?.destroy();
		this.#handle = null;
		this.#client?.destroy();
		this.#client = null;
	}

	#render(): void {
		this.#teardown();

		const token = this.getAttribute("token");
		if (!token) {
			// Common and legitimate: the page renders the element first and sets
			// `token` once its own auth resolves. Wait rather than warn.
			return;
		}

		const apiUrl = this.getAttribute("api-url");
		const programKey = this.getAttribute("program");
		const theme = this.getAttribute("theme") as "light" | "dark" | "auto" | null;

		this.#client = createClient({ token, ...(apiUrl ? { apiUrl } : {}) });
		this.#handle = mountWidget(this, this.#client, {
			...(programKey ? { programKey } : {}),
			...(theme ? { theme } : {}),
			// Host pages listen with addEventListener, the platform's own idiom —
			// no framework, no callback prop, no library to import.
			onGrant: () => {
				this.dispatchEvent(new CustomEvent("activekit:grant", { bubbles: true, composed: true }));
			},
		});
	}

	/** Re-fetch progress and repaint. */
	async refresh(): Promise<void> {
		await this.#handle?.refresh();
	}
}

/**
 * Register the elements. Safe to call more than once — a second registration
 * of the same tag throws, and two bundles of this package on one page is a
 * normal thing to survive rather than a reason to break the host's render.
 */
export function defineActiveKitElements(tagName = "activekit-widget"): void {
	if (typeof customElements === "undefined") return;
	if (customElements.get(tagName)) return;
	customElements.define(tagName, ActiveKitWidgetElement);
}
