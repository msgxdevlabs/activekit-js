import { defineConfig } from "tsdown";
import type { UserConfig } from "tsdown";

/** Shared by both script-tag builds. Each is one self-contained file. */
const cdn: UserConfig = {
	format: ["iife"],
	globalName: "ActiveKit",
	platform: "browser",
	target: "es2022",
	dts: false,
	minify: true,
	sourcemap: true,
	clean: false,
};

export default defineConfig([
	{
		// The package entry. Minified on purpose: this is the thing a customer's
		// bundler pulls in, and the size budget only means something if what we
		// measure is what they ship. Bundlers tree-shake it — `sideEffects: false`
		// says so — which is why the whole-file number is a ceiling, not a bill.
		entry: ["src/index.ts"],
		format: ["esm"],
		platform: "browser",
		target: "es2022",
		dts: true,
		minify: true,
		sourcemap: true,
		clean: false,
	},
	{
		// The CDN build for the inline widget. Self-mounting, global-scoped.
		entry: { "activekit.global": "src/global.ts" },
		...cdn,
	},
	{
		// The CDN build for the shell. A separate file because a script tag has
		// no tree-shaking: a page that wants the inline widget would otherwise
		// download an iframe host and a message protocol it never uses.
		entry: { "activekit-shell.global": "src/global-shell.ts" },
		...cdn,
	},
]);
