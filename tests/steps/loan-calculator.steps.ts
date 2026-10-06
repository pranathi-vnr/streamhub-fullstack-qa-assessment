import { DataTable, Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { calculateExpectedEmi, parseCurrency } from "../support/emi";
import { CustomWorld } from "../support/world";

// The app shows currency with 2 decimals, so values must match to within half a paisa.
const TOLERANCE = 0.01;

Given("the user opens the loan calculator", async function (this: CustomWorld) {
  await this.calculatorPage.open();
  await this.calculatorPage.openCalculator();
});

When("the user enters the following loan details:", async function (this: CustomWorld, table: DataTable) {
  const rows = table.rowsHash();
  const amount = Number(rows["Loan Amount"]);
  const rate = Number(rows["Interest Rate"]);
  const years = Number(rows["Tenure"]);
  this.loanInput = { amount, rate, years };
  await this.calculatorPage.enterLoanDetails(amount, rate, years);
});

When(
  "the user enters loan amount {float}, interest rate {float} and tenure {float} years",
  async function (this: CustomWorld, amount: number, rate: number, years: number) {
    this.loanInput = { amount, rate, years };
    await this.calculatorPage.enterLoanDetails(amount, rate, years);
  }
);

When("clicks Calculate", async function (this: CustomWorld) {
  await this.calculatorPage.clickCalculate();
});

Then("the displayed EMI should match the independently calculated expected EMI", async function (this: CustomWorld) {
  const input = this.loanInput;
  if (!input) throw new Error("No loan input was entered in an earlier step.");

  // Expected value is computed here in the test, NOT read from the application.
  const expected = calculateExpectedEmi(input.amount, input.rate, input.years);

  await expect(this.calculatorPage.emiOutput).not.toHaveText("–");
  const actual = parseCurrency(await this.calculatorPage.getEmiText());

  expect(Math.abs(actual - expected.emi), `displayed EMI ${actual} vs expected ${expected.emi.toFixed(2)}`).toBeLessThanOrEqual(TOLERANCE);
});

Then("total interest should be displayed", async function (this: CustomWorld) {
  const input = this.loanInput;
  if (!input) throw new Error("No loan input was entered in an earlier step.");
  const expected = calculateExpectedEmi(input.amount, input.rate, input.years);

  await expect(this.calculatorPage.totalInterestOutput).toBeVisible();
  const actual = parseCurrency(await this.calculatorPage.getTotalInterestText());

  expect(Number.isNaN(actual)).toBe(false);
  // Interest is derived from the unrounded EMI x months, so allow a small rounding tolerance.
  expect(Math.abs(actual - expected.totalInterest)).toBeLessThanOrEqual(0.05);
});

Then("total payment should be displayed", async function (this: CustomWorld) {
  const input = this.loanInput;
  if (!input) throw new Error("No loan input was entered in an earlier step.");
  const expected = calculateExpectedEmi(input.amount, input.rate, input.years);

  await expect(this.calculatorPage.totalPaymentOutput).toBeVisible();
  const actual = parseCurrency(await this.calculatorPage.getTotalPaymentText());

  expect(Number.isNaN(actual)).toBe(false);
  expect(Math.abs(actual - expected.totalPayment)).toBeLessThanOrEqual(0.05);
});

Then("an input validation error should be displayed", async function (this: CustomWorld) {
  await expect(this.calculatorPage.errorMessage).toBeVisible();
  await expect(this.calculatorPage.errorMessage).toContainText("Please enter");
});

Then("no EMI should be displayed", async function (this: CustomWorld) {
  await expect(this.calculatorPage.emiOutput).toHaveText("–");
});
