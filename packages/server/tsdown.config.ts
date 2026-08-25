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
	outputOptions: {
		// The reasoning in this package is load-bearing and long, and none of it
		// needs to be in the executed file. `dist/index.d.ts` is generated
		// separately and keeps every word, which is where an editor reads them
		// and therefore where a developer actually does. Shipping the same prose
		// twice spent a fifth of the size budget on bytes no runtime parses for
		// meaning, and that budget exists to catch dependency creep — so let it
		// measure dependencies.
		//
		// `legal` and `annotation` stay: the first is a licensing obligation, the
		// second is `@__PURE__`, which is what lets a bundler drop what a caller
		// did not import.
		comments: { legal: true, annotation: true, jsdoc: false },
	},
});
