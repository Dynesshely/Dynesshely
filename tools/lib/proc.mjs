/**
 * Shared helpers for spawning the vendored services and waiting until they are
 * actually serving, plus process-tree safe shutdown.
 */
import { spawn } from "node:child_process";
import net from "node:net";

/**
 * Resolve an executable name for the current platform.
 *
 * NOTE: on Windows `exe("npm")` returns `npm.cmd`, which Node >= 20 refuses to
 * spawn ("spawn EINVAL"). Run npm through `process.execPath <npm-cli.js>`
 * instead (see tools/services/github-readme-stats.mjs for the helper).
 */
export function exe(name) {
  if (process.platform !== "win32") return name;
  return ["npm", "npx", "pnpm", "php", "composer"].includes(name) ? `${name}.cmd` : name;
}

/**
 * Stream child output line by line into `sink`.
 * When a custom sink is supplied (one that already formats its lines) the tag
 * prefix is dropped, otherwise every line is prefixed with `[tag]`.
 */
function pipeLogs(tag, stream, sink, withPrefix) {
  let buffer = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf("\n")) !== -1) {
      const line = buffer.slice(0, index).replace(/\r$/, "");
      sink(withPrefix ? `[${tag}] ${line}` : line);
      buffer = buffer.slice(index + 1);
    }
  });
}

/**
 * Start a long running service process.
 * @returns {import("node:child_process").ChildProcess}
 */
export function spawnService(tag, command, args, options = {}) {
  const log = options.log ?? ((line) => console.log(line));
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
    detached: process.platform !== "win32",
  });
  const withPrefix = options.log === undefined;
  pipeLogs(tag, child.stdout, log, withPrefix);
  pipeLogs(tag, child.stderr, log, withPrefix);
  child.on("exit", (code, signal) => log(withPrefix ? `[${tag}] exited (code=${code} signal=${signal})` : `exited (code=${code} signal=${signal})`));
  return child;
}

/** Run a short lived command to completion, streaming its output into the log. */
export function runCommand(tag, command, args, options = {}) {
  const log = options.log ?? ((line) => console.log(line));
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const withPrefix = options.log === undefined;
    pipeLogs(tag, child.stdout, log, withPrefix);
    pipeLogs(tag, child.stderr, log, withPrefix);
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${tag}: command failed with exit code ${code}: ${command} ${args.join(" ")}`));
    });
  });
}

/** Wait until a TCP port on the loopback interface accepts connections. */
export async function waitForPort(port, { timeoutMs = 180_000, host = "127.0.0.1", label = `port ${port}` } = {}) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const socket = net.connect({ port, host });
      socket.setTimeout(1500);
      socket.once("connect", () => {
        socket.destroy();
        resolve(true);
      });
      const fail = () => {
        socket.destroy();
        resolve(false);
      };
      socket.once("error", fail);
      socket.once("timeout", fail);
    });
    if (ok) return;
    await sleep(400);
  }
  throw new Error(`timed out after ${timeoutMs}ms waiting for ${label}`);
}

/** Fetch a URL with a timeout, returning the response text. */
export async function fetchText(url, { timeoutMs = 120_000, headers = {} } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers });
    const text = await res.text();
    return { ok: res.ok, status: res.status, contentType: res.headers.get("content-type") ?? "", text };
  } finally {
    clearTimeout(timer);
  }
}

/** Poll an HTTP endpoint until it answers with a 2xx/3xx response. */
export async function waitForHttp(url, { timeoutMs = 180_000, label = url } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const { ok, status } = await fetchText(url, { timeoutMs: 20_000 });
      if (ok || status < 500) return;
      lastError = `HTTP ${status}`;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
    await sleep(500);
  }
  throw new Error(`timed out after ${timeoutMs}ms waiting for ${label} (last error: ${lastError})`);
}

/** Kill a service and every child process it created. */
export async function killTree(child) {
  if (!child || child.exitCode !== null || child.killed) return;
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      killer.on("exit", resolve);
      killer.on("error", resolve);
    });
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    try {
      child.kill("SIGTERM");
    } catch {
      /* already gone */
    }
  }
  await sleep(700);
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    /* already gone */
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
