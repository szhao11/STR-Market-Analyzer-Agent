import { NextRequest, NextResponse } from "next/server";
import { dismissFromRecent } from "@/lib/recent-markets";
import { getSnapshotsByIds } from "@/lib/storage";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [snapshot] = getSnapshotsByIds([id]);
  if (!snapshot) {
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });
  }

  dismissFromRecent(id);
  return NextResponse.json({ ok: true });
}
