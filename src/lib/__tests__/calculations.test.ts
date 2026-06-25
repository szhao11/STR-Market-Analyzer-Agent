import { describe, expect, it } from "vitest";
import {
  calculateDerivedMetrics,
  computeGdpGrowthPct,
  formatCurrency,
  formatGdpGrowthLabel,
  formatMetricValue,
  formatNumber,
  formatPercent,
} from "@/lib/calculations";

describe("calculateDerivedMetrics", () => {
  it("computes GDP growth (annualized over 5 years)", () => {
    const derived = calculateDerivedMetrics({
      gdpCurrent: 110,
      gdp5yr: 100,
    });
    // ((110-100)/5)/100 * 100 = 2%
    expect(derived.gdpGrowth).toBe(2);
  });

  it("computes housing affordability index", () => {
    const derived = calculateDerivedMetrics({
      medianHomePrice: 400_000,
      medianIncome: 100_000,
    });
    expect(derived.housingAffordabilityIndex).toBe(4);
  });

  it("derives annual rental income and price-to-rent ratio from median rent", () => {
    const derived = calculateDerivedMetrics({
      medianHomePrice: 300_000,
      medianRent: 1_500,
    });
    expect(derived.annualRentalIncome).toBe(18_000);
    expect(derived.priceToRentRatio).toBeCloseTo(16.67, 1);
  });

  it("computes STR RevPAR and annual revenue", () => {
    const derived = calculateDerivedMetrics({
      strAdr: 200,
      strOccupancyRate: 70,
    });
    expect(derived.strRevpar).toBe(140);
    expect(derived.strAnnualRevenue).toBe(51_100);
  });

  it("prefers STR revenue for cap rate and cash-on-cash", () => {
    const derived = calculateDerivedMetrics({
      medianHomePrice: 400_000,
      medianRent: 2_000,
      strAdr: 250,
      strOccupancyRate: 75,
    });
    expect(derived.strAnnualRevenue).toBeGreaterThan(derived.annualRentalIncome!);
    expect(derived.capRateEstimate).toBeGreaterThan(0);
    expect(derived.cashOnCashEstimate).toBeDefined();
  });

  it("skips division when denominators are zero or missing", () => {
    const derived = calculateDerivedMetrics({
      gdpCurrent: 100,
      gdp5yr: 0,
      medianHomePrice: 300_000,
      medianIncome: null,
    });
    expect(derived.gdpGrowth).toBeUndefined();
    expect(derived.housingAffordabilityIndex).toBeUndefined();
  });
});

describe("computeGdpGrowthPct", () => {
  it("computes true YoY when year gap is 1", () => {
    expect(computeGdpGrowthPct(110, 100, 1)).toBe(10);
    expect(formatGdpGrowthLabel(110, 100, 1)).toBe("+10% YoY");
  });

  it("annualizes multi-year growth as CAGR", () => {
    expect(computeGdpGrowthPct(121, 100, 2)).toBe(10);
    expect(formatGdpGrowthLabel(121, 100, 2)).toBe("+10%/yr");
  });

  it("returns null for invalid prior values", () => {
    expect(computeGdpGrowthPct(110, 0, 1)).toBeNull();
    expect(formatGdpGrowthLabel(110, 0, 1)).toBeNull();
  });
});

describe("format helpers", () => {
  it("formats currency with compact notation", () => {
    expect(formatCurrency(null)).toBe("N/A");
    expect(formatCurrency(1_500_000, true)).toBe("$1.5M");
    expect(formatCurrency(2_500, true)).toBe("$2.5K");
  });

  it("formats numbers and percents", () => {
    expect(formatNumber(null)).toBe("N/A");
    expect(formatNumber(1234.56, 1)).toBe("1,234.6");
    expect(formatPercent(2.345, 2)).toBe("2.35%");
  });

  it("formats metric values by unit", () => {
    expect(formatMetricValue(true)).toBe("Yes");
    expect(formatMetricValue(false)).toBe("No");
    expect(formatMetricValue(4.75, "★")).toBe("4.75★");
    expect(formatMetricValue(12.5, "%")).toBe("12.5%");
  });
});
