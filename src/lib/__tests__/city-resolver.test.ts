import { describe, expect, it } from "vitest";
import {
  getAllMetros,
  getMetroBySlug,
  resolveCity,
  searchMetros,
  toSlug,
} from "@/lib/city-resolver";

describe("city-resolver", () => {
  it("returns all 73 metros", () => {
    expect(getAllMetros()).toHaveLength(73);
  });

  it("resolves city by exact name with optional state", () => {
    const austin = resolveCity("Austin", "TX");
    expect(austin?.city).toBe("Austin");
    expect(austin?.stateAbbr).toBe("TX");

    const withoutState = resolveCity("Austin");
    expect(withoutState?.city).toBe("Austin");
  });

  it("returns null for unknown cities", () => {
    expect(resolveCity("Not A Real City", "ZZ")).toBeNull();
  });

  it("builds and parses slugs consistently", () => {
    const slug = toSlug("San Antonio", "TX");
    expect(slug).toBe("san-antonio-tx");
    const metro = getMetroBySlug(slug);
    expect(metro?.city).toBe("San Antonio");
    expect(metro?.stateAbbr).toBe("TX");
  });

  it("resolves multi-word city slugs", () => {
    const metro = getMetroBySlug("new-york-ny");
    expect(metro?.city).toBe("New York");
    expect(metro?.stateAbbr).toBe("NY");
  });

  it("searchMetros ranks exact matches before prefix and contains", () => {
    const results = searchMetros("port", 20);
    const cities = results.map((m) => m.city);
    const portlandIndex = cities.indexOf("Portland");
    const portStLucieIndex = cities.findIndex((c) => c.includes("Port"));
    expect(portlandIndex).toBeGreaterThanOrEqual(0);
    // Portland should appear before cities that only contain "port" in metro area
    if (portStLucieIndex >= 0 && portStLucieIndex !== portlandIndex) {
      expect(portlandIndex).toBeLessThan(portStLucieIndex);
    }
  });

  it("searchMetros matches city, state, or metro area", () => {
    expect(searchMetros("california", 5).length).toBeGreaterThan(0);
    expect(searchMetros("austin, tx", 5)[0]?.city).toBe("Austin");
  });

  it("searchMetros returns empty for blank query", () => {
    expect(searchMetros("")).toEqual([]);
    expect(searchMetros("   ")).toEqual([]);
  });

  it("searchMetros respects limit", () => {
    expect(searchMetros("a", 3)).toHaveLength(3);
  });
});
