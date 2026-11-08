/**
 * Fixed recolouring of the skills icons.
 *
 * Each icon has one hand-picked accent in `ICON_COLORS` (theme.mjs). At render time
 * every coloured path in that icon is re-tinted to that accent, keeping the logo's
 * own light/mid/shadow structure by mapping each source colour onto one of three
 * lightness steps. No runtime hue maths decides *which* colour an icon gets - that
 * is a fixed table an editor can correct by hand - only *how* the logo's internal
 * shades are spread inside that accent.
 *
 * Rules that keep the labels readable:
 * - the dark tile and pure white / near-black glyphs pass through unchanged
 * - neutral greys stay grey (warmed slightly) instead of being tinted
 * - every icon in a group has a different accent, so neighbours never merge
 */
import { ICON_COLORS, ICON_MULTI_COLOR, SKILL_ICON_STYLE } from "../theme.mjs";

const TILE = SKILL_ICON_STYLE.tile.toLowerCase();
const WHITE = "#F2F0EC";
const BLACK = "#1B1E22";

/** Three lightness steps the accent is spread across. */
const STEPS = [0.34, 0.5, 0.66];

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

/**
 * Re-tint one source colour to the icon's accent, keeping a 3-step lightness band.
 *
 * @param {string} hex source colour
 * @param {number} accentHue hue of the icon's fixed accent (0..1)
 * @param {number} accentSaturation saturation of the icon's fixed accent
 */
function tint(hex, accentHue, accentSaturation) {
  const [, s, l] = hexToHsl(hex);

  if (l > 0.92) return WHITE;
  if (l < 0.08) return BLACK;

  if (s < 0.1) {
    // neutral grey: keep it grey, just warm it very slightly
    return hslToHex(accentHue, 0.04, Math.min(0.86, Math.max(0.14, l)));
  }

  // coloured: keep the logo's relative shading on a 3-step ladder
  const step = l < 0.3 ? STEPS[0] : l < 0.58 ? STEPS[1] : STEPS[2];
  return hslToHex(accentHue, accentSaturation, step);
}

/**
 * Rewrite every colour in one icon's markup onto its fixed accent.
 *
 * @param {string} markup icon inner SVG markup
 * @param {string} name   icon name, used to look up its accent
 */
export function morandiIconMarkup(markup, name) {
  const multiColor = ICON_MULTI_COLOR.includes(name);

  return markup.replace(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g, (match) => {
    const lower = match.toLowerCase();
    if (lower === TILE || lower === "#242938") return lower; // backing tiles stay

    // Multi-colour logos keep their own hues; they are only muted, so Chrome stays
    // four-coloured instead of collapsing into one accent.
    if (multiColor) {
      const [h, s, l] = hexToHsl(lower);
      if (l > 0.92) return WHITE;
      if (l < 0.08) return BLACK;
      return hslToHex(h, Math.min(s, 0.38), Math.min(0.78, Math.max(0.3, l)));
    }

    const accent = (ICON_COLORS[name] ?? ICON_COLORS.cpp ?? "#7290AF").toLowerCase();
    const [accentHue, accentSaturation] = hexToHsl(accent);
    return tint(lower, accentHue, accentSaturation);
  });
}

export { hexToHsl, hslToHex, tint };
