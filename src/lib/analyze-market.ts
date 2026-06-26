import { fetchGdpData } from "@/lib/api/bea";
import { fetchCensusData } from "@/lib/api/census";
import { fetchBlsData } from "@/lib/api/bls";
import { fetchCrimeData } from "@/lib/api/fbi-crime";
import { fetchWalkScore } from "@/lib/api/walkscore";
import { EMPTY_APIFY_STR_RESULT } from "@/lib/api/apify-str";
import { calculateDerivedMetrics } from "@/lib/calculations";
import { scoreMarket } from "@/lib/thresholds";
import { getStateIncomeTaxRate } from "@/lib/state-tax-rates";
import { getStatePropertyTaxRate } from "@/lib/state-property-tax-rates";
import { enrichSafetyFields } from "@/lib/safety-enrichment";
import { enrichRegulationFields } from "@/lib/str-regulations";
import { saveSnapshot, getSnapshot } from "@/lib/storage";
import { CategoryScore, MarketSnapshot, MetroEntry } from "@/types/market";

export interface AnalyzeMarketResult {
  snapshot: MarketSnapshot;
  scores: CategoryScore[];
  flags: string[];
  cached: boolean;
}

function finalizeScoredSnapshot(
  snapshot: MarketSnapshot,
  metro: MetroEntry
): AnalyzeMarketResult {
  const derived = calculateDerivedMetrics(snapshot);
  const enriched = enrichSafetyFields(
    {
      ...snapshot,
      ...derived,
      ...enrichRegulationFields(metro),
      stateTaxRate: snapshot.stateTaxRate ?? getStateIncomeTaxRate(metro.stateAbbr),
    },
    metro.stateAbbr
  ) as MarketSnapshot;

  const { scores, score, rating, flags } = scoreMarket(enriched);
  enriched.overallScore = score;
  enriched.overallRating = rating;

  return { snapshot: enriched, scores, flags, cached: false };
}

export async function analyzeMarket(
  metro: MetroEntry,
  options?: { refresh?: boolean; save?: boolean }
): Promise<AnalyzeMarketResult> {
  const refresh = options?.refresh ?? false;
  const save = options?.save ?? true;

  if (!refresh) {
    const existing = getSnapshot(metro.city, metro.stateAbbr);
    if (existing) {
      const result = finalizeScoredSnapshot(existing, metro);
      return { ...result, cached: true };
    }
  }

  const address = `${metro.city}, ${metro.stateAbbr}`;
  const [gdpData, censusData, blsData, crimeData, walkScoreData] = await Promise.all([
    fetchGdpData(metro.stateAbbr),
    fetchCensusData(metro.cbsaCode),
    fetchBlsData(metro.cbsaCode, metro.stateAbbr),
    fetchCrimeData(metro.stateAbbr, metro.city),
    fetchWalkScore(metro.latitude, metro.longitude, address),
  ]);

  const rawSnapshot: Partial<MarketSnapshot> = {
    identifiers: {
      city: metro.city,
      state: metro.state,
      stateAbbr: metro.stateAbbr,
      metroArea: metro.metroArea,
      fipsCode: metro.fipsCode,
      cbsaCode: metro.cbsaCode,
      zipCodes: metro.zipCodes,
      latitude: metro.latitude,
      longitude: metro.longitude,
    },
    fetchedAt: new Date().toISOString(),
    ...gdpData,
    ...censusData,
    ...blsData,
    ...crimeData,
    ...walkScoreData,
    ...EMPTY_APIFY_STR_RESULT,
    strLoadComplete: null,
    ...enrichRegulationFields(metro),
    landlordFriendly: null,
    stateTaxRate: getStateIncomeTaxRate(metro.stateAbbr),
    propertyTaxRate: getStatePropertyTaxRate(metro.stateAbbr),
    keyIndustries: null,
    majorEmployers: null,
    monthsOfInventory: null,
    daysOnMarket: null,
    medianListPrice: null,
    capRateEstimate: null,
    cashOnCashEstimate: null,
    userNotes: "",
  };

  const derived = calculateDerivedMetrics(rawSnapshot);
  const snapshot: MarketSnapshot = enrichSafetyFields(
    {
      ...rawSnapshot,
      ...derived,
      overallScore: null,
      overallRating: null,
    },
    metro.stateAbbr
  ) as MarketSnapshot;

  const { scores, score, rating, flags } = scoreMarket(snapshot);
  snapshot.overallScore = score;
  snapshot.overallRating = rating;

  const saved = save ? saveSnapshot(snapshot) : snapshot;

  return {
    snapshot: saved,
    scores,
    flags,
    cached: false,
  };
}
