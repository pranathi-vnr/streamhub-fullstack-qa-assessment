import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { loadLoans } from "../support/loanData";
import { CustomWorld } from "../support/world";

Given("the loan report is opened", async function (this: CustomWorld) {
  await this.reportPage.open();
  await this.reportPage.openReport();
  await expect(this.reportPage.rows.first()).toBeVisible();
});

When("I filter the report by loan type {string}", async function (this: CustomWorld, type: string) {
  await this.reportPage.filterByLoanType(type);
});

When("I filter the report by status {string}", async function (this: CustomWorld, status: string) {
  await this.reportPage.filterByStatus(status);
});

When("I search the report for customer {string}", async function (this: CustomWorld, name: string) {
  await this.reportPage.searchCustomer(name);
});

Then("the report table should list all loans from the data file", async function (this: CustomWorld) {
  await expect(this.reportPage.table).toBeVisible();
  await expect(this.reportPage.rows).toHaveCount(loadLoans().length);
});

Then("the report table should only show {string} loans", async function (this: CustomWorld, type: string) {
  const expectedCount = loadLoans().filter((l) => l.type === type).length;
  await expect(this.reportPage.rows).toHaveCount(expectedCount);
  // Every listed row must contain a cell with exactly the filtered type.
  await expect(this.reportPage.cellsWithExactText(type)).toHaveCount(expectedCount);
  await expect(this.reportPage.resultCount).toContainText(`Showing ${expectedCount}`);
});

Then(
  "the report table should show the loans matching status {string} and customer {string}",
  async function (this: CustomWorld, status: string, customer: string) {
    const expected = loadLoans().filter(
      (l) => l.status === status && l.customer.toLowerCase().includes(customer.toLowerCase())
    );
    expect(expected.length, "test data should contain at least one match").toBeGreaterThan(0);
    await expect(this.reportPage.rows).toHaveCount(expected.length);
    for (const loan of expected) {
      await expect(this.reportPage.rows.filter({ hasText: loan.id })).toHaveCount(1);
    }
  }
);

Then("the report table should show no loans", async function (this: CustomWorld) {
  await expect(this.reportPage.rows).toHaveCount(0);
  await expect(this.reportPage.resultCount).toContainText("Showing 0");
});

Then("an empty-results message should be displayed", async function (this: CustomWorld) {
  await expect(this.reportPage.emptyMessage).toBeVisible();
});

Then("the report chart should be visible", async function (this: CustomWorld) {
  await expect(this.reportPage.chart).toBeVisible();
});

Then("the report chart should contain valid non-zero data", async function (this: CustomWorld) {
  const chart = await this.reportPage.getChartData();
  expect(chart.values.length).toBeGreaterThan(0);
  for (const value of chart.values) {
    expect(Number.isFinite(value)).toBe(true);
    expect(value).toBeGreaterThan(0);
  }
});

Then("the report chart should have one bar for each listed loan", async function (this: CustomWorld) {
  const chart = await this.reportPage.getChartData();
  const rowCount = await this.reportPage.rows.count();
  expect(chart.type).toBe("bar");
  expect(chart.labels.length).toBe(rowCount);
});
