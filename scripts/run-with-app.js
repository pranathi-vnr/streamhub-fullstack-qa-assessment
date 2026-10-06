// Starts the web app (if it is not already running), runs the given command, then stops the app.
// Usage: node scripts/run-with-app.js <command> [args...]
// Example: node scripts/run-with-app.js npx cucumber-js
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  console.error("BASE_URL is not set. Copy .env.example to .env first.");
  process.exit(1);
}

const command = process.argv.slice(2);
if (command.length === 0) {
  console.error("Usage: node scripts/run-with-app.js <command> [args...]");
  process.exit(1);
}

function isUp() {
  return new Promise((resolve) => {
    const req = http.get(baseUrl, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForApp(timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isUp()) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

(async () => {
  let server = null;

  if (await isUp()) {
    console.log(`App already running at ${baseUrl} - using it.`);
  } else {
    console.log(`Starting app for ${baseUrl} ...`);
    server = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], { stdio: "inherit" });
    if (!(await waitForApp(15000))) {
      console.error(`App did not start at ${baseUrl}. Check HOST/PORT/BASE_URL in .env.`);
      server.kill();
      process.exit(1);
    }
  }

  const child = spawn(command[0], command.slice(1), { stdio: "inherit", shell: true });
  child.on("exit", (code) => {
    if (server) server.kill();
    process.exit(code === null ? 1 : code);
  });
})();
