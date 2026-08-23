/**
 * Custom elements.
 *
 * Read-only, like every ActiveKit client package.
 *
 * The highest-leverage package in the repo: one implementation that works in
 * Angular, Astro, Rails and Laravel views, HTMX, Alpine, plain HTML — and in
 * whatever framework arrives next. Writing a hand binding per framework is
 * three packages, three test matrices and three release cadences for the same
 * behaviour.
 *
 *   <script type="module" src="…/@activekit/elements"></script>
 *   <activekit-widget token="SUBJECT_JWT" campaign="daily-login"></activekit-widget>
 *   <activekit-launcher token="SUBJECT_JWT" campaign="daily-login"></activekit-launcher>
 */
import { createClient, mountLauncher, mountWidget } from "@activekit/js";
import type { ActiveKitClient, LauncherHandle, WidgetColors, WidgetHandle } from "@activekit/js";

const OBSERVED = ["token", "campaign", "theme", "api-url", "brand-color", "accent-color"] as const;

const LAUNCHER_OBSERVED = [...OBSERVED, "position", "panel-title", "subject-label"] as const;

/**
 * `brand-color` / `accent-color` cover an attribute-driven page's share of the
 * `colors` option; the full per-theme shape needs a caller with code.
 */
const readColors = (el: HTMLElement): WidgetColors | undefined => {
	const brand = el.getAttribute("brand-color");
	const accent = el.getAttribute("accent-color");
	if (!brand && !accent) return undefined;
	return { ...(brand ? { brand } : {}), ...(accent ? { accent } : {}) };
};

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
		const campaignKey = this.getAttribute("campaign");
		const theme = this.getAttribute("theme") as "light" | "dark" | "auto" | null;

		const colors = readColors(this);

		this.#client = createClient({ token, ...(apiUrl ? { apiUrl } : {}) });
		this.#handle = mountWidget(this, this.#client, {
			...(campaignKey ? { campaignKey } : {}),
			...(theme ? { theme } : {}),
			...(colors ? { colors } : {}),
		});
	}

	/** Re-fetch progress and repaint. */
	async refresh(): Promise<void> {
		await this.#handle?.refresh();
	}
}

/**
 * The floating launcher.
 *
 *   <activekit-launcher token="SUBJECT_JWT" campaign="daily-login"></activekit-launcher>
 *
 * The element itself renders nothing and takes no space: the launcher appends
 * itself to `document.body` and floats over the page, so this tag is just the
 * place you configure it from. Put it anywhere.
 *
 * The panel heading is `panel-title`, not `title` — `title` is a global HTML
 * attribute and would give the element a browser tooltip as a side effect.
 */
export class ActiveKitLauncherElement extends HTMLElement {
	static readonly observedAttributes = LAUNCHER_OBSERVED;

	#client: ActiveKitClient | null = null;
	#handle: LauncherHandle | null = null;
	#connected = false;

	connectedCallback(): void {
		this.#connected = true;
		// Nothing renders here, but an element that is display:inline still
		// occupies a line box in the host's layout. It should cost them nothing.
		this.style.display = "contents";
		this.#render();
	}

	disconnectedCallback(): void {
		this.#connected = false;
		this.#teardown();
	}

	attributeChangedCallback(_name: string, previous: string | null, next: string | null): void {
		if (previous === next || !this.#connected) return;
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
		const campaignKey = this.getAttribute("campaign");
		const theme = this.getAttribute("theme") as "light" | "dark" | "auto" | null;
		const position = this.getAttribute("position") as "bottom-right" | "bottom-left" | null;
		const title = this.getAttribute("panel-title");
		const subjectLabel = this.getAttribute("subject-label");
		const colors = readColors(this);

		this.#client = createClient({ token, ...(apiUrl ? { apiUrl } : {}) });
		this.#handle = mountLauncher(this.#client, {
			...(campaignKey ? { campaignKey } : {}),
			...(theme ? { theme } : {}),
			...(position ? { position } : {}),
			...(title ? { title } : {}),
			...(subjectLabel ? { subjectLabel } : {}),
			...(colors ? { colors } : {}),
		});
	}

	/** Show the compact panel. */
	open(): void {
		this.#handle?.open();
	}
	/** Collapse everything back to the bubble. */
	close(): void {
		this.#handle?.close();
	}
	/** Open the expanded view. */
	expand(): void {
		this.#handle?.expand();
	}
	/** Shrink the expanded view back to the compact panel. */
	collapse(): void {
		this.#handle?.collapse();
	}
	/** Re-fetch and repaint. */
	async refresh(): Promise<void> {
		await this.#handle?.refresh();
	}
}

/**
 * Register the elements. Safe to call more than once — a second registration
 * of the same tag throws, and two bundles of this package on one page is a
 * normal thing to survive rather than a reason to break the host's render.
 */
export function defineActiveKitElements(
	tagName = "activekit-widget",
	launcherTagName = "activekit-launcher",
): void {
	if (typeof customElements === "undefined") return;
	if (!customElements.get(tagName)) customElements.define(tagName, ActiveKitWidgetElement);
	if (!customElements.get(launcherTagName)) {
		customElements.define(launcherTagName, ActiveKitLauncherElement);
	}
}
