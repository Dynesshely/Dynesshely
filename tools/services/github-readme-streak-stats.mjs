/**
 * github-readme-streak-stats - https://github.com/DenverCoder1/github-readme-streak-stats
 *
 * Upstream is a PHP 8.2+ application (ext-intl required) served from `src/`;
 * its composer `start` script is `php -S localhost:8000 -t src`. Dependencies
 * (vlucas/phpdotenv) go into vendor/github-readme-streak-stats/vendor/ (gitignored),
 * while GitHub responses are cached for a day in vendor/github-readme-streak-stats/cache/
 * (also gitignored).
 *
 * Two ways to run it, picked once in prepare():
 *   native  - `php` on PATH with ext-intl. This is the CI path (shivammathur/setup-php
 *             with extensions: intl), so it is the primary path.
 *   docker  - no usable PHP/extension on the host: the same commands run inside a
 *             php:8.3-cli image with intl + Composer (default `dsh/php:8.3`,
 *             override with DSH_PHP_IMAGE). The repository root is bind mounted at
 *             /app and PHP binds 0.0.0.0 so the published host port reaches it.
 *
 * Upstream reads its GitHub token from $_SERVER. The PHP built-in server does not
 * publish process environment variables into $_SERVER, so both runtime paths load
 * a generated auto_prepend_file (.build/, gitignored) that copies the token into
 * $_SERVER. Credentials are only ever passed through the environment - nothing is
 * written into the tracked tree.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { killTree, runCommand, spawnService, waitForHttp } from "../lib/proc.mjs";

const SERVICE_ID = "github-readme-streak-stats";
const SERVICE_PORT = 4705;
const IMAGE = process.env.DSH_PHP_IMAGE?.trim() || "dsh/php:8.3";

/** Environment variables upstream understands; mirrored into $_SERVER by the prepend file. */
const PASSTHROUGH_ENV = ["TOKEN", "TOKEN2", "TOKEN3", "TOKEN4", "TOKEN5", "WHITELIST", "DISABLE_CACHE"];

const isWindows = process.platform === "win32";
const phpBinary = () => (isWindows ? "php.exe" : "php");
/** Docker bind mounts want forward slashes even on Windows. */
const dockerPath = (target) => path.resolve(target).replace(/\\/g, "/");

let child = null;
let containerName = null;
let baseUrl = null;
let runtime = null; // "native" | "docker"
let prependFile = null; // absolute path of the generated auto_prepend_file
let serviceDir = null;
let envFilePresent = false;

function probe(command, args) {
  return new Promise((resolve) => {
    const probeChild = spawn(command, args, { stdio: "ignore", windowsHide: true });
    probeChild.on("error", () => resolve(false));
    probeChild.on("exit", (code) => resolve(code === 0));
  });
}

/** Best effort cleanup command; never throws. */
function runQuiet(command, args) {
  return new Promise((resolve) => {
    const quietChild = spawn(command, args, { stdio: "ignore", windowsHide: true });
    quietChild.on("error", () => resolve());
    quietChild.on("exit", () => resolve());
  });
}

async function dependenciesInstalled(dir) {
  return fs
    .access(path.join(dir, "vendor", "autoload.php"))
    .then(() => true)
    .catch(() => false);
}

/**
 * Resolve the GitHub token(s) to hand to the service. PAT_1 is the repository
 * secret name used by the workflow, TOKEN is what upstream itself expects.
 */
function serviceEnv() {
  const env = {};
  const token = process.env.TOKEN?.trim() || process.env.PAT_1?.trim();
  if (token) env.TOKEN = token;
  for (const name of PASSTHROUGH_ENV.slice(1)) {
    const value = process.env[name]?.trim();
    if (value) env[name] = value;
  }
  return env;
}

/** Decide between native php (with intl) and the Docker fallback. */
async function chooseRuntime(ctx) {
  if (await probe(phpBinary(), ["--version"])) {
    // Upstream requires php ^8.2 and ext-intl.
    const versionOk = await probe(phpBinary(), ["-r", "exit(PHP_VERSION_ID >= 80200 ? 0 : 1);"]);
    if (versionOk) {
      const intlOk = await probe(phpBinary(), ["-r", "exit(extension_loaded('intl') ? 0 : 1);"]);
      if (intlOk) {
        ctx.log(`using native ${phpBinary()} with ext-intl (php -S built-in server)`);
        return "native";
      }
      ctx.log("native php has no ext-intl (required by the streak card) - falling back to Docker");
    } else {
      ctx.log(`native ${phpBinary()} is older than 8.2 - falling back to Docker`);
    }
  } else {
    ctx.log("php is not on PATH - falling back to Docker");
  }

  if (!(await probe("docker", ["version", "--format", "{{.Server.Version}}"]))) {
    throw new Error(
      `${SERVICE_ID} needs PHP 8.2+ with ext-intl: install PHP 8.2+ (intl + Composer), ` +
        `or start Docker so the ${IMAGE} image can be used instead.`,
    );
  }
  if (!(await probe("docker", ["image", "inspect", IMAGE]))) {
    throw new Error(
      `Docker image ${IMAGE} is not available. Build a php 8.3 image with intl + Composer, ` +
        `or point DSH_PHP_IMAGE at an existing one.`,
    );
  }
  ctx.log(`using Docker image ${IMAGE} (php -S inside the container)`);
  return "docker";
}

/**
 * Composer invocation for the native path. On Windows Composer is a .bat file,
 * which Node cannot spawn directly, so route it through cmd.exe.
 */
