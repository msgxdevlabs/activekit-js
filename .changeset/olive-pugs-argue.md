---
"activekit": patch
---

Call `POST /subject-sessions` with a `subject` field, which is what the platform
serves and accepts. It posted to `/subjects/tokens` with a `subjectId` and an
unsupported `ttlSeconds`, so minting a browser token failed for every caller.
