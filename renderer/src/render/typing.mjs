/**
 * Typing animation (replaces the readme-typing-svg images).
 *
 * Cycles type -> hold -> delete -> hold, the way the original service behaved:
 * the text is revealed glyph by glyph, pauses, then is removed glyph by glyph,
 * then starts over.
 *
 * Implementation notes:
 * - The reveal is a `clipPath` rect whose width animates in `steps()` so every
 *   step lands exactly on a monospace glyph boundary (no text measuring, no font
 *   embedding).
 * - `animation-timing-function` is set per keyframe segment, so the typing and
 *   deleting halves are both stepped while the hold segments are linear.
 * - The rect ships with its final width inline: if CSS animations are unavailable
 *   the finished line is shown instead of an empty image.
 */

const CHAR_RATIO = 0.6; // monospace advance width relative to font-size

const TYPING_FONT =
  "'Fira Code', 'Cascadia Code', 'Segoe UI Mono', 'SFMono-Regular', Consolas, monospace";

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * @param {object} spec
 * @param {string} spec.text           line to type
 * @param {number} [spec.fontSize]
 * @param {string} [spec.color]        text colour (Morandi accent)
 * @param {string|false} [spec.caret]  caret colour, or false for no caret
 * @param {"left"|"center"} [spec.align]
 * @param {number} [spec.typeMs]       typing phase duration
 * @param {number} [spec.holdMs]       pause with the full line visible
 * @param {number} [spec.deleteMs]     deleting phase duration
 * @param {number} [spec.paddingX]
 */
export function renderTyping(spec) {
  const {
    text,
    fontSize = 26,
    color = "#6E87A6",
    caret = "#A9B8CC",
    align = "left",
    typeMs = 1800,
    holdMs = 1600,
    deleteMs = 1200,
    paddingX = 36,
  } = spec;

  const chars = [...text];
  const charWidth = fontSize * CHAR_RATIO;
  const textWidth = chars.length * charWidth;
  const width = Math.round(textWidth + paddingX * 2 + fontSize);
  const height = Math.round(fontSize * 3);
  const baselineY = Math.round(height / 2 + fontSize * 0.35);
  const startX = align === "center" ? (width - textWidth) / 2 : paddingX;

  const typeEnd = typeMs;
  const holdEnd = typeEnd + holdMs;
  const deleteEnd = holdEnd + deleteMs;
  const total = deleteEnd + 300; // small empty beat before looping
  const pct = (ms) => ((ms / total) * 100).toFixed(2);
  const duration = (total / 1000).toFixed(2);

  const caretMarkup = caret
    ? `<rect class="caret" x="${(startX + 1).toFixed(1)}"
    y="${(baselineY - fontSize * 0.92).toFixed(1)}" width="2"
    height="${(fontSize * 1.15).toFixed(1)}" fill="${caret}" />`
    : "";

  const caretCss = caret
    ? `
    .caret {
      animation: caret ${duration}s infinite, blink 1s steps(2, jump-none) infinite;
    }
    @keyframes caret {
      0%             { transform: translateX(0); animation-timing-function: steps(${chars.length}, end); }
      ${pct(typeEnd)}%   { transform: translateX(${textWidth.toFixed(1)}px); }
      ${pct(holdEnd)}%   { transform: translateX(${textWidth.toFixed(1)}px); animation-timing-function: steps(${chars.length}, end); }
      ${pct(deleteEnd)}% { transform: translateX(0); }
      100%           { transform: translateX(0); }
    }`
    : "";

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(text)}">
  <title>${escapeXml(text)}</title>
  <style>
    .reveal {
      animation: reveal ${duration}s infinite;
    }
    @keyframes reveal {
      0% {
        width: 0;
        animation-timing-function: steps(${chars.length}, end);
      }
      ${pct(typeEnd)}% { width: ${textWidth.toFixed(1)}px; }
      ${pct(holdEnd)}% {
        width: ${textWidth.toFixed(1)}px;
        animation-timing-function: steps(${chars.length}, end);
      }
      ${pct(deleteEnd)}% { width: 0; }
      100% { width: 0; }
    }${caretCss}
    @keyframes blink {
      0%   { opacity: 1; }
      50%  { opacity: 0; }
      100% { opacity: 1; }
    }
  </style>
  <defs>
    <clipPath id="typing-reveal">
      <rect class="reveal" x="${startX.toFixed(1)}" y="0"
        width="${textWidth.toFixed(1)}" height="${height}" />
    </clipPath>
  </defs>
  <g clip-path="url(#typing-reveal)">
    <text x="${startX.toFixed(1)}" y="${baselineY}" fill="${color}" font-family="${TYPING_FONT}"
      font-size="${fontSize}" font-weight="500" letter-spacing="0">${escapeXml(text)}</text>
  </g>
  ${caretMarkup}
</svg>
`;
}
