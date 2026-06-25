import { describe, it, expect } from "vitest";
import { makeSnapshot } from "./fixtures";
import { computeCalculatorResult, runInvestmentScenario } from "@/lib/agent/calculator";
import { DEFAULT_INVESTOR_PROFILE } from "@/lib/agent/types";

describe("agent calculator", () => {
  it("matches UI calculator math for STR scenario", () => {
    const snapshot = makeSnapshot({
      medianHomePrice: 400_000,
      medianRent: 2000,
      strMonthlyRevenue: 4500,
      strOccupancyRate: 70,
    });

    const result = runInvestmentScenario(snapshot, DEFAULT_INVESTOR_PROFILE, "str");

    expect(result.purchasePrice).toBe(400_000);
    expect(result.monthlyCashFlow).toBeCloseTo(
      computeCalculatorResult({
        purchasePrice: 400_000,
        downPaymentPct: 25,
        interestRate: 7,
        loanTermYears: 30,
        monthlyRent: 4500,
        expenseRatioPct: 40,
        occupancyRate: 70,
        mode: "str",
      }).monthlyCashFlow,
      1
    );
  });

  it("caps purchase price at investor max budget", () => {
    const snapshot = makeSnapshot({ medianHomePrice: 600_000 });
    const result = runInvestmentScenario(
      snapshot,
      { ...DEFAULT_INVESTOR_PROFILE, maxPurchasePrice: 350_000 },
      "ltr"
    );
    expect(result.purchasePrice).toBe(350_000);
  });

  it("falls back to LTR when no STR revenue", () => {
    const snapshot = makeSnapshot({
      medianHomePrice: 300_000,
      medianRent: 1800,
      strAdr: null,
      strMonthlyRevenue: null,
    });
    const result = runInvestmentScenario(snapshot, DEFAULT_INVESTOR_PROFILE, "str");
    expect(result.mode).toBe("ltr");
    expect(result.grossAnnualRevenue).toBe(1800 * 12);
  });
});
