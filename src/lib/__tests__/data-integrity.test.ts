import { describe, expect, it } from "vitest";
import metros from "@/data/metros.json";
import regulations from "@/data/str-regulations.json";
import { getAllMetros, toSlug } from "@/lib/city-resolver";
import { getRegulationCoverageGaps } from "@/lib/str-regulations";
import { MetroEntry } from "@/types/market";

const metrosList = metros as MetroEntry[];

describe("data integrity", () => {
  it("metros.json has 73 entries matching city-resolver", () => {
    expect(metrosList).toHaveLength(73);
    expect(getAllMetros()).toHaveLength(73);
  });

  it("every metro has required identifier fields", () => {
    for (const metro of metrosList) {
      expect(metro.city).toBeTruthy();
      expect(metro.stateAbbr).toMatch(/^[A-Z]{2}$/);
      expect(metro.cbsaCode).toBeTruthy();
      expect(metro.fipsCode).toBeTruthy();
      expect(metro.zipCodes.length).toBeGreaterThan(0);
      expect(typeof metro.latitude).toBe("number");
      expect(typeof metro.longitude).toBe("number");
    }
  });

  it("every metro has a county for regulation resolution", () => {
    const missing = metrosList.filter((m) => !m.county);
    expect(missing).toEqual([]);
  });

  it("metro slugs are unique", () => {
    const slugs = metrosList.map((m) => toSlug(m.city, m.stateAbbr));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("regulation dataset covers all metros with city overrides", () => {
    expect(getRegulationCoverageGaps(metrosList)).toEqual([]);
    expect(regulations.cityOverrides).toHaveLength(73);
  });

  it("high-confidence city overrides include official sources", () => {
    const highWithoutSources = regulations.cityOverrides.filter(
      (e: { confidence: string; sources?: unknown[] }) =>
        e.confidence === "high" && (!e.sources || e.sources.length === 0)
    );
    expect(highWithoutSources).toEqual([]);
  });

  it("high-confidence county overrides include official sources", () => {
    const highWithoutSources = (regulations.countyOverrides ?? []).filter(
      (e: { confidence: string; sources?: unknown[] }) =>
        e.confidence === "high" && (!e.sources || e.sources.length === 0)
    );
    expect(highWithoutSources).toEqual([]);
  });

  it("regulation dataset has a version and state defaults", () => {
    expect(regulations.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(Object.keys(regulations.stateDefaults).length).toBeGreaterThanOrEqual(30);
  });
});
