import { Locator } from "@playwright/test";
import { BasePage, ChartSnapshot } from "./BasePage";

export class ReportPage extends BasePage {
  // ---- locators ----
  get reportTab(): Locator {
    return this.tab("Loan Report");
  }

  get loanTypeFilter(): Locator {
    // exact: the dashboard chart's aria-label also contains "loan type".
    return this.page.getByLabel("Loan Type", { exact: true });
  }

  get statusFilter(): Locator {
    return this.page.getByLabel("Status");
  }

  get customerFilter(): Locator {
    return this.page.getByLabel("Customer Name");
  }

  get table(): Locator {
    return this.page.getByRole("table", { name: "Loan report table" });
  }

  get rows(): Locator {
    return this.page.getByTestId("loan-row");
  }

  get resultCount(): Locator {
    return this.page.getByTestId("report-count");
  }

  get emptyMessage(): Locator {
    return this.page.getByText("No loans match the selected filters.");
  }

  get chart(): Locator {
    return this.page.getByTestId("report-chart");
  }

  /** Table cells whose whole text equals the given value (e.g. every "Home" in the Type column). */
  cellsWithExactText(text: string): Locator {
    return this.rows.getByRole("cell", { name: text, exact: true });
  }

  // ---- actions ----
  async openReport(): Promise<void> {
    await this.selectTab("Loan Report");
  }

  async filterByLoanType(type: string): Promise<void> {
    await this.loanTypeFilter.selectOption(type);
  }

  async filterByStatus(status: string): Promise<void> {
    await this.statusFilter.selectOption(status);
  }

  async searchCustomer(name: string): Promise<void> {
    await this.customerFilter.fill(name);
  }

  async getChartData(): Promise<ChartSnapshot> {
    return this.readChart(this.chart);
  }
}
