import { MarketSnapshot } from "@/types/market";
import { formatCurrency } from "@/lib/calculations";
import { toSlug } from "@/lib/city-resolver";
import { collectDataGaps } from "@/lib/agent/context";
import { runInvestmentScenario } from "@/lib/agent/calculator";
import { preRankMarkets } from "@/lib/agent/pre-rank";
import { InvestorProfile } from "@/lib/agent/types";
import { DiscoveryCriteria, DiscoveryProfileMode, ScoredCandidate } from "./types";

const PREFER_UNANALYZED_BOOST = 0.05;

function passesNumericCriteria(
  snapshot: MarketSnapshot,
  criteria: DiscoveryCriteria,
  profile: InvestorProfile,
  profileMode: DiscoveryProfileMode = "investor"
): { passes: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const maxPrice =
    profileMode === "query-only"
      ? criteria.maxPurchasePrice
      : (criteria.maxPurchasePrice ?? profile.maxPurchasePrice);
  if (maxPrice != null && snapshot.medianHomePrice != null) {
    if (snapshot.medianHomePrice > maxPrice) {
      return { passes: false, reasons };
    }
    reasons.push(
      `Median price ${formatCurrency(snapshot.medianHomePrice, true)} within budget`
    );
  }

  if (criteria.minOccupancy != null) {
    if (snapshot.strOccupancyRate == null || snapshot.strOccupancyRate < criteria.minOccupancy) {
      return { passes: false, reasons };
    }
    reasons.push(`Occupancy ${snapshot.strOccupancyRate.toFixed(0)}%`);
  }

  if (criteria.minRevpar != null) {
    if (snapshot.strRevpar == null || snapshot.strRevpar < criteria.minRevpar) {
      return { passes: false, reasons };
    }
    reasons.push(`RevPAR ${formatCurrency(snapshot.strRevpar, true)}`);
  }

  if (criteria.minOverallScore != null) {
    if (snapshot.overallScore == null || snapshot.overallScore < criteria.minOverallScore) {
      return { passes: false, reasons };
    }
    reasons.push(`Score ${snapshot.overallScore.toFixed(1)}`);
  }

  if (criteria.minPopulation != null) {
    if (snapshot.population == null || snapshot.population < criteria.minPopulation) {
      return { passes: false, reasons };
    }
    reasons.push(`Population ${snapshot.population.toLocaleString()}`);
  }

  if (criteria.maxAffordabilityIndex != null) {
    if (
      snapshot.housingAffordabilityIndex == null ||
      snapshot.housingAffordabilityIndex > criteria.maxAffordabilityIndex
    ) {
      return { passes: false, reasons };
    }
    reasons.push(`Affordability ${snapshot.housingAffordabilityIndex.toFixed(1)}×`);
  }

  if (criteria.ratingsAllow?.length) {
    const rating = snapshot.overallRating ?? "";
    if (!criteria.ratingsAllow.includes(rating as never)) {
      return { passes: false, reasons };
    }
    reasons.push(`Rating ${rating}`);
  }

  if (criteria.minCashOnCash != null) {
    const hasStr = Boolean(snapshot.strAdr && snapshot.strAdr > 0);
    const calc = runInvestmentScenario(snapshot, profile, hasStr ? "str" : "ltr");
    if (calc.cashOnCash < criteria.minCashOnCash) {
      return { passes: false, reasons };
    }
    reasons.push(`Cash-on-cash ${calc.cashOnCash.toFixed(1)}%`);
  }

  return { passes: true, reasons };
}

export function scoreCandidates(
  snapshots: MarketSnapshot[],
  criteria: DiscoveryCriteria,
  profile: InvestorProfile,
  cachedIds: Set<string>,
  profileMode: DiscoveryProfileMode = "investor"
): ScoredCandidate[] {
  const filtered = snapshots.filter((snapshot) => {
    const { passes } = passesNumericCriteria(snapshot, criteria, profile, profileMode);
    return passes;
  });

  const { eligible } = preRankMarkets(filtered, profile, {
    useInvestorProfile: profileMode === "investor",
  });

  return eligible.map((entry) => {
    const snapshot = filtered.find(
      (s) =>
        (s.id || `${s.identifiers.city}-${s.identifiers.stateAbbr}`) === entry.snapshotId
    )!;
    const { reasons } = passesNumericCriteria(snapshot, criteria, profile, profileMode);
    const wasCached = Boolean(snapshot.id && cachedIds.has(snapshot.id));
    const compositeScore =
      entry.compositeScore + (criteria.preferUnanalyzed && !wasCached ? PREFER_UNANALYZED_BOOST : 0);

    return {
      snapshotId: entry.snapshotId,
      city: entry.city,
      stateAbbr: entry.stateAbbr,
      slug: toSlug(entry.city, entry.stateAbbr),
      overallScore: entry.overallScore,
      rating: entry.rating,
      keyMetric: entry.keyMetric,
      compositeScore,
      matchReasons: reasons,
      dataGaps: collectDataGaps(snapshot),
      wasCached,
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);
}

export function buildNoResultsReason(
  criteria: DiscoveryCriteria,
  profile: InvestorProfile,
  considered: number,
  afterNumericFilter: number,
  profileMode: DiscoveryProfileMode = "investor"
): string {
  if (considered === 0) {
    return "No metros matched your geography or regulation filters. Try widening state selection or relaxing regulation constraints.";
  }
  if (afterNumericFilter === 0) {
    const hints: string[] = [];
    const budget =
      profileMode === "query-only"
        ? criteria.maxPurchasePrice
        : (criteria.maxPurchasePrice ?? profile.maxPurchasePrice);
    if (budget) hints.push(`raising budget above ${formatCurrency(budget, true)}`);
    if (criteria.minOccupancy) hints.push(`lowering minimum occupancy below ${criteria.minOccupancy}%`);
    if (criteria.minRevpar) hints.push(`lowering minimum RevPAR below ${formatCurrency(criteria.minRevpar, true)}`);
    if (hints.length) {
      return `No markets met all criteria after analyzing ${considered} metros. Try ${hints.join(" or ")}.`;
    }
    return `No markets met all criteria after analyzing ${considered} metros. Try relaxing one or more filters.`;
  }
  return "No markets matched your criteria.";
}
