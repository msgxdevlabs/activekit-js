/*
 * Serves the stand-in ActiveKit app, on its own port.
 *
 * The port is the point. In production the app is on `app.activekit.app` and
 * the customer's page is on theirs, so the frame is genuinely cross-origin and
 * the message protocol is the only way across. Serving this from the customer
 * demo's own server would make the boundary imaginary and the handshake
 * untested — a same-origin iframe can just reach into `parent`.
 *
 *   node examples/dummy-app/server.mjs        → http://localhost:4174
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.APP_PORT ?? 4174);
const publicDir = fileURLToPath(new URL("public/", import.meta.url));

const TYPES = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".svg": "image/svg+xml",
	".json": "application/json; charset=utf-8",
};

const server = createServer(async (req, res) => {
	const url = new URL(req.url, `http://localhost:${PORT}`);

	// `/embed` is the route the shell frames. Everything else is assets.
	const name = url.pathname === "/" || url.pathname === "/embed" ? "embed.html" : url.pathname.slice(1);

	// Normalize before joining: `/../` in a request path must not escape the
	// public directory.
	const target = join(publicDir, normalize(name).replace(/^(\.\.[/\\])+/, ""));
	if (!target.startsWith(publicDir)) {
		res.writeHead(403).end("forbidden");
		return;
	}

	try {
		const body = await readFile(target);
		res.writeHead(200, {
			"content-type": TYPES[extname(target)] ?? "application/octet-stream",
			"cache-control": "no-store",
			// The real app sets this per tenant from their configured domains.
			// Absent it, any site could frame the app; present and empty, none
			// could. The demo allows framing from anywhere for convenience and
			// says so rather than quietly shipping a bad default.
			"content-security-policy": "frame-ancestors *",
		}).end(body);
	} catch {
		res.writeHead(404, { "content-type": "text/plain" }).end("not found");
	}
});

server.on("error", (error) => {
	if (error.code === "EADDRINUSE") {
		console.error(`✗ Port ${PORT} is in use — APP_PORT=4184 node examples/dummy-app/server.mjs`);
		process.exit(1);
	}
	throw error;
});

server.listen(PORT, process.env.HOST ?? "127.0.0.1", () => {
	console.log(`ActiveKit app (stand-in) → http://localhost:${PORT}/embed`);
});
