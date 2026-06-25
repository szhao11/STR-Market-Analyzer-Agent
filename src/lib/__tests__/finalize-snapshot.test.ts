import { describe, expect, it } from "vitest";
import { finalizeSnapshot } from "@/lib/finalize-snapshot";
import { makeSnapshot } from "@/lib/__tests__/fixtures";

describe("finalizeSnapshot", () => {
  it("re-derives metrics, regulation, safety fallbacks, and overall score", () => {
    const raw = makeSnapshot({
      identifiers: {
        city: "Austin",
        state: "Texas",
        stateAbbr: "TX",
        metroArea: "Austin-Round Rock",
        fipsCode: "12420",
        cbsaCode: "12420",
        zipCodes: ["78701"],
        latitude: 30.27,
        longitude: -97.74,
      },
      medianHomePrice: 400_000,
      medianIncome: 80_000,
      medianRent: 1_800,
      strAdr: 180,
      strOccupancyRate: 68,
      overallScore: null,
      overallRating: null,
      strRegulationScore: null,
      crimeRateViolent: null,
      propertyTaxRate: null,
    });

    const finalized = finalizeSnapshot(raw);

    expect(finalized.housingAffordabilityIndex).toBe(5);
    expect(finalized.annualRentalIncome).toBe(21_600);
    expect(finalized.strRevpar).toBeCloseTo(122.4, 1);
    expect(finalized.strAnnualRevenue).toBeGreaterThan(0);
    expect(finalized.strRegulationScore).toBeTruthy();
    expect(finalized.strRegulationResolution).toBe("city");
    expect(finalized.crimeRateViolent).toBeGreaterThan(0);
    expect(finalized.propertyTaxRate).toBeGreaterThan(0);
    expect(finalized.stateTaxRate).not.toBeNull();
    expect(finalized.overallScore).toBeGreaterThan(0);
    expect(finalized.overallRating).toBeTruthy();
  });

  it("preserves fetched STR fields while updating derived values", () => {
    const raw = makeSnapshot({
      strAdr: 250,
      strOccupancyRate: 80,
      strActiveListings: 42,
      strAvgRating: 4.9,
    });

    const finalized = finalizeSnapshot(raw);
    expect(finalized.strActiveListings).toBe(42);
    expect(finalized.strAvgRating).toBe(4.9);
    expect(finalized.strRevpar).toBe(200);
  });
});
