import { Locator, expect } from "@playwright/test";
import { BasePage, ChartSnapshot } from "./BasePage";

export type KpiName = "total loans" | "total loan amount" | "average loan amount" | "total interest" | "number of customers";

export class DashboardPage extends BasePage {
  // ---- locators (role / label / test-id based, no positional CSS) ----
  get dashboardTab(): Locator {
    return this.tab("Dashboard");
  }

  get dashboardPanel(): Locator {
    return this.page.getByRole("tabpanel", { name: "Dashboard" });
  }

  get portfolioHeading(): Locator {
    return this.page.getByRole("heading", { name: "Portfolio Summary" });
  }

  kpiValue(name: KpiName): Locator {
    const testIds: Record<KpiName, string> = {
      "total loans": "kpi-total-loans-value",
      "total loan amount": "kpi-total-amount-value",
      "average loan amount": "kpi-average-amount-value",
      "total interest": "kpi-total-interest-value",
      "number of customers": "kpi-customers-value",
    };
    return this.page.getByTestId(testIds[name]);
  }

  get chart(): Locator {
    return this.page.getByTestId("dashboard-chart");
  }

  // ---- actions ----
  async goToDashboard(): Promise<void> {
    await this.selectTab("Dashboard");
  }

  async allKpiNames(): Promise<KpiName[]> {
    return ["total loans", "total loan amount", "average loan amount", "total interest", "number of customers"];
  }

  /** Waits until the app has loaded the JSON data and replaced the "–" placeholders with numbers. */
  async waitForSummaryToLoad(): Promise<void> {
    await expect(this.kpiValue("total loans")).toHaveText(/^\d+$/);
  }

  async getKpiText(name: KpiName): Promise<string> {
    return (await this.kpiValue(name).innerText()).trim();
  }

  async getChartData(): Promise<ChartSnapshot> {
    return this.readChart(this.chart);
  }
}
