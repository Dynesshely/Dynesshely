# tools - local README image generator

Every image in `README.md` is a committed SVG under `assets/`, produced by the
vendored generators in `../vendor/`. Nothing on the profile page depends on a
third-party rendering service any more, so an upstream outage (like the
`402 DEPLOYMENT_DISABLED` from `github-readme-activity-graph`) cannot break it.

## How it works

```
tools/lib/manifest.mjs   the single list of assets: id, service, request path, output file
tools/services/*.mjs     one adapter per vendored service (prepare / start / stop)
tools/generate.mjs       starts the needed services, requests every asset, writes assets/
tools/check.mjs          verifies README references and generated SVGs
```

`generate.mjs` starts each service on a fixed loopback port, waits for readiness,
then issues exactly the request that used to go to the public deployment. The SVG
body is validated (`<svg` present), and a file is only rewritten when its bytes
actually changed - so a scheduled run with identical data produces no commit.

| service | port | how it is started |
| --- | --- | --- |
| `capsule-render` | 4701 | `api/index.ts` bundled with esbuild, served by a small Node shim |
| `github-readme-stats` | 4702 | `node express.js` in `vendor/github-readme-stats` |
| `github-readme-activity-graph` | 4703 | `node dist/main.js` in `vendor/github-readme-activity-graph` |
| `readme-typing-svg` | 4704 | `php -S` in `vendor/readme-typing-svg` |
| `github-readme-streak-stats` | 4705 | `php -S` in `vendor/github-readme-streak-stats` |
| `skill-icons` | 4706 | Go binary built in `.build/skill-icons` |

## Running locally

Requirements: Node.js 22+, PHP 8.3+ with `ext-intl` and Composer, Go 1.23+.
On Windows without a local PHP you can point the generator at Docker instead -
the PHP adapters fall back to the `dsh/php:8.3` image when `php` is not on `PATH`.

```powershell
cd tools
npm ci
node generate.mjs --list                     # show every asset and its output file
node generate.mjs                            # regenerate everything
node generate.mjs --service=skill-icons      # only one service
node generate.mjs --only=stats-github,banner-status
node generate.mjs --dry-run                  # report changes, write nothing
node check.mjs                               # validate README <-> assets
```

Environment variables:

| name | used by | notes |
| --- | --- | --- |
| `PAT_1` | `github-readme-stats` | GitHub token that can read account data. `gh auth token` works locally. Required for the stats/top-languages cards. |
| `TOKEN` | `github-readme-activity-graph` | GitHub token; the workflow's built-in `GITHUB_TOKEN` is enough here. |
| `WAKATIME_API_KEY` | `github-readme-stats` (WakaTime card) | Optional; without it `stats-wakatime` is skipped. |

Assets whose token is missing are skipped *before* their service starts, so a run
without credentials still regenerates everything else and exits successfully.
Never commit tokens - pass them through the shell environment only.

> Why `PAT_1` cannot be replaced by the workflow's `GITHUB_TOKEN`:
> `github-readme-stats` queries other accounts' contributions/stargazers, and an
> Actions installation token is scoped to this repository only, so GitHub answers
> `FORBIDDEN: Resource not accessible by integration`. Create a fine-grained or
> classic personal access token with read-only public access and store it as the
> `PAT_1` repository secret.

## Notes

- **Banner gradients are pinned.** Upstream's `color=timeGradient` picks a palette
  from the current minute, so regenerating would produce a different banner on
  every run and the scheduled job would commit purely cosmetic changes forever.
  The manifest uses the explicit `color=0:00c6ff,100:0072ff` palette instead, which
  makes a run idempotent (`unchanged: N`) and keeps commits meaningful. Swap it
  back to `timeGradient` if you prefer shifting colours over quiet history.
- Generated files are only rewritten when the bytes change, so `git diff --quiet`
  is a reliable "did anything actually move?" check - that is what the workflow
  uses to decide whether to commit.
- The `skill-icons` output is byte-identical to the public deployment; the
  `github-readme-stats` numbers change whenever GitHub's data changes.

## Adding or changing an image

1. add/adjust an entry in `tools/lib/manifest.mjs` (`path` is the request you
   would have sent to the public service);
2. reference `assets/<file>` from `README.md`;
3. run `node generate.mjs` and commit the generated SVG together with the
   manifest change.

## CI

`.github/workflows/readme-assets.yml` runs on a 5-hour cron (plus on pushes that
touch `tools/`, `vendor/`, `assets/` or `README.md`, and manual dispatch). It
installs all three runtimes, regenerates the assets, runs `tools/check.mjs`, and
commits `assets/` back to `main` only when something changed.

Secrets:

- `PAT_1` - optional personal access token; falls back to the workflow's
  `GITHUB_TOKEN`, which is enough for public data.
- `WAKATIME_API_KEY` - optional; needed only if you want to switch the WakaTime
  card from the remote deployment to the local one.

## WakaTime card

`README.md` still points at the remote `github-readme-stats` WakaTime deployment
because it requires a private API key. The generator supports it already: add the
`WAKATIME_API_KEY` secret (and locally the env var), run the generator once so
`assets/stats/wakatime.svg` exists, then swap the `src` in `README.md` to
`assets/stats/wakatime.svg`. Reverting is the same one-line change.
