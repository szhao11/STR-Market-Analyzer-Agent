export interface StrListingPin {
  lat: number;
  lng: number;
  adr: number;
  rating: number | null;
}

export interface MarketIdentifiers {
  city: string;
  state: string;
  stateAbbr: string;
  metroArea: string;
  fipsCode: string;
  cbsaCode: string;
  zipCodes: string[];
  latitude: number;
  longitude: number;
}

export interface MarketSnapshot {
  id?: string;
  marketId?: string;
  fetchedAt: string;
  identifiers: MarketIdentifiers;

  // Economic (BEA)
  gdpCurrent: number | null;
  gdp1yr: number | null;
  gdp5yr: number | null;
  gdp10yr: number | null;
  gdpGrowth: number | null;

  // Demographics (Census)
  population: number | null;
  medianIncome: number | null;
  medianHomePrice: number | null;
  rentalPopulationPct: number | null;
  netMigrationPct: number | null;

  // Employment (BLS)
  unemploymentRate: number | null;
  jobGrowthPct: number | null;

  // Housing Market
  annualRentalIncome: number | null;
  medianRent: number | null;
  housingAffordabilityIndex: number | null;
  priceToRentRatio: number | null;
  monthsOfInventory: number | null;
  daysOnMarket: number | null;
  medianListPrice: number | null;

  // STR Metrics (Apify)
  strAdr: number | null;
  strOccupancyRate: number | null;
  strRevpar: number | null;
  strAnnualRevenue: number | null;
  strMonthlyRevenue: number | null;
  strActiveListings: number | null;
  strSeasonalityScore: number | null;
  strOccupancyD30: number | null;
  strOccupancyD60: number | null;
  strOccupancyD90: number | null;
  strOccupancyD365: number | null;
  strAvgRating: number | null;
  strMedianReviews: number | null;
  strSuperhostPct: number | null;
  strMedianBedrooms: number | null;
  strTypicalMinNights: number | null;
  strBookedNights: number | null;
  strAvailableNights: number | null;
  strAdrP25: number | null;
  strAdrP75: number | null;
  strSegment2brAdr: number | null;
  strSegment2brOccupancy: number | null;
  strSegment2brRevpar: number | null;
  strSegment2brCount: number | null;
  strListingPins: StrListingPin[];
  strFetchError: string | null;
  /** True when STR data was fetched with the full listing target (not quick-preview). */
  strLoadComplete: boolean | null;

  // Qualitative / Other
  crimeRateViolent: number | null;
  crimeRateProperty: number | null;
  keyIndustries: string | null;
  majorEmployers: string | null;
  landlordFriendly: boolean | null;
  stateTaxRate: number | null;
  propertyTaxRate: number | null;
  strRegulationScore: StrRegulationLevel | null;
  strRegulationSignals: StrRegulationSignals | null;
  strRegulationNotes: string | null;
  strRegulationSources: StrRegulationSource[] | null;
  strRegulationVerifiedAt: string | null;
  strRegulationConfidence: StrRegulationConfidence | null;
  strRegulationJurisdiction: string | null;
  /** Derived: can a non-owner/investor operate STR legally? */
  strInvestorEligible: boolean | null;
  /** How regulation was resolved: city, county, cbsa, or state. */
  strRegulationResolution: "city" | "county" | "cbsa" | "state" | null;
  walkScore: number | null;
  transitScore: number | null;

  // Calculated
  capRateEstimate: number | null;
  cashOnCashEstimate: number | null;

  // Overall
  overallScore: number | null;
  overallRating: "Strong Buy" | "Buy" | "Hold / Watch" | "Avoid" | null;

  userNotes?: string;
}

export type SignalColor = "green" | "yellow" | "red" | "gray";

export interface MetricThreshold {
  label: string;
  value: number | string | boolean | null;
  signal: SignalColor;
  unit?: string;
  source?: string;
  tooltip?: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  weight: number;
  weightedScore: number;
  metrics: MetricThreshold[];
}

export type StrRegulationLevel = "friendly" | "moderate" | "restrictive" | "banned";

export type StrRegulationConfidence = "high" | "medium" | "low";

export type StrEnforcementLevel = "low" | "moderate" | "active";

export interface StrRegulationSignals {
  operatingAllowed: boolean;
  permitRequired: boolean;
  primaryResidenceOnly: boolean;
  nightCap: number | null;
  listingCap: number | null;
  enforcementLevel: StrEnforcementLevel | null;
}

export interface StrRegulationSource {
  label: string;
  url: string;
}

export interface MetroEntry {
  city: string;
  state: string;
  stateAbbr: string;
  county?: string;
  metroArea: string;
  fipsCode: string;
  cbsaCode: string;
  zipCodes: string[];
  latitude: number;
  longitude: number;
  blsAreaCode?: string;
}

export interface AnalyzeResponse {
  snapshot: MarketSnapshot;
  scores: CategoryScore[];
  cached: boolean;
  strError?: string | null;
  /** True when STR metrics are from a quick (1-listing) preview, not the full sample. */
  strPartial?: boolean;
  /** Regulation gates applied to overall rating (e.g. primary-residence-only). */
  decisionFlags?: string[];
}
