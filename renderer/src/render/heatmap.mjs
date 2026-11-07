/**
 * Contributions panel: 53-week heatmap + a 30-day trend line.
 *
 * The heatmap replaces github-readme-activity-graph's 1200px chartist line (too
 * wide for a 768px row), but the old README's contribution graph was liked, so
 * both views are drawn here: the calendar grid for the year, and a smoothed
 * area/line chart of the last 30 days underneath. Colours follow the panel
 * design tokens and the upstream theme (`styles/themes.ts`) ideas.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CELL = 11;
const GAP = 2;
const STEP = CELL + GAP;
const TREND_DAYS = 30;

const hexToRgb = (hex) => {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

const rgbToHex = (rgb) =>
  `#${rgb.map((channel) => Math.round(channel).toString(16).padStart(2, "0")).join("")}`;

/**
 * Continuous heat scale: each day is interpolated between heatFrom (quiet) and
 * heatTo (peak) by count/max, with a slight gamma so low days stay distinguishable.
 * No fixed buckets.
 */
function heatColor(count, max, theme) {
  if (!count) return theme.heatEmpty;
  const t = Math.pow(Math.min(1, count / Math.max(1, max)), 0.55);
  const from = hexToRgb(theme.heatFrom);
  const to = hexToRgb(theme.heatTo);
  return rgbToHex(from.map((channel, index) => channel + (to[index] - channel) * t));
}

function renderHeatmap(calendar, theme, box) {
  const weeks = calendar.weeks.slice(-53);
  const max = Math.max(1, ...weeks.flat().map((date) => calendar.counts.get(date) ?? 0));

  const labelWidth = 20;
  const gridWidth = weeks.length * STEP;
  const gridHeight = 7 * STEP;
  const originX = labelWidth;
  const originY = 17;
  const width = Math.min(box.width, gridWidth + labelWidth);
  const offsetX = Math.max(0, Math.round((box.width - width) / 2));

  let cells = "";
  let monthLabels = "";
  let lastMonth = -1;

  weeks.forEach((weekDates, col) => {
    weekDates.forEach((date, row) => {
      const count = calendar.counts.get(date) ?? 0;
      const x = originX + offsetX + col * STEP;
      const y = originY + row * STEP;
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${heatColor(count, max, theme)}"><title>${date}: ${count}</title></rect>`;

      const month = Number(date.slice(5, 7)) - 1;
      if (row === 0 && month !== lastMonth) {
        lastMonth = month;
        if (col < weeks.length - 3) {
          monthLabels += `<text x="${x}" y="${originY - 6}" fill="${theme.muted}" font-family="${theme.font}" font-size="9">${MONTHS[month]}</text>`;
        }
      }
    });
  });

  const weekdayLabels = [
    [1, "Mon"],
    [3, "Wed"],
    [5, "Fri"],
  ]
    .map(([row, text]) => {
      const y = originY + row * STEP + CELL - 1;
      return `<text x="0" y="${y}" fill="${theme.muted}" font-family="${theme.font}" font-size="9">${text}</text>`;
    })
    .join("");

  return `${monthLabels}${weekdayLabels}${cells}`;
}

/** Cubic curve through the points, using midpoint control points (smooth, no overshoot). */
function smoothPath(points) {
  if (points.length === 0) return "";
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const mx = ((x0 + x1) / 2).toFixed(2);
    d += ` C${mx},${y0.toFixed(2)} ${mx},${y1.toFixed(2)} ${x1.toFixed(2)},${y1.toFixed(2)}`;
  }
  return d;
}

function renderTrend(days, theme, box) {
  const today = new Date().toISOString().slice(0, 10);
  const recent = days.filter((day) => day.date <= today).slice(-TREND_DAYS);
  if (recent.length < 2) return "";

  const max = Math.max(1, ...recent.map((day) => day.count));
  const left = 26;
  const top = 6;
  const bottom = 13;
  const width = box.width - left;
  const height = box.height - top - bottom;
  const step = width / (recent.length - 1);
  const px = (index) => left + index * step;
  const py = (count) => top + height - (height * count) / max;
  const baseY = top + height;

  const points = recent.map((day, index) => [px(index), py(day.count)]);
  const line = smoothPath(points);
  const area = `${line} L${px(recent.length - 1).toFixed(2)},${baseY} L${left},${baseY} Z`;

  const gridLines = [0, 0.5, 1]
    .map((ratio) => {
      const value = Math.round(max * ratio);
      const y = py(value);
      return `<line x1="${left}" y1="${y.toFixed(1)}" x2="${left + width}" y2="${y.toFixed(1)}"
          stroke="${theme.panelStroke}" stroke-width="1" stroke-dasharray="3 4" />
        <text x="${left - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end" fill="${theme.muted}"
          font-family="${theme.font}" font-size="8">${value}</text>`;
    })
    .join("");

  const xLabels = recent
    .map((day, index) => ({ day, index }))
    .filter(({ index }) => index % 6 === 0 || index === recent.length - 1)
    .map(({ day, index }) => {
      const label = `${Number(day.date.slice(5, 7))}/${Number(day.date.slice(8, 10))}`;
      return `<text x="${px(index).toFixed(1)}" y="${baseY + 11}" text-anchor="middle" fill="${theme.muted}"
        font-family="${theme.font}" font-size="8">${label}</text>`;
    })
    .join("");

  const dots = recent
    .map((day, index) => {
      if (day.count === 0) return "";
      return `<circle cx="${px(index).toFixed(1)}" cy="${py(day.count).toFixed(1)}" r="1.6" fill="${theme.accent}" />`;
    })
    .join("");

  return `
    <g>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.28" />
          <stop offset="100%" stop-color="${theme.accent}" stop-opacity="0" />
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${area}" fill="url(#trendFill)" />
      <path d="${line}" fill="none" stroke="${theme.accent}" stroke-width="1.6"
        stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      ${xLabels}
    </g>`;
}

/**
 * Calendar heatmap card.
 * @param {{weeks: string[][], counts: Map<string, number>}} calendar
 * @param {object} theme
 * @param {{width:number, height:number}} box
 */
export function renderHeatmapPanel(calendar, theme, box) {
  return renderHeatmap(calendar, theme, box);
}

/**
 * Last-30-days trend card.
 * @param {{days: {date:string,count:number}[]}} calendar
 * @param {object} theme
 * @param {{width:number, height:number}} box
 */
export function renderTrendPanel(calendar, theme, box) {
  return renderTrend(calendar.days, theme, box);
}
