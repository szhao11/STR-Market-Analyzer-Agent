import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const DISMISSED_RECENT_FILE = path.join(DATA_DIR, "dismissed-recent.json");

function loadDismissedIds(): Set<string> {
  try {
    if (!fs.existsSync(DISMISSED_RECENT_FILE)) return new Set();
    const raw = fs.readFileSync(DISMISSED_RECENT_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch (error) {
    console.error("Failed to load dismissed recent markets:", error);
    return new Set();
  }
}

function persistDismissedIds(ids: Set<string>): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    DISMISSED_RECENT_FILE,
    JSON.stringify([...ids], null, 2),
    "utf8"
  );
}

export function isDismissedFromRecent(id: string): boolean {
  return loadDismissedIds().has(id);
}

export function dismissFromRecent(id: string): boolean {
  const ids = loadDismissedIds();
  if (ids.has(id)) return true;
  ids.add(id);
  persistDismissedIds(ids);
  return true;
}

export function restoreToRecent(id: string): void {
  const ids = loadDismissedIds();
  if (!ids.has(id)) return;
  ids.delete(id);
  persistDismissedIds(ids);
}

export function filterRecentSnapshotIds<T extends { id?: string }>(snapshots: T[]): T[] {
  const dismissed = loadDismissedIds();
  return snapshots.filter((s) => s.id && !dismissed.has(s.id));
}

/** Test helper — reset dismissed recent list */
export function clearDismissedRecent(): void {
  if (fs.existsSync(DISMISSED_RECENT_FILE)) {
    fs.unlinkSync(DISMISSED_RECENT_FILE);
  }
}
