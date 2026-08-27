---
"@activekit/js": patch
"@activekit/react": patch
---

Point the default app origin at `play.activekit.app`, where the app is
actually served. It defaulted to `app.activekit.app`, a hostname nothing
listens on, so every integration that did not pass `appUrl` opened a frame
that could never load. Caught the day the app first deployed.
