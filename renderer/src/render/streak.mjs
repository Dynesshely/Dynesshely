/**
 * Streak panel.
 *
 * github-readme-streak-stats is a PHP application (vendor/github-readme-streak-stats,
 * src/card.php), so it cannot be imported as-is. This module ports the visual
 * skeleton of that card - three columns: total contributions, current streak,
 * longest streak, each with a big number, a label and a date range - to a plain
 * SVG template that uses the shared design tokens. The numbers come from
 * data/calendar.mjs and are lifetime values, like the original card.
 *
 * Each column is laid out independently and centred inside its own third of the
 * panel, so long labels ("TOTAL CONTRIBUTIONS") never crowd the dividers.
 */
import { formatDate } from "../data/calendar.mjs";

const COLUMNS = 3;
const NUMBER_SIZE = 24;
const LABEL_OFFSET = 22; // baseline distance between number and label
const RANGE_OFFSET = 43; // baseline distance between number and date range
const BLOCK_HEIGHT = 72;

function column(centerX, top, { value, label, range }, theme) {
  const numberY = top + NUMBER_SIZE;
  return `
    <text x="${centerX.toFixed(1)}" y="${numberY}" text-anchor="middle" fill="${theme.text}"
      font-family="${theme.font}" font-size="${NUMBER_SIZE}" font-weight="700"
      letter-spacing="-0.6">${value}</text>
    <text x="${centerX.toFixed(1)}" y="${numberY + LABEL_OFFSET}" text-anchor="middle" fill="${theme.muted}"
      font-family="${theme.font}" font-size="8" font-weight="600" letter-spacing="0.3">${label}</text>
    <text x="${centerX.toFixed(1)}" y="${numberY + RANGE_OFFSET}" text-anchor="middle" fill="${theme.muted}"
      font-family="${theme.font}" font-size="8.5" opacity="0.8">${range}</text>
  `;
}

/**
 * @param {{current:{length:number,start?:string,end?:string}, longest:{length:number,start?:string,end?:string}, total:number, since:string}} streak
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

  const entries = [
    {
      value: streak.total.toLocaleString("en-US"),
      label: "TOTAL CONTRIBUTIONS",
      range: `${formatDate(streak.since)} – now`,
    },
    {
      value: String(streak.current.length),
      label: "CURRENT STREAK",
      range: currentRange,
    },
    {
      value: String(streak.longest.length),
      label: "LONGEST STREAK",
      range: longestRange,
    },
  ];

  const columnWidth = box.width / COLUMNS;
  const top = Math.max(0, Math.round((box.height - BLOCK_HEIGHT) / 2));

  return `
    <g>
      ${entries
        .map((entry, index) => {
          const centerX = columnWidth * index + columnWidth / 2;
          const divider =
            index > 0
              ? `<line x1="${(columnWidth * index).toFixed(1)}" y1="${top + 2}"
                  x2="${(columnWidth * index).toFixed(1)}" y2="${top + BLOCK_HEIGHT - 4}"
                  stroke="${theme.panelStroke}" stroke-width="1" />`
              : "";
          return `${divider}${column(centerX, top, entry, theme)}`;
        })
        .join("")}
    </g>
  `;
}
