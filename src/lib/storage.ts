import fs from "fs";
import path from "path";
import { MarketSnapshot } from "@/types/market";
import { filterRecentSnapshotIds, restoreToRecent } from "@/lib/recent-markets";

const DATA_DIR = path.join(process.cwd(), ".data");
const SNAPSHOTS_FILE = path.join(DATA_DIR, "snapshots.json");

function normalizeSnapshot(snapshot: MarketSnapshot): MarketSnapshot {
  return {
    ...snapshot,
    strListingPins: snapshot.strListingPins ?? [],
    strFetchError: snapshot.strFetchError ?? null,
    strLoadComplete: snapshot.strLoadComplete ?? null,
  };
}

function loadSnapshots(): MarketSnapshot[] {
  try {
    if (!fs.existsSync(SNAPSHOTS_FILE)) return [];
    const raw = fs.readFileSync(SNAPSHOTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s) => normalizeSnapshot(s as MarketSnapshot));
  } catch (error) {
    console.error("Failed to load snapshots:", error);
    return [];
  }
}

function persistSnapshots(snapshots: MarketSnapshot[]): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SNAPSHOTS_FILE, JSON.stringify(snapshots, null, 2), "utf8");
}

export function saveSnapshot(snapshot: MarketSnapshot): MarketSnapshot {
  const snapshots = loadSnapshots();
  const existing = snapshots.findIndex(
    (s) =>
      s.identifiers.city === snapshot.identifiers.city &&
      s.identifiers.stateAbbr === snapshot.identifiers.stateAbbr
  );

  const withId: MarketSnapshot = normalizeSnapshot({
    ...snapshot,
    id: snapshot.id || crypto.randomUUID(),
    fetchedAt: snapshot.fetchedAt || new Date().toISOString(),
    strListingPins: snapshot.strListingPins ?? [],
  });

  if (existing >= 0) {
    snapshots[existing] = withId;
  } else {
    snapshots.push(withId);
  }

  persistSnapshots(snapshots);
  restoreToRecent(withId.id!);
  return withId;
}

export function getSnapshot(city: string, stateAbbr: string): MarketSnapshot | null {
  const snapshots = loadSnapshots();
  return (
    snapshots.find(
      (s) =>
        s.identifiers.city.toLowerCase() === city.toLowerCase() &&
        s.identifiers.stateAbbr.toLowerCase() === stateAbbr.toLowerCase()
    ) || null
  );
}

export function getAllSnapshots(): MarketSnapshot[] {
  return loadSnapshots().sort(
    (a, b) => new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
  );
}

export function getRecentSnapshots(): MarketSnapshot[] {
  return filterRecentSnapshotIds(getAllSnapshots());
}

export function deleteSnapshot(id: string): boolean {
  const snapshots = loadSnapshots();
  const idx = snapshots.findIndex((s) => s.id === id);
  if (idx < 0) return false;
  snapshots.splice(idx, 1);
  persistSnapshots(snapshots);
  return true;
}

export function getSnapshotsByIds(ids: string[]): MarketSnapshot[] {
  const idSet = new Set(ids);
  return loadSnapshots().filter((s) => s.id && idSet.has(s.id));
}
