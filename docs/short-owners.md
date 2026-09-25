# Short owner lane

Everything in this repository that is a person's rather than a session's, in
one screen. One card per walk, steps only, the way a configuration runbook
reads. The why lives where each card points:
[`CLAUDE.md`](../CLAUDE.md), [`docs/packaging.md`](packaging.md), the demo's
[`README.md`](../examples/customer-demo/README.md), and `docs/owner-lane.md` in
`activekit-io` for the items that span all three repositories.

> [!NOTE]
> **How a card reads.** The heading is the walk's ID and title. One note under
> it carries three fields and nothing else: **Tier**, the deployment or machine
> the walk opens; **Needs**, what has to be true before step 1; **Holds**, what
> the walk keeps open. The table is the steps, one imperative sentence each,
> with every control a person presses or reads in **bold**, spelled as the
> screen spells it, and every value a person types in `code`. **Where** is how
> to get there: a URL in angle brackets when one exists, the screen region in
> plain words otherwise. **Pass** is a checklist of facts read off the screen or
> a response, one sentence each. A warning or important banner under a card is
> a failure mode, an ordering rule or a dated fact, one sentence each. "J02
> failed at step 4" is enough to say back to the loop.

> [!IMPORTANT]
> **Rules for this file.** One ID per walk, `J01` onward, never reused, and
> the letter is the repository so an ID resolves from any of the three: `W` is
> `activekit-io`, `P` is `activekit-play`, `J` is this repository. A walk added
> to the lane gets its card here in the same pull request, and a finished walk
> leaves on your word. Every URL, route, control label and file path in a card
> is checked against `origin/main` before it is written, and
> `scripts/short-owners.test.mjs` holds every card to the shape above. Every
> walk that fails comes back as a bug report, and the loop turns it into a
> story.

> [!IMPORTANT]
> **Which tier, and which environment.** Two axes, easy to conflate. The
> **tier** is which deployment you open: dev, staging or production. The
> **environment** is the toggle inside an app on the dashboard: Sandbox or
> Production keys. The rule, the same in all three repositories:
>
> | Tier | Walk? | Why |
> |---|---|---|
> | **Staging** | Every walk that opens a deployment, whatever it touches | The only tier you walk, and the only tier where io, play and js meet |
> | **Dev** | Never | A session's tier for checking its own work. Nothing is asked of you on it |
> | **Production** | Never | A release, and yours to dispatch |
>
> This repository deploys nothing itself, so its walks sit outside the table:
> J01 is an Actions dispatch, J02 runs on your machine against the in-memory
> mock, J03 is the Cloudflare dashboard and J04 is a terminal. In the
> repositories that do deploy, anything the loop wants you to look at is
> deployed to staging first, with the steps for walking it, and a walk here that
> needs a deployed platform is **staging** too and lives in `activekit-play` as
> `P03`. Written down on 2026-09-24, on your word that staging is the only
> environment you test.

## Walks

### J01. Release to npm

> [!NOTE]
> **Tier:** GitHub Actions, from `main` · **Needs:** an unreleased changeset that names a package · **Holds:** the only approval in this repository that is yours; merging is the session's, and publishing what it merged is not

| # | Step | Where |
|---|---|---|
| 1 | Read every `.changeset/*.md` whose name is not listed in `.changeset/pre.json` | [`.changeset/`](../.changeset/) |
| 2 | Open the **Release** workflow and press **Run workflow** | <https://github.com/msgxdevlabs/activekit-js/actions/workflows/release.yml> |
| 3 | Pick branch `main`, type `RELEASE` under **Type RELEASE to publish to npm**, and press **Run workflow** | The **Run workflow** menu |
| 4 | Run `npm view <name> version dist-tags` and `npm view <name> dependencies` for each package that shipped | A terminal |

**Pass**

- [ ] The run is green in about two minutes, and packages with no changeset were skipped rather than republished.
- [ ] The new version is on the registry under the `alpha` dist-tag, and `workspace:^` was rewritten to real ranges.
- [ ] The repository has a new `<name>@<version>` tag with a matching GitHub release, and the npm page shows the provenance badge.

> [!IMPORTANT]
> Only a changeset that names a package in its front matter ships anything; an empty one records plumbing and releases nothing.

> [!IMPORTANT]
> On 2026-09-09 one unreleased changeset named a package, `webhook-on-and-track`, a minor for `activekit`; on 2026-09-25 seven do, that one plus `card-defaults-to-main-quest`, `card-learns-slot-and-title`, `demo-and-stand-in-draw-v2`, `frame-ground-follows-template`, `served-streak-reaches-the-sdk` and `shell-reads-ground-after-config`, and nothing has been released between the two dates.

> [!IMPORTANT]
> The repository is in changesets pre mode, tag `alpha`, so a release moves the `alpha` dist-tag and leaves `latest` where it is, and leaving pre mode is `pnpm changeset pre exit` in its own pull request, on your word.

