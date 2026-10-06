import { expect, test } from "@playwright/test";

/**
 * AI SELF-HEALING EXERCISE - INTENTIONALLY BROKEN LOCATORS
 *
 * Every locator marked "INTENTIONALLY BROKEN" below is wrong on purpose and is left unfixed.
 * They are NOT part of the main suites: `npm test` never runs this folder.
 * Run on demand with:  npm run test:self-healing-demo   (expected result: all 5 tests FAIL)
 *
 * See SELF_HEALING.md for how an AI-assisted healer would detect, repair and validate these.
 */
test.skip(process.env.RUN_SELF_HEALING_DEMO !== "true", "Set RUN_SELF_HEALING_DEMO=true (npm run test:self-healing-demo) to run the broken-locator demo.");

test.describe("Self-healing demo: intentionally broken locators", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("broken #1 - wrong test id for the Calculate button", async ({ page }) => {
    await page.getByRole("tab", { name: "Loan Calculator" }).click();
    // INTENTIONALLY BROKEN LOCATOR FOR AI SELF-HEALING EXERCISE
    // Real element: page.getByRole("button", { name: "Calculate" })  /  data-testid="calculate-button"
    await page.getByTestId("wrong-calculator-button").click();
  });

  test("broken #2 - outdated label for the loan amount field", async ({ page }) => {
    await page.getByRole("tab", { name: "Loan Calculator" }).click();
    // INTENTIONALLY BROKEN LOCATOR FOR AI SELF-HEALING EXERCISE
    // Real label is "Loan Amount (₹)"
    await page.getByLabel("Principal Amount").fill("2500000");
  });

  test("broken #3 - brittle positional CSS for the EMI output", async ({ page }) => {
    await page.getByRole("tab", { name: "Loan Calculator" }).click();
    // INTENTIONALLY BROKEN LOCATOR FOR AI SELF-HEALING EXERCISE
    // Positional selector pointing at the wrong structure. Real element: getByTestId("emi-output")
    await expect(page.locator("div.results > span:nth-child(3)")).toBeVisible();
  });

  test("broken #4 - wrong role name for the report tab", async ({ page }) => {
    // INTENTIONALLY BROKEN LOCATOR FOR AI SELF-HEALING EXERCISE
    // Real tab is named "Loan Report" and has role "tab" (not "link")
    await page.getByRole("link", { name: "Reports" }).click();
  });

  test("broken #5 - stale text for the dashboard KPI", async ({ page }) => {
    // INTENTIONALLY BROKEN LOCATOR FOR AI SELF-HEALING EXERCISE
    // Real heading text is "Total Loans" (KPI card) / "Portfolio Summary" (section)
    await expect(page.getByText("Number of Active Accounts")).toBeVisible();
  });
});
