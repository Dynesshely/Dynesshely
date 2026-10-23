/**
 * capsule-render - https://github.com/kyechan99/capsule-render
 *
 * Upstream is a Vercel/Next style app: `api/index.ts` exports a serverless
 * handler that renders the SVG from the query string. The rendering code itself
 * only depends on TypeScript + a few local JSON palettes, so instead of pulling
 * in the `vercel` CLI we bundle the handler with esbuild and serve it through a
 * tiny Node HTTP shim - the URLs stay identical to the public deployment.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { killTree, spawnService, waitForHttp } from "../lib/proc.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const shim = path.join(here, "capsule-render-server.cjs");

let child = null;
let baseUrl = null;

export default {
  id: "capsule-render",
  port: 4701,
  get child() {
    return child;
  },
  async prepare(ctx) {
    const outDir = path.join(ctx.buildDir, "capsule-render");
    await fs.mkdir(outDir, { recursive: true });

    let esbuild;
    try {
      esbuild = await import("esbuild");
    } catch {
      throw new Error(
        "esbuild is not installed - run `npm install` inside tools/ (or `npm ci` in CI) before generating.",
      );
    }

    const entry = path.join(ctx.vendorDir, "capsule-render", "api", "index.ts");
    const outfile = path.join(outDir, "api.cjs");
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      platform: "node",
      format: "cjs",
      target: "node22",
      outfile,
      logLevel: "silent",
    });
    ctx.log(`bundled api/index.ts -> .build/capsule-render/api.cjs`);
  },
  async start(ctx) {
    const bundle = path.join(ctx.buildDir, "capsule-render", "api.cjs");
    child = spawnService("capsule-render", process.execPath, [shim, bundle, String(ctx.port)], { log: ctx.log });
    baseUrl = `http://127.0.0.1:${ctx.port}`;
    await waitForHttp(`${baseUrl}/api?type=wave&text=ready`, { timeoutMs: 30_000, label: "capsule-render" });
    return baseUrl;
  },
  async stop() {
    await killTree(child);
    child = null;
  },
};
