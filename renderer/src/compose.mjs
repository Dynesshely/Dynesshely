/**
 * Composes the individual cards into one 800px-wide status panel.
 *
 * Two composition strategies are used on purpose:
 *   - upstream cards are embedded as base64 <image> elements. Each card ships its
 *     own <style> block with class names like `.text`, so inlining five of them
 *     into one document would make the CSS collide. An <image> is a separate
 *     document, so the upstream output stays byte-for-byte untouched.
 *   - our own streak / heatmap panels are inlined SVG with presentation
 *     attributes only (no classes), so nothing can leak between panels.
 */
import { LAYOUT, THEMES } from "./theme.mjs";
import { svgDataUri } from "./render/cards.mjs";
import { renderHeatmapPanel } from "./render/heatmap.mjs";
import { renderStreakPanel } from "./render/streak.mjs";

const esc = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function panelFrame(theme, box, { title, hint = "", content }) {
  const pad = LAYOUT.padding;
  const contentX = box.x + pad;
  const contentY = box.y + pad + 20;
  const contentW = box.w - pad * 2;
  const contentH = box.h - (pad + 20) - pad;

  const titleText = `<text x="${box.x + pad}" y="${box.y + pad + 12}" fill="${theme.title}"
      font-family="${theme.font}" font-size="12" font-weight="700" letter-spacing="0.3">${esc(title)}</text>`;
  const hintText = hint
    ? `<text x="${box.x + box.w - pad}" y="${box.y + pad + 12}" text-anchor="end" fill="${theme.muted}"
        font-family="${theme.font}" font-size="10" opacity="0.9">${esc(hint)}</text>`
    : "";

  let body;
  if (content?.kind === "image") {
    body = `<image x="0" y="0" width="${contentW}" height="${contentH}"
      preserveAspectRatio="xMidYMid meet" href="${content.dataUri}" />`;
  } else if (content?.kind === "inline") {
    body = content.render({ width: contentW, height: contentH }, theme);
  } else {
    body = `<text x="0" y="${Math.round(contentH / 2)}" fill="${theme.muted}" font-family="${theme.font}"
      font-size="11">${esc(content?.message ?? "unavailable")}</text>`;
  }

  return `
    <g>
      <rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="${LAYOUT.radius}"
        fill="${theme.panelFill}" stroke="${theme.panelStroke}" stroke-width="1" />
      ${titleText}${hintText}
      <g transform="translate(${contentX}, ${contentY})">${body}</g>
    </g>`;
}

/**
 * @param {object} input
 * @param {"light"|"dark"} input.variant
 * @param {Record<string, any>} input.cards   results of renderUpstreamCards()
 * @param {object} input.streak               computeStreak() result
 * @param {object|null} input.calendar        fetchContributionCalendar() result
 */
export function composeStatusPanel({ variant, cards, streak, calendar }) {
  const theme = THEMES[variant];
  const { panels } = LAYOUT;

  const imageContent = (card, fallback) =>
    card
      ? { kind: "image", dataUri: svgDataUri(card.svg) }
      : { kind: "missing", message: fallback };

  const heatmap = calendar
    ? { kind: "inline", render: (box, t) => renderHeatmapPanel(calendar, t, box) }
    : { kind: "missing", message: "contribution data unavailable" };

  const streakPanel = streak
    ? { kind: "inline", render: (box, t) => renderStreakPanel(streak, t, box) }
    : { kind: "missing", message: "streak data unavailable" };

  const body = [
    panelFrame(theme, panels.heatmap, {
      title: "Contributions",
      hint: calendar ? `${calendar.total.toLocaleString("en-US")} in the last year` : "",
      content: heatmap,
    }),
    panelFrame(theme, panels.stats, {
      title: "GitHub Stats",
      content: imageContent(cards.stats, "GitHub stats unavailable"),
    }),
    panelFrame(theme, panels.streak, {
      title: "Streak",
      content: streakPanel,
    }),
    panelFrame(theme, panels.wakatime, {
      title: "WakaTime",
      hint: "last year",
      content: imageContent(cards.wakatime, "WakaTime unavailable"),
    }),
    panelFrame(theme, panels.toplangs, {
      title: "Top Languages",
      hint: "by code size",
      content: imageContent(cards.topLangs, "language data unavailable"),
    }),
  ].join("\n");

  return `<svg width="${LAYOUT.width}" height="${LAYOUT.height}" viewBox="0 0 ${LAYOUT.width} ${LAYOUT.height}"
    fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dynesshely status panel">
  <title>Dynesshely &#183; status</title>
  <g font-family="${theme.font}">
${body}
  </g>
</svg>
`;
}
