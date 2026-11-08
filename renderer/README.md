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
  src/render/skills.mjs  skills panel grid + icon loading
  src/render/icon-palette.mjs  recolours the vendored icons onto the palette
  src/render/icon-artwork.mjs  hand-drawn substitutes for two or three logos
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

## Palette (Morandi)

All panel colours come from `src/theme.mjs`: muted, grey-leaning tones (fog blue,
warm grey, parchment) so the panel sits quietly on both GitHub themes. Two
gotchas are encoded there:

- **Card colour options must not carry a leading `#`.** The vendored
  `getCardColors()` validates bare hex (`57524C`), so a value like `#57524C`
  silently falls back to the default theme colours - which is why the labels used
  to render in the stock dark grey and the rank ring in bright blue.
- **Language colours are desaturated after rendering.** Upstream paints each
  language with its brand colour from `languageColors.json` (saturated Vue green,
  C# purple, ...). There is no option to override them and patching the vendored
  copy would break the verbatim-upstream rule, so `src/render/morandi.mjs`
  rewrites every hex colour in the rendered top-languages / WakaTime SVG: hue and
  lightness are kept, saturation is clamped to 0.3. Greys (our own text colours)
  are below that saturation and pass through unchanged.

Cards are rendered at roughly the panel's content width (`card_width` 400 / 350 /
360) instead of the upstream default 495: embedding a 495px card into a 350px
slot scaled 14px labels down to ~10px, which was the other half of the
readability problem.

### Heat grid scale

A plain `count / max` ramp (with or without a gamma) flattens this profile,
because its contribution distribution is extremely spiky: **227 of 365 days sit on
exactly 9 contributions** (p50 = 9), while a handful of days reach 180. Any
absolute ramp paints that 62% majority as one tone.

`src/render/heatmap.mjs` therefore blends two normalised views:

```
t = 0.55 * normalCdf((count - mean) / stdev) + 0.45 * (count / max) ^ 0.5
```

- the term **normalCdf** brings the variance in: it is steepest around the mean,
  which is exactly the low/mid band most days live in, so 6 → 9 → 11 → 20 spread
  out visibly instead of collapsing
- the **magnitude** term keeps absolute counts in play so the peaks still end at
  the top of the ramp

The normal CDF is chosen over an empirical percentile on purpose: the empirical
curve has a cliff at the mode (8 → 9 would jump half a shade), while the CDF is
smooth, strictly monotonic in count, and stable as data changes. Empty days stay
outside the ramp (`heatEmpty`) so "no activity" never reads as "a little
activity".

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

## Section banners, skills panel and typing lines

The renderer also owns the page chrome that used to come from third-party
services:

| output | replaces |
| --- | --- |
| `assets/banner/{status,intro,skills,contact,footer}.svg` | capsule-render `type=venom` headers |
| `assets/skills.svg` | skill-icons grids **and** the typing headings above them |
| `assets/icons/contact-*.svg` | the three contact tiles from skill-icons |
| `assets/typing/hello.svg` | readme-typing-svg greeting |

- **Banners are rendered by the vendored capsule-render sources**, not by a
  reimplementation: `src/render/banner.mjs` bundles
  `vendor/capsule-render/model/index.ts` with esbuild and calls the same model
  classes that back the public endpoint, so the artwork and the `twinkling`
  animation are identical - only the colour stops are Morandi, one hue per
  section (`BANNERS` in `src/theme.mjs`).
- **The skills panel uses fixed columns of different widths.** The panel is split
  into 5-, 4- and 3-cell columns; one icon is one cell, a heading is one cell. Each
  group keeps the width it naturally wants, so languages stay 5 wide, the editor
  grids stay 4 wide and the small groups stay 3 wide. A group wider than every
  column (the 7-icon Learn / Research row) is re-flowed to the column where it
  leaves the fewest empty cells - 4+3 rather than 5+2.

  Groups are placed by an explicit `COLUMN_PLAN` rather than by a search: the
  columns have to be balanced *and* the reading order has to stay sensible, and a
  greedy packer managed neither. The three columns come out 29 / 25 / 24 cells
  tall; the `Operating Systems` group spans the first two columns at the bottom,
  which closes the panel into a rectangle instead of leaving a ragged edge. The
  canvas is **632x1292**.

  Spacing: a block keeps one empty cell from its neighbours; its backing panel
  bleeds 8px (twice the 4px cell inset) past the content, which narrows the visual
  gap without costing grid cells. Headings are vertically centred in their cell
  row with a 12px left margin.

  Icons that ship without a background tile get a matching rounded tile so the
  grid reads evenly, and every icon's internal ids are prefixed to keep 140+
  gradients/clip paths from colliding. Short names from the old URLs (`js`, `py`,
  `net`, ...) are mapped through the same table upstream used.

  Icon colouring is fixed, not derived at runtime (`src/render/icon-palette.mjs`):

  - `ICON_COLORS` holds one hand-picked Morandi accent per icon;
  - `ICON_ROLE_OVERRIDES` holds an explicit *original colour -> replacement*
    table for the marks a single accent cannot describe (SQLite's dark wordmark on
    a light body, pnpm's two-tone grid, Redis' four reds). These bypass every
    heuristic, so their result is reviewable;
  - `ICON_MULTI_COLOR` keeps the hue structure of genuinely multi-colour logos
    (Chrome, Figma, Firefox) and only mutes the saturation;
  - `ICON_KEEP_ORIGINAL` renders the mark as published and only normalises its
    plate to the shared tile (Zen Browser's white ring on a dark plate has no
    brand hue to preserve).

  A logo that no table can rescue is redrawn instead (`src/render/icon-artwork.mjs`).
  **Safari** is the case that forced this: the vendored SVG carries a 16 KB
  tick-mark path (60 individual marks), two Gaussian-blur filters and a five-stop
  radial gradient. Recoloured, it reads as a smudge at 36px - the filters cannot be
  colour-mapped at all, and 60 ticks collapse into noise. The replacement is plain
  geometry on the same 256x256 canvas: one plate, one bezel ring, one dial with a
  single highlight, four ticks on the diagonals (so they never hide under the
  needle), a rounded diamond needle and a dark hub pin with a cream ring. It is
  about 1.2 KB of markup instead of 21 KB, and it stays crisp at every size.
  Hand-drawn entries bypass the recolour pipeline entirely - they are authored in
  the Morandi palette already, so re-tinting them would only move hand-picked
  values.

  Three colour syntaxes are normalised first (six-digit hex, three-digit hex and
  CSS colour names): missing the last two is what used to leave `fill="navy"` and
  `fill="white"` untouched.

- **Typing lines** cycle type -> hold -> delete -> hold, like the original
  service. The reveal is a `clipPath` whose width animates in `steps()`, with the
  per-segment timing function set on the keyframes so both the typing and the
  deleting halves are stepped. The rect ships with its final width inline, so a
  viewer without CSS animation shows the finished line rather than a blank box.

## Relationship to tools/ and vendor/

`tools/` still generates the individual cards (`assets/stats/*.svg`) from the
vendored services, but **it no longer runs in CI** - it is kept only as a manual
fallback so the README can be reverted to the old five-card layout. Note that a
manual `tools` run also rewrites `assets/banner/*.svg` and `assets/typing/*.svg`
back to the pre-Morandi versions, because those paths belong to the renderer now.

Nothing in `renderer/` starts a service or a PHP/Go runtime - it is plain Node and
uses the same PAT_1 secret.
