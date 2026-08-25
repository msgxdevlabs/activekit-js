/**
 * The two credentials, and the guards that keep them apart.
 *
 * ActiveKit has exactly two secrets a customer handles, and they have opposite
 * blast radii:
 *
 * | Credential | Grants | Lives |
 * |---|---|---|
 * | API key, `ak_…` | Organization-wide read **and write** | Your server, forever |
 * | Subject session token, a JWT | One subject's own `GET /v1/me/*` | One browser, fifteen minutes |
 *
 * `subjects.createSession` is the bridge between them, and it is also the first
 * reason anybody has to want this package near a browser: the browser needs the
 * token, so the naive reach is to mint it where it is used. That is the exact
 * move that puts an organization-wide write credential in a page's source, and
 * this file is the reason it does not work.
 *
 * Every guard here fails at construction, before a request is built, because a
 * credential mistake that reaches the network has already been logged by
 * something along the way.
 */

/** What the platform's own `looksLikeApiKey` admits, and nothing else does. */
const API_KEY_PREFIX = "ak_";

/** The platform bounds a subject id at 256 characters, same as event ingest. */
export const SUBJECT_ID_MAX_LENGTH = 256;

/**
 * A subject session, exactly as `POST /v1/subject-sessions` answers it.
 *
 * Nothing here is invented and nothing is reshaped. That is deliberate: this
 * object's whole job is to be handed to one browser, so `res.json(session)` has
 * to be correct by construction. A field the SDK renamed would be a field that
 * disagrees with the OpenAPI contract the app on the other side generates its
 * own types from, and a field the SDK computed would be a field that disagrees
 * with the server that computed the real one.
 *
 * It is safe to send whole. The token is the thing being delivered, the expiry
 * and the environment are facts about it, and `subject.externalId` is an
 * identifier the customer's own browser already knows, because the customer
 * chose it. The API key is not reachable from here in any form.
 */
export interface SubjectSession {
	/**
	 * The credential the browser presents as `Authorization: Bearer`.
	 *
	 * Send it through the shell handshake, never in a URL: the API refuses a
	 * token in a query string outright rather than 401-ing, because by then it
	 * is already in browser history, in a referrer header and in every access
	 * log between the page and the API.
	 *
	 * Not recoverable after this response. Nothing stores it, here or there.
	 */
	readonly token: string;
	/**
	 * ISO 8601, when the token stops being accepted.
	 *
	 * The lifetime is the platform's and is not negotiable per call, so this is
	 * a fact to schedule against rather than something a caller asked for. See
	 * the note on refresh in `SubjectSessionInput`.
	 */
	readonly expiresAt: string;
	readonly subject: {
		/** The id you passed, echoed. Subjects are created on first sight, per app. */
		readonly externalId: string;
	};
	/**
	 * Which side of the app the presented API key is scoped to, and therefore
	 * which side this session reads.
	 *
	 * Worth asserting on in your own integration test. "My events go to sandbox
	 * and my widget shows production" is a real confusion with an expensive
	 * shape, and this field is where it becomes visible at integration time
	 * rather than after a support ticket.
	 */
	readonly environment: "sandbox" | "production";
}

/**
 * What minting a session takes: the subject, and nothing else.
 *
 * **There is no lifetime option, and its absence is the design.** The platform
 * fixes the token's life at fifteen minutes and rejects a body carrying any
 * other field, so a `ttlSeconds` on this type would be a parameter that
 * typechecks, ships, and then 400s in production against a real customer. The
 * type says what the wire accepts.
 *
 * **There is no refresh option either, for a sharper reason.** Refreshing has
 * to happen where the token is spent, which is the browser, and minting has to
 * happen where the API key is, which is not. Any helper in this package that
 * kept a session alive would need the key at the moment of renewal, so it would
 * either be useless in the browser or catastrophic there. The seam that works
 * has three steps and no SDK support at all: your server exposes its own
 * authenticated endpoint that calls this method, the page fetches that endpoint
 * when `expiresAt` gets close, and `@activekit/js`'s `setToken` swaps the
 * credential in place without rebuilding the client.
 */
export interface SubjectSessionInput {
	/**
	 * The identifier your own system knows this person by, exactly as your
	 * events carry it. Up to {@link SUBJECT_ID_MAX_LENGTH} characters.
	 *
	 * Pass the id of whoever is actually signed in, read from your own session,
	 * never a value the browser sent you. This call is the moment your server
	 * asserts who someone is; ActiveKit takes that assertion on your word,
	 * because only you can know it.
	 */
	subject: string;
}

