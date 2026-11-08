/**
 * Skills panel: three fixed columns of different widths.
 *
 * The panel is split into 5-, 4- and 3-cell columns; one icon is one cell and a
 * heading line is one cell. Groups are assigned to columns by an explicit plan
 * (`COLUMN_PLAN`) rather than by a search: the columns have to be balanced *and*
 * the reading order has to stay sensible, and a greedy packer managed neither -
 * it left one column at 25 cells and another at 12.
 *
 * Inside a column each group keeps the column's width and is stacked vertically.
 * A group wider than every column (the 7-icon Learn row) is re-flowed to 4+3.
 *
 * Headings may span several lines (`titleLines`), so a group that mixes two
 * concepts can label them separately; the heading block grows to match.
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

/** Grid geometry. One cell holds one icon plus its breathing room. */
const CELL = 44;
const ICON = 36; // icon inside a cell, leaves 4px on every side
/** Empty cells kept between columns and between stacked blocks. */
const GAP_CELLS = 1;
/** Panels bleed this far past their content (2x the 4px cell inset). */
const BLEED = 8;
const PADDING = 8;

const COLUMN_WIDTHS = [5, 4, 3];

/**
 * Which groups live in which column. Hand-tuned so the three columns end up
 * close in height while the groups still read in a sensible order top to bottom.
 */
const COLUMN_PLAN = [
  [
    "programing-languages",
    "frameworks-ui",
    "game-3d",
    "media",
    "docs-learning",
    "ai-ml",
  ],
  [
    "backend-apis",
    "databases",
    "build-test-quality",
    "tools",
    "ides-editors",
    "operating-systems",
  ],
  [
    "mobile",
    "cloud-services",
    "devops-infra",
    "servers-network",
    "virtualization-hardware",
    "internet-browsers",
  ],
];

/** Rounded tile behind icons that ship without one, so every cell reads the same. */
const TILE_COLOR = "#2C3238";

const iconCache = new Map();

