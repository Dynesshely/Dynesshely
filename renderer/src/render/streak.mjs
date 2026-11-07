/**
 * Streak panel.
 *
 * github-readme-streak-stats is a PHP application (vendor/github-readme-streak-stats,
 * src/card.php), so it cannot be imported as-is. This module ports the visual
 * skeleton of that card (two columns: current streak / longest streak, big number,
 * label, date range) to a plain SVG template that uses the shared design tokens.
 * The streak numbers themselves are computed by data/calendar.mjs.
 */
import { formatDate } from "../data/calendar.mjs";

function column(x, top, { value, label, range, numberSize }, theme) {
  const numberY = top + numberSize;
  return `
    <text x="${x}" y="${numberY}" fill="${theme.text}" font-family="${theme.font}"
      font-size="${numberSize}" font-weight="700" letter-spacing="-0.8">${value}</text>
    <text x="${x}" y="${numberY + 17}" fill="${theme.muted}" font-family="${theme.font}"
      font-size="11" font-weight="500">${label}</text>
    <text x="${x}" y="${numberY + 33}" fill="${theme.muted}" font-family="${theme.font}"
      font-size="9.5" opacity="0.85">${range}</text>
  `;
}

/**
 * @param {{current:{length:number,start?:string,end?:string}, longest:{length:number,start?:string,end?:string}}} streak
 * @param {{width:number, height:number}} box content area inside the panel
 */
export function renderStreakPanel(streak, theme, box) {
  const currentRange =
    streak.current.length > 0
      ? `${formatDate(streak.current.start)} – ${formatDate(streak.current.end)}`
      : "no active streak";
  const longestRange =
    streak.longest.length > 0
      ? `${formatDate(streak.longest.start)} – ${formatDate(streak.longest.end)}`
      : "—";

  const columnHeight = 34 + 33;
  const top = Math.max(0, Math.round((box.height - columnHeight) / 2));
  const half = Math.round(box.width / 2);
  const dividerX = half - 18;

  return `
    <g>
      <line x1="${dividerX}" y1="${top + 4}" x2="${dividerX}" y2="${top + columnHeight - 6}"
        stroke="${theme.panelStroke}" stroke-width="1" />
      ${column(0, top, {
        value: String(streak.current.length),
        label: "current streak (days)",
        range: currentRange,
        numberSize: 34,
      }, theme)}
      ${column(half + 8, top + 6, {
        value: String(streak.longest.length),
        label: "longest streak (days)",
        range: longestRange,
        numberSize: 24,
      }, theme)}
    </g>
  `;
}