/**
 * Refuse to run in a browser.
 *
 * This client holds an organization-wide read-write credential, so the honest
 * bar is not that browser use is discouraged but that it does not work. Code
 * that constructs an `ActiveKit` in a page throws on the line that constructs
 * it, in development, on the developer's own machine, before a bundle carrying
 * the key is ever deployed.
 *
 * The check is `document`, deliberately, rather than `window`: Workers define
 * neither, Deno defined `window` for years and never a `document`, and no
 * server runtime has ever had one. A DOM is the signal.
 *
 * There is no opt-out option, and that is the point of having the guard. A
 * `dangerouslyAllowBrowser`-style escape hatch is set by exactly the person the
 * guard exists to stop, and it turns a mistake nobody can make into a mistake
 * with a documented spelling. If a test runner puts server code under jsdom,
 * the fix is that file's test environment, not this package's.
 */
export const assertServerRuntime = (): void => {
	if (typeof document === "undefined" || typeof document.createElement !== "function") return;

	throw new TypeError(
		"ActiveKit: the `activekit` package cannot run in a browser. It holds an " +
			"organization API key, which grants organization-wide read and write, and " +
			"there is no scoping that makes that safe in a page. Construct it on your " +
			"server, mint a session with `subjects.createSession`, and send only that " +
			"token to the browser for `@activekit/js` to read with.",
	);
};

/**
 * Refuse a subject session token presented as an API key.
 *
 * A deny list rather than an allow list, and the asymmetry is the argument: an
 * `ak_` allow list would refuse a valid key the day the platform mints a second
 * prefix, whereas a JWT can never be an API key at all, because the API refuses
 * every presented string that does not open with `ak_`. So this refuses only
 * what is certainly wrong, and it stays correct without maintenance.
 *
 * Worth catching rather than leaving to the network. A session token in the
 * `apiKey` slot answers 401, which reads as a revoked or mistyped key and sends
 * the reader to their dashboard rather than to the line above.
 */
export const assertApiKeyShape = (apiKey: string): void => {
	const segments = apiKey.split(".");
	const looksLikeAJwt = segments.length === 3 && segments[0]?.startsWith("ey") === true;

	if (looksLikeAJwt) {
		throw new TypeError(
			"ActiveKit: `apiKey` looks like a subject session token, not an API key. " +
				"The two are opposites: a session token is minted per subject, lives " +
				"minutes and only reads `GET /v1/me/*`, while an API key is your " +
				"organization's server credential and starts `ak_`. This client takes the key.",
		);
	}

	if (!apiKey.startsWith(API_KEY_PREFIX)) {
		// Not fatal. The prefix is what the API admits today, but refusing here
		// would make this package the reason a newly minted key does not work, and
		// a wrong guess about someone else's key format is worse than a 401.
		console.warn(
			`ActiveKit: \`apiKey\` does not start with \`${API_KEY_PREFIX}\`. Every key from ` +
				"`POST /v1/apps/{app}/keys` does, so this is probably the wrong value.",
		);
	}
};

/**
 * Refuse a subject id the API would either reject or, worse, accept.
 *
 * The second half is why this is not left to the server. Subjects are created
 * on first sight, so `String(user?.id)` on a signed-out request does not fail:
 * it mints a real, working session for a real, new subject called `"undefined"`
 * and every event that user ever generates lands on it. An empty string is the
 * same bug one type coercion earlier. Both are caught here, on the caller's own
 * stack, where the wrong variable is visible.
 */
export const assertSubjectId = (subject: unknown): string => {
	if (typeof subject !== "string" || subject.length === 0) {
		throw new TypeError(
			"ActiveKit: `subject` is required — pass the id your own system knows this " +
				"person by, read from your server-side session.",
		);
	}

	if (subject === "undefined" || subject === "null") {
		throw new TypeError(
			`ActiveKit: \`subject\` is the string "${subject}", which is a coerced empty ` +
				"value rather than an id. Subjects are created on first sight, so this " +
				"would mint a working session for a subject nobody meant to create.",
		);
	}

	if (subject.length > SUBJECT_ID_MAX_LENGTH) {
		throw new TypeError(
			`ActiveKit: \`subject\` is ${subject.length} characters; the limit is ` +
				`${SUBJECT_ID_MAX_LENGTH}, the same bound event ingest carries.`,
		);
	}

	return subject;
};
