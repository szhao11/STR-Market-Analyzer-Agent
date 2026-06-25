import { NextRequest, NextResponse } from "next/server";
import { getSnapshotsByIds } from "@/lib/storage";
import { assertAgentAvailable } from "@/lib/agent/config";
import { generateCompareRank, mergeInvestorProfile } from "@/lib/agent/service";
import { investorProfileSchema } from "@/lib/agent/schemas";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const availability = assertAgentAvailable();
  if (!availability.ok) {
    return NextResponse.json({ error: availability.error }, { status: availability.status });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const snapshotIds = (body as { snapshotIds?: string[] }).snapshotIds;
  const profileInput = (body as { profile?: Record<string, unknown> }).profile ?? {};
  const refresh = (body as { refresh?: boolean }).refresh === true;

  if (!Array.isArray(snapshotIds) || snapshotIds.length < 2 || snapshotIds.length > 8) {
    return NextResponse.json(
      { error: "snapshotIds must contain 2–8 market IDs" },
      { status: 400 }
    );
  }

  const profileParsed = investorProfileSchema.partial().safeParse(profileInput);
  if (!profileParsed.success) {
    return NextResponse.json({ error: "Invalid investor profile" }, { status: 400 });
  }

  const snapshots = getSnapshotsByIds(snapshotIds);
  if (snapshots.length !== snapshotIds.length) {
    return NextResponse.json(
      { error: "One or more snapshot IDs not found" },
      { status: 404 }
    );
  }

  try {
    const result = await generateCompareRank(
      snapshots,
      mergeInvestorProfile(profileParsed.data),
      refresh
    );
    return NextResponse.json(result);
  } catch (err) {
    console.error("Agent rank error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to rank markets" },
      { status: 502 }
    );
  }
}
