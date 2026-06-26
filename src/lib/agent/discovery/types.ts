import { InvestorProfile } from "@/lib/agent/types";

export type AllowedRating = "Strong Buy" | "Buy" | "Hold / Watch";

export interface DiscoveryCriteria {
  intentSummary: string;
  limit: number;
  statesInclude?: string[] | null;
  statesExclude?: string[] | null;
  absenteeInvestor?: boolean | null;
  excludeRestrictive?: boolean | null;
  excludeSnapshotIds?: string[] | null;
  maxPurchasePrice?: number | null;
  minOccupancy?: number | null;
  minRevpar?: number | null;
  minOverallScore?: number | null;
  minCashOnCash?: number | null;
  minPopulation?: number | null;
  maxAffordabilityIndex?: number | null;
  ratingsAllow?: AllowedRating[] | null;
  preferUnanalyzed?: boolean | null;
  requireFresh?: boolean | null;
}

export interface DiscoveryCandidate {
  rank: number;
  city: string;
  stateAbbr: string;
  snapshotId: string;
  slug: string;
  overallScore: number;
  rating: string;
  keyMetric: string;
  matchReasons: string[];
  rationale: string;
  disqualified?: boolean;
  disqualifyReason?: string;
  dataGaps: string[];
}

export type DiscoveryProfileMode = "investor" | "query-only";

export interface DiscoveryResult {
  generatedAt: string;
  promptVersion: string;
  query: string;
  criteria: DiscoveryCriteria;
  profile: InvestorProfile;
  profileApplied: boolean;
  summary: string;
  ranked: DiscoveryCandidate[];
  considered: number;
  hydrated: number;
  strPreviewsFetched: number;
  noResultsReason?: string;
}

export interface ScoredCandidate {
  snapshotId: string;
  city: string;
  stateAbbr: string;
  slug: string;
  overallScore: number;
  rating: string;
  keyMetric: string;
  compositeScore: number;
  matchReasons: string[];
  dataGaps: string[];
  wasCached: boolean;
}
