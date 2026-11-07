/**
 * Section banners - rendered by the vendored capsule-render sources, not by a
 * reimplementation.
 *
 * `vendor/capsule-render/model/index.ts` exports the model classes that back the
 * public `https://capsule-render.vercel.app/api?type=...` endpoint: each one takes
 * the query string object and returns the finished SVG from `render()`. We bundle
 * that model graph once with esbuild (TypeScript -> ESM, cached under `.cache/`)
 * and call it directly, so the output is the same organic "venom" artwork the
 * README used before - only the colour stops differ (Morandi, one hue per section).
 */
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const rendererRoot = path.resolve(here, "..", "..");
const repoRoot = path.resolve(rendererRoot, "..");
const vendorModel = path.join(repoRoot, "vendor", "capsule-render", "model", "index.ts");
const cacheDir = path.join(rendererRoot, ".cache");
const bundleFile = path.join(cacheDir, "capsule-render-models.mjs");

let modelsPromise = null;

async function loadModels() {
  if (!modelsPromise) {
    modelsPromise = (async () => {
      await fs.mkdir(cacheDir, { recursive: true });
      const esbuild = await import("esbuild");
      await esbuild.build({
        entryPoints: [vendorModel],
        bundle: true,
        platform: "node",
        format: "esm",
        target: "node22",
        outfile: bundleFile,
        logLevel: "silent",
        // The upstream tree imports JSON palettes; esbuild inlines them.
        loader: { ".json": "json" },
      });
      const module = await import(pathToFileURL(bundleFile).href);
      return module.default;
    })();
  }
  return modelsPromise;
}

/**
 * @param {object} spec  one entry of BANNERS from theme.mjs
 * @returns {Promise<string>} the SVG markup
 */
export async function renderBanner(spec) {
  const Models = await loadModels();
  const Model = Models[spec.type ?? "venom"];
  if (!Model) throw new Error(`capsule-render has no model "${spec.type}"`);

  const query = {
    type: spec.type ?? "venom",
    height: String(spec.height),
    color: spec.color,
    text: spec.text ?? "",
    fontSize: String(spec.fontSize ?? 50),
    fontAlignY: String(spec.fontAlignY ?? 55),
    animation: spec.animation ?? "twinkling",
    fontColor: spec.fontColor ?? "ffffff",
    ...(spec.extra ?? {}),
  };

  const model = new Model(query);
  const svg = model.render();
  if (typeof svg !== "string" || !svg.includes("<svg")) {
    throw new Error(`capsule-render produced no SVG for banner "${spec.id}"`);
  }
  return svg.endsWith("\n") ? svg : `${svg}\n`;
}
