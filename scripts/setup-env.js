// Runs after `npm install`: creates .env from .env.example if it does not exist yet.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const envFile = path.join(root, ".env");
const example = path.join(root, ".env.example");

if (!fs.existsSync(envFile) && fs.existsSync(example)) {
  fs.copyFileSync(example, envFile);
  console.log("Created .env from .env.example");
}
