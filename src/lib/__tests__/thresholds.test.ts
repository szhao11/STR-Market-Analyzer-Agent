import { describe, expect, it } from "vitest";
import {
  computeOverallScore,
  evaluateAllCategories,
  evaluateMetric,
  getDecisionFlags,
  scoreMarket,
  economicRules,
} from "@/lib/thresholds";
import { makeSnapshot } from "@/lib/__tests__/fixtures";
import { MarketSnapshot } from "@/types/market";

/** Strong metrics across categories to produce a high raw score before gates. */
function strongSnapshot(overrides: Partial<MarketSnapshot> = {}): MarketSnapshot {
  return makeSnapshot({
    gdpGrowth: 2,
    unemploymentRate: 3,
    jobGrowthPct: 3,
    medianIncome: 75_000,
    population: 500_000,
    netMigrationPct: 2,
    rentalPopulationPct: 35,
    medianHomePrice: 250_000,
    housingAffordabilityIndex: 3.3,
    priceToRentRatio: 12,
    medianRent: 1_500,
    annualRentalIncome: 18_000,
    strAdr: 200,
    strOccupancyRate: 75,
    strRevpar: 150,
    strAnnualRevenue: 54_750,
    strSeasonalityScore: 80,
    strAvgRating: 4.8,
    strSuperhostPct: 40,
    strActiveListings: 20,
    strSegment2brAdr: 200,
    capRateEstimate: 10,
    cashOnCashEstimate: 15,
    crimeRateViolent: 150,
    crimeRateProperty: 1_500,
    walkScore: 80,
    stateTaxRate: 0,
    propertyTaxRate: 0.8,
    strRegulationScore: "friendly",
    strRegulationSignals: {
      operatingAllowed: true,
      permitRequired: false,
      primaryResidenceOnly: false,
      nightCap: null,
      listingCap: null,
      enforcementLevel: "low",
    },
    strInvestorEligible: true,
    strRegulationConfidence: "high",
    strRegulationResolution: "city",
    ...overrides,
  });
}

describe("evaluateMetric", () => {
  it("assigns green/yellow/red signals from threshold rules", () => {
    const snapshot = makeSnapshot({ gdpGrowth: 2, unemploymentRate: 3 });
    const gdp = evaluateMetric(economicRules[0], snapshot);
    const unemployment = evaluateMetric(economicRules[1], snapshot);
    expect(gdp.signal).toBe("green");
    expect(unemployment.signal).toBe("green");
  });

  it("returns gray for missing values", () => {
    const snapshot = makeSnapshot({ gdpGrowth: null });
    const gdp = evaluateMetric(economicRules[0], snapshot);
    expect(gdp.signal).toBe("gray");
  });
});

describe("scoreMarket", () => {
  it("produces seven weighted categories", () => {
    const { scores } = scoreMarket(strongSnapshot());
    expect(scores).toHaveLength(7);
    const names = scores.map((c) => c.category);
    expect(names).toContain("STR Performance");
    expect(names).toContain("STR Regulation");
  });

  it("caps rating at Hold / Watch for restrictive regulation", () => {
    const { rating } = scoreMarket(
      strongSnapshot({
        strRegulationScore: "restrictive",
        strRegulationSignals: {
          operatingAllowed: true,
          permitRequired: true,
          primaryResidenceOnly: false,
          nightCap: null,
          listingCap: null,
          enforcementLevel: "active",
        },
        strInvestorEligible: true,
      })
    );
    expect(rating).not.toBe("Strong Buy");
    expect(rating).not.toBe("Buy");
    expect(["Hold / Watch", "Avoid"]).toContain(rating);
  });

  it("caps rating at Hold / Watch when not investor-eligible", () => {
    const { rating } = scoreMarket(
      strongSnapshot({
        strInvestorEligible: false,
        strRegulationSignals: {
          operatingAllowed: true,
          permitRequired: true,
          primaryResidenceOnly: true,
          nightCap: null,
          listingCap: null,
          enforcementLevel: "moderate",
        },
        strRegulationScore: "moderate",
      })
    );
    expect(rating).toBe("Hold / Watch");
  });

  it("forces Avoid when STR is banned or not operating", () => {
    const banned = scoreMarket(
      strongSnapshot({
        strRegulationScore: "banned",
        strRegulationSignals: {
          operatingAllowed: false,
          permitRequired: true,
          primaryResidenceOnly: false,
          nightCap: null,
          listingCap: null,
          enforcementLevel: "active",
        },
      })
    );
    expect(banned.rating).toBe("Avoid");

    const notAllowed = scoreMarket(
      strongSnapshot({
        strRegulationScore: "moderate",
        strRegulationSignals: {
          operatingAllowed: false,
          permitRequired: false,
          primaryResidenceOnly: false,
          nightCap: null,
          listingCap: null,
          enforcementLevel: "low",
        },
      })
    );
    expect(notAllowed.rating).toBe("Avoid");
  });
});

describe("getDecisionFlags", () => {
  it("flags missing regulation data", () => {
    const flags = getDecisionFlags(makeSnapshot());
    expect(flags[0]).toMatch(/Regulation data unavailable/);
  });

  it("flags restrictive and investor-ineligible markets", () => {
    const flags = getDecisionFlags(
      strongSnapshot({
        strRegulationScore: "restrictive",
        strInvestorEligible: false,
        strRegulationSignals: {
          operatingAllowed: true,
          permitRequired: true,
          primaryResidenceOnly: true,
          nightCap: 60,
          listingCap: null,
          enforcementLevel: "active",
        },
        strRegulationConfidence: "low",
        strRegulationResolution: "state",
      })
    );
    expect(flags.some((f) => f.includes("Restrictive STR regulations"))).toBe(
      true
    );
    expect(flags.some((f) => f.includes("Not investor-eligible"))).toBe(true);
    expect(flags.some((f) => f.includes("Primary residence only"))).toBe(true);
    expect(flags.some((f) => f.includes("Night cap"))).toBe(true);
    expect(flags.some((f) => f.includes("Low confidence"))).toBe(true);
    expect(flags.some((f) => f.includes("state-level default"))).toBe(true);
  });
});

describe("computeOverallScore", () => {
  it("returns zero score when no categories have data", () => {
    const categories = evaluateAllCategories(makeSnapshot());
    const result = computeOverallScore(categories);
    expect(result.score).toBe(0);
    expect(result.rating).toBeNull();
  });
});
