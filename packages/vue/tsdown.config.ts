import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm"],
	platform: "browser",
	target: "es2022",
	dts: true,
	minify: true,
	sourcemap: true,
	clean: false,
	// `@activekit/js` stays external so a customer importing both packages gets
	// one copy of the client, not two. Bundling it here would also double-count
	// it against the size budget and hide a real regression.
	external: ["vue", "@activekit/js"],
});
