/**
 * Fixed recolouring of the skills icons.
 *
 * Each icon has one hand-picked accent in `ICON_COLORS` (theme.mjs). At render time
 * the logo is re-tinted to that accent while keeping its own light/mid/shadow
 * structure. Which colour an icon gets is a fixed table an editor can correct by
 * hand; only the spread inside that accent is computed.
 *
 * The vendored icons come in four structural families, and each needs a different
 * treatment - applying one rule to all of them is what made Ansible stay black,
 * Nginx stay green and Unreal turn purple:
 *
 *   1. coloured background + white glyph   (Nginx, Caddy, Debian)
 *      -> background becomes the accent, glyph stays white
 *   2. dark background + white glyph       (Ansible, Vercel, ChatGPT, Unity)
 *      -> background becomes the tile, glyph becomes the accent
 *   3. coloured artwork on the tile        (most language logos)
 *      -> artwork is re-tinted to the accent
 *   4. genuinely multi-colour marks        (Chrome, Figma, VMware)
 *      -> hues kept, only muted
 *
 * Colours also arrive in three syntaxes - six-digit hex, three-digit hex and CSS
 * colour names - and all three are normalised before tinting. Miss the last two and
 * Ansible's `fill="white"` on `fill="#000"` never gets touched.
 */
import { ICON_COLORS, ICON_MULTI_COLOR, ICON_ROLE_OVERRIDES, SKILL_ICON_STYLE } from "../theme.mjs";

const TILE = SKILL_ICON_STYLE.tile.toLowerCase();
const WHITE = "#F2F0EC";
const BLACK = "#1B1E22";

/** Lightness steps the accent is spread across, tuned for a dark tile. */
const STEPS = [0.5, 0.62, 0.74];

/**
 * Icons whose original artwork relies on a wide value range (Redis' three reds).
 * For these the ladder is stretched, otherwise every red lands on the same tone and
 * the logo reads as a flat silhouette.
 */
const WIDE_LADDER = new Set(["redis", "mongodb", "postgresql", "sqlserver"]);

/** CSS colour names used by the vendored icons. */
const NAMED = {
  white: "#ffffff",
  black: "#000000",
  navy: "#000080",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  gray: "#808080",
  grey: "#808080",
  silver: "#c0c0c0",
  orange: "#ffa500",
  yellow: "#ffff00",
  purple: "#800080",
  teal: "#008080",
  aqua: "#00ffff",
  lime: "#00ff00",
  maroon: "#800000",
  olive: "#808000",
  fuchsia: "#ff00ff",
  magenta: "#ff00ff",
  cyan: "#00ffff",
  crimson: "#dc143c",
  gold: "#ffd700",
  indigo: "#4b0082",
  violet: "#ee82ee",
  brown: "#a52a2a",
  pink: "#ffc0cb",
  beige: "#f5f5dc",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  salmon: "#fa8072",
  tan: "#d2b48c",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
};

const HEX6 = /#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g;

/** Icons whose gradients are collapsed to two stops before tinting. */
const SIMPLIFY_GRADIENT = new Set(["cmake", "thunderbird", "sublime", "sublimetext"]);