> [!WARNING]
> Never `pnpm publish` from a laptop, and a session never runs this dispatch.

### J02. The demo, as a developer sees it

> [!NOTE]
> **Tier:** your machine, this checkout · **Needs:** `pnpm install` done, ports 4173 and 4174 free · **Holds:** the word "shipped" for any SDK change, since `pnpm check` exercises nothing against a deployed API

| # | Step | Where |
|---|---|---|
| 1 | Run `pnpm demo` | This checkout |
| 2 | Open the page | <http://localhost:4173> |
| 3 | Read the streak chip | Acme's nav, beside **Toggle dark mode** |
| 4 | Press **Practice for five minutes** twice, reading the chip after each press | The **Demo controls** card |
| 5 | Press **A referred friend signs up**, then **Log a sprint session** | The **Demo controls** card |
| 6 | Press the **Your rewards** bubble | The corner of the page |
| 7 | Read **Home**, then press **Map** | The nav at the foot of the frame |
| 8 | Leave the app open and press a lesson's **Start** button on the page behind it | The lesson rows under **Spanish 101 · Unit 3** |
| 9 | Press **Toggle dark mode**, then open the app again | Acme's nav |
| 10 | Close the app, press **Reset demo state**, open the browser's network tab, and press the bubble again | The **Demo controls** card, then the corner |

**Pass**

- [ ] The streak chip reads 4 on load, 5 after the first press of **Practice for five minutes**, and 5 after the second.
- [ ] The bubble has two states and no middle panel, a dot is on it on load, and opening the app clears the dot.
- [ ] The app opens on `localhost:4174`, a different origin, in a frame over the dimmed page.
- [ ] **Home** draws the week strip, the main quest's objectives, today's objective and the side quests, with no claim control anywhere and today's cell in the week strip the only thing moving.
- [ ] **Map** draws the goal strip across the top and the route below it, with exactly one station pulsing.
- [ ] A goal moves on each press, a grant lands when a goal is met, and with the app open a press on the page behind it moves a goal in the app too.
- [ ] The frame's ground is the app's own in both page themes: switching the page to dark changes the bubble and the scrim, leaves the ground behind the app alone, and never flashes the page's background at the moment the app appears.
- [ ] In the network tab the frame's URL carries `theme` and `v` and no token, and every request from the page under `/v1/me` is a `GET`.

> [!IMPORTANT]
> The mock behind the demo is shaped by the platform, never by the SDKs, so a demo that disagrees with staging is a bug in the mock and the mock loses.

> [!WARNING]
> The seed is built for the UTC day the server starts, so a demo left running past 00:00 UTC reads a broken streak, 0, until **Reset demo state**.

### J03. Stand up `cdn.activekit.app`

> [!NOTE]
> **Tier:** the Cloudflare dashboard · **Needs:** your Cloudflare sign-in · **Holds:** CDN delivery of the shell, the one path no environment exercises, drift row 3 of `docs/integration-map.md` in `activekit-play`

| # | Step | Where |
|---|---|---|
| 1 | Create the Worker or bucket the CDN serves from | <https://dash.cloudflare.com> |
| 2 | Add the DNS record for `cdn.activekit.app` | **DNS** for the `activekit.app` zone in the same dashboard |
| 3 | Tell the loop which of the two you made | A reply |

**Pass**

- [ ] `https://cdn.activekit.app` answers.
- [ ] The demo in `activekit-play` mounts the shell from it instead of from npm.

> [!IMPORTANT]
> `README.md` under CDN pins the path shape, `/v<version>/activekit.js`, and publishing the `<script>` build to it on each release is the session's to write once the host exists.

> [!WARNING]
> Until this exists the demo mounts the shell from npm, which is why P03 in `activekit-play` cannot prove CDN delivery.

### J04. Delete the merged branches

> [!NOTE]
> **Tier:** a terminal with this checkout · **Needs:** push access to origin, which no session has · **Holds:** nothing, cosmetic

| # | Step | Where |
|---|---|---|
| 1 | Run the js command under item 12 | `docs/owner-lane.md` in `activekit-io` |
| 2 | Run `git ls-remote --heads origin \| wc -l` | The same terminal |

**Pass**

- [ ] The count is `main`, `feature/subject-session-sdk` and whatever is in flight, and no more.

> [!IMPORTANT]
> The command keeps `feature/subject-session-sdk`, the only copy of `packages/server/src/credentials.ts`, until someone reads whether `main`'s `subjects.createSession` made it redundant, and deletes only what is merged into `main` by ancestry or by squash.

> [!IMPORTANT]
> The count printed 17 on 2026-09-09 and 17 on 2026-09-25.

> [!WARNING]
> No session can remove a ref, the proxy answers 403, which is why this is yours.
