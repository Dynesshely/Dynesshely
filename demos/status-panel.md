# Status panel preview

[`renderer/`](../renderer/README.md) replaces the five separate status cards of
the profile README with a single 800px panel: contribution heatmap, 30-day
activity, GitHub stats, streak, WakaTime and top languages - rendered by the
vendored upstream renderers but laid out with one shared design system (grid,
radius, borders, typography, accent colour).

The main [`README.md`](../README.md) now uses this composed panel; this page keeps
the details of how it is produced, plus what changed compared with the old
individual cards.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../assets/status-dark.svg">
  <img src="../assets/status.svg" width="800"
    alt="Composed status panel: contribution heatmap, 30-day activity, GitHub stats, streak, WakaTime and top languages">
</picture>

## How it is generated

```bash
cd renderer
npm ci
export PAT_1=$(gh auth token)   # the vendored github-readme-stats fetchers read PAT_1..PAT_n
node src/index.mjs
```

- Writes `assets/status.svg` (light) and `assets/status-dark.svg` (dark). The dark
  variant is selected with `<picture>` because `prefers-color-scheme` inside an SVG
  loaded as `<img>` does not work.
- [`.github/workflows/readme-assets.yml`](../.github/workflows/readme-assets.yml)
  runs the same command on its five-hour schedule and commits the result whenever
  the bytes change.
- Which upstream code is copied verbatim, and which panels had to be ported
  (streak is a PHP app, the activity graph is a 1200px chartist line), is
  documented in [`renderer/README.md`](../renderer/README.md).

## Layout

```
+--------------------------------------------------------------+
| Contributions (heatmap, last year)                       5,894 |
+--------------------------------------------------------------+
| Activity (last 30 days, smoothed area/line)                    |
+------------------------------+-------------------------------+
| GitHub Stats                 | Streak (3 columns)            |
+------------------------------+-------------------------------+
| WakaTime (22 languages)      | Top Languages (donut, top 10) |
+------------------------------+-------------------------------+
```

## What changed compared with the individual cards

- **Streak** shows lifetime values (18,419 / 1,120 / 1,121), not a one-year window:
  `contributionsCollection` is queried once per year since the account was
  created and the daily counts are merged.
- **WakaTime** renders the same 22 languages and **Top Languages** the same top 10
  (excluding HTML) as the original card URLs, so the numbers match.
- **Contributions** keeps the 53-week heatmap *and* adds a 30-day trend line, both
  as separate cards; the heatmap now uses a continuous colour scale interpolated
  between the quietest and busiest day instead of fixed buckets.
