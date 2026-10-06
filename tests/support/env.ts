import * as dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set. Copy .env.example to .env (npm install does this automatically).`);
  }
  return value;
}

// All environment configuration for the UI tests lives here - no URLs are hardcoded in tests.
export const env = {
  baseUrl: required("BASE_URL"),
  headless: (process.env.HEADLESS ?? "true").toLowerCase() !== "false",
  slowMo: Number(process.env.SLOW_MO ?? 0),
};
