/**
 * Contribution heatmap panel.
 *
 * github-readme-activity-graph (vendor/github-readme-activity-graph) renders a
 * 1200px-wide chartist line chart. At 768px on the shared canvas that becomes
 * unreadable, so the same data (the GitHub contribution calendar) is drawn as a
 * 53x7 heatmap instead - higher information density and it matches the size of
 * the other panels. Theme colours and the general layout follow the upstream
 * project's `styles/themes.ts`.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;

/** 5 buckets: empty + quartile thresholds so a low-volume profile still gets
 *  a readable distribution (raw max would put almost every day in bucket 1). */
function heatBuckets(weeks, counts) {
  const values = weeks
    .flat()
    .map((date) => counts.get(date) ?? 0)
    .filter((count) => count > 0)
    .sort((a, b) => a - b);
  if (values.length === 0) return [1, 2, 3, 4];
  const at = (p) => values[Math.min(values.length - 1, Math.floor(p * (values.length - 1)))];
  return [at(0.2), at(0.4), at(0.6), at(0.82)];
}

function heatColor(count, thresholds, theme) {
  if (!count) return theme.heatEmpty;
  let bucket = 1;
  for (const threshold of thresholds) {
    if (count > threshold) bucket += 1;
  }
  return theme.heat[Math.min(4, bucket)];
}

/**
 * @param {{weeks: string[][], counts: Map<string, number>}} calendar
 * @param {object} theme
 * @param {{width:number, height:number}} box
 */
export function renderHeatmapPanel(calendar, theme, box) {
  const weeks = calendar.weeks.slice(-53);
  const thresholds = heatBuckets(weeks, calendar.counts);

  const labelWidth = 20;
  const gridWidth = weeks.length * STEP;
  const gridHeight = 7 * STEP;
  const originX = labelWidth;
  const originY = 12;
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
      cells += `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" rx="2.5" fill="${heatColor(count, thresholds, theme)}"><title>${date}: ${count}</title></rect>`;

      const month = Number(date.slice(5, 7)) - 1;
      if (row === 0 && month !== lastMonth) {
        lastMonth = month;
        // keep labels from crowding the right edge
        if (col < weeks.length - 3) {
          monthLabels += `<text x="${x}" y="${originY - 3}" fill="${theme.muted}" font-family="${theme.font}" font-size="9">${MONTHS[month]}</text>`;
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

  const height = originY + gridHeight + 4;
  const scaled = height > box.height ? box.height / height : 1;

  return `
    <g transform="translate(0, ${Math.max(0, Math.round((box.height - height) / 2))}) scale(${scaled})">
      ${monthLabels}
      ${weekdayLabels}
      ${cells}
    </g>
  `;
}
