import { NextRequest, NextResponse } from "next/server";
import { resolveCity } from "@/lib/city-resolver";
import {
  ApifyStrPhase,
  fetchApifyStrData,
  getApifyStrTargetMax,
  isStrResultComplete,
  isStrSnapshotComplete,
} from "@/lib/api/apify-str";
import { calculateDerivedMetrics } from "@/lib/calculations";
import { scoreMarket } from "@/lib/thresholds";
import { enrichRegulationFields } from "@/lib/str-regulations";
import { getSnapshot, saveSnapshot } from "@/lib/storage";
import { AnalyzeResponse, MarketSnapshot } from "@/types/market";

export const maxDuration = 300;

function withRegulation(snapshot: MarketSnapshot, metro: ReturnType<typeof resolveCity>): MarketSnapshot {
  if (!metro) return snapshot;
  return { ...snapshot, ...enrichRegulationFields(metro) } as MarketSnapshot;
}

function buildAnalyzeResponse(
  snapshot: MarketSnapshot,
  options: { cached: boolean; strError?: string | null; strPartial?: boolean }
): AnalyzeResponse {
  const { scores, score, rating, flags } = scoreMarket(snapshot);
  const withScores: MarketSnapshot = {
    ...snapshot,
    overallScore: score,
    overallRating: rating,
  };

  return {
    snapshot: withScores,
    scores,
    cached: options.cached,
    strError: options.strError ?? snapshot.strFetchError,
    strPartial: options.strPartial,
    decisionFlags: flags,
  };
}

function parsePhase(value: string | null): ApifyStrPhase {
  return value === "quick" ? "quick" : "full";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const refresh = searchParams.get("refresh") === "true";
  const phase = parsePhase(searchParams.get("phase"));

  if (!city) {
    return NextResponse.json({ error: "City parameter is required" }, { status: 400 });
  }

  const metro = resolveCity(city, state || undefined);
  if (!metro) {
    return NextResponse.json({ error: `Could not resolve city: ${city}` }, { status: 404 });
  }

  const existing = getSnapshot(metro.city, metro.stateAbbr);
  if (!existing) {
    return NextResponse.json(
      { error: "Run market analysis first before fetching STR data" },
      { status: 404 }
    );
  }

  if (!refresh) {
    if (phase === "quick" && existing.strAdr != null) {
      return NextResponse.json(
        buildAnalyzeResponse(withRegulation(existing, metro), {
          cached: true,
          strPartial: !isStrSnapshotComplete(existing),
        })
      );
    }

    if (phase === "full" && isStrSnapshotComplete(existing)) {
      return NextResponse.json(
        buildAnalyzeResponse(withRegulation(existing, metro), { cached: true, strPartial: false })
      );
    }
  }

  const strData = await fetchApifyStrData(metro.city, metro.stateAbbr, {
    skipCache: refresh,
    phase,
  });

  const targetMax = getApifyStrTargetMax();
  const strLoadComplete =
    phase === "full" && isStrResultComplete(strData, targetMax);

  const rawSnapshot: Partial<MarketSnapshot> = {
    ...existing,
    ...strData,
    ...enrichRegulationFields(metro),
    strLoadComplete,
    fetchedAt: new Date().toISOString(),
  };

  const derived = calculateDerivedMetrics(rawSnapshot);
  const snapshot: MarketSnapshot = {
    ...rawSnapshot,
    ...derived,
    overallScore: null,
    overallRating: null,
  } as MarketSnapshot;

  const saved = saveSnapshot(snapshot);
  const strPartial =
    phase === "quick" ||
    (strData.strAdr != null && !isStrResultComplete(strData, targetMax));

  return NextResponse.json(
    buildAnalyzeResponse(saved, {
      cached: false,
      strError: strData.strFetchError,
      strPartial,
    })
  );
}
