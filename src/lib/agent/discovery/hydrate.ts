import { MetroEntry } from "@/types/market";
import { analyzeMarket } from "@/lib/analyze-market";
import { getSnapshot } from "@/lib/storage";
import { getDiscoveryHydrateConcurrency, getDiscoverySnapshotMaxAgeDays } from "./config";
import { DiscoveryCriteria } from "./types";

export interface HydrateResult {
  snapshots: import("@/types/market").MarketSnapshot[];
  hydrated: number;
  cachedIds: Set<string>;
}

function isSnapshotStale(fetchedAt: string, maxAgeDays: number): boolean {
  const ageMs = Date.now() - new Date(fetchedAt).getTime();
  return ageMs > maxAgeDays * 24 * 60 * 60 * 1000;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker(): Promise<void> {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function hydrateMetros(
  metros: MetroEntry[],
  criteria: DiscoveryCriteria
): Promise<HydrateResult> {
  const concurrency = getDiscoveryHydrateConcurrency();
  const maxAgeDays = getDiscoverySnapshotMaxAgeDays();
  const cachedIds = new Set<string>();
  let hydrated = 0;

  const snapshots = await mapWithConcurrency(metros, concurrency, async (metro) => {
    const existing = getSnapshot(metro.city, metro.stateAbbr);
    const needsRefresh =
      criteria.requireFresh &&
      existing &&
      isSnapshotStale(existing.fetchedAt, maxAgeDays);

    if (existing && !needsRefresh) {
      if (existing.id) cachedIds.add(existing.id);
      const { snapshot } = await analyzeMarket(metro, { refresh: false, save: false });
      return snapshot;
    }

    hydrated += 1;
    const { snapshot } = await analyzeMarket(metro, {
      refresh: !existing || Boolean(needsRefresh),
      save: true,
    });
    return snapshot;
  });

  return { snapshots, hydrated, cachedIds };
}
