/** Shared DOM factories for the widget and the launcher. Internal. */

export const el = <K extends keyof HTMLElementTagNameMap>(
	tag: K,
	className?: string,
	text?: string,
): HTMLElementTagNameMap[K] => {
	const node = document.createElement(tag);
	if (className) node.className = className;
	// textContent, never innerHTML. Campaign names are organization-authored and
	// this runs on the organization's own page — but "trusted today" is how
	// stored XSS gets shipped.
	if (text !== undefined) node.textContent = text;
	return node;
};

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * SVG factory. Every attribute value passed to it is a compile-time constant
 * or a number we computed — never subject- or organization-authored text.
 */
export const svg = (tag: string, attrs: Record<string, string>): SVGElement => {
	const node = document.createElementNS(SVG_NS, tag);
	for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
	return node;
};
