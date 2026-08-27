---
"activekit": minor
---

Rename `subjects.createToken` to `subjects.createSession`. It returns a session,
not just a token: the platform serves `/v1/subject-sessions` and answers with the
token, its expiry and the subject it belongs to, so the old name described one
field of the answer and made every reader translate.
