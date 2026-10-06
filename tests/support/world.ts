import { IWorldOptions, World, setWorldConstructor } from "@cucumber/cucumber";
import { Browser, BrowserContext, Page } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";
import { LoanCalculatorPage } from "../pages/LoanCalculatorPage";
import { ReportPage } from "../pages/ReportPage";

export interface LoanInput {
  amount: number;
  rate: number;
  years: number;
}

/** Per-scenario state. A fresh browser context (and page) is created for every scenario. */
export class CustomWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  /** Last values typed into the calculator - used to compute the expected EMI independently. */
  loanInput?: LoanInput;

  private _dashboard?: DashboardPage;
  private _calculator?: LoanCalculatorPage;
  private _report?: ReportPage;

  constructor(options: IWorldOptions) {
    super(options);
  }

  get dashboardPage(): DashboardPage {
    return (this._dashboard ??= new DashboardPage(this.page));
  }

  get calculatorPage(): LoanCalculatorPage {
    return (this._calculator ??= new LoanCalculatorPage(this.page));
  }

  get reportPage(): ReportPage {
    return (this._report ??= new ReportPage(this.page));
  }
}

setWorldConstructor(CustomWorld);