function hexToHsl(hex) {
  const value = parseInt(hex.slice(1), 16);
  const r = ((value >> 16) & 255) / 255;
  const g = ((value >> 8) & 255) / 255;
  const b = (value & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const hue = (p, q, t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  let r;
  let g;
  let b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue(p, q, h + 1 / 3);
    g = hue(p, q, h);
    b = hue(p, q, h - 1 / 3);
  }
  const toHex = (channel) =>
    Math.round(Math.max(0, Math.min(1, channel)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Relative luminance: tells a dark background apart from a mid-tone. */
function luminance(hex) {
  const value = parseInt(hex.slice(1), 16);
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel((value >> 16) & 255) +
    0.7152 * channel((value >> 8) & 255) +
    0.0722 * channel(value & 255)
  );
}

/** Normalise three-digit hex and CSS colour names to six-digit hex. */
function normaliseColors(markup) {
  const withHex = markup.replace(
    /#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])(?![0-9a-fA-F])/g,
    (_m, r, g, b) => `#${r}${r}${g}${g}${b}${b}`,
  );

  return withHex.replace(/(fill|stroke|stop-color)="([a-zA-Z]+)"/g, (match, attr, value) => {
    const key = value.toLowerCase();
    if (key === "none" || key === "currentcolor" || key === "inherit") return match;
    const hex = NAMED[key];
    return hex === undefined ? match : `${attr}="${hex}"`;
  });
}

/** The `<rect>` values that mark a full-bleed background rather than artwork. */
const BLEED_RECT = /<rect[^>]*?(?:width="256"[^>]*?height="256"|height="256"[^>]*?width="256")[^>]*?>/g;

/** Is this the accent's hue but at a usable lightness? */
function accentAt(accentHex, step) {
  const [hue, saturation] = hexToHsl(accentHex);
  return hslToHex(hue, Math.max(0.22, saturation * 0.85), step);
}

/**
 * Re-tint one icon onto the hand-picked palette.
 *
 * @param {string} markup icon inner SVG markup
 * @param {string} name   icon name, used to look up its accent
 * @returns {string}
 */
export function morandiIconMarkup(markup, name) {
  const accent = (ICON_COLORS[name] ?? ICON_COLORS.cpp ?? "#9db3c8").toLowerCase();
  const accentStep = accentAt(accent, STEPS[1]);
  const accentBright = accentAt(accent, STEPS[2]);
  const accentDeep = accentAt(accent, STEPS[0]);

  let normalised = normaliseColors(markup);

  // Explicit colour maps win over every heuristic. Each icon lists its original
  // colours and their replacements, so the result is fully reviewable - and the
  // "which part is the plate, which is the figure" question is answered per icon
  // instead of guessed from luminance.
  const override = ICON_ROLE_OVERRIDES[name];
  if (override) {
    normalised = normalised.replace(BLEED_RECT, (tag) =>
      tag.replace(/(fill)="[^"]*"/, `$1="${override.plate}"`),
    );

    const lookup = (value) => {
      const key = value.toLowerCase();
      return override.map[key] ?? override.map[value] ?? null;
    };

    // named colours first, then hex
    normalised = normalised.replace(/(fill|stroke|stop-color)="([a-zA-Z]+)"/g, (match, attr, value) => {
      const hit = lookup(value);
      return hit ? `${attr}="${hit}"` : match;
    });

    // hex on any colour-bearing attribute, including gradient stops
    return normalised.replace(
      /(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,6})"/g,
      (match, attr, hex) => {
        const full = hex.length === 4
          ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
          : hex;
        const hit = lookup(full);
        return hit ? `${attr}="${hit}"` : match;
      },
    );
  }
  // DaVinci's mark is a ring drawn as 366 separate one-colour paths - 364 distinct
  // colours cycling through the whole hue wheel. At 36px those adjacent cells read as
  // jagged noise. Quantising them to six ordered steps turns the ring back into a
  // smooth sweep while keeping the "spectrum" intent.
  if (name === "davinci") {
    // The mark is a white plate, a black camera silhouette and a pinwheel of 361
    // one-colour slices (a sliced radial gradient). Three problems at 36px:
    //  - the plate stays pure white and outshines everything else in the grid
    //  - the slices carry 361 distinct hues, which reads as jaggies
    //  - the radial gradients add banding on top of that
    // So: plate -> warm off-white, camera -> near-black, gradients flattened to one
    // tone each, and the slices collapsed onto three flat Morandi hues (one per vane).
    const PLATE = "#E9E5DF";
    const vaneColors = ["#8D94D6", "#BEAA73", "#C08398"];

    normalised = normalised.replace(BLEED_RECT, (tag) =>
      tag.replace(/(fill)="[^"]*"/, `$1="${PLATE}"`),
    );

    // Flat gradients: both stops get the same colour, so no banding survives.
    const stopToVane = (hueDegrees) => {
      if (hueDegrees >= 190 && hueDegrees < 310) return vaneColors[0];
      if (hueDegrees >= 40 && hueDegrees < 190) return vaneColors[1];
      return vaneColors[2];
    };
    let gradientIndex = 0;
    normalised = normalised.replace(/<radialGradient[\s\S]*?<\/radialGradient>/g, (block) => {
      const flat = vaneColors[gradientIndex % vaneColors.length];
      gradientIndex += 1;
      return block.replace(/stop-color="[^"]*"/g, `stop-color="${flat}"`);
    });

    // Slices: map by hue. Only true neutrals are exempt - a bright saturated yellow
    // also has high luminance, so guarding on luminance alone silently skipped the
    // yellow vane's slices and left them pure #FFFD00.
    normalised = normalised.replace(/fill="(#[0-9a-fA-F]{6})"/g, (match, hex) => {
      const lower = hex.toLowerCase();
      const [h, s] = hexToHsl(lower);
      if (s < 0.12) return match; // neutral: white highlights, black outline
      return `fill="${stopToVane(h * 360)}"`;
    });

    // The white plate itself is drawn as a path, not a rect - retint it too.
    normalised = normalised.replace(/fill="#ffffff"/gi, `fill="${PLATE}"`);

    return normalised;
  }
  // CMake is three gradient-filled triangles. Once muted, three gradients in three
  // bright hues fight each other; flattening each triangle to one flat tone and
  // separating them by value instead keeps the geometry and kills the noise.
  if (name === "cmake") {
    const levels = [0.32, 0.46, 0.6, 0.72];
    let index = 0;
    normalised = normalised.replace(/<linearGradient[\s\S]*?<\/linearGradient>/g, (block) => {
      const level = levels[index % levels.length];
      index += 1;
      const [au, as] = hexToHsl(accent);
      const flat = hslToHex(au, Math.max(0.26, as * 0.9), level);
      return block.replace(/stop-color="#[0-9a-fA-F]{6}"/g, `stop-color="${flat}"`);
    });

    // Same reason as DaVinci: the four levels are the point, a second pass would
    // collapse them back onto one ladder.
    return normalised.replace(HEX6, (match) => {
      const lower = match.toLowerCase();
      if (lower === TILE) return lower;
      const lum = luminance(lower);
      if (lum > 0.72) return WHITE;
      if (lum < 0.02) return BLACK;
      return lower;
    });
  }

  // Other gradient-heavy logos (Thunderbird, Sublime) keep their direction but lose
  // the extra stops that turn into banding after desaturation.
  if (SIMPLIFY_GRADIENT.has(name)) {
    normalised = normalised.replace(/<linearGradient[\s\S]*?<\/linearGradient>/g, (block) => {
      const stops = block.match(/<stop[^>]*>/g) ?? [];
      if (stops.length <= 2) return block;
      const first = stops[0];
      const last = stops[stops.length - 1];
      return block.replace(/<stop[^>]*>/g, "").replace("</linearGradient>", `${first}${last}</linearGradient>`);
    });
  }

  // Classify the icon before touching anything: which colours are background, which
  // are the glyph, and whether anything is genuinely coloured.
  const bleedRects = normalised.match(BLEED_RECT) ?? [];
  const backgroundColors = new Set();
  for (const rect of bleedRects) {
    for (const hex of rect.match(HEX6) ?? []) backgroundColors.add(hex.toLowerCase());
  }

  const withoutBackground = normalised.replace(BLEED_RECT, "");
  const glyphColors = [...new Set((withoutBackground.match(HEX6) ?? []).map((h) => h.toLowerCase()))];

  const isColoured = (hex) => {
    const [, s, l] = hexToHsl(hex);
    return s >= 0.15 && l > 0.06 && l < 0.94;
  };

  const backgroundIsColour = [...backgroundColors].some(isColoured);
  const glyphHasColour = glyphColors.some(isColoured);
  // A glyph that is pure white on a dark plate is the "white figure" family; it must
  // be tinted to the accent, otherwise it stays a white blob on a grey tile.
  const glyphIsWhiteOnly =
    glyphColors.length > 0 && glyphColors.every((hex) => luminance(hex) > 0.72);

  // Family 1: coloured background + plain glyph -> paint the background, keep the
  // glyph white (Nginx's green plate with the white N, Windows' blue plate).
  // Family 2: dark background, glyph carries one accent colour -> keep the plate
  // dark and let the glyph keep the accent (Ansible's red ring on black).
  // Family 3: dark background, glyph is plain white -> colour the glyph so it is not
  // a white blob on a grey tile (Vercel, ChatGPT, Unity, three.js).
  const colorTheBackground = backgroundIsColour && !glyphHasColour;
  const colorTheGlyph =
    !backgroundIsColour && (glyphIsWhiteOnly || !glyphHasColour) && !glyphHasColour;

  let out = normalised.replace(BLEED_RECT, (tag) =>
    tag.replace(/(fill|style)="[^"]*"/g, (attr) => {
      if (!attr.startsWith("fill")) return attr;
      return `fill="${colorTheBackground ? accent : TILE}"`;
    }),
  );

  if (ICON_MULTI_COLOR.includes(name)) {
    // Family 4: keep the hues, mute them.
    return out.replace(HEX6, (match) => {
      const lower = match.toLowerCase();
      if (lower === TILE) return lower;
      const lum = luminance(lower);
      if (lum > 0.72) return WHITE;
      if (lum < 0.02) return BLACK;
      const [h, s, l] = hexToHsl(lower);
      return hslToHex(h, Math.min(s, 0.34), Math.min(0.78, Math.max(0.32, l)));
    });
  }

  // stroke="white" is how outline-only logos (three.js) draw their figure; it has to
  // follow the same rule as fill or the glyph stays pure white.
  out = out.replace(/stroke="(#[0-9a-fA-F]{6})"/g, (match, hex) =>
    colorTheGlyph && luminance(hex.toLowerCase()) > 0.72 ? `stroke="${accentStep}"` : match,
  );

  return out.replace(HEX6, (match) => {
    const lower = match.toLowerCase();
    if (lower === TILE) return lower;

    const lum = luminance(lower);
    const [h, s, l] = hexToHsl(lower);

    // The icon's own figure, in a family that needs it coloured (Ansible's white A,
    // Vercel's white triangle, three.js outline).
    if (lum > 0.72) return colorTheGlyph ? accentStep : WHITE;
    if (lum < 0.02 && s < 0.2) return BLACK;

    // Family 3: coloured artwork -> snap its shading onto the accent ladder. A dark
    // but saturated colour (Lua's navy circle) is artwork, not background, so it is
    // tinted rather than pushed to black.
    if (s < 0.12) {
      return hslToHex((hexToHsl(accent)[0]), 0.05, Math.min(0.88, Math.max(0.18, l)));
    }

    const wide = WIDE_LADDER.has(name);
    const step = wide
      ? l < 0.25
        ? accentAt(accent, 0.38)
        : l < 0.5
          ? accentAt(accent, 0.56)
          : accentAt(accent, 0.76)
      : l < 0.3
        ? accentDeep
        : l < 0.58
          ? accentStep
          : accentBright;
    return step;
  });
}

export { hexToHsl, hslToHex, luminance, normaliseColors };
