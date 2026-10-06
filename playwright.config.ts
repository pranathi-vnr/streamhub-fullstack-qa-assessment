import { defineConfig } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

// Playwright Test config for the API tests (api-tests/).
// The UI tests run through Cucumber (see cucumber.js).
const apiBaseUrl = process.env.API_BASE_URL;
if (!apiBaseUrl) {
  throw new Error("API_BASE_URL is not set. Copy .env.example to .env first.");
}

export default defineConfig({
  testDir: "./api-tests",
  timeout: 30_000,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "test-results/reports/api-html", open: "never" }],
    ["json", { outputFile: "test-results/reports/api-results.json" }],
  ],
  outputDir: "test-results/_pw-artifacts",
  use: {
    baseURL: apiBaseUrl,
    extraHTTPHeaders: { Accept: "application/json" },
  },
});
