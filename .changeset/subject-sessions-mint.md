---
"activekit": minor
---

Add `subjects.createSession`, the missing link between an API key and a browser.

Until now nothing this SDK shipped could obtain a subject token. The
`subjects.createToken` it shipped instead could not: it called
`POST /v1/subjects/tokens`, a path the platform does not serve, with a body the
real route's strict schema rejects twice over. It has never worked against any
server, so this replaces it rather than deprecating it.

```ts
const session = await activekit.subjects.createSession({ subject: user.id });
```

**Breaking, and free while it is.** `subjects.createToken` is gone. The two
arguments it took are gone with it: `subjectId` is `subject`, the key the API's
strict body actually names, and `ttlSeconds` has no replacement because the
platform fixes the lifetime at fifteen minutes and 400s a body that asks for
another. A parameter that typechecks and then fails in production is worse than
no parameter.

The result is `POST /v1/subject-sessions`' answer, whole and unreshaped —
`token`, `expiresAt`, `subject.externalId` and `environment`. Send it as it
stands: every field is either the credential being delivered or a fact about it,
so `res.json(session)` is correct by construction and stays correct when the
contract adds a field. `environment` is the one worth asserting on, because "my
events go to sandbox and my widget shows production" is a real confusion and
this is the first place it is visible.

**The client now refuses to construct where a DOM exists.** This package holds a
credential granting organization-wide read and write, and minting a browser's
token is the first reason anybody has to want it near a browser, so the bar is
not that browser use is discouraged — it is that it does not work:

```ts
new ActiveKit({ apiKey }); // TypeError, in a page
```

There is no opt-out option, deliberately: an escape hatch is set by exactly the
person the guard exists to stop. If a test runner puts server code under jsdom,
the fix is that file's test environment. Two smaller guards ride along. A
subject session token passed as `apiKey` is refused by name rather than left to
answer a confusing 401, and a subject id that is `""`, `"undefined"` or `"null"`
is refused before it reaches the network — subjects are created on first sight,
so a coerced empty value does not fail there, it mints a working session for a
subject nobody meant to exist.

**Nothing here refreshes a session, and that is the design.** Renewal happens
where the token is spent, which is the browser; minting happens where the API
key is, which is not. A refresh helper in this package would need the key at the
moment of renewal, so it would be either useless in a page or catastrophic in
one. The seam that works needs no SDK support: your server exposes its own
authenticated route calling `createSession`, the page fetches it before
`expiresAt`, and `@activekit/js`'s `setToken` swaps the credential in place.
`examples/customer-demo` does exactly that.

JSDoc no longer ships in `dist/index.js`. `dist/index.d.ts` keeps every word,
which is where an editor reads them and therefore where a developer does. The
bundle is 2.78 kB brotli against its 5 kB budget, below the 3.00 kB it measured
before this change, so the budget goes back to guarding dependency creep rather
than prose.
