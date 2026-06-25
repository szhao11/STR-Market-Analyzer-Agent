import { MarketSnapshot } from "@/types/market";
import { finalizeSnapshot } from "@/lib/finalize-snapshot";
import {
  BRIEF_SYSTEM_PROMPT,
  EXPLAIN_SYSTEM_PROMPT,
  RANK_SYSTEM_PROMPT,
  PROMPT_VERSION,
  buildBriefUserPrompt,
  buildRankUserPrompt,
} from "./prompts";
import { buildMarketContext } from "./context";
import { preRankMarkets } from "./pre-rank";
import { generateStructuredJson } from "./openai";
import {
  compareRankResultSchema,
  marketBriefExplainSchema,
  marketBriefSchema,
  investorProfileSchema,
} from "./schemas";
import {
  briefCacheKey,
  clearCacheKey,
  getCached,
  hasExplainSections,
  rankCacheKey,
  setCached,
} from "./cache";
import {
  CompareRankResult,
  DEFAULT_INVESTOR_PROFILE,
  InvestorProfile,
  MarketBrief,
  MarketBriefExplain,
  RankedMarket,
} from "./types";

export function mergeInvestorProfile(
  partial: Partial<InvestorProfile> = {}
): InvestorProfile {
  const parsed = investorProfileSchema.safeParse({
    ...DEFAULT_INVESTOR_PROFILE,
    ...partial,
  });
  return parsed.success ? parsed.data : DEFAULT_INVESTOR_PROFILE;
}

export async function generateMarketBrief(
  snapshot: MarketSnapshot,
  mode: "brief" | "explain" = "brief",
  refresh = false
): Promise<MarketBrief | MarketBriefExplain> {
  const finalized = finalizeSnapshot(snapshot);
  const snapshotId = finalized.id || `${finalized.identifiers.city}-${finalized.identifiers.stateAbbr}`;
  const cacheKey = briefCacheKey(snapshotId, mode);

  if (!refresh) {
    const cached = getCached<MarketBrief | MarketBriefExplain>(
      cacheKey,
      finalized.fetchedAt
    );
    if (cached) {
      if (mode === "explain" && !hasExplainSections(cached)) {
        clearCacheKey(cacheKey);
      } else {
        return cached;
      }
    }
  }

  const facts = buildMarketContext(finalized);
  const factsJson = JSON.stringify(facts, null, 2);
  const systemPrompt = mode === "explain" ? EXPLAIN_SYSTEM_PROMPT : BRIEF_SYSTEM_PROMPT;
  const userPrompt = buildBriefUserPrompt(factsJson, mode);

  const schema = mode === "explain" ? marketBriefExplainSchema : marketBriefSchema;
  const llmOutput = await generateStructuredJson(
    systemPrompt,
    userPrompt,
    schema,
    mode === "explain" ? "market_brief_explain" : "market_brief"
  );

  const result: MarketBrief | MarketBriefExplain = {
    ...llmOutput,
    generatedAt: new Date().toISOString(),
    promptVersion: PROMPT_VERSION,
    snapshotId,
  };

  setCached(cacheKey, result, finalized.fetchedAt);
  return result;
}

export async function generateCompareRank(
  snapshots: MarketSnapshot[],
  profileInput: Partial<InvestorProfile> = {},
  refresh = false
): Promise<CompareRankResult> {
  const profile = mergeInvestorProfile(profileInput);
  const finalized = snapshots.map(finalizeSnapshot);
  const snapshotIds = finalized.map(
    (s) => s.id || `${s.identifiers.city}-${s.identifiers.stateAbbr}`
  );
  const cacheKey = rankCacheKey(snapshotIds, profile);

  if (!refresh) {
    const cached = getCached<CompareRankResult>(cacheKey);
    if (cached) return cached;
  }

  const { eligible, disqualified } = preRankMarkets(finalized, profile);

  const eligiblePayload = eligible.map((e, idx) => ({
    rank: idx + 1,
    city: e.city,
    stateAbbr: e.stateAbbr,
    snapshotId: e.snapshotId,
    score: e.overallScore,
    rating: e.rating,
    keyMetric: e.keyMetric,
    compositeScore: e.compositeScore,
    facts: e.facts,
  }));

  const disqualifiedPayload = disqualified.map((e) => ({
    city: e.city,
    stateAbbr: e.stateAbbr,
    snapshotId: e.snapshotId,
    score: e.overallScore,
    rating: e.rating,
    keyMetric: e.keyMetric,
    disqualifyReason: e.disqualifyReason,
  }));

  const llmOutput = await generateStructuredJson(
    RANK_SYSTEM_PROMPT,
    buildRankUserPrompt(
      JSON.stringify(profile, null, 2),
      JSON.stringify(eligiblePayload, null, 2),
      JSON.stringify(disqualifiedPayload, null, 2)
    ),
    compareRankResultSchema,
    "compare_rank"
  );

  const ranked: RankedMarket[] = eligible.map((e, idx) => {
    const llmRow = llmOutput.ranked.find((r) => r.snapshotId === e.snapshotId);
    return {
      rank: idx + 1,
      city: e.city,
      stateAbbr: e.stateAbbr,
      snapshotId: e.snapshotId,
      score: e.overallScore,
      rating: e.rating,
      rationale: llmRow?.rationale ?? `Ranked #${idx + 1} on composite investor score`,
      keyMetric: e.keyMetric,
    };
  });

  const disqualifiedResult: RankedMarket[] = disqualified.map((e, idx) => ({
    rank: idx + 1,
    city: e.city,
    stateAbbr: e.stateAbbr,
    snapshotId: e.snapshotId,
    score: e.overallScore,
    rating: e.rating,
    rationale: e.disqualifyReason ?? "Disqualified",
    keyMetric: e.keyMetric,
    disqualified: true,
    disqualifyReason: e.disqualifyReason,
  }));

  const result: CompareRankResult = {
    generatedAt: new Date().toISOString(),
    promptVersion: PROMPT_VERSION,
    profile,
    summary: llmOutput.summary,
    ranked,
    disqualified: disqualifiedResult,
  };

  setCached(cacheKey, result);
  return result;
}
