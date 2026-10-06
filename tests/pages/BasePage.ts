import { Locator, Page, expect } from "@playwright/test";

export interface ChartSnapshot {
  type: string;
  labels: string[];
  values: number[];
}

/** Shared behaviour for all page objects: navigation by tab and reading Chart.js data. */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Opens the application root. The URL comes from BASE_URL (Playwright baseURL), never hardcoded here. */
  async open(): Promise<void> {
    await this.page.goto("/");
    await expect(this.appTitle).toBeVisible();
  }

  get appTitle(): Locator {
    return this.page.getByRole("heading", { level: 1, name: /loan & emi dashboard/i });
  }

  protected tab(name: string | RegExp): Locator {
    return this.page.getByRole("tab", { name });
  }

  protected async selectTab(name: string | RegExp): Promise<void> {
    const tab = this.tab(name);
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
  }

  /**
   * Reads the data Chart.js is actually rendering for a canvas (type, labels and first dataset values).
   * Polls until the chart object exists, because the page loads the JSON data asynchronously.
   */
  protected async readChart(canvas: Locator): Promise<ChartSnapshot> {
    let snapshot: ChartSnapshot | null = null;
    await expect
      .poll(
        async () => {
          snapshot = await canvas.evaluate((el) => {
            const chartLib = (window as unknown as { Chart?: { getChart(c: Element): any } }).Chart;
            const chart = chartLib?.getChart(el);
            if (!chart) return null;
            return {
              type: String(chart.config.type),
              labels: (chart.data.labels ?? []).map(String),
              values: (chart.data.datasets[0]?.data ?? []).map(Number),
            };
          });
          return snapshot !== null;
        },
        { message: "Chart.js chart was not created for the canvas", timeout: 10_000 }
      )
      .toBe(true);
    return snapshot as unknown as ChartSnapshot;
  }
}
