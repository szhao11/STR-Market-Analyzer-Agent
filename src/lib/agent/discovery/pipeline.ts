import { MetroEntry, MarketSnapshot } from "@/types/market";
import { getSnapshot } from "@/lib/storage";
import { analyzeMarket } from "@/lib/analyze-market";
import { InvestorProfile } from "@/lib/agent/types";
import {
  getDiscoveryHydrateConcurrency,
  getDiscoveryMaxHydratePerRun,
  getDiscoverySnapshotMaxAgeDays,
  getDiscoveryStrFetchMax,
  getDiscoveryStrPreviewPool,
} from "./config";
import { filterMetros } from "./filter-metros";
import { hydrateMetros } from "./hydrate";
import { fetchStrPreviewsForCandidates } from "./str-preview";
import { buildNoResultsReason, scoreCandidates } from "./score-candidates";
import { DiscoveryCriteria, DiscoveryCandidate, DiscoveryProfileMode, ScoredCandidate } from "./types";

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

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

export interface PipelineResult {
  criteria: DiscoveryCriteria;
  ranked: DiscoveryCandidate[];
  scoredForSummary: ScoredCandidate[];
  considered: number;
  hydrated: number;
  strPreviewsFetched: number;
  noResultsReason?: string;
}

function toDiscoveryCandidates(
  scored: ScoredCandidate[],
  limit: number,
  rationales: Map<string, string>
): DiscoveryCandidate[] {
  return scored.slice(0, limit).map((entry, idx) => ({
    rank: idx + 1,
    city: entry.city,
    stateAbbr: entry.stateAbbr,
    snapshotId: entry.snapshotId,
    slug: entry.slug,
    overallScore: entry.overallScore,
    rating: entry.rating,
    keyMetric: entry.keyMetric,
    matchReasons: entry.matchReasons,
    rationale: rationales.get(entry.snapshotId) ?? `Ranked #${idx + 1} on composite investor score`,
    dataGaps: entry.dataGaps,
  }));
}

export async function runDiscoveryPipeline(
  criteria: DiscoveryCriteria,
  profile: InvestorProfile,
  profileMode: DiscoveryProfileMode = "investor"
): Promise<PipelineResult> {
  const candidateMetros = filterMetros(criteria, profile, profileMode);
  const considered = candidateMetros.length;
  const maxAgeDays = getDiscoverySnapshotMaxAgeDays();
  const maxHydrate = getDiscoveryMaxHydratePerRun();
  const concurrency = getDiscoveryHydrateConcurrency();
  const cachedIds = new Set<string>();

  const withSnapshot: MetroEntry[] = [];
  const withoutSnapshot: MetroEntry[] = [];
  const staleMetros: MetroEntry[] = [];

  for (const metro of candidateMetros) {
    const existing = getSnapshot(metro.city, metro.stateAbbr);
    if (!existing) {
      withoutSnapshot.push(metro);
    } else if (criteria.requireFresh && isSnapshotStale(existing.fetchedAt, maxAgeDays)) {
      staleMetros.push(metro);
    } else {
      withSnapshot.push(metro);
      if (existing.id) cachedIds.add(existing.id);
    }
  }

  let snapshots: MarketSnapshot[] = [];

  if (withSnapshot.length > 0) {
    const cached = await mapWithConcurrency(withSnapshot, concurrency, async (metro) => {
      const { snapshot } = await analyzeMarket(metro, { refresh: false, save: false });
      return snapshot;
    });
    snapshots.push(...cached);
  }

  let initialScored = scoreCandidates(snapshots, criteria, profile, cachedIds, profileMode);
  let hydrated = 0;

  const needsMore =
    initialScored.length < criteria.limit ||
    criteria.preferUnanalyzed ||
    criteria.requireFresh;

  if (needsMore) {
    const toFetch = [
      ...staleMetros,
      ...(criteria.preferUnanalyzed ? withoutSnapshot : []),
      ...(!criteria.preferUnanalyzed ? withoutSnapshot : []),
    ].slice(0, maxHydrate);

    if (toFetch.length > 0) {
      const { snapshots: fetched, hydrated: fetchCount, cachedIds: newCached } =
        await hydrateMetros(toFetch, criteria);
      hydrated = fetchCount;
      for (const id of newCached) cachedIds.add(id);

      const existingIds = new Set(
        snapshots.map((s) => s.id || `${s.identifiers.city}-${s.identifiers.stateAbbr}`)
      );
      for (const snap of fetched) {
        const id = snap.id || `${snap.identifiers.city}-${snap.identifiers.stateAbbr}`;
        if (!existingIds.has(id)) {
          snapshots.push(snap);
          existingIds.add(id);
        } else {
          snapshots = snapshots.map((s) => {
            const sid = s.id || `${s.identifiers.city}-${s.identifiers.stateAbbr}`;
            return sid === id ? snap : s;
          });
        }
      }
    }
  }

  let scored = scoreCandidates(snapshots, criteria, profile, cachedIds, profileMode);
  const afterNumericFilter = scored.length;

  if (scored.length === 0) {
    return {
      criteria,
      ranked: [],
      scoredForSummary: [],
      considered,
      hydrated,
      strPreviewsFetched: 0,
      noResultsReason: buildNoResultsReason(criteria, profile, considered, afterNumericFilter, profileMode),
    };
  }

  const previewPool = scored.slice(0, getDiscoveryStrPreviewPool());
  const { snapshots: strUpdated, fetched: strPreviewsFetched } =
    await fetchStrPreviewsForCandidates(previewPool, getDiscoveryStrFetchMax());

  if (strPreviewsFetched > 0) {
    const updatedMap = new Map(
      strUpdated.map((s) => [s.id || `${s.identifiers.city}-${s.identifiers.stateAbbr}`, s])
    );
    snapshots = snapshots.map((s) => {
      const id = s.id || `${s.identifiers.city}-${s.identifiers.stateAbbr}`;
      return updatedMap.get(id) ?? s;
    });
    scored = scoreCandidates(snapshots, criteria, profile, cachedIds, profileMode);
  }

  const rationales = new Map<string, string>();
  const ranked = toDiscoveryCandidates(scored, criteria.limit, rationales);

  return {
    criteria,
    ranked,
    scoredForSummary: scored.slice(0, criteria.limit),
    considered,
    hydrated,
    strPreviewsFetched,
    noResultsReason: ranked.length === 0
      ? buildNoResultsReason(criteria, profile, considered, afterNumericFilter, profileMode)
      : undefined,
  };
}
