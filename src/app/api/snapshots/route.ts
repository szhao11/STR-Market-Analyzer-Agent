import { NextRequest, NextResponse } from "next/server";
import { finalizeSnapshot } from "@/lib/finalize-snapshot";
import { getAllSnapshots, getRecentSnapshots } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const recentOnly = request.nextUrl.searchParams.get("recent") === "true";
  const snapshots = (recentOnly ? getRecentSnapshots() : getAllSnapshots()).map(
    finalizeSnapshot
  );
  return NextResponse.json(snapshots);
}
