import { MarketSnapshot } from "@/types/market";
import { InvestorProfile } from "./types";

export type RentalMode = "ltr" | "str";

export interface CalculatorInput {
  purchasePrice: number;
  downPaymentPct: number;
  interestRate: number;
  loanTermYears: number;
  monthlyRent: number;
  expenseRatioPct: number;
  occupancyRate: number;
  mode: RentalMode;
}

export interface CalculatorResult {
  purchasePrice: number;
  mode: RentalMode;
  downPayment: number;
  closingCosts: number;
  totalCashInvested: number;
  loanAmount: number;
  monthlyMortgage: number;
  grossAnnualRevenue: number;
  effectiveAnnualRevenue: number;
  annualExpenses: number;
  noi: number;
  annualMortgage: number;
  annualCashFlow: number;
  monthlyCashFlow: number;
  capRate: number;
  cashOnCash: number;
  breakEvenOccupancy: number;
}

export function computeCalculatorResult(input: CalculatorInput): CalculatorResult {
  const {
    purchasePrice,
    downPaymentPct,
    interestRate,
    loanTermYears,
    monthlyRent,
    expenseRatioPct,
    occupancyRate,
    mode,
  } = input;

  const downPayment = purchasePrice * (downPaymentPct / 100);
  const closingCosts = purchasePrice * 0.03;
  const totalCashInvested = downPayment + closingCosts;
  const loanAmount = purchasePrice - downPayment;

  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTermYears * 12;
  const monthlyMortgage =
    monthlyRate > 0
      ? (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments))
      : loanAmount / numPayments;

  const grossAnnualRevenue = monthlyRent * 12;
  const effectiveAnnualRevenue =
    mode === "str" ? grossAnnualRevenue * (occupancyRate / 100) : grossAnnualRevenue;
  const annualExpenses = effectiveAnnualRevenue * (expenseRatioPct / 100);
  const noi = effectiveAnnualRevenue - annualExpenses;
  const annualMortgage = monthlyMortgage * 12;
  const annualCashFlow = noi - annualMortgage;
  const monthlyCashFlow = annualCashFlow / 12;

  const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
  const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const breakEvenOccupancy =
    mode === "str" && grossAnnualRevenue > 0
      ? ((annualExpenses + annualMortgage) / grossAnnualRevenue) * 100
      : grossAnnualRevenue > 0
        ? ((annualExpenses + annualMortgage) / grossAnnualRevenue) * 100
        : 0;

  return {
    purchasePrice,
    mode,
    downPayment,
    closingCosts,
    totalCashInvested,
    loanAmount,
    monthlyMortgage,
    grossAnnualRevenue,
    effectiveAnnualRevenue,
    annualExpenses,
    noi,
    annualMortgage,
    annualCashFlow,
    monthlyCashFlow,
    capRate,
    cashOnCash,
    breakEvenOccupancy,
  };
}

function defaultStrMonthly(snapshot: MarketSnapshot): number | null {
  if (snapshot.strMonthlyRevenue != null && snapshot.strMonthlyRevenue > 0) {
    return snapshot.strMonthlyRevenue;
  }
  if (snapshot.strAnnualRevenue != null && snapshot.strAnnualRevenue > 0) {
    return Math.round(snapshot.strAnnualRevenue / 12);
  }
  return null;
}

export function runInvestmentScenario(
  snapshot: MarketSnapshot,
  profile: InvestorProfile,
  mode: RentalMode = "str"
): CalculatorResult {
  const medianPrice = snapshot.medianHomePrice || 250_000;
  const purchasePrice = Math.min(medianPrice, profile.maxPurchasePrice);
  const defaultLtrRent = snapshot.medianRent || 1500;
  const strMonthly = defaultStrMonthly(snapshot);
  const hasStrData = strMonthly != null && strMonthly > 0;
  const effectiveMode = mode === "str" && hasStrData ? "str" : "ltr";

  const monthlyRent =
    effectiveMode === "str" && strMonthly ? strMonthly : defaultLtrRent;
  const expenseRatioPct =
    effectiveMode === "str" ? profile.expenseRatioPct : Math.min(profile.expenseRatioPct, 35);
  const occupancyRate = snapshot.strOccupancyRate ?? 70;

  return computeCalculatorResult({
    purchasePrice,
    downPaymentPct: profile.downPaymentPct,
    interestRate: profile.interestRate,
    loanTermYears: profile.loanTermYears,
    monthlyRent,
    expenseRatioPct,
    occupancyRate,
    mode: effectiveMode,
  });
}
