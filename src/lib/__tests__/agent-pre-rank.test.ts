import { describe, it, expect } from "vitest";
import { makeSnapshot } from "./fixtures";
import { buildMarketContext, collectDataGaps } from "@/lib/agent/context";
import { preRankMarkets, getDisqualifyReason } from "@/lib/agent/pre-rank";
import { DEFAULT_INVESTOR_PROFILE } from "@/lib/agent/types";

describe("buildMarketContext", () => {
  it("includes decision flags and data gaps for partial STR", () => {
    const snapshot = makeSnapshot({
      id: "test-1",
      strAdr: 120,
      strLoadComplete: false,
      strRegulationScore: "friendly",
      strInvestorEligible: true,
      overallScore: 7.5,
      overallRating: "Buy",
    });

    const gaps = collectDataGaps(snapshot);
    expect(gaps.some((g) => g.includes("preview"))).toBe(true);

    const ctx = buildMarketContext(snapshot);
    expect(ctx.city).toBe("Austin");
    expect(ctx.overallScore).toBe(7.5);
    expect(ctx.calculatorScenario.purchasePrice).toBeGreaterThan(0);
  });
});

describe("preRankMarkets", () => {
  it("disqualifies absentee investor on primary-residence market", () => {
    const snapshot = makeSnapshot({
      id: "pr-market",
      identifiers: {
        city: "Portland",
        state: "Oregon",
        stateAbbr: "OR",
        metroArea: "Portland",
        fipsCode: "38900",
        cbsaCode: "38900",
        zipCodes: ["97201"],
        latitude: 45.5,
        longitude: -122.6,
      },
      strRegulationScore: "restrictive",
      strInvestorEligible: false,
      strRegulationSignals: {
        operatingAllowed: true,
        permitRequired: true,
        primaryResidenceOnly: true,
        nightCap: null,
        listingCap: null,
        enforcementLevel: "moderate",
      },
      medianHomePrice: 450_000,
      overallScore: 6,
      overallRating: "Hold / Watch",
    });

    const reason = getDisqualifyReason(snapshot, {
      ...DEFAULT_INVESTOR_PROFILE,
      absenteeInvestor: true,
    });
    expect(reason).toBeTruthy();

    const { disqualified, eligible } = preRankMarkets([snapshot], DEFAULT_INVESTOR_PROFILE);
    expect(disqualified).toHaveLength(1);
    expect(eligible).toHaveLength(0);
  });

  it("disqualifies markets over budget", () => {
    const snapshot = makeSnapshot({
      id: "expensive",
      medianHomePrice: 800_000,
      strRegulationScore: "friendly",
      strInvestorEligible: true,
    });

    const { disqualified } = preRankMarkets(
      [snapshot],
      { ...DEFAULT_INVESTOR_PROFILE, maxPurchasePrice: 300_000 }
    );
    expect(disqualified[0].disqualifyReason).toContain("budget");
  });

  it("ranks eligible markets by composite score", () => {
    const strong = makeSnapshot({
      id: "strong",
      identifiers: { ...makeSnapshot().identifiers, city: "Boise" },
      medianHomePrice: 350_000,
      strRevpar: 130,
      strSeasonalityScore: 80,
      housingAffordabilityIndex: 3.5,
      overallScore: 8.5,
      overallRating: "Strong Buy",
      strRegulationScore: "friendly",
      strInvestorEligible: true,
      strAdr: 180,
      strMonthlyRevenue: 5000,
      strOccupancyRate: 72,
    });
    const weak = makeSnapshot({
      id: "weak",
      identifiers: { ...makeSnapshot().identifiers, city: "Cleveland" },
      medianHomePrice: 200_000,
      strRevpar: 50,
      strSeasonalityScore: 40,
      housingAffordabilityIndex: 6,
      overallScore: 4,
      overallRating: "Avoid",
      strRegulationScore: "friendly",
      strInvestorEligible: true,
      strAdr: 80,
      strMonthlyRevenue: 2000,
      strOccupancyRate: 50,
    });

    const { eligible } = preRankMarkets([weak, strong], DEFAULT_INVESTOR_PROFILE);
    expect(eligible[0].snapshotId).toBe("strong");
    expect(eligible[1].snapshotId).toBe("weak");
  });
});
