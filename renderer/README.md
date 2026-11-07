# renderer - one status panel for the profile README

The old status block was five unrelated images (300px to 1200px wide, four
different themes, four rendering projects, three runtimes). This folder renders
the same data through the vendored upstream renderers and composes the results
into **one 800px-wide panel**, so spacing, borders, typography and accent colour
are decided in exactly one place.

```
renderer/
  src/index.mjs          CLI: fetch data -> render cards -> compose -> write assets/
  src/theme.mjs          design tokens + layout grid + per-variant card options
  src/compose.mjs        panel frames, titles, <image> placement, dark/light variants
  src/data/calendar.mjs  contribution calendar + streak (GraphQL)
  src/render/cards.mjs   calls the vendored github-readme-stats renderers
  src/render/streak.mjs  streak panel (ported from the PHP card)
  src/render/heatmap.mjs contribution heatmap
  src/upstream/          code copied from upstream projects (see below)
```

## Upstream code that is copied verbatim

`src/upstream/github-readme-stats/` is a byte-for-byte copy of the files needed by
its stats / top-languages / wakatime cards, taken from
[anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats)
at commit `54a7985aeefda00d5eadb55b80c17c7f976c37d2` (the same snapshot as
`../vendor/github-readme-stats`, MIT, licence included):

| copied | why |
| --- | --- |
| `src/cards/{stats,top-languages,wakatime}.js` | the card renderers |
| `src/fetchers/{stats,top-languages,wakatime}.js` | data fetching, rank calculation, rate-limit retries |
| `src/common/*.js`, `src/calculateRank.js`, `src/translations.js` | rendering helpers and translations |
| `themes/index.js`, `src/common/languageColors.json` | colour palettes |

Nothing in that tree is patched: the renderers are called through their public
`fetch*` / `render*` exports, with the same parameters the README URLs used
(`show_icons`, `hide=contribs`, `show=reviews`, `number_format=long`,
`layout=compact`, `langs_count`, `hide=html`). Two adaptations are needed at the
call site instead of in the copied code:

- `disable_animations: true`, so the cards are complete in a static file (their
  fade-in animation starts at `opacity: 0`);
- `card_width: 495`, so all three cards share the same scale factor on the canvas.

## What could not be copied, and why

- **`github-readme-streak-stats` is PHP** (`vendor/github-readme-streak-stats`,
  `src/card.php`, plus a 66 KB theme table). It cannot be imported into Node, so
  `src/render/streak.mjs` ports its visual skeleton (two columns, big number,
  label, date range) to SVG and reuses the shared tokens. The streak numbers are
  computed in `src/data/calendar.mjs` with the same rules the PHP project uses
  (a zero today does not break a running streak).
- **`github-readme-activity-graph` renders a 1200px chartist line chart.** At the
  panel width that is unreadable, so `src/render/heatmap.mjs` draws the GitHub
  contribution calendar as a 53x7 grid instead - more information per pixel, and
  its theme colours follow the upstream project's `styles/themes.ts`.

## Composition details

- Upstream cards are embedded as base64 `<image>` elements. Each card carries its
  own `<style>` block with class names like `.text`, so inlining several of them
  in one document would make the CSS collide; an `<image>` is a separate document
  and keeps the upstream output untouched.
- The streak and heatmap panels are inline SVG that uses presentation attributes
  only, so they cannot leak styles either.
- Two variants are written because `prefers-color-scheme` inside an SVG served as
  `<img>` does not work; the README picks one with `<picture>`.

## Usage

```bash
cd renderer
npm ci
export PAT_1=$(gh auth token)     # or GITHUB_TOKEN
node src/index.mjs                # writes ../assets/status.svg + status-dark.svg
node src/index.mjs --variant light --out assets/status.svg
node src/index.mjs --username SomeUser --variant all
```

WakaTime is read anonymously from the public profile, exactly like the old card
URL - no API key is involved.

## Layout

```
+--------------------------------------------------------------+
| Contributions (heatmap, last year)                            |
+--------------------------------------------------------------+
| Activity (last 30 days, smoothed area/line)                   |
+------------------------------+-------------------------------+
| GitHub Stats                 | Streak (total/current/longest) |
+------------------------------+-------------------------------+
| WakaTime (compact, 22)       | Top Languages (donut, top 10) |
+------------------------------+-------------------------------+
```

To add a panel, add a box to `LAYOUT.panels` in `src/theme.mjs` and one
`panelFrame(...)` call in `src/compose.mjs`; the height is derived from the last
row, so keep `LAYOUT.height` in sync.

## Data notes

- **Streak** values are lifetime: `contributionsCollection` accepts at most one
  year per query, so `fetchFullHistory()` walks the account year by year and
  merges the daily counts. A single-year window would cap the streak at 365.
- **WakaTime** is read anonymously from the public profile (`PAT_1` is only used
  by the GitHub fetchers).
- **Top Languages / WakaTime** use the same `langs_count` and `hide` values as the
  old README URLs, so switching between the composed panel and the individual
  cards does not change the numbers.

## Relationship to tools/ and vendor/

`tools/` still generates the individual cards (`assets/stats/*.svg`) from the
vendored services and is kept as a fallback: reverting the README to the old block
is a one-commit revert. Nothing in `renderer/` starts a service or a PHP/Go
runtime - it is plain Node and uses the same PAT_1 secret.
