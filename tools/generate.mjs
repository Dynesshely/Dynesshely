#!/usr/bin/env node
/**
 * Regenerates every README image from the vendored sources in `vendor/`.
 *
 * Each service in tools/services/<id>.mjs knows how to prepare itself and how to
 * expose a local HTTP base URL. This orchestrator starts the needed services,
 * fetches the exact requests listed in tools/lib/manifest.mjs, and writes the
 * responses into assets/ - only when the bytes actually changed, so the CI
 * commit step stays quiet when nothing moved.
 *
 * Usage:
 *   node generate.mjs                 # regenerate everything
 *   node generate.mjs --dry-run       # report what would change, write nothing
 *   node generate.mjs --only=stats-github,icons-tools
 *   node generate.mjs --service=skill-icons
 *   node generate.mjs --list
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assets as allAssets, manifestServices } from "./lib/manifest.mjs";
import { fetchText, killTree, sleep } from "./lib/proc.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..");
const vendorDir = path.join(repoRoot, "vendor");
const buildDir = path.join(repoRoot, ".build");
const assetsDir = path.join(repoRoot, "assets");
const servicesDir = path.join(here, "services");

const log = (message) => console.log(`${new Date().toISOString().slice(11, 19)} ${message}`);

// --------------------------------------------------------------------- arguments
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const values = (name) =>
  argv
    .filter((arg) => arg.startsWith(`--${name}=`))
    .flatMap((arg) => arg.slice(name.length + 3).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

const onlyIds = values("only");
const onlyServices = values("service");
const dryRun = flag("dry-run") || flag("dry");
const listOnly = flag("list");

if (listOnly) {
  for (const asset of allAssets) {
    console.log(`${asset.id.padEnd(34)} ${asset.service.padEnd(32)} assets/${asset.file}`);
  }
  console.log(`\n${allAssets.length} assets across ${manifestServices().length} services.`);
  process.exit(0);
}

let selected = allAssets;
if (onlyIds.length) selected = selected.filter((asset) => onlyIds.includes(asset.id));
if (onlyServices.length) selected = selected.filter((asset) => onlyServices.includes(asset.service));

if (!selected.length) {
  console.error("No asset matched the filter.");
  process.exit(2);
}

// Assets whose tokens are not configured are skipped before any service starts:
// a service that only produces optional assets should not run at all (and cannot
// fail the run) when the credentials are missing.
const summary = { written: 0, unchanged: 0, skipped: 0, failed: 0 };
const envSkipped = [];
selected = selected.filter((asset) => {
  const missing = (asset.requiresEnv ?? []).filter((name) => !process.env[name]);
  if (missing.length) {
    envSkipped.push({ asset, missing });
    return false;
  }
  return true;
});
for (const { asset, missing } of envSkipped) {
  log(`skip assets/${asset.file}: ${missing.join(", ")} not set (file left untouched)`);
}
summary.skipped += envSkipped.length;

if (!selected.length) {
  console.log(`Nothing to generate: all ${envSkipped.length} selected asset(s) need credentials that are not configured.`);
  process.exit(0);
}

const serviceIds = [...new Set(selected.map((asset) => asset.service))].sort();

// ----------------------------------------------------------------------- runtime
const running = new Map(); // serviceId -> { module, child, baseUrl }
let shuttingDown = false;

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const [id, entry] of [...running].reverse()) {
    try {
      await entry.module.stop?.();
    } catch (err) {
      log(`warning: failed to stop ${id}: ${err instanceof Error ? err.message : err}`);
    }
  }
  for (const entry of running.values()) {
    await killTree(entry.child);
  }
  running.clear();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    log(`received ${signal}, stopping services...`);
    await shutdown();
    process.exit(130);
  });
}

async function pool(items, limit, worker) {
  const queue = [...items];
  const results = [];
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const item = queue.shift();
      results.push(await worker(item));
    }
  });
  await Promise.all(runners);
  return results;
}

const ctxFor = (serviceId, port) => ({
  repoRoot,
  vendorDir,
  buildDir,
  assetsDir,
  log: (message) => log(`[${serviceId}] ${message}`),
  port,
  id: serviceId,
});

// ------------------------------------------------------------------- main phases
const failures = [];

try {
  await fs.mkdir(buildDir, { recursive: true });
  await fs.mkdir(assetsDir, { recursive: true });

  // 1. load and prepare services
  const modules = new Map();
  for (const serviceId of serviceIds) {
    const file = path.join(servicesDir, `${serviceId}.mjs`);
    try {
      await fs.access(file);
    } catch {
      throw new Error(`missing service adapter: tools/services/${serviceId}.mjs`);
    }
    const module = (await import(`./services/${serviceId}.mjs`)).default;
    modules.set(serviceId, module);
  }

  log(`preparing ${serviceIds.length} service(s): ${serviceIds.join(", ")}`);
  await pool(serviceIds, 2, async (serviceId) => {
    const module = modules.get(serviceId);
    const port = module.port;
    const ctx = ctxFor(serviceId, port);
    try {
      await module.prepare?.(ctx);
    } catch (err) {
      failures.push({ id: `prepare:${serviceId}`, error: err });
      throw err;
    }
  });

  // 2. start services (sequentially: they bind fixed ports and some are chatty)
  for (const serviceId of serviceIds) {
    const module = modules.get(serviceId);
    const ctx = ctxFor(serviceId, module.port);
    log(`starting ${serviceId} on port ${module.port}`);
    const baseUrl = await module.start(ctx);
    running.set(serviceId, { module, child: module.child, baseUrl });
    log(`${serviceId} ready at ${baseUrl}`);
  }

  // 3. fetch and store
  for (const asset of selected) {
    const entry = running.get(asset.service);
    const url = `${entry.baseUrl}${asset.path}`;
    const missingEnv = (asset.requiresEnv ?? []).filter((name) => !process.env[name]);
    if (missingEnv.length) {
      log(`skip ${asset.id}: missing ${missingEnv.join(", ")}`);
      summary.skipped += 1;
      continue;
    }

    let result;
    try {
      result = await fetchText(url, {
        headers: {
          // GitHub readme stats instances expect a browser-ish UA; some servers
          // reject curl's default agent.
          "user-agent": "readme-assets-generator/1.0 (+https://github.com/Dynesshely/Dynesshely)",
          accept: "image/svg+xml,text/plain;q=0.9,*/*;q=0.8",
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ id: asset.id, error: new Error(`${asset.id}: request failed: ${message}`) });
      summary.failed += 1;
      continue;
    }

    // Normalise line endings so the committed bytes are identical on Windows and
    // Linux; a few upstream icon files embed CRLF, which would otherwise make the
    // scheduled run rewrite files that git considers unchanged.
    const body = result.text.replace(/\r\n/g, "\n");
    if (!result.ok || !/<svg[\s>]/i.test(body)) {
      const preview = body.replace(/\s+/g, " ").slice(0, 300);
      failures.push({ id: asset.id, error: new Error(`${asset.id}: ${result.status} ${result.contentType}: ${preview}`) });
      summary.failed += 1;
      continue;
    }

    const target = path.join(assetsDir, asset.file);
    await fs.mkdir(path.dirname(target), { recursive: true });
    const current = await fs.readFile(target, "utf8").catch(() => null);
    if (current === body) {
      summary.unchanged += 1;
      continue;
    }
    if (dryRun) {
      log(`would write assets/${asset.file} (${Buffer.byteLength(body)} bytes)`);
    } else {
      await fs.writeFile(target, body, "utf8");
      log(`wrote assets/${asset.file} (${Buffer.byteLength(body)} bytes)`);
    }
    summary.written += 1;
    await sleep(0);
  }
} catch (err) {
  failures.push({ id: "fatal", error: err });
} finally {
  await shutdown();
}

// ------------------------------------------------------------------------ report
console.log("");
console.log(`generated: ${summary.written}  unchanged: ${summary.unchanged}  skipped: ${summary.skipped}  failed: ${summary.failed}`);
if (failures.length) {
  console.error("");
  for (const failure of failures) {
    console.error(`FAILED ${failure.id}: ${failure.error instanceof Error ? failure.error.message : failure.error}`);
  }
  console.error(`\n${failures.length} error(s) - assets left untouched where generation failed.`);
  process.exit(1);
}
