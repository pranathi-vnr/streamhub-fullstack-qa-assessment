import { defineConfig } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

// Separate config for the AI self-healing demonstration.
// The specs in tests/self-healing contain INTENTIONALLY BROKEN locators and are
// expected to fail. They are never part of `npm test`.
const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  throw new Error("BASE_URL is not set. Copy .env.example to .env first.");
}

export default defineConfig({
  testDir: "./tests/self-healing",
  timeout: 15_000,
  expect: { timeout: 3_000 },
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/reports/self-healing-html", open: "never" }],
  ],
  outputDir: "test-results/_pw-artifacts",
  use: {
    baseURL: baseUrl,
    headless: true,
    screenshot: "only-on-failure",
  },
});
