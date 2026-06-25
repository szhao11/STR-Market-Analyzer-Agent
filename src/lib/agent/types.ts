import { CategoryScore } from "@/types/market";
import { CalculatorResult } from "./calculator";

export interface InvestorProfile {
  maxPurchasePrice: number;
  downPaymentPct: number;
  interestRate: number;
  loanTermYears: number;
  expenseRatioPct: number;
  absenteeInvestor: boolean;
  minMonthlyCashFlow: number;
}

export const DEFAULT_INVESTOR_PROFILE: InvestorProfile = {
  maxPurchasePrice: 500_000,
  downPaymentPct: 25,
  interestRate: 7,
  loanTermYears: 30,
  expenseRatioPct: 40,
  absenteeInvestor: true,
  minMonthlyCashFlow: 500,
};

export interface BriefBullet {
  text: string;
  metricRefs: string[];
}

export interface MarketBrief {
  generatedAt: string;
  promptVersion: string;
  snapshotId: string;
  verdict: "Pursue" | "Watch" | "Pass";
  verdictAlignsWithRating: boolean;
  headline: string;
  regulationSummary: string;
  strengths: BriefBullet[];
  risks: BriefBullet[];
  strOutlook: string | null;
  ltrFallback: string | null;
  dataCaveats: string[];
}

export interface ScoreExplainSection {
  category: string;
  summary: string;
  highlights: string[];
}

export interface MarketBriefExplain extends MarketBrief {
  explain: ScoreExplainSection[];
}

export interface RankedMarket {
  rank: number;
  city: string;
  stateAbbr: string;
  snapshotId: string;
  score: number;
  rating: string;
  rationale: string;
  keyMetric: string;
  disqualified?: boolean;
  disqualifyReason?: string;
}

export interface CompareRankResult {
  generatedAt: string;
  promptVersion: string;
  profile: InvestorProfile;
  summary: string;
  ranked: RankedMarket[];
  disqualified: RankedMarket[];
}

export interface MarketContextFacts {
  city: string;
  stateAbbr: string;
  fetchedAt: string;
  overallScore: number | null;
  overallRating: string | null;
  decisionFlags: string[];
  categories: CategoryScore[];
  regulation: {
    level: string | null;
    investorEligible: boolean | null;
    summary: string | null;
    confidence: string | null;
    sources: { label: string; url: string }[];
  };
  str: {
    adr: number | null;
    occupancy: number | null;
    revpar: number | null;
    annualRevenue: number | null;
    seasonality: number | null;
    loadComplete: boolean;
    fetchError: string | null;
  };
  housing: {
    medianHomePrice: number | null;
    medianRent: number | null;
    affordabilityIndex: number | null;
    priceToRent: number | null;
  };
  returns: {
    capRate: number | null;
    cashOnCash: number | null;
  };
  calculatorScenario: CalculatorResult;
  dataGaps: string[];
}

export interface PreRankEntry {
  snapshotId: string;
  city: string;
  stateAbbr: string;
  overallScore: number;
  rating: string;
  compositeScore: number;
  disqualified: boolean;
  disqualifyReason?: string;
  keyMetric: string;
  facts: MarketContextFacts;
}
