import { resolveCity } from "@/lib/city-resolver";
import { calculateDerivedMetrics } from "@/lib/calculations";
import { enrichSafetyFields } from "@/lib/safety-enrichment";
import { enrichRegulationFields } from "@/lib/str-regulations";
import { scoreMarket } from "@/lib/thresholds";
import { MarketSnapshot } from "@/types/market";

/** Re-derive metrics, regulation, and overall score for a stored snapshot. */
export function finalizeSnapshot(snapshot: MarketSnapshot): MarketSnapshot {
  const metro = resolveCity(snapshot.identifiers.city, snapshot.identifiers.stateAbbr);
  const derived = calculateDerivedMetrics(snapshot);

  let merged: Partial<MarketSnapshot> = {
    ...snapshot,
    ...derived,
  };

  if (metro) {
    merged = { ...merged, ...enrichRegulationFields(metro) };
  }

  const enriched = enrichSafetyFields(merged, snapshot.identifiers.stateAbbr) as MarketSnapshot;
  const { score, rating } = scoreMarket(enriched);

  return {
    ...enriched,
    overallScore: score,
    overallRating: rating,
  };
}
