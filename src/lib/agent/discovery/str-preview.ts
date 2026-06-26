import { MarketSnapshot } from "@/types/market";
import { resolveCity } from "@/lib/city-resolver";
import {
  fetchApifyStrData,
  isStrResultComplete,
  getApifyStrTargetMax,
} from "@/lib/api/apify-str";
import { calculateDerivedMetrics } from "@/lib/calculations";
import { scoreMarket } from "@/lib/thresholds";
import { enrichRegulationFields } from "@/lib/str-regulations";
import { saveSnapshot, getSnapshot } from "@/lib/storage";
import { ScoredCandidate } from "./types";

function needsStrPreview(snapshot: MarketSnapshot): boolean {
  if (!snapshot.strAdr) return true;
  if (snapshot.strLoadComplete !== true) return true;
  return false;
}

export async function fetchStrPreviewsForCandidates(
  candidates: ScoredCandidate[],
  maxFetches: number
): Promise<{ snapshots: MarketSnapshot[]; fetched: number }> {
  const token = process.env.APIFY_API_TOKEN?.trim();
  if (!token) {
    return {
      snapshots: candidates
        .map((c) => getSnapshot(c.city, c.stateAbbr))
        .filter((s): s is MarketSnapshot => s != null),
      fetched: 0,
    };
  }

  let fetched = 0;
  const updated = new Map<string, MarketSnapshot>();

  for (const candidate of candidates) {
    if (fetched >= maxFetches) break;

    const existing = getSnapshot(candidate.city, candidate.stateAbbr);
    if (!existing || !needsStrPreview(existing)) {
      if (existing) updated.set(candidate.snapshotId, existing);
      continue;
    }

    try {
      const strData = await fetchApifyStrData(candidate.city, candidate.stateAbbr, {
        phase: "quick",
      });
      fetched += 1;

      const metroEntry = resolveCity(candidate.city, candidate.stateAbbr);
      if (!metroEntry) {
        updated.set(candidate.snapshotId, existing);
        continue;
      }

      const targetMax = getApifyStrTargetMax();
      const rawSnapshot: Partial<MarketSnapshot> = {
        ...existing,
        ...strData,
        ...enrichRegulationFields(metroEntry),
        strLoadComplete:
          strData.strAdr != null && isStrResultComplete(strData, targetMax),
        fetchedAt: new Date().toISOString(),
      };

      const derived = calculateDerivedMetrics(rawSnapshot);
      const snapshot: MarketSnapshot = {
        ...rawSnapshot,
        ...derived,
        overallScore: null,
        overallRating: null,
      } as MarketSnapshot;

      const { score, rating } = scoreMarket(snapshot);
      snapshot.overallScore = score;
      snapshot.overallRating = rating;

      const saved = saveSnapshot(snapshot);
      updated.set(candidate.snapshotId, saved);
    } catch (err) {
      console.error(`STR preview failed for ${candidate.city}:`, err);
      updated.set(candidate.snapshotId, existing);
    }
  }

  for (const candidate of candidates) {
    if (!updated.has(candidate.snapshotId)) {
      const snap = getSnapshot(candidate.city, candidate.stateAbbr);
      if (snap) updated.set(candidate.snapshotId, snap);
    }
  }

  return {
    snapshots: candidates
      .map((c) => updated.get(c.snapshotId))
      .filter((s): s is MarketSnapshot => s != null),
    fetched,
  };
}
