import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  dismissFromRecent,
  restoreToRecent,
  filterRecentSnapshotIds,
  clearDismissedRecent,
} from "@/lib/recent-markets";
import { makeSnapshot } from "./fixtures";

const DATA_DIR = path.join(process.cwd(), ".data");
const DISMISSED_RECENT_FILE = path.join(DATA_DIR, "dismissed-recent.json");

describe("recent markets", () => {
  beforeEach(() => {
    clearDismissedRecent();
  });

  afterEach(() => {
    clearDismissedRecent();
  });

  it("filters dismissed snapshot ids from recent list", () => {
    const snapshots = [
      { ...makeSnapshot({ id: "a" }), id: "a" },
      { ...makeSnapshot({ id: "b" }), id: "b" },
      { ...makeSnapshot({ id: "c" }), id: "c" },
    ];

    dismissFromRecent("b");

    const recent = filterRecentSnapshotIds(snapshots);
    expect(recent.map((s) => s.id)).toEqual(["a", "c"]);
  });

  it("persists dismissed ids across reloads", () => {
    dismissFromRecent("snap-1");

    expect(fs.existsSync(DISMISSED_RECENT_FILE)).toBe(true);
    expect(JSON.parse(fs.readFileSync(DISMISSED_RECENT_FILE, "utf8"))).toEqual([
      "snap-1",
    ]);
  });

  it("restores a dismissed market to recent", () => {
    dismissFromRecent("snap-1");
    restoreToRecent("snap-1");

    const snapshots = [{ ...makeSnapshot({ id: "snap-1" }), id: "snap-1" }];
    expect(filterRecentSnapshotIds(snapshots)).toHaveLength(1);
  });

  it("excludes snapshots without ids from recent list", () => {
    const snapshots = [makeSnapshot(), { ...makeSnapshot({ id: "snap-1" }), id: "snap-1" }];
    expect(filterRecentSnapshotIds(snapshots)).toHaveLength(1);
    expect(filterRecentSnapshotIds(snapshots)[0].id).toBe("snap-1");
  });
});
