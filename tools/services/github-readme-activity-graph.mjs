/**
 * github-readme-activity-graph - https://github.com/Ashutosh00710/github-readme-activity-graph
 *
 * TypeScript Express app: dependencies are installed with `npm ci`, the sources
 * are compiled with `npm run build` (tsc) and `node dist/main.js` serves
 * `/graph`. The build output intentionally stays in `vendor/<service>/dist`
 * (already gitignored): `src/createChart.ts` requires the chartist files via the
 * relative path `../node_modules/node-chartist/...`, so the compiled files must
 * sit next to `node_modules` - a `.build/` output directory breaks that require.
 *
 * The GitHub token is read from `TOKEN` (same variable upstream documents in
 * `.env.example`) and only ever passed through the child process environment.
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
  const token = process.env.TOKEN;
  if (!token) {
    throw new Error(
      "github-readme-activity-graph needs a GitHub token in TOKEN (locally: `$env:TOKEN = (gh auth token)`).",
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

/** True when `npm ci` already produced the build toolchain. */
async function dependenciesInstalled(vendorDir) {
  try {
    await fs.access(path.join(vendorDir, "node_modules", "typescript", "bin", "tsc"));
    await fs.access(path.join(vendorDir, "node_modules", "express", "package.json"));
    return true;
  } catch {
    return false;
  }
}

export default {
  id: "github-readme-activity-graph",
  port: 4703,
  get child() {
    return child;
  },
  async prepare(ctx) {
    const vendorDir = path.join(ctx.vendorDir, "github-readme-activity-graph");
    requireToken();

    if (await dependenciesInstalled(vendorDir)) {
      ctx.log("dependencies already installed, skipping npm ci");
    } else {
      ctx.log("installing dependencies (npm ci)...");
      await runNpm(
        ctx,
        vendorDir,
        ["ci", "--no-audit", "--no-fund"],
        "github-readme-activity-graph:npm",
      );
      if (!(await dependenciesInstalled(vendorDir))) {
        throw new Error(
          "npm ci did not produce node_modules/typescript for github-readme-activity-graph",
        );
      }
    }

    ctx.log("compiling TypeScript (npm run build) -> vendor/github-readme-activity-graph/dist");
    await runNpm(
      ctx,
      vendorDir,
      ["run", "build"],
      "github-readme-activity-graph:tsc",
    );
    await fs.access(path.join(vendorDir, "dist", "main.js"));
    ctx.log("build finished (dist/main.js)");
  },
  async start(ctx) {
    const vendorDir = path.join(ctx.vendorDir, "github-readme-activity-graph");
    const token = requireToken();

    child = spawnService(
      "github-readme-activity-graph",
      process.execPath,
      [path.join("dist", "main.js")],
      {
        cwd: vendorDir,
        env: { PORT: String(ctx.port), TOKEN: token },
        log: ctx.log,
      },
    );

    const baseUrl = `http://127.0.0.1:${ctx.port}`;
    try {
      await waitForHttp(`${baseUrl}/`, {
        timeoutMs: 60_000,
        label: "github-readme-activity-graph",
      });

      // Upstream answers invalid tokens / API failures with an `invalidUserSvg`
      // and HTTP 200, so probe with a real account before trusting the service.
      const probe = await fetchText(`${baseUrl}/graph?username=octocat`, {
        timeoutMs: 120_000,
      });
      const body = probe.text ?? "";
      const invalidCard = /viewBox="0 0 420 200"/.test(body);
      if (!probe.ok || !/<svg[\s>]/i.test(body) || invalidCard) {
        const preview = body.replace(/\s+/g, " ").slice(0, 240);
        throw new Error(
          `github-readme-activity-graph is reachable but could not render a graph (HTTP ${probe.status}): ${preview}`,
        );
      }
    } catch (err) {
      // The orchestrator only stops services whose start() resolved.
      await killTree(child);
      child = null;
      throw err;
    }

    ctx.log("token check passed (rendered a real contribution graph for octocat)");
    return baseUrl;
  },
  async stop() {
    await killTree(child);
    child = null;
  },
};
