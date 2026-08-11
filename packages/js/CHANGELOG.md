# @activekit/js

## 0.1.0

### Minor Changes

- 1ef7d09: First public release.

  Server SDK (`activekit`): event recording with idempotency keys, grant reads,
  subject token minting, and Web Crypto webhook verification that runs unchanged
  on Node, Workers, Bun and Deno.

  Browser client (`@activekit/js`): read-only, zero-dependency client with retry
  and `Retry-After` handling, plus a shadow-DOM widget that cannot leak styles
  into — or inherit them from — the host page. It reads a subject's own progress
  and grants and issues nothing but `GET`s: anything the browser can write, the
  browser's owner can forge, so recording events stays on the server side of the
  API key. Test-enforced, not just documented.

  Bindings (`@activekit/react`, `@activekit/svelte`, `@activekit/elements`):
  lifecycle glue over the same widget. No logic of their own.
