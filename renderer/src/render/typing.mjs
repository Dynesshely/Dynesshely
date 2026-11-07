/**
 * Typing animation (replaces the readme-typing-svg images).
 *
 * Design constraint: the SVG must look complete even when animations do not run
 * (headless renderers, image proxies, accessibility tools). So nothing is hidden
 * through inline attributes - every glyph starts at its natural opacity and the
 * CSS animation's `both` fill hides it only while the animation is active. If CSS
 * animations are unavailable the result is simply the finished line, not a blank
 * image.
 *
 * Glyph advance is a monospace constant, so the delay staircase is computed from
 * font-size without measuring text and without embedding a font (~1-2 KB per file).
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
 * @param {string} spec.text        line to type
 * @param {number} [spec.fontSize]
 * @param {string} [spec.color]     text colour (Morandi accent)
 * @param {string|false} [spec.caret] caret colour, or false for no caret
 * @param {"left"|"center"} [spec.align]
 * @param {number} [spec.typeMs]    total typing duration in ms
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
    paddingX = 36,
  } = spec;

  const chars = [...text];
  const charWidth = fontSize * CHAR_RATIO;
  const textWidth = chars.length * charWidth;
  const width = Math.round(textWidth + paddingX * 2);
  const height = Math.round(fontSize * 3);
  const baselineY = Math.round(height / 2 + fontSize * 0.35);
  const startX = align === "center" ? (width - textWidth) / 2 : paddingX;
  const stepSeconds = typeMs / 1000 / chars.length;
  const glyphMs = 110;

  const spans = chars
    .map((char, index) => {
      const delay = (0.2 + index * stepSeconds).toFixed(3);
      const glyph = char === " " ? "&#160;" : escapeXml(char);
      return `<tspan style="animation-delay:${delay}s">${glyph}</tspan>`;
    })
    .join("");

  const caretMarkup = caret
    ? `<rect class="caret" x="${(startX + textWidth + 2).toFixed(1)}"
    y="${(baselineY - fontSize * 0.92).toFixed(1)}" width="2"
    height="${(fontSize * 1.15).toFixed(1)}" fill="${caret}" />`
    : "";

  const caretCss = caret
    ? `
    .caret {
      animation: blink 1s steps(2, jump-none) infinite;
    }
    @keyframes blink {
      0%   { opacity: 1; }
      50%  { opacity: 0; }
      100% { opacity: 1; }
    }`
    : "";

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none"
    xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeXml(text)}">
  <title>${escapeXml(text)}</title>
  <style>
    tspan {
      opacity: 1;
      animation: glyph ${glyphMs}ms both;
    }
    @keyframes glyph {
      from { opacity: 0; }
      to   { opacity: 1; }
    }${caretCss}
  </style>
  <text x="${startX.toFixed(1)}" y="${baselineY}" fill="${color}" font-family="${TYPING_FONT}"
    font-size="${fontSize}" font-weight="500" letter-spacing="0" xml:space="preserve">${spans}</text>
  ${caretMarkup}
</svg>
`;
}
