/**
 * Hand-drawn replacements for a few logos.
 *
 * Two reasons an icon ends up here instead of going through the recolour pipeline:
 *
 *  1. the vendored mark carries so much detail that it turns to mush at 36px
 *     (Safari ships a 16 KB tick-mark path, two Gaussian-blur filters and five
 *     nested gradient stops - recoloured it reads as a smudge, not a compass);
 *  2. the original is drawn for a light background and has no dark variant.
 *
 * Entries are drawn on the same 256x256 canvas as the vendored icons, on the shared
 * tile colour, and use the same Morandi palette, so they sit in the grid without a
 * seam. Everything is plain geometry - no filters, no blur, no external ids - which
 * keeps them crisp at every size and cheap to inline.
 */

const TILE = "#2C3238";
const CENTRE = 128;

/** Trim trailing decimals so the generated markup stays readable and stable. */
const n = (value) => Number(value.toFixed(2)).toString();

/**
 * Four ticks at the cardinal points.
 *
 * They are deliberately *not* on the diagonals: the needle points to the upper
 * right, so a diagonal tick would sit right underneath it and disappear.
 */
function cardinalTicks({ radiusIn, radiusOut, width, colour }) {
  const lines = [];
  for (let index = 0; index < 4; index += 1) {
    const angle = ((index * 90) * Math.PI) / 180;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    lines.push(
      `<line x1="${n(CENTRE + radiusIn * sin)}" y1="${n(CENTRE - radiusIn * cos)}" `
        + `x2="${n(CENTRE + radiusOut * sin)}" y2="${n(CENTRE - radiusOut * cos)}" `
        + `stroke="${colour}" stroke-width="${width}" stroke-linecap="round"/>`,
    );
  }
  return lines.join("");
}

/** Point on a circle, in degrees, measured from 12 o'clock clockwise. */
function pointOnCircle(radius, degrees) {
  const angle = (degrees * Math.PI) / 180;
  return [CENTRE + radius * Math.sin(angle), CENTRE - radius * Math.cos(angle)];
}

/**
 * A simplified Safari compass: plate, bezel, dial, four ticks, needle, hub.
 *
 * Compared with the vendored artwork the tick ring is 4 marks instead of 60, the
 * needle is a rounded diamond instead of two sharp triangles, the dial keeps one
 * soft highlight instead of five radial stops, and the two blur filters are gone.
 * The needle still points up-right like the real mark and the ticks sit on the
 * cardinal points, so the two never overlap. Proportions were chosen so it reads as
 * Safari at 36px while the silhouette becomes rounder - which is what "a bit more
 * Q" means here.
 */
function safariCompass() {
  const bezel = "#CFC6B6";
  const dial = "#84ADC6";
  const dialHighlight = "#ACC9DC";
  const tick = "#EDE8DE";
  const needleNorth = "#C4685A";
  const needleSouth = "#F2ECE0";
  const hub = "#EFE8DC";

  // Needle proportions: half-width 25 on a 73-radius dial, tips 57 units apart.
  // The wide-ish waist and the round joins are what make the silhouette read as a
  // rounded needle rather than two sharp triangles.
  const halfWidth = 25;
  const northTip = 71;
  const southTip = 185;
  const stroke = 12;
  const left = CENTRE - halfWidth;
  const right = CENTRE + halfWidth;
  // The hub is a dark pin inside a thin cream ring. A pale disc sitting on the
  // centre of a red-and-white needle reads as the letter A; the dark pin keeps the
  // two halves visibly "pinned" without closing the shape into a wordmark.
  const hubRadius = 9;
  const hubRingWidth = 3;

  // One gloss arc across the upper-left of the dial. It is a plain stroke, not a
  // filter, so it survives being scaled down to 36px without turning into a halo.
  const gloss = 64;
  const [gx0, gy0] = pointOnCircle(gloss, -140);
  const [gx1, gy1] = pointOnCircle(gloss, -40);
  const glossPath = `M${n(gx0)} ${n(gy0)} A${gloss} ${gloss} 0 0 1 ${n(gx1)} ${n(gy1)}`;

  return [
    `<defs><radialGradient id="safari-dial" cx="0.36" cy="0.3" r="0.86">`
      + `<stop stop-color="${dialHighlight}"/><stop offset="1" stop-color="${dial}"/>`
      + `</radialGradient></defs>`,
    `<rect width="256" height="256" rx="60" fill="${TILE}"/>`,
    `<circle cx="128" cy="128" r="79" fill="none" stroke="${bezel}" stroke-width="11"/>`,
    `<circle cx="128" cy="128" r="73" fill="url(#safari-dial)"/>`,
    cardinalTicks({ radiusIn: 57, radiusOut: 68, width: 8, colour: tick }),
    // The needle is drawn upright and then rotated 45 degrees clockwise, the way the
    // real Safari mark points. Keeping it upright read as the letter A inside the
    // ring; the diagonal also leaves the four cardinal ticks free.
    `<g transform="rotate(45 128 128)">`,
    `<path d="M128 ${northTip} L${right} 128 L128 ${southTip} L${left} 128 Z" `
      + `fill="${needleSouth}" stroke="${needleSouth}" stroke-width="${stroke}" `
      + `stroke-linejoin="round" stroke-linecap="round"/>`,
    `<path d="M128 ${northTip} L${right} 128 L${left} 128 Z" `
      + `fill="${needleNorth}" stroke="${needleNorth}" stroke-width="${stroke}" `
      + `stroke-linejoin="round" stroke-linecap="round"/>`,
    `</g>`,
    `<circle cx="128" cy="128" r="${hubRadius}" fill="${TILE}"/>`,
    `<circle cx="128" cy="128" r="${hubRadius + 2.5}" fill="none" stroke="${hub}" `
      + `stroke-width="${hubRingWidth}"/>`,
    `<path d="${glossPath}" fill="none" stroke="#FFFFFF" stroke-opacity="0.26" `
      + `stroke-width="8" stroke-linecap="round"/>`,
  ].join("");
}

const ARTWORK = { safari: safariCompass };

/**
 * @param {string} name icon name
 * @returns {string|null} inner SVG markup, or null when this icon has no custom art
 */
export function customIconMarkup(name) {
  const draw = ARTWORK[name];
  return draw ? draw() : null;
}
