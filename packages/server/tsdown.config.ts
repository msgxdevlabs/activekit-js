import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts"],
	// Dual output: plenty of Node services are still CJS, and a server SDK that
	// only ships ESM makes adopting it a refactor.
	format: ["esm", "cjs"],
	// `neutral` keeps Node builtins from being assumed available — the same
	// build has to run in workerd.
	platform: "neutral",
	target: "es2022",
	dts: true,
	sourcemap: true,
	clean: false,
});
