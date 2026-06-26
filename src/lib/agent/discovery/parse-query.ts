import { generateStructuredJson } from "@/lib/agent/openai";
import { InvestorProfile } from "@/lib/agent/types";
import {
  DISCOVERY_PROMPT_VERSION,
  PARSE_QUERY_SYSTEM_PROMPT,
  buildParseQueryUserPrompt,
  buildParseQueryUserPromptQueryOnly,
} from "./prompts";
import { DiscoveryProfileMode } from "./types";
import { discoveryCriteriaSchema } from "./schemas";
import { DiscoveryCriteria } from "./types";

export function normalizeDiscoveryCriteria(
  parsed: DiscoveryCriteria,
  limit: number,
  profile: InvestorProfile,
  profileMode: DiscoveryProfileMode = "investor"
): DiscoveryCriteria {
  const boundedLimit = Math.min(Math.max(parsed.limit || limit, 1), 10);

  if (profileMode === "query-only") {
    return {
      ...parsed,
      limit: boundedLimit,
    };
  }

  return {
    ...parsed,
    limit: boundedLimit,
    maxPurchasePrice: parsed.maxPurchasePrice ?? profile.maxPurchasePrice,
    absenteeInvestor: parsed.absenteeInvestor ?? profile.absenteeInvestor,
    excludeRestrictive: parsed.excludeRestrictive ?? profile.absenteeInvestor,
  };
}

export async function parseDiscoveryQuery(
  query: string,
  limit: number,
  profile: InvestorProfile,
  profileMode: DiscoveryProfileMode = "investor"
): Promise<DiscoveryCriteria> {
  const userPrompt =
    profileMode === "query-only"
      ? buildParseQueryUserPromptQueryOnly(query)
      : buildParseQueryUserPrompt(query, JSON.stringify(profile, null, 2));

  const parsed = await generateStructuredJson(
    PARSE_QUERY_SYSTEM_PROMPT,
    userPrompt,
    discoveryCriteriaSchema,
    "discovery_criteria"
  );

  return normalizeDiscoveryCriteria(
    {
      ...parsed,
      limit: parsed.limit || limit,
    },
    limit,
    profile,
    profileMode
  );
}

export { DISCOVERY_PROMPT_VERSION };
