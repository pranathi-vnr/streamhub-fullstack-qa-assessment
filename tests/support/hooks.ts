import { After, AfterAll, Before, BeforeAll, ITestCaseHookParameter, Status, setDefaultTimeout } from "@cucumber/cucumber";
import { Browser, chromium } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { env } from "./env";
import { CustomWorld } from "./world";

setDefaultTimeout(30_000);

const screenshotDir = path.resolve(__dirname, "../../test-results/screenshots");
let browser: Browser;
let scenarioCounter = 0;

BeforeAll(async () => {
  fs.mkdirSync(screenshotDir, { recursive: true });
  browser = await chromium.launch({ headless: env.headless, slowMo: env.slowMo });
});

AfterAll(async () => {
  await browser?.close();
});

Before(async function (this: CustomWorld) {
  this.browser = browser;
  this.context = await browser.newContext({ baseURL: env.baseUrl, viewport: { width: 1280, height: 900 } });
  this.page = await this.context.newPage();
  this.page.setDefaultTimeout(10_000);
});

After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  // Save a screenshot for every scenario (passed or failed) as execution evidence.
  const safeName = scenario.pickle.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  const outcome = scenario.result?.status === Status.PASSED ? "passed" : "failed";
  scenarioCounter += 1;
  const file = path.join(screenshotDir, `${String(scenarioCounter).padStart(2, "0")}-${safeName}--${outcome}.png`);

  const image = await this.page.screenshot({ path: file, fullPage: true });
  this.attach(image, "image/png");

  await this.context.close();
});
