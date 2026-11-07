#!/usr/bin/env node
/**
 * Sanity checks around the generated README images.
 *
 *  1. every local `assets/...` reference in README.md must exist and look like an SVG;
 *  2. every SVG under assets/ must contain an <svg> root element;
 *  3. assets that no longer appear in README.md are reported as warnings.
 *
 * Exits non-zero when a reference is missing or a generated file is broken, so CI
 * fails instead of silently shipping dead images.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const readmePath = path.join(repoRoot, "README.md");
const assetsDir = path.join(repoRoot, "assets");

const docsDir = path.join(repoRoot, "demos");

// The main README and the previews under demos/ both reference generated assets.
const docFiles = [readmePath, ...(await walk(docsDir)).filter((file) => file.endsWith(".md"))];
const referenced = new Set();
for (const file of docFiles) {
  const text = await fs.readFile(file, "utf8");
  for (const match of text.matchAll(/assets\/[\w./-]+\.svg/g)) referenced.add(match[0]);
}

const problems = [];
const warnings = [];

if (referenced.size === 0) problems.push("README.md references no local assets - did the rewrite run?");

for (const ref of referenced) {
  const file = path.join(repoRoot, ref);
  try {
    const content = await fs.readFile(file, "utf8");
    if (!/<svg[\s>]/i.test(content)) problems.push(`${ref}: file exists but contains no <svg> root element`);
  } catch {
    problems.push(`${ref}: referenced by README.md or demos/ but missing on disk`);
  }
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

const generated = await walk(assetsDir);

// assets/stats/*.svg are the individual cards produced by the old per-card
// pipeline. The README no longer uses them (it shows the composed panel from
// renderer/), but they are kept as a fallback, so their absence from the docs is
// expected rather than a warning.
const RETIRED_PREFIXES = ["assets/stats/"];

for (const file of generated) {
  const relative = path.relative(repoRoot, file).split(path.sep).join("/");
  const retired = RETIRED_PREFIXES.some((prefix) => relative.startsWith(prefix));
  if (!referenced.has(relative) && !retired) {
    warnings.push(`${relative}: generated but not referenced by README.md or demos/`);
  }
  const content = await fs.readFile(file, "utf8").catch(() => "");
  if (!/<svg[\s>]/i.test(content)) problems.push(`${relative}: generated file contains no <svg> root element`);
}

console.log(`README + demos reference ${referenced.size} local asset(s); assets/ contains ${generated.length} file(s).`);
for (const warning of warnings) console.warn(`warning: ${warning}`);

if (problems.length) {
  console.error("");
  for (const problem of problems) console.error(`ERROR ${problem}`);
  process.exit(1);
}
console.log("All references resolve and every generated SVG looks valid.");
