const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3000);
const root = __dirname;

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp"
};

const server = http.createServer((req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && requestUrl.pathname === "/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    let requestedPath = decodeURIComponent(requestUrl.pathname);
    if (requestedPath === "/") requestedPath = "/index.html";

    const fullPath = path.resolve(root, "." + requestedPath);
    if (!fullPath.startsWith(root + path.sep) && fullPath !== root) {
      return sendJson(res, 403, { error: "Forbidden" });
    }

    const blocked = new Set([".env", ".git", ".gitignore", "server.js", "package.json", "package-lock.json"]);
    const relative = path.relative(root, fullPath);
    const firstPart = relative.split(path.sep)[0];
    if (blocked.has(firstPart) || firstPart.startsWith(".")) {
      return sendJson(res, 403, { error: "Forbidden" });
    }

    if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
      return sendJson(res, 404, { error: "Nicht gefunden." });
    }

    const ext = path.extname(fullPath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": types[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600"
    });

    if (req.method === "HEAD") return res.end();
    return fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: "Interner Serverfehler." });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Bremen RP VC läuft auf Port ${PORT}`);
});