const escapeXml = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function loadIcon(name) {
  if (iconCache.has(name)) return iconCache.get(name);
  const file = path.join(iconsDir, `${name}.svg`);
  let markup = null;
  try {
    const raw = await fs.readFile(file, "utf8");
    markup = raw
      .replace(/^[\s\S]*?<svg[^>]*>/i, "")
      .replace(/<\/svg>\s*$/i, "")
      .replace(/id="([^"]+)"/g, (_match, id) => `id="${name}-${id}"`)
      .replace(/url\(#([^)]+)\)/g, (_match, id) => `url(#${name}-${id})`)
      .replace(/>\s+</g, "><")
      .replace(/\s{2,}/g, " ")
      .trim();

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

/** Every column count a group can take, given how many heading lines it needs. */
function shapeCandidates(count, maxCols, titleRows) {
  const out = [];
  const upper = Math.max(1, Math.min(count, maxCols));
  for (let perLine = 1; perLine <= upper; perLine += 1) {
    const rows = Math.ceil(count / perLine);
    out.push({
      perLine,
      rows,
      width: perLine,
      height: rows + titleRows,
      waste: perLine * rows - count,
    });
  }
  return out;
}

/** The most square shape - squareness first, waste second. */
function naturalShape(count, titleRows) {
  return [...shapeCandidates(count, count, titleRows)].sort(
    (a, b) => Math.abs(a.width - a.height) - Math.abs(b.width - b.height) || a.waste - b.waste,
  )[0];
}

/** The widest shape that fits `maxCols`. */
function shapeForWidth(count, maxCols, titleRows) {
  return [...shapeCandidates(count, maxCols, titleRows)].sort(
    (a, b) => b.width - a.width || a.waste - b.waste,
  )[0];
}

/**
 * @param {object} options
 * @param {"light"|"dark"} options.variant
 * @returns {Promise<{svg: string, missing: string[]}>}
 */
export async function renderSkillsPanel({ variant = "light" } = {}) {
  const theme = THEMES[variant];
  const missing = [];

  const byId = new Map();
  for (const group of SKILL_GROUPS) {
    const items = [];
    for (const id of group.icons) {
      const name = resolveName(id);
      const markup = await loadIcon(name);
      if (!markup) missing.push(`${group.title ?? group.id}: ${id} (${name})`);
      items.push({ name, markup });
    }
    const titleLines = group.titleLines ?? [group.title];
    // The heading block is always one cell tall; extra lines stack inside it.
    // Letting each line claim a whole 44px cell left a big gap between
    // "Virtualization" and "Hardwares".
    const titleRows = 1;
    const natural = naturalShape(items.length, titleRows);
    byId.set(group.id, { ...group, titleLines, titleRows, count: items.length, items, naturalWidth: natural.width });
  }

  const columns = COLUMN_WIDTHS.map((width) => ({ width, blocks: [], height: 0 }));
  COLUMN_PLAN.forEach((ids, columnIndex) => {
    const column = columns[columnIndex];
    for (const id of ids) {
      const shape = byId.get(id);
      if (!shape) throw new Error(`skills: COLUMN_PLAN references unknown group "${id}"`);
      const blockShape = shapeForWidth(shape.count, column.width, shape.titleRows);
      column.blocks.push({ ...shape, ...blockShape });
      column.height += blockShape.height + GAP_CELLS;
    }
  });

  for (const column of columns) {
    column.actualWidth = Math.max(...column.blocks.map((block) => block.width), 1);
  }

  const totalWidth = columns.reduce((sum, c) => sum + c.actualWidth, 0) + (columns.length - 1) * GAP_CELLS;
  const totalHeight = Math.max(...columns.map((c) => c.height)) - GAP_CELLS;
  const WIDTH = PADDING + totalWidth * CELL + BLEED;
  const height = PADDING + totalHeight * CELL + BLEED;

  const blocks = [];
  let columnX = 0;

  for (const column of columns) {
    let y = 0;
    for (const block of column.blocks) {
      const blockX = PADDING + columnX * CELL;
      const blockY = PADDING + y * CELL;

      blocks.push(`<rect x="${blockX - BLEED}" y="${blockY - BLEED}"
        width="${block.width * CELL + BLEED * 2}" height="${block.height * CELL + BLEED * 2}"
        rx="14" fill="${theme.panelFill}" stroke="${theme.panelStroke}" stroke-width="1" />`);

      const lineGap = 15;
      const firstLineOffset = CELL / 2 + 4 - ((block.titleLines.length - 1) * lineGap) / 2;
      block.titleLines.forEach((line, index) => {
        const fontSize = block.titleLines.length > 1 ? 11 : 12;
        blocks.push(`<text x="${blockX + 12}" y="${(blockY + firstLineOffset + index * lineGap).toFixed(1)}"
          fill="${theme.muted}" font-family="${theme.font}" font-size="${fontSize}" font-weight="700"
          letter-spacing="0.3">${escapeXml(line)}</text>`);
      });

      block.items.forEach((item, index) => {
        const iconRow = Math.floor(index / block.perLine);
        const columnInBlock = index % block.perLine;
        const x = blockX + columnInBlock * CELL + (CELL - ICON) / 2;
        const iconY = blockY + (iconRow + block.titleRows) * CELL + (CELL - ICON) / 2;
        const body = item.markup
          ? `<g transform="translate(${x},${iconY}) scale(${(ICON / 256).toFixed(5)})">${item.markup}</g>`
          : `<rect x="${x}" y="${iconY}" width="${ICON}" height="${ICON}" rx="10"
            fill="none" stroke="${theme.panelStroke}" stroke-width="1" />`;
        blocks.push(body);
      });

      y += block.height + GAP_CELLS;
    }
    columnX += column.actualWidth + GAP_CELLS;
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
 * A single icon, used for the Contact row.
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
