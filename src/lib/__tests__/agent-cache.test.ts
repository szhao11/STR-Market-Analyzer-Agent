import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  briefCacheKey,
  setCached,
  getCached,
  clearAgentCache,
  rankCacheKey,
  hasExplainSections,
} from "@/lib/agent/cache";
import { DEFAULT_INVESTOR_PROFILE } from "@/lib/agent/types";
import { marketBriefSchema, marketBriefExplainSchema } from "@/lib/agent/schemas";

describe("agent cache", () => {
  beforeEach(() => clearAgentCache());
  afterEach(() => clearAgentCache());

  it("returns cached brief by key", () => {
    const key = briefCacheKey("snap-1", "brief");
    const brief = {
      verdict: "Watch" as const,
      verdictAlignsWithRating: true,
      headline: "Test",
      regulationSummary: "Ok",
      strengths: [],
      risks: [],
      strOutlook: null,
      ltrFallback: null,
      dataCaveats: [],
    };
    setCached(key, brief, "2026-06-01T00:00:00.000Z");
    expect(getCached(key, "2026-06-01T00:00:00.000Z")).toEqual(brief);
  });

  it("invalidates when snapshot fetchedAt is newer", () => {
    const key = briefCacheKey("snap-2", "brief");
    setCached(key, { hello: "world" }, "2026-06-01T00:00:00.000Z");
    expect(getCached(key, "2026-06-02T00:00:00.000Z")).toBeNull();
  });

  it("builds stable rank cache keys", () => {
    const a = rankCacheKey(["b", "a"], DEFAULT_INVESTOR_PROFILE);
    const b = rankCacheKey(["a", "b"], DEFAULT_INVESTOR_PROFILE);
    expect(a).toBe(b);
  });

  it("detects valid explain sections on cached briefs", () => {
    expect(hasExplainSections({ explain: [{ category: "STR", summary: "x", highlights: [] }] })).toBe(
      true
    );
    expect(hasExplainSections({ explain: [] })).toBe(false);
    expect(hasExplainSections({ verdict: "Watch" })).toBe(false);
  });
});

describe("marketBriefSchema", () => {
  it("rejects invalid verdict", () => {
    const result = marketBriefSchema.safeParse({
      verdict: "Maybe",
      verdictAlignsWithRating: true,
      headline: "x",
      regulationSummary: "x",
      strengths: [],
      risks: [],
      strOutlook: null,
      ltrFallback: null,
      dataCaveats: [],
    });
    expect(result.success).toBe(false);
  });
});

describe("marketBriefExplainSchema", () => {
  it("requires explain array for structured output schema", () => {
    const withoutExplain = marketBriefSchema.safeParse({
      verdict: "Watch",
      verdictAlignsWithRating: true,
      headline: "x",
      regulationSummary: "x",
      strengths: [],
      risks: [],
      strOutlook: null,
      ltrFallback: null,
      dataCaveats: [],
    });
    expect(withoutExplain.success).toBe(true);

    const withExplain = marketBriefExplainSchema.safeParse({
      ...withoutExplain.data,
      explain: [{ category: "STR", summary: "Strong", highlights: ["adr"] }],
    });
    expect(withExplain.success).toBe(true);
  });
});
