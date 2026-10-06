/**
 * Independent EMI maths used by the tests (deliberately NOT imported from the app).
 *
 *   EMI = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *
 *   P = principal, r = monthly interest rate (annual % / 12 / 100), n = number of monthly payments
 */
export interface EmiResult {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  months: number;
}

export function calculateExpectedEmi(principal: number, annualRatePercent: number, years: number): EmiResult {
  const months = Math.round(years * 12);
  const r = annualRatePercent / 12 / 100;

  const emi =
    r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);

  const totalPayment = emi * months;
  return { emi, totalPayment, totalInterest: totalPayment - principal, months };
}

/** Converts text such as "₹33,037.68" or "₹ 1,46,45,221" into a number. Returns NaN if there are no digits. */
export function parseCurrency(text: string): number {
  const cleaned = text.replace(/[^0-9.]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}
