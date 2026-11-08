/**
 * Morandi post-processing for the vendored cards.
 *
 * The upstream charts paint each language with its brand colour straight from
 * `languageColors.json` (saturated Vue green, C# purple, C++ pink ...), which
 * fights the muted Morandi palette used by the panels. There is no upstream
 * option to override per-language colours, and patching the vendored copy would
 * break the "verbatim upstream" rule, so the rendered SVG is desaturated here:
 * hue and lightness are preserved, saturation is clamped. Greys (our own text
 * colours) have almost no saturation and are left effectively untouched.
 */

const CLAMP = 0.3; // target saturation ceiling
const MIN_LIGHTNESS = 0.3; // keep dark bars/cells from turning to mud
const MAX_LIGHTNESS = 0.78;

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
 * Desaturate one colour; greys and near-greys are returned unchanged.
 *
 * @param {string} hex  `#rrggbb`
 * @param {object} [options]
 * @param {number} [options.maxSaturation]  ceiling for the HSL saturation
 * @param {number} [options.lightnessFloor]
 * @param {number} [options.lightnessCeiling]
 */
export function morandiColor(hex, options = {}) {
  const {
    maxSaturation = CLAMP,
    lightnessFloor = MIN_LIGHTNESS,
    lightnessCeiling = MAX_LIGHTNESS,
  } = options;

  const [h, s, l] = hexToHsl(hex);
  if (s < 0.12) return hex; // already a neutral
  const nextS = Math.min(s, maxSaturation);
  const nextL = Math.min(lightnessCeiling, Math.max(lightnessFloor, l));
  return hslToHex(h, nextS, nextL);
}

/**
 * Rewrite every hex colour in an SVG through `morandiColor`.
 * Only 6-digit hex values are touched (`#fff`/`#ffffffaa` are left alone).
 */
export function morandiizeSvg(svg) {
  return svg.replace(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g, (match) => morandiColor(match.toLowerCase()));
}
