import { MetroEntry } from "@/types/market";
import { getAllMetros } from "@/lib/city-resolver";
import { enrichRegulationFields } from "@/lib/str-regulations";
import { getDisqualifyReason } from "@/lib/agent/pre-rank";
import { InvestorProfile } from "@/lib/agent/types";
import { getSnapshot } from "@/lib/storage";
import { DiscoveryCriteria, DiscoveryProfileMode } from "./types";

function normalizeStateList(states?: string[] | null): string[] | undefined {
  if (!states?.length) return undefined;
  return states.map((s) => s.toUpperCase());
}

export function filterMetros(
  criteria: DiscoveryCriteria,
  profile: InvestorProfile,
  profileMode: DiscoveryProfileMode = "investor"
): MetroEntry[] {
  const statesInclude = normalizeStateList(criteria.statesInclude);
  const statesExclude = new Set(normalizeStateList(criteria.statesExclude) ?? []);
  const excludeIds = new Set(criteria.excludeSnapshotIds ?? []);
  const absentee =
    profileMode === "query-only"
      ? Boolean(criteria.absenteeInvestor)
      : (criteria.absenteeInvestor ?? profile.absenteeInvestor);
  const excludeRestrictive =
    profileMode === "query-only"
      ? Boolean(criteria.excludeRestrictive ?? criteria.absenteeInvestor)
      : (criteria.excludeRestrictive ?? absentee);

  return getAllMetros().filter((metro) => {
    if (statesInclude?.length && !statesInclude.includes(metro.stateAbbr)) {
      return false;
    }
    if (statesExclude.has(metro.stateAbbr)) {
      return false;
    }

    if (excludeIds.size > 0) {
      const existing = getSnapshot(metro.city, metro.stateAbbr);
      if (existing?.id && excludeIds.has(existing.id)) {
        return false;
      }
    }

    if (!excludeRestrictive) {
      return true;
    }

    const regulation = enrichRegulationFields(metro);
    const partialSnapshot = {
      identifiers: metro,
      medianHomePrice: null,
      ...regulation,
    };

    const reason = getDisqualifyReason(partialSnapshot as never, {
      ...profile,
      absenteeInvestor: absentee,
    });

    if (reason && absentee) {
      return false;
    }

    if (regulation.strRegulationScore === "banned") {
      return false;
    }

    return true;
  });
}
