import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { loadLoans, summarise } from "../support/loanData";
import { parseCurrency } from "../support/emi";
import { CustomWorld } from "../support/world";

Given("the application is launched", async function (this: CustomWorld) {
  await this.dashboardPage.open();
});

When("I navigate to the dashboard", async function (this: CustomWorld) {
  await this.dashboardPage.goToDashboard();
});

Then("the dashboard should be displayed", async function (this: CustomWorld) {
  await expect(this.dashboardPage.dashboardPanel).toBeVisible();
  await expect(this.dashboardPage.portfolioHeading).toBeVisible();
});

Then("the summary values should be visible", async function (this: CustomWorld) {
  await this.dashboardPage.waitForSummaryToLoad();
  for (const name of await this.dashboardPage.allKpiNames()) {
    await expect(this.dashboardPage.kpiValue(name), `KPI "${name}" should be visible`).toBeVisible();
    await expect(this.dashboardPage.kpiValue(name)).not.toHaveText("–");
  }
});

Then("the dashboard chart should be visible", async function (this: CustomWorld) {
  await expect(this.dashboardPage.chart).toBeVisible();
});

Then("the summary values should match the loan data file", async function (this: CustomWorld) {
  await this.dashboardPage.waitForSummaryToLoad();
  const expected = summarise(loadLoans());

  expect(Number(await this.dashboardPage.getKpiText("total loans"))).toBe(expected.totalLoans);
  expect(Number(await this.dashboardPage.getKpiText("number of customers"))).toBe(expected.customers);

  // Currency KPIs are shown rounded to whole rupees, so allow a tolerance of 1 rupee.
  const totalAmount = parseCurrency(await this.dashboardPage.getKpiText("total loan amount"));
  const average = parseCurrency(await this.dashboardPage.getKpiText("average loan amount"));
  const interest = parseCurrency(await this.dashboardPage.getKpiText("total interest"));

  expect(Math.abs(totalAmount - expected.totalAmount)).toBeLessThanOrEqual(1);
  expect(Math.abs(average - expected.averageAmount)).toBeLessThanOrEqual(1);
  expect(Math.abs(interest - expected.totalInterest)).toBeLessThanOrEqual(1);
});

Then("the dashboard chart should contain valid non-zero data", async function (this: CustomWorld) {
  const chart = await this.dashboardPage.getChartData();
  expect(chart.labels.length, "chart should have at least one category").toBeGreaterThan(0);
  expect(chart.values.length).toBe(chart.labels.length);
  for (const value of chart.values) {
    expect(Number.isFinite(value), `value ${value} should be a finite number`).toBe(true);
    expect(value).toBeGreaterThan(0);
  }

  // The chart total must equal the total loan amount in the data file.
  const chartTotal = chart.values.reduce((a, b) => a + b, 0);
  expect(chartTotal).toBe(summarise(loadLoans()).totalAmount);
});
