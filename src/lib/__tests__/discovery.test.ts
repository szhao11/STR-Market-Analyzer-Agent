import { describe, it, expect } from "vitest";
import { zodResponseFormat } from "openai/helpers/zod";
import { getAllMetros } from "@/lib/city-resolver";
import { filterMetros } from "@/lib/agent/discovery/filter-metros";
import { scoreCandidates, buildNoResultsReason } from "@/lib/agent/discovery/score-candidates";
import { normalizeDiscoveryCriteria } from "@/lib/agent/discovery/parse-query";
import { discoveryCriteriaSchema } from "@/lib/agent/discovery/schemas";
import { DEFAULT_INVESTOR_PROFILE } from "@/lib/agent/types";
import { makeSnapshot } from "./fixtures";
import { DiscoveryCriteria } from "@/lib/agent/discovery/types";

describe("discoveryCriteriaSchema", () => {
  it("produces a strict OpenAI JSON schema with all fields required", () => {
    const format = zodResponseFormat(discoveryCriteriaSchema, "discovery_criteria");
    const required = format.json_schema.schema.required as string[];
    expect(required).toContain("statesInclude");
    expect(required).toContain("statesExclude");
    expect(required).toHaveLength(Object.keys(format.json_schema.schema.properties ?? {}).length);
  });

  it("accepts null for unset optional filters", () => {
    const result = discoveryCriteriaSchema.safeParse({
      intentSummary: "Texas cash flow",
      limit: 5,
      statesInclude: ["TX"],
      statesExclude: null,
      absenteeInvestor: null,
      excludeRestrictive: null,
      excludeSnapshotIds: null,
      maxPurchasePrice: null,
      minOccupancy: null,
      minRevpar: null,
      minOverallScore: null,
      minCashOnCash: null,
      minPopulation: null,
      maxAffordabilityIndex: null,
      ratingsAllow: null,
      preferUnanalyzed: null,
      requireFresh: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("filterMetros", () => {
  it("returns only Texas metros when statesInclude is TX", () => {
    const criteria: DiscoveryCriteria = {
      intentSummary: "Texas markets",
      limit: 5,
      statesInclude: ["TX"],
    };

    const filtered = filterMetros(criteria, DEFAULT_INVESTOR_PROFILE);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((m) => m.stateAbbr === "TX")).toBe(true);
  });

  it("excludes California when statesExclude includes CA", () => {
    const criteria: DiscoveryCriteria = {
      intentSummary: "Not California",
      limit: 5,
      statesExclude: ["CA"],
    };

    const filtered = filterMetros(criteria, DEFAULT_INVESTOR_PROFILE);
    expect(filtered.every((m) => m.stateAbbr !== "CA")).toBe(true);
    expect(filtered.length).toBeLessThan(getAllMetros().length);
  });
});

describe("scoreCandidates", () => {
  it("filters by max purchase price", () => {
    const cheap = makeSnapshot({
      id: "cheap",
      medianHomePrice: 250_000,
      overallScore: 7,
      overallRating: "Buy",
      strRevpar: 90,
      strAdr: 120,
      strOccupancyRate: 70,
    });
    const expensive = makeSnapshot({
      id: "expensive",
      identifiers: {
        city: "San Diego",
        state: "California",
        stateAbbr: "CA",
        metroArea: "San Diego",
        fipsCode: "41740",
        cbsaCode: "41740",
        zipCodes: ["92101"],
        latitude: 32.7,
        longitude: -117.1,
      },
      medianHomePrice: 900_000,
      overallScore: 8,
      overallRating: "Strong Buy",
      strRevpar: 150,
      strAdr: 200,
      strOccupancyRate: 75,
    });

    const criteria: DiscoveryCriteria = {
      intentSummary: "Under 400k",
      limit: 5,
      maxPurchasePrice: 400_000,
    };

    const scored = scoreCandidates([cheap, expensive], criteria, DEFAULT_INVESTOR_PROFILE, new Set());
    expect(scored).toHaveLength(1);
    expect(scored[0].city).toBe("Austin");
  });

  it("builds actionable no-results reason", () => {
    const reason = buildNoResultsReason(
      {
        intentSummary: "Strict",
        limit: 5,
        maxPurchasePrice: 100_000,
        minOccupancy: 90,
      },
      DEFAULT_INVESTOR_PROFILE,
      40,
      0
    );
    expect(reason).toContain("40 metros");
  });
});

describe("normalizeDiscoveryCriteria", () => {
  it("merges profile defaults for budget and absentee", () => {
    const normalized = normalizeDiscoveryCriteria(
      {
        intentSummary: "Test",
        limit: 3,
      },
      5,
      { ...DEFAULT_INVESTOR_PROFILE, maxPurchasePrice: 350_000, absenteeInvestor: true }
    );

    expect(normalized.maxPurchasePrice).toBe(350_000);
    expect(normalized.excludeRestrictive).toBe(true);
    expect(normalized.limit).toBe(3);
  });

  it("does not merge profile defaults in query-only mode", () => {
    const normalized = normalizeDiscoveryCriteria(
      {
        intentSummary: "Test",
        limit: 3,
      },
      5,
      { ...DEFAULT_INVESTOR_PROFILE, maxPurchasePrice: 350_000, absenteeInvestor: true },
      "query-only"
    );

    expect(normalized.maxPurchasePrice).toBeUndefined();
    expect(normalized.excludeRestrictive).toBeUndefined();
    expect(normalized.limit).toBe(3);
  });
});

describe("scoreCandidates query-only", () => {
  it("does not filter by investor profile budget when criteria omit max price", () => {
    const expensive = makeSnapshot({
      id: "expensive",
      medianHomePrice: 900_000,
      overallScore: 8,
      overallRating: "Strong Buy",
      strRevpar: 150,
      strAdr: 200,
      strOccupancyRate: 75,
    });

    const criteria: DiscoveryCriteria = {
      intentSummary: "High performers",
      limit: 5,
    };

    const withProfile = scoreCandidates(
      [expensive],
      criteria,
      { ...DEFAULT_INVESTOR_PROFILE, maxPurchasePrice: 400_000 },
      new Set(),
      "investor"
    );
    const queryOnly = scoreCandidates(
      [expensive],
      criteria,
      { ...DEFAULT_INVESTOR_PROFILE, maxPurchasePrice: 400_000 },
      new Set(),
      "query-only"
    );

    expect(withProfile).toHaveLength(0);
    expect(queryOnly).toHaveLength(1);
  });
});
