import { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoanCalculatorPage extends BasePage {
  // ---- locators ----
  get calculatorTab(): Locator {
    return this.tab("Loan Calculator");
  }

  get loanAmountInput(): Locator {
    // Anchored: chart canvases also have aria-labels that mention "loan amount".
    return this.page.getByLabel(/^Loan Amount/);
  }

  get interestRateInput(): Locator {
    return this.page.getByLabel("Interest Rate");
  }

  get tenureInput(): Locator {
    return this.page.getByLabel("Loan Tenure");
  }

  get calculateButton(): Locator {
    return this.page.getByRole("button", { name: "Calculate" });
  }

  get emiOutput(): Locator {
    return this.page.getByTestId("emi-output");
  }

  get totalInterestOutput(): Locator {
    return this.page.getByTestId("total-interest-output");
  }

  get totalPaymentOutput(): Locator {
    return this.page.getByTestId("total-payment-output");
  }

  get errorMessage(): Locator {
    return this.page.getByTestId("calculator-error");
  }

  get chart(): Locator {
    return this.page.getByTestId("calculator-chart");
  }

  // ---- actions ----
  async openCalculator(): Promise<void> {
    await this.selectTab("Loan Calculator");
  }

  async enterLoanDetails(amount: number | string, rate: number | string, years: number | string): Promise<void> {
    await this.loanAmountInput.fill(String(amount));
    await this.interestRateInput.fill(String(rate));
    await this.tenureInput.fill(String(years));
  }

  async clickCalculate(): Promise<void> {
    await this.calculateButton.click();
  }

  async getEmiText(): Promise<string> {
    return (await this.emiOutput.innerText()).trim();
  }

  async getTotalInterestText(): Promise<string> {
    return (await this.totalInterestOutput.innerText()).trim();
  }

  async getTotalPaymentText(): Promise<string> {
    return (await this.totalPaymentOutput.innerText()).trim();
  }
}
