// The one property behind "runs on Node 20+, Workers, Bun and Deno".
//
// ## What this proves
//
// That no module in `packages/server/src`, and nothing in the two artifacts
// built from it, imports a Node builtin or reaches a Node-only global. That is
// the property the claim rests on: `fetch`, `crypto.subtle`, `TextEncoder`,
// `setTimeout` and `Response` exist in all four runtimes, and the moment one
// `node:crypto` import lands, three of the four stop working. Today nothing but
// review stands between the claim and that import, and a claim is worth exactly
// what proves it.
//
// ## What this does not prove
//
// That the SDK runs on any of those four. Nothing here executes on workerd, Bun
// or Deno; it cannot, from one Node process. It catches the one failure mode
// that is both easy to introduce and invisible until deploy, and leaves the
// rest to an integration that actually boots each runtime. Read a pass as "no
// module reached for Node", never as "verified on four runtimes".
//
// It is also a text scan, not a parse. Comments and string literals are
// separated so that prose about `node:crypto`, of which the source has plenty,
// does not read as an import; a regular-expression literal containing a quote
// character would confuse that separation, and there is none in this package.
// A builtin reached through a computed specifier would also slip past. Both are
// deliberate: a parser here would be more machinery than the risk deserves, and
// the risk this catches is somebody typing an import.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const here = new URL(".", import.meta.url).pathname;
const SRC = join(here, "..", "src");
const DIST = join(here, "..", "dist");

/** Node builtins as they are written without the `node:` prefix. */
const BARE_BUILTINS = new Set([
	"assert", "async_hooks", "buffer", "child_process", "cluster", "console",
	"constants", "crypto", "dgram", "diagnostics_channel", "dns", "domain",
	"events", "fs", "http", "http2", "https", "inspector", "module", "net",
	"os", "path", "perf_hooks", "process", "punycode", "querystring",
	"readline", "repl", "stream", "string_decoder", "timers", "tls",
	"trace_events", "tty", "url", "util", "v8", "vm", "wasi", "worker_threads",
	"zlib",
]);

/**
 * Node-only globals, matched in use rather than as bare words, so a sentence
 * mentioning one in a comment that survived stripping is not a failure.
 */
const NODE_GLOBALS = [
	[/\bprocess\s*\./, "process"],
	[/\bBuffer\s*[.(]/, "Buffer"],
	[/\bnew\s+Buffer\b/, "Buffer"],
	[/\bglobal\s*\./, "global"],
	[/\b__dirname\b/, "__dirname"],
	[/\b__filename\b/, "__filename"],
	[/\bsetImmediate\s*\(/, "setImmediate"],
];

/**
 * Blank out comments, leaving strings intact.
 *
 * Import specifiers are string literals, so strings have to survive; comments
 * do not, because this package documents at length why it avoids `node:crypto`
 * and every one of those sentences would otherwise be a failure. Replaced with
 * spaces rather than removed so reported line numbers stay true.
 */
const stripComments = (source) => {
	let out = "";
	let i = 0;
	while (i < source.length) {
		const c = source[i];
		const next = source[i + 1];
		if (c === "/" && next === "/") {
			while (i < source.length && source[i] !== "\n") {
				out += " ";
				i++;
			}
			continue;
		}
		if (c === "/" && next === "*") {
			while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
				out += source[i] === "\n" ? "\n" : " ";
				i++;
			}
			out += "  ";
			i += 2;
			continue;
		}
		if (c === '"' || c === "'" || c === "`") {
			out += c;
			i++;
			while (i < source.length) {
				if (source[i] === "\\") {
					out += source[i] + (source[i + 1] ?? "");
					i += 2;
					continue;
				}
				out += source[i];
				if (source[i] === c) {
					i++;
					break;
				}
				i++;
			}
			continue;
		}
		out += c;
		i++;
	}
	return out;
};

/** Every module specifier the file names, however it names it. */
const specifiers = (code) => {
	const found = [];
	const patterns = [
		/(?:^|[;}\s])(?:import|export)\b[^;'"`]*?\bfrom\s*["'`]([^"'`]+)["'`]/g,
		/(?:^|[;}\s])import\s*["'`]([^"'`]+)["'`]/g,
		/\bimport\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
		/\brequire\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
	];
	for (const pattern of patterns) {
		for (const match of code.matchAll(pattern)) found.push(match[1]);
	}
	return found;
};

const offendingSpecifier = (specifier) =>
	specifier.startsWith("node:") || BARE_BUILTINS.has(specifier);

/** Every file under a directory, recursively, matching one of the extensions. */
const walk = (dir, extensions) => {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) out.push(...walk(full, extensions));
		else if (extensions.some((extension) => entry.endsWith(extension))) out.push(full);
	}
	return out;
};

const lineOf = (code, index) => code.slice(0, index).split("\n").length;

/** Every finding in one file, named precisely enough to fix without hunting. */
const audit = (path) => {
	const raw = readFileSync(path, "utf8");
	const code = stripComments(raw);
	const findings = [];

	for (const specifier of specifiers(code)) {
		if (offendingSpecifier(specifier)) {
			findings.push(`${path}: imports the Node builtin "${specifier}"`);
		}
	}
	for (const [pattern, name] of NODE_GLOBALS) {
		const match = pattern.exec(code);
		if (match) {
			findings.push(`${path}:${lineOf(code, match.index)}: reaches the Node global \`${name}\``);
		}
	}
	return findings;
};

test("no source module imports a Node builtin or reaches a Node global", () => {
	const files = walk(SRC, [".ts"]);
	assert.ok(files.length > 0, "found no sources to audit — the paths are wrong");

	const findings = files.flatMap(audit);

	assert.deepEqual(
		findings,
		[],
		`This package claims Node 20+, Workers, Bun and Deno on one build.\n${findings.join("\n")}\n` +
			"Web Crypto, fetch, TextEncoder and setTimeout are the portable equivalents.",
	);
});

test("neither built artifact carries a Node builtin either", () => {
	// The backstop: a builtin can also arrive through a dependency or a bundler
	// shim, and neither shows up in `src`. `dist/index.cjs` is CommonJS, so its
	// own `exports` assignments are the module format and not a Node API; a
	// `require("fs")` in it would be the thing this catches.
	const files = walk(DIST, [".js", ".cjs"]);
	assert.ok(files.length > 0, "found no build output — run `pnpm build` first");

	const findings = files.flatMap(audit);

	assert.deepEqual(findings, [], findings.join("\n"));
});

test("the package declares no dependencies at all", () => {
	// Nothing to audit is the strongest version of the guard above. A dependency
	// is where a Node builtin arrives without anybody writing an import.
	const pkg = JSON.parse(readFileSync(join(here, "..", "package.json"), "utf8"));

	assert.deepEqual(pkg.dependencies ?? {}, {});
	assert.deepEqual(pkg.peerDependencies ?? {}, {});
});
