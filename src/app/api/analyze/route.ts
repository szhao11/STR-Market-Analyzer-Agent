import { NextRequest, NextResponse } from "next/server";
import { resolveCity } from "@/lib/city-resolver";
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
import { MarketSnapshot, AnalyzeResponse } from "@/types/market";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const refresh = searchParams.get("refresh") === "true";

  if (!city) {
    return NextResponse.json({ error: "City parameter is required" }, { status: 400 });
  }

  const metro = resolveCity(city, state || undefined);
  if (!metro) {
    return NextResponse.json({ error: `Could not resolve city: ${city}` }, { status: 404 });
  }

  if (!refresh) {
    const existing = getSnapshot(metro.city, metro.stateAbbr);
    if (existing) {
      const derived = calculateDerivedMetrics(existing);
      const snapshot: MarketSnapshot = enrichSafetyFields(
        {
          ...existing,
          ...derived,
          ...enrichRegulationFields(metro),
          stateTaxRate: existing.stateTaxRate ?? getStateIncomeTaxRate(metro.stateAbbr),
        },
        metro.stateAbbr
      ) as MarketSnapshot;
      const { scores, score, rating, flags } = scoreMarket(snapshot);
      snapshot.overallScore = score;
      snapshot.overallRating = rating;

      return NextResponse.json({
        snapshot,
        scores,
        cached: true,
        decisionFlags: flags,
      } as AnalyzeResponse);
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

  const saved = saveSnapshot(snapshot);

  return NextResponse.json({
    snapshot: saved,
    scores,
    cached: false,
    decisionFlags: flags,
  } as AnalyzeResponse);
}
