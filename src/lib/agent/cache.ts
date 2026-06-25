import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PROMPT_VERSION } from "./prompts";
import { InvestorProfile, MarketBriefExplain } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const CACHE_FILE = path.join(DATA_DIR, "agent-cache.json");
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  createdAt: string;
  snapshotFetchedAt?: string;
}

type AgentCacheStore = Record<string, CacheEntry<unknown>>;

function loadStore(): AgentCacheStore {
  try {
    if (!fs.existsSync(CACHE_FILE)) return {};
    const raw = fs.readFileSync(CACHE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: AgentCacheStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function isStale(entry: CacheEntry<unknown>, snapshotFetchedAt?: string): boolean {
  const age = Date.now() - new Date(entry.createdAt).getTime();
  if (age > TTL_MS) return true;
  if (snapshotFetchedAt && entry.snapshotFetchedAt) {
    return new Date(snapshotFetchedAt).getTime() > new Date(entry.snapshotFetchedAt).getTime();
  }
  return false;
}

export function briefCacheKey(
  snapshotId: string,
  mode: "brief" | "explain" = "brief"
): string {
  return `brief:${snapshotId}:${PROMPT_VERSION}:${mode}`;
}

/** Reject legacy explain cache entries saved before explain array was required. */
export function hasExplainSections(value: unknown): value is MarketBriefExplain {
  if (!value || typeof value !== "object") return false;
  const explain = (value as MarketBriefExplain).explain;
  return Array.isArray(explain) && explain.length > 0;
}

export function rankCacheKey(snapshotIds: string[], profile: InvestorProfile): string {
  const sortedIds = [...snapshotIds].sort().join(",");
  const profileHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(profile))
    .digest("hex")
    .slice(0, 16);
  const idsHash = crypto.createHash("sha256").update(sortedIds).digest("hex").slice(0, 16);
  return `rank:${idsHash}:${profileHash}:${PROMPT_VERSION}`;
}

export function getCached<T>(
  key: string,
  snapshotFetchedAt?: string
): T | null {
  const store = loadStore();
  const entry = store[key] as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (isStale(entry, snapshotFetchedAt)) {
    delete store[key];
    saveStore(store);
    return null;
  }
  return entry.value;
}

export function setCached<T>(
  key: string,
  value: T,
  snapshotFetchedAt?: string
): void {
  const store = loadStore();
  store[key] = {
    value,
    createdAt: new Date().toISOString(),
    snapshotFetchedAt,
  };
  saveStore(store);
}

export function clearCacheKey(key: string): void {
  const store = loadStore();
  delete store[key];
  saveStore(store);
}

/** Test helper — wipe agent cache */
export function clearAgentCache(): void {
  if (fs.existsSync(CACHE_FILE)) {
    fs.unlinkSync(CACHE_FILE);
  }
}
