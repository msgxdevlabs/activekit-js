/**
 * Custom elements.
 *
 * Read-only, like every ActiveKit client package.
 *
 * The highest-leverage package in the repo: one implementation that works in
 * Angular, Astro, Rails and Laravel views, HTMX, Alpine, plain HTML — and in
 * whatever framework arrives next. Writing a hand binding per framework is
 * three packages, three test matrices and three release cadences for the same
 * behavior.
 *
 *   <script type="module" src="…/@activekit/elements"></script>
 *   <activekit-widget token="SUBJECT_JWT" campaign="campaign_123"></activekit-widget>
 *   <activekit-shell token="SUBJECT_JWT"></activekit-shell>
 */
import { createClient, mountShell, mountWidget } from "@activekit/js";
import type { ActiveKitClient, ShellHandle, WidgetColors, WidgetHandle } from "@activekit/js";

const OBSERVED = ["token", "campaign", "label", "theme", "api-url", "brand-color", "accent-color"] as const;

/**
 * The shell's own set. It mounts an app rather than a campaign card, so it
 * shares only the four attributes that identify the tenant and the look.
 */
const SHELL_OBSERVED = [
	"token",
	"api-url",
	"app-url",
	"theme",
	"position",
	"label",
	"prefetch",
	"brand-color",
] as const;

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
		const campaignId = this.getAttribute("campaign");
		const label = this.getAttribute("label");
		const theme = this.getAttribute("theme") as "light" | "dark" | "auto" | null;

		const colors = readColors(this);

		this.#client = createClient({ token, ...(apiUrl ? { apiUrl } : {}) });
		this.#handle = mountWidget(this, this.#client, {
			...(campaignId ? { campaignId } : {}),
			...(label ? { label } : {}),
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
 * The shell: a bubble in the corner that opens the ActiveKit app.
 *
 *   <activekit-shell token="SUBJECT_JWT" label="Rewards"></activekit-shell>
 *
 * The element itself renders nothing and takes no space: the shell appends
 * itself to `document.body` and floats over the page, so this tag is only the
 * place you configure it from. Put it anywhere.
 *
 * `label` rather than `title`: `title` is a global HTML attribute and would
 * give the element a browser tooltip as a side effect.
 */
export class ActiveKitShellElement extends HTMLElement {
	static readonly observedAttributes = SHELL_OBSERVED;

	#handle: ShellHandle | null = null;
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
		const appUrl = this.getAttribute("app-url");
		const theme = this.getAttribute("theme") as "light" | "dark" | "auto" | null;
		const position = this.getAttribute("position") as "bottom-right" | "bottom-left" | null;
		const label = this.getAttribute("label");
		const prefetch = this.getAttribute("prefetch") as "idle" | "hover" | "none" | null;
		const brand = this.getAttribute("brand-color");

		// No client here: the shell needs a token and an API root, not a
		// transport. Building one would ship the retry machinery to a page that
		// makes exactly one request.
		this.#handle = mountShell({
			token,
			...(apiUrl ? { apiUrl } : {}),
			...(appUrl ? { appUrl } : {}),
			...(theme ? { theme } : {}),
			...(position ? { position } : {}),
			...(label ? { label } : {}),
			...(prefetch ? { prefetch } : {}),
			...(brand ? { colors: { brand } } : {}),
		});
	}

	/** Open the app. */
	async open(): Promise<void> {
		await this.#handle?.open();
	}
	/** Dismiss it. */
	close(): void {
		this.#handle?.close();
	}
	/** Open if closed, close if open. */
	toggle(): void {
		this.#handle?.toggle();
	}
	/** Re-check the unseen dot, and tell the app to re-fetch. */
	async refresh(): Promise<void> {
		await this.#handle?.refresh();
	}
	/** Swap in a rotated subject token, without reloading the app. */
	setToken(next: string): void {
		this.#handle?.setToken(next);
	}
}

/**
 * Register the elements. Safe to call more than once — a second registration
 * of the same tag throws, and two bundles of this package on one page is a
 * normal thing to survive rather than a reason to break the host's render.
 */
export function defineActiveKitElements(
	tagName = "activekit-widget",
	shellTagName = "activekit-shell",
): void {
	if (typeof customElements === "undefined") return;
	if (!customElements.get(tagName)) customElements.define(tagName, ActiveKitWidgetElement);
	if (!customElements.get(shellTagName)) {
		customElements.define(shellTagName, ActiveKitShellElement);
	}
}
