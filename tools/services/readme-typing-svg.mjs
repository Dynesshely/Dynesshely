/**
 * readme-typing-svg - https://github.com/DenverCoder1/readme-typing-svg
 *
 * Upstream is a small PHP application served straight out of `src/`; its composer
 * `start` script is literally `php -S localhost:8000 -t src`. The only runtime
 * dependency is vlucas/phpdotenv, installed by Composer into
 * vendor/readme-typing-svg/vendor/ (gitignored).
 *
 * Two ways to run it, picked once in prepare():
 *   native  - `php` on PATH. This is the path CI uses (shivammathur/setup-php
 *             provides php 8.3 + composer), so it is the primary path.
 *   docker  - no usable PHP on the host: the exact same commands run inside a
 *             php:8.3-cli image that also carries Composer. Defaults to the
 *             `dsh/php:8.3` image, override with the DSH_PHP_IMAGE env var.
 *             The service directory is bind mounted at /app and PHP binds
 *             0.0.0.0 so the published host port reaches it.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { killTree, runCommand, spawnService, waitForHttp } from "../lib/proc.mjs";

const SERVICE_ID = "readme-typing-svg";
const SERVICE_PORT = 4704;
const IMAGE = process.env.DSH_PHP_IMAGE?.trim() || "dsh/php:8.3";

const isWindows = process.platform === "win32";
const phpBinary = () => (isWindows ? "php.exe" : "php");
/** Docker bind mounts want forward slashes even on Windows. */
const dockerPath = (target) => path.resolve(target).replace(/\\/g, "/");

let child = null;
let containerName = null;
let baseUrl = null;
let runtime = null; // "native" | "docker"

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

async function dependenciesInstalled(serviceDir) {
  return fs
    .access(path.join(serviceDir, "vendor", "autoload.php"))
    .then(() => true)
    .catch(() => false);
}

/** Decide between native php and the Docker fallback. */
async function chooseRuntime(ctx) {
  if (await probe(phpBinary(), ["--version"])) {
    // Upstream requires php ^8.1.
    if (await probe(phpBinary(), ["-r", "exit(PHP_VERSION_ID >= 80100 ? 0 : 1);"])) {
      ctx.log(`using native ${phpBinary()} (php -S built-in server)`);
      return "native";
    }
    ctx.log(`native ${phpBinary()} is older than 8.1 - falling back to Docker`);
  } else {
    ctx.log("php is not on PATH - falling back to Docker");
  }

  if (!(await probe("docker", ["version", "--format", "{{.Server.Version}}"]))) {
    throw new Error(
      `${SERVICE_ID} needs PHP 8.1+: install PHP 8.1+ together with Composer, ` +
        `or start Docker so the ${IMAGE} image can be used instead.`,
    );
  }
  if (!(await probe("docker", ["image", "inspect", IMAGE]))) {
    throw new Error(
      `Docker image ${IMAGE} is not available. Build a php 8.3 image with Composer ` +
        `(e.g. FROM php:8.3-cli + docker-php-ext-install intl + composer), ` +
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

export default {
  id: SERVICE_ID,
  port: SERVICE_PORT,
  get child() {
    return child;
  },
  async prepare(ctx) {
    const serviceDir = path.join(ctx.vendorDir, SERVICE_ID);
    await fs.mkdir(ctx.buildDir, { recursive: true });
    runtime = await chooseRuntime(ctx);

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
    const serviceDir = path.join(ctx.vendorDir, SERVICE_ID);
    const port = ctx.port;
    baseUrl = `http://127.0.0.1:${port}`;

    if (runtime === "docker") {
      containerName = `dsh-${SERVICE_ID}-${port}`;
      await runQuiet("docker", ["rm", "-f", containerName]);
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
          `${dockerPath(serviceDir)}:/app`,
          "-w",
          "/app",
          IMAGE,
          // 0.0.0.0 inside the container, published on loopback only.
          "php",
          "-S",
          `0.0.0.0:${port}`,
          "-t",
          "src",
        ],
        { log: ctx.log },
      );
    } else {
      child = spawnService(SERVICE_ID, phpBinary(), ["-S", `127.0.0.1:${port}`, "-t", "src"], {
        cwd: serviceDir,
        log: ctx.log,
      });
    }

    try {
      await waitForHttp(`${baseUrl}/?lines=ready&center=true`, {
        timeoutMs: 60_000,
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
