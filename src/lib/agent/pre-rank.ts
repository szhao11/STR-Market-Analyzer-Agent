import { MarketSnapshot } from "@/types/market";
import { formatCurrency } from "@/lib/calculations";
import { buildMarketContext } from "./context";
import { runInvestmentScenario } from "./calculator";
import { DEFAULT_INVESTOR_PROFILE, InvestorProfile, PreRankEntry } from "./types";

function revparSignalScore(revpar: number | null): number {
  if (revpar == null) return 0;
  if (revpar > 100) return 1;
  if (revpar >= 60) return 0.6;
  return 0.2;
}

function seasonalitySignalScore(score: number | null): number {
  if (score == null) return 0;
  if (score > 70) return 1;
  if (score >= 50) return 0.6;
  return 0.2;
}

function affordabilitySignalScore(index: number | null): number {
  if (index == null) return 0;
  if (index < 4) return 1;
  if (index <= 5) return 0.6;
  return 0.2;
}

function normalizeScore(value: number | null, max = 10): number {
  if (value == null) return 0;
  return Math.min(value / max, 1);
}

function cashOnCashSignalScore(coc: number): number {
  if (coc > 12) return 1;
  if (coc >= 8) return 0.6;
  if (coc >= 0) return 0.3;
  return 0;
}

export function getDisqualifyReason(
  snapshot: MarketSnapshot,
  profile: InvestorProfile
): string | undefined {
  const signals = snapshot.strRegulationSignals;

  if (snapshot.medianHomePrice != null && snapshot.medianHomePrice > profile.maxPurchasePrice) {
    return `Median home price (${formatCurrency(snapshot.medianHomePrice, true)}) exceeds budget (${formatCurrency(profile.maxPurchasePrice, true)})`;
  }

  if (!profile.absenteeInvestor) return undefined;

  if (snapshot.strRegulationScore === "banned" || signals?.operatingAllowed === false) {
    return "STR operation banned or prohibited";
  }

  if (snapshot.strInvestorEligible === false) {
    return "Not investor-eligible — owner-occupancy rules apply";
  }

  if (signals?.primaryResidenceOnly) {
    return "Primary residence only — absentee STR not viable";
  }

  return undefined;
}

function buildKeyMetric(snapshot: MarketSnapshot): string {
  if (snapshot.strRevpar != null) {
    return `RevPAR ${formatCurrency(snapshot.strRevpar, true)}`;
  }
  if (snapshot.overallScore != null) {
    return `Score ${snapshot.overallScore.toFixed(1)}`;
  }
  return "Limited data";
}

export function preRankMarkets(
  snapshots: MarketSnapshot[],
  profile: InvestorProfile = DEFAULT_INVESTOR_PROFILE,
  options?: { useInvestorProfile?: boolean }
): { eligible: PreRankEntry[]; disqualified: PreRankEntry[] } {
  const useInvestorProfile = options?.useInvestorProfile ?? true;

  const entries: PreRankEntry[] = snapshots.map((snapshot) => {
    const facts = buildMarketContext(snapshot, profile);
    const hasStr = Boolean(snapshot.strAdr && snapshot.strAdr > 0);
    const calc = runInvestmentScenario(snapshot, profile, hasStr ? "str" : "ltr");
    const disqualifyReason = useInvestorProfile
      ? getDisqualifyReason(snapshot, profile)
      : undefined;
    const disqualified = Boolean(disqualifyReason);

    const compositeScore = disqualified
      ? 0
      : useInvestorProfile
        ? normalizeScore(snapshot.overallScore) * 0.25 +
          revparSignalScore(snapshot.strRevpar) * 0.25 +
          cashOnCashSignalScore(calc.cashOnCash) * 0.25 +
          seasonalitySignalScore(snapshot.strSeasonalityScore) * 0.1 +
          affordabilitySignalScore(snapshot.housingAffordabilityIndex) * 0.15
        : normalizeScore(snapshot.overallScore) * 0.35 +
          revparSignalScore(snapshot.strRevpar) * 0.35 +
          seasonalitySignalScore(snapshot.strSeasonalityScore) * 0.15 +
          affordabilitySignalScore(snapshot.housingAffordabilityIndex) * 0.15;

    return {
      snapshotId: snapshot.id || `${snapshot.identifiers.city}-${snapshot.identifiers.stateAbbr}`,
      city: snapshot.identifiers.city,
      stateAbbr: snapshot.identifiers.stateAbbr,
      overallScore: snapshot.overallScore ?? 0,
      rating: snapshot.overallRating ?? "N/A",
      compositeScore,
      disqualified,
      disqualifyReason,
      keyMetric: buildKeyMetric(snapshot),
      facts,
    };
  });

  const disqualified = entries
    .filter((e) => e.disqualified)
    .sort((a, b) => a.city.localeCompare(b.city));

  const eligible = entries
    .filter((e) => !e.disqualified)
    .sort((a, b) => b.compositeScore - a.compositeScore);

  return { eligible, disqualified };
}
