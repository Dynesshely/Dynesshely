/**
 * Section banners (Status / Intro / Skills / Contact / footer).
 *
 * These replace the capsule-render images the README used to pull: one flat
 * Morandi gradient per section, each section in its own hue, with soft wave
 * bands for depth. Rendering them here keeps the whole page on one palette and
 * removes the last third-party image dependency.
 */
import { BANNER_FONT } from "../theme.mjs";

/**
 * Build a smooth closed wave filling the bottom part of the canvas.
 * Quadratic curves through the midpoints of a sampled sine wave.
 */
function wavePath(width, height, { amplitude, baseline, phase, steps = 48 }) {
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const x = (width * index) / steps;
    const y = baseline + Math.sin((index / steps) * Math.PI * 2 + phase) * amplitude;
    points.push([x, y]);
  }

  let path = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let index = 1; index < points.length - 1; index += 1) {
    const [cx, cy] = points[index];
    const [nx, ny] = points[index + 1];
    path += ` Q${cx.toFixed(1)},${cy.toFixed(1)} ${((cx + nx) / 2).toFixed(1)},${((cy + ny) / 2).toFixed(1)}`;
  }
  path += ` L${width},${height} L0,${height} Z`;
  return path;
}

/**
 * @param {object} spec
 * @param {string} spec.id          file name (status, intro, skills, contact, footer)
 * @param {string} spec.title       centred label; empty for a pure decoration
 * @param {number} spec.height      canvas height (150 for section headers, 300 for the footer)
 * @param {string[]} spec.gradient  two Morandi stops, left to right
 */
export function renderBanner(spec) {
  const { id, title, height, gradient } = spec;
  const width = 800;
  const [start, end] = gradient;
  const fontSize = Math.round(height * 0.29);
  const textY = Math.round(height / 2 + fontSize * 0.35);
  const gradientId = `${id}-grad`;
  const clipId = `${id}-clip`;

  const waves = [
    { amplitude: height * 0.06, baseline: height * 0.72, phase: 0.6, opacity: 0.1 },
    { amplitude: height * 0.045, baseline: height * 0.84, phase: 2.4, opacity: 0.08 },
    { amplitude: height * 0.03, baseline: height * 0.94, phase: 4.1, opacity: 0.06 },
  ]
    .map(
      (wave) =>
        `<path d="${wavePath(width, height, wave)}" fill="#ffffff" fill-opacity="${wave.opacity}" />`,
    )
    .join("\n      ");

  const label = title
    ? `<text x="${width / 2}" y="${textY}" text-anchor="middle" fill="#ffffff" fill-opacity="0.95"
      font-family="${BANNER_FONT}" font-size="${fontSize}" font-weight="700" letter-spacing="2">${title}</text>`
    : "";

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title || "decoration"}">
  <title>${title || "decoration"}</title>
  <defs>
    <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${start}" />
      <stop offset="100%" stop-color="${end}" />
    </linearGradient>
    <clipPath id="${clipId}">
      <rect x="0" y="0" width="${width}" height="${height}" rx="16" ry="16" />
    </clipPath>
  </defs>
  <g clip-path="url(#${clipId})">
    <rect x="0" y="0" width="${width}" height="${height}" fill="url(#${gradientId})" />
    ${waves}
    ${label}
  </g>
</svg>
`;
}
