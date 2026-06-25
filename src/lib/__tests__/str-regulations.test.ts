import { describe, expect, it } from "vitest";
import metros from "@/data/metros.json";
import {
  deriveInvestorEligible,
  enrichRegulationFields,
  formatRegulationLevel,
  formatRegulationResolution,
  getRegulationCoverageGaps,
  getRegulationDatasetStats,
  getRegulationDatasetVersion,
  resolveStrRegulation,
} from "@/lib/str-regulations";
import { MetroEntry, StrRegulationSignals } from "@/types/market";

const metrosList = metros as MetroEntry[];

function findMetro(city: string, stateAbbr: string): MetroEntry {
  const metro = metrosList.find(
    (m) => m.city === city && m.stateAbbr === stateAbbr
  );
  if (!metro) throw new Error(`Metro not found: ${city}, ${stateAbbr}`);
  return metro;
}

describe("deriveInvestorEligible", () => {
  const baseSignals: StrRegulationSignals = {
    operatingAllowed: true,
    permitRequired: true,
    primaryResidenceOnly: false,
    nightCap: null,
    listingCap: null,
    enforcementLevel: "moderate",
  };

  it("returns false when STR is not allowed", () => {
    expect(
      deriveInvestorEligible({ ...baseSignals, operatingAllowed: false })
    ).toBe(false);
  });

  it("returns false for primary-residence-only rules", () => {
    expect(
      deriveInvestorEligible({ ...baseSignals, primaryResidenceOnly: true })
    ).toBe(false);
  });

  it("returns false when night cap is under 90", () => {
    expect(deriveInvestorEligible({ ...baseSignals, nightCap: 60 })).toBe(
      false
    );
  });

  it("returns false when listing cap is 25% or lower", () => {
    expect(deriveInvestorEligible({ ...baseSignals, listingCap: 0.25 })).toBe(
      false
    );
    expect(deriveInvestorEligible({ ...baseSignals, listingCap: 0.2 })).toBe(
      false
    );
  });

  it("returns true for investor-friendly signals", () => {
    expect(deriveInvestorEligible(baseSignals)).toBe(true);
    expect(
      deriveInvestorEligible({ ...baseSignals, nightCap: 120 })
    ).toBe(true);
  });
});

describe("resolveStrRegulation", () => {
  it("resolves city override before county, CBSA, and state", () => {
    const nyc = findMetro("New York", "NY");
    const resolved = resolveStrRegulation(nyc);
    expect(resolved?.resolution).toBe("city");
    expect(resolved?.record.overall).toBe("restrictive");
    expect(resolved?.record.jurisdiction).toContain("New York");
  });

  it("enriches regulation fields for a known metro", () => {
    const la = findMetro("Los Angeles", "CA");
    const fields = enrichRegulationFields(la);
    expect(fields.strRegulationScore).toBe("moderate");
    expect(fields.strRegulationResolution).toBe("city");
    expect(fields.strRegulationConfidence).toBe("high");
    expect(fields.strRegulationSources?.length).toBeGreaterThan(0);
    expect(fields.strInvestorEligible).toBe(true);
  });

  it("marks San Francisco as not investor-eligible (primary residence only)", () => {
    const sf = findMetro("San Francisco", "CA");
    const fields = enrichRegulationFields(sf);
    expect(fields.strRegulationSignals?.primaryResidenceOnly).toBe(true);
    expect(fields.strInvestorEligible).toBe(false);
  });

  it("marks Savannah as not investor-eligible (listing cap)", () => {
    const savannah = findMetro("Savannah", "GA");
    const fields = enrichRegulationFields(savannah);
    expect(fields.strRegulationSignals?.listingCap).toBe(0.2);
    expect(fields.strInvestorEligible).toBe(false);
  });
});

describe("regulation dataset", () => {
  it("has a version string", () => {
    expect(getRegulationDatasetVersion()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("reports expected override counts", () => {
    const stats = getRegulationDatasetStats();
    expect(stats.cityOverrideCount).toBe(73);
    expect(stats.stateCount).toBeGreaterThan(0);
    expect(stats.version).toBe(getRegulationDatasetVersion());
  });

  it("has no coverage gaps for shipped metros", () => {
    const gaps = getRegulationCoverageGaps(metrosList);
    expect(gaps).toEqual([]);
  });
});

describe("format helpers", () => {
  it("formats regulation level and resolution", () => {
    expect(formatRegulationLevel("friendly")).toBe("Friendly");
    expect(formatRegulationLevel(null)).toBe("N/A");
    expect(formatRegulationResolution("city")).toBe("City");
    expect(formatRegulationResolution("state")).toBe("State default");
    expect(formatRegulationResolution(null)).toBe("Unknown");
  });
});
