# Short owner lane

Everything in this repository that is a person's rather than a session's, in
one screen. One card per walk: where to be, what it holds open, the steps, and
what a pass looks like. The why lives where each card points:
[`CLAUDE.md`](../CLAUDE.md), [`docs/packaging.md`](packaging.md), the demo's
[`README.md`](../examples/customer-demo/README.md), and `docs/owner-lane.md` in
`activekit-io` for the items that span all three repositories.

> [!NOTE]
> **How a card reads.** **Where** is the surface, **Holds** is what the walk
> keeps open. **Do** is numbered so a step has a name, and "J02 failed at step
> 4" is enough to say back to the loop. **Pass** is a checklist, tick as you
> go. A callout under the card names a prerequisite or the way it fails.

> [!IMPORTANT]
> **Rules for this file.** One ID per walk, `J01` onward, never reused, and
> the letter is the repository so an ID resolves from any of the three: `W` is
> `activekit-io`, `P` is `activekit-play`, `J` is this repository. A walk added
> to the lane gets its card here in the same pull request, and a finished walk
> leaves. Every walk that fails comes back as a bug report, and the loop turns
> it into a story.

> [!IMPORTANT]
> **Which tier, and which environment.** Two axes, easy to conflate. The
> **tier** is which deployment you open: dev, staging or production. The
> **environment** is the toggle inside an app on the dashboard: Sandbox or
> Production keys. The rule, the same in all three repositories:
>
> | Walk | Tier | Why |
> |---|---|---|
> | A screen or API nothing outside one repository touches | **Dev** | Each repository's dev Worker is its own, redeployed on every merge, so it holds the newest build |
> | Anything the demo, the golden loop or a second repository touches, webhooks included | **Staging** | The only tier where io, play and js meet; the demo Worker holds a staging sandbox key |
> | Anything | **Production** | Never for a walk. Production is a release, and yours to dispatch |
>
> This repository deploys nothing itself, so its walks sit outside the table:
> J02 runs on your machine against the in-memory mock, and J01 and J03 are
> npm and Cloudflare. When a walk needs a deployed platform it is
> **staging**, and that walk lives in `activekit-play` as `P03`.

## Walks

### J01. Release to npm

- **Where:** Actions, the Release workflow, from `main`
- **Holds:** the only approval in this repository that is yours. Merging is the session's, and publishing what it merged is not

**Do**

1. Read what would publish. Every `.changeset/*.md` not yet listed in `.changeset/pre.json` is unreleased, and only one with a package name in its front matter ships anything. On 2026-09-09 that is one, `webhook-on-and-track`, a minor for `activekit`: `webhooks.on` arrives and `events.record` becomes `events.track`.
2. Actions tab, **Release** in the left sidebar, **Run workflow**, branch `main`, type `RELEASE` into the confirmation box, run.
3. Validate, for each package that shipped:

   ```bash
   npm view <name> version dist-tags
   npm view <name> dependencies
   ```

**Pass**

- [ ] The run went green in about two minutes, and packages with no changeset were skipped rather than republished.
- [ ] The new version is on the registry, and `workspace:^` was rewritten to real ranges.
- [ ] The repository has a new `<name>@<version>` tag with a matching GitHub release, and the npm page shows the provenance badge.

> [!IMPORTANT]
> The repository is in changesets pre mode, tag `alpha`, so a release moves
> the `alpha` dist-tag and leaves `latest` where it is. Leaving pre mode is a
> decision, not a side effect: `pnpm changeset pre exit` in its own pull
> request, on your word. Never `pnpm publish` from a laptop, and a session
> never runs this dispatch.

### J02. The demo, as a developer sees it

- **Where:** this checkout, `pnpm demo`, then `http://localhost:4173`
- **Holds:** the word "shipped" for any SDK change. `pnpm check` exercises nothing against a deployed API, and this walk is the part no gate covers

**Do**

1. `pnpm install`, then `pnpm demo`. It builds first, so the page serves the exact minified file a customer ships.
2. Open the page. It is Acme Learn, a pretend language app, with the ActiveKit bubble docked in a corner.
3. Under Demo controls press **Complete today's practice** a few times, then **Finish a lesson**, then **A referred friend signs up**.
4. Press the bubble.
5. Close the app, press **Reset demo state**, and open the network tab before pressing the bubble again.

**Pass**

- [ ] The bubble has two states and no middle panel. A dot appears when something is unacknowledged, and opening the app clears it.
- [ ] The app opens on `localhost:4174`, a different origin, in a frame over the dimmed page.
- [ ] A goal moves on each press, and a grant lands when a goal is met.
- [ ] In the network tab the frame's URL carries `theme` and a protocol version and no token. Every request from the page under `/v1/me` is a `GET`.

> [!NOTE]
> The mock behind the demo is shaped by the platform, never by the SDKs:
> events are idempotent per key, an unconfirmed name answers 202, and the
> acknowledgment happens inside the grants read. A demo that disagrees with
> staging is a bug in the mock, and the mock loses.

### J03. Stand up `cdn.activekit.app`

- **Where:** the Cloudflare dashboard
- **Holds:** CDN delivery of the shell, the one path no environment exercises. Drift row 3 in `docs/integration-map.md` in `activekit-play`

**Do**

1. Create the Worker or bucket the CDN serves from, and the DNS record for `cdn.activekit.app`, both console acts behind your sign-in.
2. Tell the loop which. Publishing the `<script>` build to it on each release is the session's to write once the host exists; `README.md` under CDN pins the path shape, `/v<version>/activekit.js`.

**Pass**

- [ ] `https://cdn.activekit.app` answers, and the demo in `activekit-play` can mount the shell from it instead of from npm.

> [!NOTE]
> Until this exists the demo mounts the shell from npm, which is why P03 in
> `activekit-play` cannot prove CDN delivery.

### J04. Delete the merged branches

- **Where:** a terminal with this checkout
- **Holds:** nothing. Cosmetic

**Do**

1. Run the js command in item 12 of `docs/owner-lane.md` in `activekit-io`. It keeps `feature/subject-session-sdk`, the only copy of `packages/server/src/credentials.ts`, until someone reads whether `main`'s `subjects.createSession` made it redundant, and deletes only what is merged into `main` by ancestry or by squash.

**Pass**

- [ ] `git ls-remote --heads origin | wc -l` prints `main`, the kept branch, and whatever is in flight, and no more. It printed 17 on 2026-09-09.

> [!NOTE]
> No session can remove a ref, the proxy answers 403, which is why this is
> yours. Two minutes.
