import { defineConfig } from "tsdown";

export default defineConfig([
	{
		// The package entry. Minified on purpose: this is the thing a customer's
		// bundler pulls in, and the size budget only means something if what we
		// measure is what they ship.
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
		// The CDN build. Self-mounting, global-scoped, one file.
		entry: { "activekit.global": "src/global.ts" },
		format: ["iife"],
		globalName: "ActiveKit",
		platform: "browser",
		target: "es2022",
		dts: false,
		minify: true,
		sourcemap: true,
		clean: false,
	},
]);
