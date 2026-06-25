import { NextRequest, NextResponse } from "next/server";
import { getSnapshot } from "@/lib/storage";
import { assertAgentAvailable } from "@/lib/agent/config";
import { generateMarketBrief } from "@/lib/agent/service";
import { checkRateLimit } from "@/lib/agent/rate-limit";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const availability = assertAgentAvailable();
  if (!availability.ok) {
    return NextResponse.json({ error: availability.error }, { status: availability.status });
  }

  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city");
  const state = searchParams.get("state");
  const mode = searchParams.get("mode") === "explain" ? "explain" : "brief";
  const refresh = searchParams.get("refresh") === "true";

  if (!city || !state) {
    return NextResponse.json({ error: "city and state are required" }, { status: 400 });
  }

  const snapshot = getSnapshot(city, state);
  if (!snapshot) {
    return NextResponse.json({ error: "No snapshot found for this market" }, { status: 404 });
  }

  if (refresh) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "local";
    if (!checkRateLimit(`brief:${ip}`)) {
      return NextResponse.json(
        { error: "Rate limit exceeded — try again in a minute" },
        { status: 429 }
      );
    }
  }

  try {
    const brief = await generateMarketBrief(snapshot, mode, refresh);
    return NextResponse.json(brief);
  } catch (err) {
    console.error("Agent brief error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate brief" },
      { status: 502 }
    );
  }
}
