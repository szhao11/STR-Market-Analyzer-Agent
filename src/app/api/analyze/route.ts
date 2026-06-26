import { NextRequest, NextResponse } from "next/server";
import { resolveCity } from "@/lib/city-resolver";
import { analyzeMarket } from "@/lib/analyze-market";
import { AnalyzeResponse } from "@/types/market";

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

  const { snapshot, scores, flags, cached } = await analyzeMarket(metro, { refresh });

  return NextResponse.json({
    snapshot,
    scores,
    cached,
    decisionFlags: flags,
  } as AnalyzeResponse);
}
