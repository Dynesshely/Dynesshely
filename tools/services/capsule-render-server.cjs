/**
 * Minimal Node HTTP shim that serves the vendored capsule-render serverless
 * handler (vendor/capsule-render/api/index.ts) as if it ran on Vercel.
 *
 * Usage: node capsule-render-server.cjs <bundle.cjs> <port>
 */
const http = require("node:http");

const [bundlePath, portArg] = process.argv.slice(2);
const port = Number(portArg || 4701);

if (!bundlePath) {
  console.error("usage: node capsule-render-server.cjs <bundle.cjs> <port>");
  process.exit(2);
}

const loaded = require(bundlePath);
const handler = loaded.default ?? loaded;

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const query = {};
  for (const [key, value] of url.searchParams) {
    if (key in query) {
      query[key] = Array.isArray(query[key]) ? [...query[key], value] : [query[key], value];
    } else {
      query[key] = value;
    }
  }

  const vercelReq = { method: req.method, url: req.url, headers: req.headers, query };
  const vercelRes = {
    statusCode: 200,
    setHeader(key, value) {
      res.setHeader(key, value);
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      res.statusCode = this.statusCode;
      res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : String(body));
    },
    end(body) {
      res.end(body);
    },
  };

  try {
    handler(vercelReq, vercelRes);
  } catch (err) {
    res.statusCode = 500;
    res.end(`capsule-render shim error: ${err && err.stack ? err.stack : err}`);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`capsule-render shim listening on http://127.0.0.1:${port}`);
});
