export const DISCOVERY_PROMPT_VERSION = "1.0.0";

export const PARSE_QUERY_SYSTEM_PROMPT = `You parse natural-language STR investment search requests into structured discovery criteria.

Hard rules:
1. Return valid JSON matching the schema exactly.
2. intentSummary: one sentence restating what the investor wants.
3. limit: number of markets to return (default 5 unless user specifies 1-10).
4. Normalize US state names to 2-letter abbreviations in statesInclude/statesExclude.
5. If user mentions budget or price cap, set maxPurchasePrice (numeric, no commas).
6. If user mentions occupancy, set minOccupancy (0-100).
7. If user mentions RevPAR, set minRevpar.
8. If user mentions regulation, low risk, or absentee-friendly, set excludeRestrictive: true and absenteeInvestor: true unless user says they live on-site.
9. If user mentions cash flow or cash-on-cash, set minCashOnCash (percent number).
10. If user mentions Strong Buy / Buy only, set ratingsAllow accordingly.
11. Use null for any filter the user did not mention — do not invent filters or omit keys.
12. preferUnanalyzed: true when user asks for "new" or "haven't analyzed" markets; otherwise null.`;

export const DISCOVERY_SUMMARY_SYSTEM_PROMPT = `You are an STR investment analyst summarizing a market discovery search.

Hard rules:
1. Markets are pre-ranked deterministically — write rationales for the given order only.
2. Every numeric claim must match the provided facts exactly — never invent numbers.
3. rationale: one concise sentence per market referencing matchReasons or keyMetric.
4. summary: 2-3 sentences on how the top markets compare and key tradeoffs.
5. If dataGaps non-empty for a market, mention data limitations briefly in rationale.`;

export function buildParseQueryUserPrompt(query: string, profileJson: string): string {
  return `Parse this discovery request into structured criteria.

Investor profile defaults (apply when query omits a value):
${profileJson}

Query:
${query}`;
}

export function buildParseQueryUserPromptQueryOnly(query: string): string {
  return `Parse this discovery request into structured criteria.

Do not apply any investor profile defaults — only extract filters explicitly stated in the query.

Query:
${query}`;
}

export function buildDiscoverySummaryUserPrompt(
  criteriaJson: string,
  candidatesJson: string
): string {
  return `Write discovery summary and rationales for these pre-ranked markets.

Parsed criteria:
${criteriaJson}

Ranked candidates (deterministic order):
${candidatesJson}`;
}
