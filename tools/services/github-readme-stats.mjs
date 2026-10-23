/**
 * github-readme-stats - https://github.com/anuraghazra/github-readme-stats
 *
 * Upstream ships a plain Express entry point (`express.js`) that mounts the same
 * handlers Vercel uses under `/api`, so the vendored checkout only needs its
 * dependencies installed before `node express.js` serves everything the manifest
 * asks for. The port and the GitHub token are passed through the process
 * environment (PORT / PAT_1); the token is never written to disk.
 */
import fs from "node:fs/promises";
import path from "node:path";
import {
  exe,
  fetchText,
  killTree,
  runCommand,
  spawnService,
  waitForHttp,
} from "../lib/proc.mjs";

let child = null;

/** Resolve a token from the environment, failing with an actionable message. */
function requireToken() {
  const token = process.env.PAT_1;
  if (!token) {
    throw new Error(
      "github-readme-stats needs a GitHub token in PAT_1 (locally: `$env:PAT_1 = (gh auth token)`).",
    );
  }
  return token;
}

/**
 * npm is `npm.cmd` on Windows and Node >= 20 refuses to spawn `.cmd` files
 * without a shell (spawn EINVAL), so prefer running npm's JS entry point with the
 * current node binary. The cmd.exe branch is only a last resort.
 */
async function runNpm(ctx, cwd, args, tag) {
  const npmCliCandidates = [
    process.env.npm_execpath,
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
    path.join(path.dirname(process.execPath), "lib", "node_modules", "npm", "bin", "npm-cli.js"),
  ].filter(Boolean);

  const env = { HUSKY: "0", npm_config_update_notifier: "false" };
  for (const cli of npmCliCandidates) {
    try {
      await fs.access(cli);
      await runCommand(tag, process.execPath, [cli, ...args], { cwd, env, log: ctx.log });
      return;
    } catch (err) {
      if (err && err.code === "ENOENT") continue;
      throw err;
    }
  }

  if (process.platform === "win32") {
    const shell = process.env.ComSpec ?? "cmd.exe";
    await runCommand(tag, shell, ["/d", "/s", "/c", ["npm", ...args].join(" ")], {
      cwd,
      env,
      log: ctx.log,
    });
    return;
  }
  await runCommand(tag, exe("npm"), args, { cwd, env, log: ctx.log });
}

/** True when `npm ci` already produced a usable dependency tree. */
async function dependenciesInstalled(vendorDir) {
  try {
    await fs.access(path.join(vendorDir, "node_modules", "express", "package.json"));
    await fs.access(path.join(vendorDir, "node_modules", "dotenv", "package.json"));
    return true;
  } catch {
    return false;
  }
}

export default {
  id: "github-readme-stats",
  port: 4702,
  get child() {
    return child;
  },
  async prepare(ctx) {
    const vendorDir = path.join(ctx.vendorDir, "github-readme-stats");
    requireToken();

    if (await dependenciesInstalled(vendorDir)) {
      ctx.log("dependencies already installed, skipping npm ci");
      return;
    }

    ctx.log("installing dependencies (npm ci)...");
    // Upstream's `prepare` script runs husky; HUSKY=0 skips that (no git repo to wire up).
    await runNpm(ctx, vendorDir, ["ci", "--no-audit", "--no-fund"], "github-readme-stats:npm");
    if (!(await dependenciesInstalled(vendorDir))) {
      throw new Error("npm ci did not produce node_modules/express for github-readme-stats");
    }
    ctx.log("dependencies installed");
  },
  async start(ctx) {
    const vendorDir = path.join(ctx.vendorDir, "github-readme-stats");
    const token = requireToken();

    child = spawnService("github-readme-stats", process.execPath, ["express.js"], {
      cwd: vendorDir,
      env: { PORT: String(ctx.port), PAT_1: token },
      log: ctx.log,
    });

    const baseUrl = `http://127.0.0.1:${ctx.port}`;
    try {
      await waitForHttp(`${baseUrl}/api`, { timeoutMs: 60_000, label: "github-readme-stats" });

      // Cheap end-to-end check that the token/network actually work: a well known
      // account must render a real card, not the "Something went wrong!" card the
      // service returns (with HTTP 200) when GitHub rejects the request.
      const probe = await fetchText(`${baseUrl}/api?username=octocat&hide=contribs`, {
        timeoutMs: 120_000,
      });
      const body = probe.text ?? "";
      if (!probe.ok || !/<svg[\s>]/i.test(body) || /Something went wrong!/.test(body)) {
        const preview = body.replace(/\s+/g, " ").slice(0, 240);
        throw new Error(
          `github-readme-stats is reachable but could not render a card (HTTP ${probe.status}): ${preview}`,
        );
      }
    } catch (err) {
      // The orchestrator only stops services whose start() resolved.
      await killTree(child);
      child = null;
      throw err;
    }

    ctx.log("token check passed (rendered a real stats card for octocat)");
    return baseUrl;
  },
  async stop() {
    await killTree(child);
    child = null;
  },
};
