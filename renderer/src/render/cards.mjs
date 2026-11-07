/**
 * Thin wrappers around the vendored github-readme-stats renderers.
 *
 * The rendering code below `../upstream/github-readme-stats/` is copied verbatim
 * from anuraghazra/github-readme-stats (commit 54a7985, see
 * ../upstream/github-readme-stats/LICENSE). Nothing here forks it: we only call
 * its public `fetch*` / `render*` functions with the parameters the old README
 * URLs used, then return the raw SVG string plus its intrinsic size so the
 * composer can place it on the shared canvas.
 */
import { fetchStats } from "../upstream/github-readme-stats/src/fetchers/stats.js";
import { fetchTopLanguages } from "../upstream/github-readme-stats/src/fetchers/top-languages.js";
import { fetchWakatimeStats } from "../upstream/github-readme-stats/src/fetchers/wakatime.js";
import { renderStatsCard } from "../upstream/github-readme-stats/src/cards/stats.js";
import { renderTopLanguages } from "../upstream/github-readme-stats/src/cards/top-languages.js";
import { renderWakatimeCard } from "../upstream/github-readme-stats/src/cards/wakatime.js";
import { morandiizeSvg } from "./morandi.mjs";

export function svgDataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

/** Pull the intrinsic width/height out of a rendered card so we can reserve space. */
export function svgSize(svg) {
  const w = Number(/<svg[^>]*\swidth="([\d.]+)"/.exec(svg)?.[1] ?? 0);
  const h = Number(/<svg[^>]*\sheight="([\d.]+)"/.exec(svg)?.[1] ?? 0);
  return { width: w || 495, height: h || 195 };
}

export async function loadCardData(username) {
  const [stats, topLangs, wakatime] = await Promise.allSettled([
    fetchStats(username),
    fetchTopLanguages(username),
    fetchWakatimeStats({ username }),
  ]);
  return { stats, topLangs, wakatime };
}

/** The three upstream card variants, with the exact parameters the README used. */
export function renderUpstreamCards(data, theme) {
  const cards = {};

  if (data.stats.status === "fulfilled") {
    const svg = renderStatsCard(data.stats.value, {
      ...theme.card,
      // Rendered near the panel content width (350px) so embedding does not scale
      // the 14px labels down into unreadable 10px.
      card_width: 400,
      show_icons: true,
      hide: ["contribs"],
      show: ["reviews"],
      number_format: "long",
    });
    cards.stats = { svg, ...svgSize(svg) };
  }

  if (data.topLangs.status === "fulfilled") {
    const svg = renderTopLanguages(data.topLangs.value, {
      ...theme.card,
      // Same "top 10, no HTML" cut as the original README URL; a donut fills the
      // panel height much better than a 10-row compact list.
      layout: "donut",
      langs_count: 10,
      card_width: 350,
      hide: ["html"],
    });
    // The donut is painted with upstream brand colours; mute them to match.
    cards.topLangs = { svg: morandiizeSvg(svg), ...svgSize(svg) };
  }

  if (data.wakatime.status === "fulfilled") {
    const svg = renderWakatimeCard(data.wakatime.value, {
      ...theme.card,
      // 22 languages, exactly like the old card URL.
      layout: "compact",
      langs_count: 22,
      card_width: 360,
      display_format: "time",
    });
    cards.wakatime = { svg: morandiizeSvg(svg), ...svgSize(svg) };
  }

  return cards;
}
