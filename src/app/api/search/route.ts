import { NextRequest, NextResponse } from "next/server";
import { searchMetros } from "@/lib/city-resolver";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  const results = searchMetros(query, 8);

  return NextResponse.json(
    results.map((m) => ({
      city: m.city,
      state: m.state,
      stateAbbr: m.stateAbbr,
      metroArea: m.metroArea,
    }))
  );
}
