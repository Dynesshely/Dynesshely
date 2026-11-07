#!/usr/bin/env node
/**
 * Entry point: fetches the data, renders the cards and writes the composed panel.
 *
 *   node src/index.mjs                          # light + dark, default paths
 *   node src/index.mjs --variant light          # only assets/status.svg
 *   node src/index.mjs --variant dark           # only assets/status-dark.svg
 *   node src/index.mjs --out ../tmp/status.svg  # custom path
 *
 * Requires a GitHub token in PAT_1 (or GITHUB_TOKEN) because the vendored
 * github-readme-stats fetchers read PAT_1..PAT_n from the environment. WakaTime
 * is read anonymously from the public profile, exactly like the old card URL.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BANNERS, THEMES, TYPING_LINES } from "./theme.mjs";
import { loadCardData, renderUpstreamCards } from "./render/cards.mjs";
import { computeStreak, fetchContributionCalendar, fetchFullHistory } from "./data/calendar.mjs";
import { composeStatusPanel } from "./compose.mjs";
import { renderBanner } from "./render/banner.mjs";
import { renderTyping } from "./render/typing.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const rendererRoot = path.resolve(here, "..");
const repoRoot = path.resolve(rendererRoot, "..");

const args = process.argv.slice(2);
const value = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1] ?? fallback;
};

const username = value("username", "Dynesshely");
const variant = value("variant", "all");
const outLight = path.resolve(repoRoot, value("out", path.join("assets", "status.svg")));
const outDark = path.resolve(repoRoot, value("out-dark", path.join("assets", "status-dark.svg")));

if (!process.env.PAT_1 && !process.env.GITHUB_TOKEN) {
  console.error(
    "error: a GitHub token is required for the upstream fetchers.\n" +
      "       export PAT_1=$(gh auth token)   # or set GITHUB_TOKEN",
  );
  process.exit(2);
}
// The vendored fetchers read PAT_1 specifically; accept GITHUB_TOKEN as an alias.
if (!process.env.PAT_1 && process.env.GITHUB_TOKEN) {
  process.env.PAT_1 = process.env.GITHUB_TOKEN;
}

const log = (message) => console.log(`[status] ${message}`);
const problems = [];

async function main() {
  log(`rendering ${username} (${variant})`);

  const [cardsRaw, calendar, history] = await Promise.all([
    loadCardData(username),
    fetchContributionCalendar(username).catch((err) => {
      problems.push(`contribution calendar: ${err.message}`);
      return null;
    }),
    // The streak card shows lifetime values, which needs the whole account
    // history: contributionsCollection only accepts one year per query.
    fetchFullHistory(username).catch((err) => {
      problems.push(`lifetime contributions: ${err.message}`);
      return null;
    }),
  ]);

  for (const [key, result] of Object.entries(cardsRaw)) {
    if (result.status === "rejected") {
      problems.push(`${key}: ${result.reason?.message ?? result.reason}`);
    }
  }

  const streak = history
    ? { ...computeStreak(history.days), total: history.total, since: history.since }
    : null;
  if (streak) {
    log(
      `contributions=${history.total} (lifetime, since ${history.since}) streak=${streak.current.length} longest=${streak.longest.length}`,
    );
  }

  // Section banners and the typing line are theme-independent chrome around the
  // panel, written once per run.
  const bannerDir = path.join(repoRoot, "assets", "banner");
  await fs.mkdir(bannerDir, { recursive: true });
  for (const banner of BANNERS) {
    const svg = renderBanner(banner);
    const target = path.join(bannerDir, `${banner.id}.svg`);
    await fs.writeFile(target, svg, "utf8");
    log(`wrote ${path.relative(repoRoot, target)} (${Buffer.byteLength(svg)} bytes)`);
  }

  const typingDir = path.join(repoRoot, "assets", "typing");
  await fs.mkdir(typingDir, { recursive: true });
  for (const line of TYPING_LINES) {
    const svg = renderTyping(line);
    const target = path.join(typingDir, `${line.id}.svg`);
    await fs.writeFile(target, svg, "utf8");
    log(`wrote ${path.relative(repoRoot, target)} (${Buffer.byteLength(svg)} bytes)`);
  }

  const variants = variant === "all" ? ["light", "dark"] : [variant];
  for (const name of variants) {
    const theme = THEMES[name];
    if (!theme) throw new Error(`unknown variant: ${name} (use light, dark or all)`);

    const cards = renderUpstreamCards(cardsRaw, theme);
    const svg = composeStatusPanel({ variant: name, cards, streak, calendar });

    const target = name === "light" ? outLight : outDark;
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, svg, "utf8");

    const broken = !svg.includes("<svg");
    if (broken) problems.push(`${name}: output does not look like SVG`);
    log(`wrote ${path.relative(repoRoot, target)} (${Buffer.byteLength(svg)} bytes)`);
  }

  if (problems.length) {
    console.warn("");
    for (const problem of problems) console.warn(`warning: ${problem}`);
    console.warn(`\n${problems.length} source(s) unavailable - those panels contain a placeholder.`);
  }
}

main().catch((err) => {
  console.error(`error: ${err?.stack ?? err}`);
  process.exit(1);
});
