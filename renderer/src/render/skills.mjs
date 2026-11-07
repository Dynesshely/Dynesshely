/**
 * Skills panel: every technology group from the README, rendered as one image.
 *
 * This replaces two things the page used to depend on:
 *   - skill-icons (Go service) for the icon grids
 *   - readme-typing-svg for the group headings above each grid
 *
 * The icon SVGs are vendored into `../assets/icons/` (see the note at the bottom
 * of this file for provenance), inlined here with an id prefix per icon, and laid
 * out on a shared grid so the whole block has one rhythm.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SKILL_GROUPS, THEMES } from "../theme.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(here, "..", "assets", "icons");

/**
 * Short names accepted by the old skill-icons URLs -> asset file names.
 * Copied from the upstream `shortNames` table so the same query strings work.
 */
const SHORT_NAMES = {
  js: "javascript", ts: "typescript", py: "python", tailwind: "tailwindcss",
  vue: "vuejs", nuxt: "nuxtjs", go: "golang", cf: "cloudflare", wasm: "webassembly",
  postgres: "postgresql", k8s: "kubernetes", next: "nextjs", mongo: "mongodb",
  md: "markdown", ps: "photoshop", ai: "illustrator", pr: "premiere",
  ae: "aftereffects", scss: "sass", sc: "scala", net: "dotnet", gatsbyjs: "gatsby",
  gql: "graphql", vlang: "v", amazonwebservices: "aws", bots: "discordbots",
  express: "expressjs", googlecloud: "gcp", mui: "materialui", windi: "windicss",
  unreal: "unrealengine", nest: "nestjs", ktorio: "ktor", pwsh: "powershell",
  au: "audition", rollup: "rollupjs", rxjs: "reactivex", rxjava: "reactivex",
  ghactions: "githubactions", sklearn: "scikitlearn", ml5: "ml5js", vb: "visualbasic",
  an: "animate", ca: "capture", cc: "creativecloud", ch: "characteranimator",
  me: "mediaencoder", pl: "prelude", ru: "premiererush", fs: "fuse", id: "indesign",
  ic: "incopy", sp: "adobespark", dw: "dreamweaver", dn: "dimension", ar: "aero",
  psc: "photoshopclassic", psx: "photoshopexpress", lr: "lightroom",
  lrc: "lightroomclassic", fr: "fresco", pf: "portfolio", st: "stock", be: "behance",
  br: "bridge", million: "millionjs", asm: "assembly", pop: "popos", nix: "nixos",
  hc: "holyc", yml: "yaml", twitter: "x", arc: "arcbrowser", hf: "huggingface",
  sqla: "sqlalchemy", "notepad++": "notepadpp", jq: "jqlang",
};

const NAME_OVERRIDES = {
  "c#": "csharp", "c++": "cpp", "vue.js": "vuejs", ".net": "dotnet",
};

const CELL = 44;
const GAP = 10;
const STEP = CELL + GAP;
const MAX_PER_ROW = 14;
const TITLE_HEIGHT = 20;
const GROUP_GAP = 16;
const PADDING = 16;
const WIDTH = 800;

/** Rounded tile behind icons that ship without one, so every cell reads the same. */
const TILE_COLOR = "#2C3238";

const iconCache = new Map();

async function loadIcon(name) {
  if (iconCache.has(name)) return iconCache.get(name);
  const file = path.join(iconsDir, `${name}.svg`);
  let markup = null;
  try {
    const raw = await fs.readFile(file, "utf8");
    markup = raw
      // keep only what is inside <svg>...</svg>
      .replace(/^[\s\S]*?<svg[^>]*>/i, "")
      .replace(/<\/svg>\s*$/i, "")
      // namespace every internal id so 140 icons can coexist in one document
      .replace(/id="([^"]+)"/g, (_match, id) => `id="${name}-${id}"`)
      .replace(/url\(#([^)]+)\)/g, (_match, id) => `url(#${name}-${id})`)
      // collapse whitespace: the sources are pretty-printed, and 140 of them add
      // up to tens of KB of indentation in the composed file
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();

    // 32 of the vendored icons ship without a background tile (logo only). Give
    // them the same rounded tile the others already have, otherwise the grid
    // looks misaligned: some cells read as blocks, others float as bare glyphs.
    if (!/<rect[^>]*width="256"[^>]*height="256"/.test(markup)) {
      markup = `<rect width="256" height="256" rx="60" fill="${TILE_COLOR}" />${markup}`;
    }
  } catch {
    markup = null;
  }
  iconCache.set(name, markup);
  return markup;
}

function resolveName(id) {
  const trimmed = String(id).trim();
  const lower = trimmed.toLowerCase();
  return NAME_OVERRIDES[lower] ?? SHORT_NAMES[lower] ?? lower;
}

/**
 * @param {object} options
 * @param {"light"|"dark"} options.variant
 * @returns {Promise<{svg: string, missing: string[]}>}
 */
export async function renderSkillsPanel({ variant = "light" } = {}) {
  const theme = THEMES[variant];
  const missing = [];

  // Preload every icon so the layout pass below is synchronous and can compute
  // the total height before emitting markup.
  const groups = [];
  for (const group of SKILL_GROUPS) {
    const items = [];
    for (const id of group.icons) {
      const name = resolveName(id);
      const markup = await loadIcon(name);
      if (!markup) missing.push(`${group.title}: ${id} (${name})`);
      items.push({ name, markup });
    }
    const rows = Math.ceil(items.length / MAX_PER_ROW);
    groups.push({ ...group, items, rows });
  }

  const contentHeight = groups.reduce(
    (total, group) => total + TITLE_HEIGHT + group.rows * STEP + GROUP_GAP,
    0,
  );
  const height = Math.round(contentHeight - GROUP_GAP + PADDING * 2);

  let y = PADDING;
  const blocks = [];

  for (const group of groups) {
    blocks.push(`<text x="${PADDING}" y="${y + 13}" fill="${theme.muted}" font-family="${theme.font}"
      font-size="12" font-weight="700" letter-spacing="0.4">${group.title}</text>`);
    y += TITLE_HEIGHT;

    group.items.forEach((item, index) => {
      const row = Math.floor(index / MAX_PER_ROW);
      const column = index % MAX_PER_ROW;
      const x = PADDING + column * STEP;
      const iconY = y + row * STEP;
      const body = item.markup
        ? `<g transform="translate(${x},${iconY}) scale(${(CELL / 256).toFixed(5)})">${item.markup}</g>`
        : `<rect x="${x}" y="${iconY}" width="${CELL}" height="${CELL}" rx="10"
            fill="none" stroke="${theme.panelStroke}" stroke-width="1" />`;
      blocks.push(body);
    });

    y += group.rows * STEP + GROUP_GAP;
  }

  const svg = `<svg width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" fill="none"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dynesshely skills">
  <title>Dynesshely &#183; skills</title>
${blocks.join("\n")}
</svg>
`;

  return { svg, missing };
}

/**
 * A single icon, used for the Contact row. Same vendored assets and id-prefixing
 * as the skills grid, just one tile.
 *
 * @param {string} id  icon name (file name without .svg)
 * @param {number} [size]
 */
export async function renderIcon(id, size = 48) {
  const name = resolveName(id);
  const markup = await loadIcon(name);
  if (!markup) return { svg: null, missing: name };
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name}">
  <title>${name}</title>
  <g transform="scale(${(size / 256).toFixed(5)})">${markup}</g>
</svg>
`;
  return { svg, missing: null };
}