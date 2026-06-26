import { NextRequest, NextResponse } from "next/server";
import { assertDiscoveryAvailable } from "@/lib/agent/discovery/config";
import { generateDiscovery } from "@/lib/agent/discovery/service";
import { investorProfileSchema } from "@/lib/agent/schemas";
import { checkRateLimit } from "@/lib/agent/rate-limit";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const availability = assertDiscoveryAvailable();
  if (!availability.ok) {
    return NextResponse.json({ error: availability.error }, { status: availability.status });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";

  if (!checkRateLimit(`discover:${ip}`, 2)) {
    return NextResponse.json(
      { error: "Rate limit exceeded — try again in a minute" },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = (body as { query?: string }).query?.trim();
  const limit = (body as { limit?: number }).limit ?? 5;
  const refresh = (body as { refresh?: boolean }).refresh === true;
  const useProfile = (body as { useProfile?: boolean }).useProfile !== false;
  const profileInput = useProfile
    ? ((body as { profile?: Record<string, unknown> }).profile ?? {})
    : {};

  if (!query || query.length < 10 || query.length > 500) {
    return NextResponse.json(
      { error: "query must be 10–500 characters" },
      { status: 400 }
    );
  }

  if (limit < 1 || limit > 10) {
    return NextResponse.json({ error: "limit must be 1–10" }, { status: 400 });
  }

  const profileParsed = investorProfileSchema.partial().safeParse(profileInput);
  if (!profileParsed.success) {
    return NextResponse.json({ error: "Invalid investor profile" }, { status: 400 });
  }

  try {
    const result = await generateDiscovery(
      query,
      profileParsed.data,
      limit,
      refresh,
      useProfile
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Agent discover error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to discover markets" },
      { status: 502 }
    );
  }
}
