// The sample customer: "Acme Learn", a fictional language-learning app.
//
// One process plays three roles, so the whole demo is `node server.mjs`:
//
//   1. Acme's backend        — the part a real customer writes. It holds the
//      API key, mints subject sessions for its logged-in user, and records
//      events through the `activekit` server SDK. Marked ⭐ below.
//   2. Acme's static site    — serves public/ and the built @activekit/js.
//   3. A mock ActiveKit API  — stands in for api.activekit.app, which is not
//      live yet. A real integration deletes this role entirely.
//
// Run from the repo root, after `pnpm install && pnpm build`:
//
//   node examples/customer-demo/server.mjs
//   open http://localhost:4173

import { createServer } from "node:http";
import { existsSync, createReadStream, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import { ActiveKit } from "../../packages/server/dist/index.js";
import { API_KEY, handleMockApi, reset, seed } from "./mock-activekit.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(here, "public");
const sdkDir = join(here, "..", "..", "packages", "js", "dist");

if (!existsSync(join(sdkDir, "index.js"))) {
	console.error("✗ packages/js/dist is missing — run `pnpm build` at the repo root first.");
	process.exit(1);
}

const PORT = Number(process.env.PORT ?? 4173);

// In a real app this is whoever your session says is logged in.
const DEMO_USER = "usr_demo_1";
seed(DEMO_USER);

// ⭐ Acme's server-side ActiveKit client. In production you drop `apiUrl`
// (the SDK defaults to api.activekit.app/v1) and read the key from a secret.
const activekit = new ActiveKit({
	apiKey: API_KEY,
	apiUrl: `http://127.0.0.1:${PORT}/v1`,
});

// Demo actions. Each maps a thing a user did in Acme's product to the event
// Acme's backend records for it. `idempotencyKey` is the dedup handle: a
// retried request must not advance a streak twice. The daily check-in uses a
// fresh key per click so *the demo* can simulate many days in one sitting —
// in production it would be `${userId}:practice:${today}` so a user checking
// in twice on one day counts once.
const ACTIONS = {
	practice: () => ({
		name: "practice.checkin",
		idempotencyKey: `practice:${randomUUID()}`,
	}),
	lesson: () => ({
		name: "lesson.completed",
		properties: { course: "spanish-101" },
		idempotencyKey: `lesson:${randomUUID()}`,
	}),
	refer: () => ({
		name: "referral.converted",
		idempotencyKey: `referral:${randomUUID()}`,
	}),
};

const MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".map": "application/json",
	".json": "application/json",
	".svg": "image/svg+xml",
	".png": "image/png",
	".ico": "image/x-icon",
};

const json = (res, status, body) => {
	res.writeHead(status, { "content-type": "application/json" });
	res.end(JSON.stringify(body));
};

const serveFile = (res, baseDir, relativePath) => {
	// Resolve inside baseDir only — a static server that follows `..` serves
	// the whole filesystem.
	const path = normalize(join(baseDir, relativePath));
	if (!path.startsWith(baseDir) || !existsSync(path) || !statSync(path).isFile()) {
		res.writeHead(404, { "content-type": "text/plain" });
		res.end("Not found");
		return;
	}
	res.writeHead(200, { "content-type": MIME[extname(path)] ?? "application/octet-stream" });
	createReadStream(path).pipe(res);
};

const readBody = (req) =>
	new Promise((resolve) => {
		// Cap the buffer and settle on abort: an uncapped concat is a memory
		// hole, and a promise that never resolves on a dropped upload pins the
		// handler closure forever. Demo bodies are tiny; 64 KB is generous.
		let raw = "";
		req.on("data", (chunk) => {
			raw += chunk;
			if (raw.length > 64 * 1024) {
				resolve(null);
				req.destroy();
			}
		});
		req.on("end", () => {
			try {
				resolve(raw ? JSON.parse(raw) : null);
			} catch {
				resolve(null);
			}
		});
		req.on("error", () => resolve(null));
	});

const server = createServer(async (req, res) => {
	const url = new URL(req.url, `http://localhost:${PORT}`);
	const body = req.method === "POST" ? await readBody(req) : null;

	// Role 3: the mock ActiveKit API (everything under /v1/).
	if (handleMockApi(req, res, url, body)) return;

	// ⭐ Role 1: Acme's backend.
	//
	// GET /api/activekit/token — the browser exchanges Acme's session for a
	// subject token. The API key never leaves this process; the browser only
	// ever sees a short-lived token scoped to this one user.
	if (url.pathname === "/api/activekit/token" && req.method === "GET") {
		try {
			// The whole answer, forwarded unchanged. Every field is either the
			// credential being delivered or a fact about it, so there is nothing to
			// pick out and nothing here that could leak the key.
			json(res, 200, await activekit.subjects.createSession({ subject: DEMO_USER }));
		} catch (error) {
			json(res, 502, { error: String(error?.message ?? error) });
		}
		return;
	}

	// ⭐ POST /api/actions/:action — the user did something in Acme's product;
	// Acme's backend records the event. This is the only way progress ever
	// moves: the browser client is read-only by design.
	const action = /^\/api\/actions\/(\w+)$/.exec(url.pathname);
	if (action && req.method === "POST") {
		// hasOwn, not a bare lookup: /api/actions/constructor must 404, not
		// reach into Object.prototype.
		const build = Object.hasOwn(ACTIONS, action[1]) ? ACTIONS[action[1]] : undefined;
		if (!build) {
			json(res, 404, { error: `unknown action ${action[1]}` });
			return;
		}
		try {
			const result = await activekit.events.record({ subjectId: DEMO_USER, ...build() });
			json(res, 200, result);
		} catch (error) {
			json(res, 502, { error: String(error?.message ?? error) });
		}
		return;
	}

	// Demo-only: put the in-memory state back to its seeded start.
	if (url.pathname === "/api/demo/reset" && req.method === "POST") {
		reset(DEMO_USER);
		json(res, 200, { ok: true });
		return;
	}

	// Role 2: static files. /sdk/* is the built @activekit/js — in production
	// this is `pnpm add @activekit/js` and your bundler instead.
	if (url.pathname.startsWith("/sdk/")) {
		serveFile(res, sdkDir, url.pathname.slice("/sdk/".length));
		return;
	}
	serveFile(res, publicDir, url.pathname === "/" ? "index.html" : url.pathname.slice(1));
});

server.on("error", (error) => {
	if (error.code === "EADDRINUSE") {
		console.error(`✗ Port ${PORT} is already in use — pick another: PORT=4174 node examples/customer-demo/server.mjs`);
		process.exit(1);
	}
	throw error;
});

// Loopback only: this process holds a (demo) API key, and a rewards demo has
// no business being reachable from the rest of the network. HOST=0.0.0.0 if
// you really need it (e.g. from inside a container).
server.listen(PORT, process.env.HOST ?? "127.0.0.1", () => {
	console.log(`Acme Learn demo → http://localhost:${PORT}`);
	console.log(`  mock ActiveKit API at /v1, Acme backend at /api, SDK served from /sdk`);
});
