/**
 * Side-effecting entry: importing it registers `<activekit-widget>` and
 * `<activekit-shell>`.
 *
 * Separate from the main entry so that importing the class does not silently
 * define a global tag — a library that mutates the custom element registry on
 * import is a library that cannot be used twice on one page.
 *
 *   import "@activekit/elements/auto";
 */
import { defineActiveKitElements } from "./index.js";

defineActiveKitElements();
