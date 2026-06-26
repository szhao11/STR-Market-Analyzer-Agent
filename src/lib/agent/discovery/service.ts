import { generateStructuredJson } from "@/lib/agent/openai";
import { mergeInvestorProfile } from "@/lib/agent/service";
import { InvestorProfile } from "@/lib/agent/types";
import {
  discoveryCacheKey,
  getDiscoveryCached,
  setDiscoveryCached,
} from "./cache";
import {
  DISCOVERY_PROMPT_VERSION,
  DISCOVERY_SUMMARY_SYSTEM_PROMPT,
  buildDiscoverySummaryUserPrompt,
} from "./prompts";
import { parseDiscoveryQuery } from "./parse-query";
import { runDiscoveryPipeline } from "./pipeline";
import { discoverySummarySchema } from "./schemas";
import { DiscoveryResult } from "./types";

import { DiscoveryProfileMode } from "./types";

export async function generateDiscovery(
  query: string,
  profileInput: Partial<InvestorProfile> = {},
  limit = 5,
  refresh = false,
  useProfile = true
): Promise<DiscoveryResult> {
  const profile = mergeInvestorProfile(profileInput);
  const profileMode: DiscoveryProfileMode = useProfile ? "investor" : "query-only";
  const boundedLimit = Math.min(Math.max(limit, 1), 10);

  const criteria = await parseDiscoveryQuery(query, boundedLimit, profile, profileMode);
  const cacheKey = discoveryCacheKey(query, boundedLimit, profile, criteria, useProfile);

  if (!refresh) {
    const cached = getDiscoveryCached(cacheKey);
    if (cached) return cached;
  }

  const pipeline = await runDiscoveryPipeline(criteria, profile, profileMode);

  let summary = "";
  const rationaleMap = new Map<string, string>();

  if (pipeline.scoredForSummary.length > 0) {
    const candidatesPayload = pipeline.scoredForSummary.map((entry, idx) => ({
      rank: idx + 1,
      snapshotId: entry.snapshotId,
      city: entry.city,
      stateAbbr: entry.stateAbbr,
      overallScore: entry.overallScore,
      rating: entry.rating,
      keyMetric: entry.keyMetric,
      matchReasons: entry.matchReasons,
      dataGaps: entry.dataGaps,
    }));

    const llmOutput = await generateStructuredJson(
      DISCOVERY_SUMMARY_SYSTEM_PROMPT,
      buildDiscoverySummaryUserPrompt(
        JSON.stringify(criteria, null, 2),
        JSON.stringify(candidatesPayload, null, 2)
      ),
      discoverySummarySchema,
      "discovery_summary"
    );

    summary = llmOutput.summary;
    for (const row of llmOutput.ranked) {
      rationaleMap.set(row.snapshotId, row.rationale);
    }
  } else if (pipeline.noResultsReason) {
    summary = pipeline.noResultsReason;
  }

  const ranked = pipeline.ranked.map((entry) => ({
    ...entry,
    rationale:
      rationaleMap.get(entry.snapshotId) ??
      entry.rationale,
  }));

  const result: DiscoveryResult = {
    generatedAt: new Date().toISOString(),
    promptVersion: DISCOVERY_PROMPT_VERSION,
    query,
    criteria: pipeline.criteria,
    profile,
    profileApplied: useProfile,
    summary,
    ranked,
    considered: pipeline.considered,
    hydrated: pipeline.hydrated,
    strPreviewsFetched: pipeline.strPreviewsFetched,
    noResultsReason: pipeline.noResultsReason,
  };

  setDiscoveryCached(cacheKey, result);
  return result;
}