function nativeComposer(args) {
  if (!isWindows) return { command: "composer", args };
  return {
    command: process.env.ComSpec || "cmd.exe",
    args: ["/d", "/s", "/c", ["composer", ...args].join(" ")],
  };
}

/** Write the auto_prepend_file that mirrors env vars into $_SERVER. */
async function writePrependFile(ctx) {
  const dir = path.join(ctx.buildDir, SERVICE_ID);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "env-prepend.php");
  const names = PASSTHROUGH_ENV.map((name) => `"${name}"`).join(", ");
  const php = `<?php

declare(strict_types=1);

// Generated by tools/services/${SERVICE_ID}.mjs - .build/ is gitignored, never commit it.
//
// Upstream reads TOKEN / WHITELIST / DISABLE_CACHE from $_SERVER. The PHP built-in
// server does not expose process environment variables there, so mirror the ones
// that were passed in. Values are never written to disk; this file only forwards
// whatever the process environment contains.
foreach ([${names}] as $name) {
    $value = getenv($name);
    if ($value !== false && $value !== "") {
        $_SERVER[$name] = $value;
    }
}
`;
  await fs.writeFile(file, php, "utf8");
  prependFile = file;
  ctx.log(`generated ${path.relative(ctx.repoRoot, file).replace(/\\/g, "/")} (forwards TOKEN into $_SERVER)`);
}

export default {
  id: SERVICE_ID,
  port: SERVICE_PORT,
  get child() {
    return child;
  },
  async prepare(ctx) {
    serviceDir = path.join(ctx.vendorDir, SERVICE_ID);
    await fs.mkdir(ctx.buildDir, { recursive: true });
    // A local .env (gitignored by the vendored project) is a valid alternative
    // to environment variables; phpdotenv loads it into $_SERVER itself.
    envFilePresent = await fs
      .access(path.join(serviceDir, ".env"))
      .then(() => true)
      .catch(() => false);
    if (envFilePresent) ctx.log("found vendor/.../.env - upstream will load its token from there");

    runtime = await chooseRuntime(ctx);
    await writePrependFile(ctx);

    if (await dependenciesInstalled(serviceDir)) {
      ctx.log("composer dependencies already installed (vendor/autoload.php present) - skipping composer install");
      return;
    }

    const composerArgs = ["install", "--no-interaction", "--no-progress", "--no-dev"];
    if (runtime === "docker") {
      ctx.log(`composer install inside ${IMAGE} ...`);
      await runCommand(
        "docker",
        "docker",
        ["run", "--rm", "-v", `${dockerPath(serviceDir)}:/app`, "-w", "/app", IMAGE, "composer", ...composerArgs],
        { log: ctx.log },
      );
    } else {
      ctx.log("composer install ...");
      const { command, args } = nativeComposer(composerArgs);
      await runCommand("composer", command, args, { cwd: serviceDir, log: ctx.log });
    }

    if (!(await dependenciesInstalled(serviceDir))) {
      throw new Error(`${SERVICE_ID}: composer install finished but vendor/autoload.php is missing`);
    }
  },
  async start(ctx) {
    const port = ctx.port;
    baseUrl = `http://127.0.0.1:${port}`;
    const env = serviceEnv();

    if (!envFilePresent && !env.TOKEN) {
      throw new Error(
        `${SERVICE_ID} needs a GitHub token: set TOKEN (or PAT_1) in the environment, ` +
          `or provide vendor/${SERVICE_ID}/.env with TOKEN=... (Contributing.md of the upstream project).`,
      );
    }

    if (runtime === "docker") {
      containerName = `dsh-${SERVICE_ID}-${port}`;
      await runQuiet("docker", ["rm", "-f", containerName]);
      const containerPrepend = `/app/${path.relative(ctx.repoRoot, prependFile).replace(/\\/g, "/")}`;
      const envFlags = Object.keys(env).flatMap((name) => ["-e", name]);
      await runCommand(
        "docker",
        "docker",
        [
          "run",
          "--rm",
          "-d",
          "--name",
          containerName,
          "-p",
          `127.0.0.1:${port}:${port}`,
          "-v",
          `${dockerPath(ctx.repoRoot)}:/app`,
          "-w",
          `/app/${path.relative(ctx.repoRoot, serviceDir).replace(/\\/g, "/")}`,
          ...envFlags,
          IMAGE,
          "php",
          "-d",
          `auto_prepend_file=${containerPrepend}`,
          "-S",
          // 0.0.0.0 inside the container, published on loopback only.
          `0.0.0.0:${port}`,
          "-t",
          "src",
        ],
        // -e without a value makes docker read the variable from its own env.
        { env, log: ctx.log },
      );
    } else {
      child = spawnService(
        SERVICE_ID,
        phpBinary(),
        ["-d", `auto_prepend_file=${prependFile}`, "-S", `127.0.0.1:${port}`, "-t", "src"],
        { cwd: serviceDir, env, log: ctx.log },
      );
    }

    try {
      // Without a user the app answers 400 (missing username) before touching
      // GitHub, which is a cheap way to prove the server is up and the token is
      // in place.
      await waitForHttp(`${baseUrl}/?user=`, {
        timeoutMs: 90_000,
        label: `${SERVICE_ID} on port ${port}`,
      });
    } catch (err) {
      // Do not leak a half-started container/process behind a failed start().
      await this.stop();
      throw err;
    }
    return baseUrl;
  },
  async stop() {
    await killTree(child);
    child = null;
    if (containerName) {
      await runQuiet("docker", ["rm", "-f", containerName]);
      containerName = null;
    }
    baseUrl = null;
  },
};
