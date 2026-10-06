import * as fs from "fs";
import * as path from "path";
import { calculateExpectedEmi } from "./emi";

export interface Loan {
  id: string;
  customer: string;
  type: string;
  amount: number;
  rate: number;
  tenureYears: number;
  status: string;
}

const dataFile = path.resolve(__dirname, "../../app/data/loans.json");

/** The same mock data file the app uses - read directly from disk so expectations are independent of the UI. */
export function loadLoans(): Loan[] {
  return JSON.parse(fs.readFileSync(dataFile, "utf-8")) as Loan[];
}

export function summarise(loans: Loan[]) {
  const totalAmount = loans.reduce((sum, l) => sum + l.amount, 0);
  const totalInterest = loans.reduce((sum, l) => sum + calculateExpectedEmi(l.amount, l.rate, l.tenureYears).totalInterest, 0);
  return {
    totalLoans: loans.length,
    totalAmount,
    averageAmount: totalAmount / loans.length,
    totalInterest,
    customers: new Set(loans.map((l) => l.customer)).size,
  };
}
