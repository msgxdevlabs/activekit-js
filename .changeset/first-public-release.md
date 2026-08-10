---
"@activekit/elements": minor
"@activekit/svelte": minor
"@activekit/react": minor
"@activekit/js": minor
"activekit": minor
---

First public release.

Server SDK (`activekit`): event recording with idempotency keys, grant reads,
subject token minting, and Web Crypto webhook verification that runs unchanged
on Node, Workers, Bun and Deno.

Browser client (`@activekit/js`): zero-dependency client with retry and
`Retry-After` handling, plus a shadow-DOM widget that cannot leak styles into
— or inherit them from — the host page.

Bindings (`@activekit/react`, `@activekit/svelte`, `@activekit/elements`):
lifecycle glue over the same widget. No logic of their own.
