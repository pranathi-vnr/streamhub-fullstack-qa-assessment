// Minimal static file server for the Loan/EMI Dashboard (no extra dependencies).
// Host/port come from environment variables (see .env.example).
const http = require("http");
const fs = require("fs");
const path = require("path");

try {
  require("dotenv").config();
} catch (_) {
  // dotenv is optional at runtime; defaults below are used if it is missing.
}

const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 3000);
const APP_DIR = path.join(__dirname, "app");

// Chart.js is installed from npm and served locally, so the app works offline (no CDN).
const CHART_JS = path.join(__dirname, "node_modules", "chart.js", "dist", "chart.umd.js");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(body);
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return send(res, 404, "Not found");
    send(res, 200, data, MIME[path.extname(filePath)] || "application/octet-stream");
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);

  if (urlPath === "/vendor/chart.umd.js") return serveFile(res, CHART_JS);

  const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const target = path.normalize(path.join(APP_DIR, relative));
  if (!target.startsWith(APP_DIR)) return send(res, 403, "Forbidden");
  serveFile(res, target);
});

server.listen(PORT, HOST, () => {
  console.log(`Loan/EMI Dashboard running at http://${HOST}:${PORT}`);
});
