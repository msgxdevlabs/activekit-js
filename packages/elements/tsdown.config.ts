import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/auto.ts"],
	format: ["esm"],
	platform: "browser",
	target: "es2022",
	dts: true,
	minify: true,
	sourcemap: true,
	clean: false,
	// One copy of the client on the page, shared with whatever else imports it.
	external: ["@activekit/js"],
});
