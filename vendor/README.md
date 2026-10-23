# vendored generators

Every image in the README is rendered locally from the sources in this directory.
They are plain upstream snapshots (no `.git`, no local patches) pinned to a known
commit so the exact code that produced the committed `assets/` is reviewable.

| directory | upstream | pinned commit | runtime | local endpoint |
| --- | --- | --- | --- | --- |
| `capsule-render/` | [kyechan99/capsule-render](https://github.com/kyechan99/capsule-render) | `40d099b09f9e047aa6ce9513d6d17d48eb2729c8` | TypeScript (bundled with esbuild) | `/api?...` |
| `readme-typing-svg/` | [DenverCoder1/readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg) | `087071691ae5ea4bf9e8db89541350eb1b3b1570` | PHP 8.1+ | `/?...` |
| `skill-icons/` | [LelouchFR/skill-icons](https://github.com/LelouchFR/skill-icons) | `1c213fac65db5decb58aaa7f41db28effcb26df4` | Go 1.18+ | `/api/icons?...` |
| `github-readme-stats/` | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats) | `54a7985aeefda00d5eadb55b80c17c7f976c37d2` | Node.js 22+ | `/api?...`, `/api/top-langs/?...`, `/api/wakatime?...` |
| `github-readme-streak-stats/` | [DenverCoder1/github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats) | `ae11d329c3320706e9b9b88aeb143a627ecd7d0c` | PHP 8.2+ with `intl` | `/?...` |
| `github-readme-activity-graph/` | [Ashutosh00710/github-readme-activity-graph](https://github.com/Ashutosh00710/github-readme-activity-graph) | `0962e9461de815933d462e8b98c7ce566cada8fb` | Node.js 22+ | `/graph?...` |

Upstream licence files are kept next to the sources (`vendor/*/LICENSE`).

## Notes

- **Do not edit these sources.** Fixes belong in the adapters under
  `tools/services/`, so updating a snapshot stays a clean replace (download the
  new tarball, update the table above, regenerate).
- Installed dependencies (`node_modules/`, `vendor/*/vendor/`) and build output
  (`.build/`) are git-ignored; nothing generated from them is committed except
  `assets/`.
- `github-readme-activity-graph`'s public deployment currently answers
  `402 DEPLOYMENT_DISABLED`, which is why the README stopped using it directly.
- `capsule-render`'s renderer is pure TypeScript (no `vercel` CLI needed), so
  `tools/services/capsule-render.mjs` bundles `api/index.ts` with esbuild and
  serves it through a small HTTP shim.
- `skill-icons` embeds its 2 000+ icon SVGs by rewriting `api/index.go`, so its
  adapter copies the tree into `.build/` before building and never mutates
  `vendor/`.
