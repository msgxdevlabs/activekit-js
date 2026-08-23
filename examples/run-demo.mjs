/*
 * Runs both halves of the demo, because the boundary between them is the
 * thing being demonstrated.
 *
 *   :4173  Acme Learn — the customer's page, their backend, the mock API
 *   :4174  the ActiveKit app — a different origin, framed by the shell
 *
 * Ctrl-C stops both.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const run = (path, name) => {
	const child = spawn(process.execPath, [fileURLToPath(new URL(path, import.meta.url))], {
		stdio: "inherit",
		env: process.env,
	});
	child.on("exit", (code) => {
		if (code) console.error(`✗ ${name} exited with ${code}`);
		process.exit(code ?? 0);
	});
	return child;
};

const children = [run("dummy-app/server.mjs", "app"), run("customer-demo/server.mjs", "demo")];

for (const signal of ["SIGINT", "SIGTERM"]) {
	process.on(signal, () => {
		for (const child of children) child.kill(signal);
		process.exit(0);
	});
}
