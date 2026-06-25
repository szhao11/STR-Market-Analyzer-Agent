import { MarketSnapshot } from "@/types/market";
import { getDecisionFlags, scoreMarket } from "@/lib/thresholds";
import { formatRegulationLevel } from "@/lib/str-regulations";
import { runInvestmentScenario } from "./calculator";
import { DEFAULT_INVESTOR_PROFILE, InvestorProfile, MarketContextFacts } from "./types";

export function collectDataGaps(snapshot: MarketSnapshot): string[] {
  const gaps: string[] = [];

  if (!snapshot.strAdr) {
    gaps.push("No STR data — Apify fetch not completed or failed");
  } else if (snapshot.strLoadComplete !== true) {
    gaps.push("STR preview only — full listing sample not loaded");
  }

  if (snapshot.strFetchError) {
    gaps.push(`STR fetch error: ${snapshot.strFetchError}`);
  }

  if (!snapshot.strRegulationScore) {
    gaps.push("Regulation data unavailable — verify locally");
  } else if (snapshot.strRegulationConfidence === "low") {
    gaps.push("Low-confidence regulation data");
  }

  if (!snapshot.medianHomePrice) gaps.push("Median home price missing");
  if (!snapshot.medianRent) gaps.push("Median rent missing");

  return gaps;
}

export function buildMarketContext(
  snapshot: MarketSnapshot,
  profile: InvestorProfile = DEFAULT_INVESTOR_PROFILE
): MarketContextFacts {
  const { scores } = scoreMarket(snapshot);
  const decisionFlags = getDecisionFlags(snapshot);
  const hasStr = Boolean(snapshot.strAdr && snapshot.strAdr > 0);
  const calculatorScenario = runInvestmentScenario(
    snapshot,
    profile,
    hasStr ? "str" : "ltr"
  );

  return {
    city: snapshot.identifiers.city,
    stateAbbr: snapshot.identifiers.stateAbbr,
    fetchedAt: snapshot.fetchedAt,
    overallScore: snapshot.overallScore,
    overallRating: snapshot.overallRating,
    decisionFlags,
    categories: scores,
    regulation: {
      level: snapshot.strRegulationScore
        ? formatRegulationLevel(snapshot.strRegulationScore)
        : null,
      investorEligible: snapshot.strInvestorEligible,
      summary: snapshot.strRegulationNotes,
      confidence: snapshot.strRegulationConfidence,
      sources: snapshot.strRegulationSources ?? [],
    },
    str: {
      adr: snapshot.strAdr,
      occupancy: snapshot.strOccupancyRate,
      revpar: snapshot.strRevpar,
      annualRevenue: snapshot.strAnnualRevenue,
      seasonality: snapshot.strSeasonalityScore,
      loadComplete: snapshot.strLoadComplete === true,
      fetchError: snapshot.strFetchError,
    },
    housing: {
      medianHomePrice: snapshot.medianHomePrice,
      medianRent: snapshot.medianRent,
      affordabilityIndex: snapshot.housingAffordabilityIndex,
      priceToRent: snapshot.priceToRentRatio,
    },
    returns: {
      capRate: snapshot.capRateEstimate,
      cashOnCash: snapshot.cashOnCashEstimate,
    },
    calculatorScenario,
    dataGaps: collectDataGaps(snapshot),
  };
}
