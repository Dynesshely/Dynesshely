/**
 * Skills panel: fixed columns of different widths.
 *
 * The panel is split into columns of 5, 4 and 3 cells. Every group keeps the width
 * it naturally wants (`naturalWidth`, the column count that wastes the fewest
 * cells), so languages stay 5 wide, the editor grids stay 4 wide and the small
 * groups stay 3 wide. A group wider than its column (e.g. the 7-icon Learn row) is
 * re-flowed to the column width - 7 icons become 4+3.
 *
 * Within the layout, groups are placed tallest-first into the shortest column that
 * can hold them, which keeps the three columns close in height instead of dumping
 * everything into the first one.
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

/**
 * Column widths, widest first. Each group goes into the narrowest column that can
 * hold a shape close to its natural width; 5 -> languages, 4 -> editor grids,
 * 3 -> the small groups and the 2-icon Hardwares row.
 */
const COLUMN_WIDTHS = [5, 4, 3];

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

/** Every column count a group can take, with the empty cells it would leave. */
function shapeCandidates(count, maxCols) {
  const out = [];
  const upper = Math.max(1, Math.min(count, maxCols));
  for (let perLine = 1; perLine <= upper; perLine += 1) {
    const rows = Math.ceil(count / perLine);
    out.push({
      perLine,
      rows,
      width: perLine,
      height: rows + 1, // + heading row
      waste: perLine * rows - count,
    });
  }
  return out;
}

/** The shape with the fewest empty cells (ties: the most square). */
function naturalShape(count) {
  return [...shapeCandidates(count, count)].sort(
    (a, b) => a.waste - b.waste || Math.abs(a.width - a.height) - Math.abs(b.width - b.height),
  )[0];
}

/** The widest shape that still fits `maxCols`. */
function shapeForWidth(count, maxCols) {
  return [...shapeCandidates(count, maxCols)].sort(
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

  const shapes = [];
  for (const group of SKILL_GROUPS) {
    const items = [];
    for (const id of group.icons) {
      const name = resolveName(id);
      const markup = await loadIcon(name);
      if (!markup) missing.push(`${group.title}: ${id} (${name})`);
      items.push({ name, markup });
    }
    const natural = naturalShape(items.length);
    shapes.push({ ...group, count: items.length, items, naturalWidth: natural.width });
  }

  // Assign groups to columns: widest groups first, each into the shortest column
  // whose width can hold its natural shape (or a re-flowed version of it).
  const columns = COLUMN_WIDTHS.map((width) => ({ width, blocks: [], height: 0 }));
  const ordered = [...shapes].sort((a, b) => b.naturalWidth - a.naturalWidth || b.count - a.count);

  for (const shape of ordered) {
    // First choice: a column wide enough for the group's natural width, so 5-wide
    // language groups never get re-flowed into a 4-wide column (which turned the
    // 25-icon list into 4x7). Only when no column is wide enough - the 7-icon
    // Learn row - does it fall back to any column.
    const exact = columns.filter((column) => column.width >= shape.naturalWidth);

    let target;
    if (exact.length) {
      target = exact[0];
      for (const column of exact) {
        if (column.height < target.height) target = column;
      }
    } else {
      // No column is wide enough for the natural shape (the 7-icon Learn row).
      // Pick the column where re-flowing leaves the fewest empty cells - 7 icons
      // become 4+3 rather than 5+2 - and only then the shortest column.
      let bestWaste = Number.POSITIVE_INFINITY;
      target = columns[0];
      for (const column of columns) {
        const candidate = shapeForWidth(shape.count, column.width);
        if (candidate.waste < bestWaste || (candidate.waste === bestWaste && column.height < target.height)) {
          bestWaste = candidate.waste;
          target = column;
        }
      }
    }

    const blockShape = shapeForWidth(shape.count, target.width);
    target.blocks.push({ ...shape, ...blockShape });
    target.height += blockShape.height + GAP_CELLS;
  }

  // Trim each column to the widest block it actually holds.
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

      blocks.push(`<text x="${blockX + 12}" y="${blockY + CELL / 2 + 4}" fill="${theme.muted}"
        font-family="${theme.font}" font-size="12" font-weight="700" letter-spacing="0.3">${block.title}</text>`);

      block.items.forEach((item, index) => {
        const iconRow = Math.floor(index / block.perLine);
        const columnInBlock = index % block.perLine;
        const x = blockX + columnInBlock * CELL + (CELL - ICON) / 2;
        const iconY = blockY + (iconRow + 1) * CELL + (CELL - ICON) / 2;
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
 * A single icon, used for the Contact row. Same vendored assets and id-prefixing
 * as the skills grid, just one tile.
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
