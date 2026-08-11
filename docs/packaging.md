# Packaging and release runbook

The operational half of publishing: what exists on npm, how a release ships,
and the one-time bootstrap every new package needs before the pipeline can
touch it. The architectural half — why the packages are shaped this way — lives
in the [README](../README.md).

## What exists on npm

- The [`activekit` org](https://www.npmjs.com/org/activekit) owns the
  `@activekit` scope. Org membership is the only way to publish under it.
- The unscoped [`activekit`](https://www.npmjs.com/package/activekit) package
  (the server SDK) sits on the publishing account rather than the org — npm
  orgs only own scopes. Unscoped names are first-come-first-served, which is
  why it was claimed by publishing, not by configuration.
- The registry account uses `hello@activekit.app`, with 2FA. Steady state is
  **zero access tokens**: `npm token list` empty, every publish via trusted
  publishing. If a token exists, something has regressed — find out why before
  deleting it.

## Releasing

Every PR that changes a package carries a changeset (`pnpm changeset`, or
`pnpm changeset --empty` for changes that release nothing). The release itself
is manual, from `main`, in the GitHub UI:

1. **Actions** tab → **Release** workflow in the left sidebar.
2. **Run workflow** dropdown (right side) → branch `main` → type `RELEASE`
   into the confirmation box → green **Run workflow** button.
3. The run re-checks everything CI checks, consumes the changesets into a
   version commit, publishes via OIDC, pushes the commit and tags, and creates
   one GitHub release per tag.

No token is involved anywhere. npm's trusted publishing verifies the workflow's
OIDC identity — this repo, `release.yml`, the `npm` environment — and issues a
credential good for that one publish. Provenance attestations are generated
automatically.

After the run, spot-check one published package:

```bash
npm view <package> version dist-tags.latest   # new version, latest moved
```

The package page on npmjs.com should show the provenance badge.

## Adding a new package

Trusted publishing has a bootstrap gap: npm cannot attach a trusted publisher
to a package that does not exist on the registry, so the first version of
every new package is published by a human. Once, locally, never from CI.

The package lands in the repo at version `0.0.0` — the placeholder version
whose only job is to make the package exist — with a changeset for its real
first version. After that PR merges into `main`:

```bash
# 1. Publish 0.0.0 to make the package exist. From a clean checkout of main:
pnpm install && pnpm check
npm login                       # the ActiveKit account
pnpm --filter <name> publish --access public --no-git-checks

# 2. Attach the trusted publisher. The CLI, not the website — see below.
npx npm@latest trust github <name> \
  --repository msgxdevlabs/activekit-js \
  --file release.yml \
  --environment npm \
  --allow-publish --yes

# 3. Prove it stuck, then restore the no-tokens invariant.
npx npm@latest trust list <name>
npm logout
```

Then run a normal release. The changeset bumps the package off `0.0.0` and the
workflow publishes it via OIDC with provenance — which the hand-published
bootstrap version never has, and that is fine: its job was existence, not
authenticity.

### The CLI, not the web form

Configure trusted publishers with `npm trust`, never with the Trusted
Publisher form on npmjs.com. During the initial bootstrap the web form
silently failed to persist the configuration — twice — while reporting
nothing. The CLI echoes what it saved and `npm trust list` proves persistence.
All five original packages are configured this way; keep it uniform.

Every field of the trust configuration is exact-match and case-sensitive, and
npm validates none of it at save time. The values for this repo are:
repository `msgxdevlabs/activekit-js`, workflow file `release.yml` (filename
only), environment `npm`, allowed action `npm publish`.

## Troubleshooting a failed publish

The failure npm hands you is rarely the failure you have:

- `ERR_PNPM_AUTH_TOKEN_EXCHANGE … 404` in the Publish step, then
  `E404 … PUT https://registry.npmjs.org/<pkg>`: npm found no trusted-publisher
  configuration matching the workflow's identity for that package. The PUT 404
  is only the fallback publish running without credentials. Check
  `npm trust list <pkg>` first — the config probably isn't there, or one field
  differs from the values above.
- The exchange endpoint's verdict can be probed without publishing: mint the
  workflow's OIDC token (audience `npm:registry.npmjs.org`) and POST it to
  `registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/<escaped-name>`.
  `{"message":"OIDC token exchange error - package not found"}` means no
  matching config; HTTP 201 means the pipeline will work.
- A release run that failed at Publish left nothing behind: no version on the
  registry, no tags, no commit on `main`. The version bump existed only on the
  runner. Fix the cause and dispatch again.
