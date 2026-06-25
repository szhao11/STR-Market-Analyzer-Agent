import { SignalColor, MarketSnapshot, MetricThreshold, CategoryScore, StrRegulationLevel } from "@/types/market";
import { formatRegulationLevel } from "@/lib/str-regulations";

type ThresholdRule = {
  label: string;
  key:
    | keyof MarketSnapshot
    | "strPermitRequired"
    | "strPrimaryResidenceOnly"
    | "strEnforcementLevel";
  unit?: string;
  source?: string;
  tooltip?: string;
  evaluate: (value: number | string | boolean | null) => SignalColor;
};

function numSignal(
  value: number | null,
  greenTest: (v: number) => boolean,
  yellowTest: (v: number) => boolean
): SignalColor {
  if (value === null || value === undefined) return "gray";
  if (greenTest(value)) return "green";
  if (yellowTest(value)) return "yellow";
  return "red";
}

const economicRules: ThresholdRule[] = [
  {
    label: "GDP Growth",
    key: "gdpGrowth",
    unit: "%",
    source: "BEA",
    tooltip: "Annualized GDP growth rate (state-level proxy). Target: 1-3%",
    evaluate: (v) => numSignal(v as number, (n) => n >= 1 && n <= 3, (n) => (n >= 0.5 && n < 1) || (n > 3 && n <= 5)),
  },
  {
    label: "Unemployment Rate",
    key: "unemploymentRate",
    unit: "%",
    source: "BLS",
    tooltip: "Current unemployment rate. Target: <4%",
    evaluate: (v) => numSignal(v as number, (n) => n < 4, (n) => n >= 4 && n <= 6),
  },
  {
    label: "Job Growth",
    key: "jobGrowthPct",
    unit: "%",
    source: "BLS",
    tooltip: "Year-over-year job growth. Target: >2%",
    evaluate: (v) => numSignal(v as number, (n) => n > 2, (n) => n >= 1 && n <= 2),
  },
  {
    label: "Median Income",
    key: "medianIncome",
    unit: "$",
    source: "Census",
    tooltip: "Median household income. Target: >$55k",
    evaluate: (v) => numSignal(v as number, (n) => n > 55000, (n) => n >= 40000 && n <= 55000),
  },
];

const demographicRules: ThresholdRule[] = [
  {
    label: "Population",
    key: "population",
    source: "Census",
    tooltip: "Metro population. Target: >100k",
    evaluate: (v) => numSignal(v as number, (n) => n > 100000, (n) => n >= 50000 && n <= 100000),
  },
  {
    label: "Pop. / Migration Growth",
    key: "netMigrationPct",
    unit: "%",
    source: "Census",
    tooltip: "Annualized population growth over 5 years (ACS). Target: >1.5%",
    evaluate: (v) => numSignal(v as number, (n) => n > 1.5, (n) => n >= 0.5 && n <= 1.5),
  },
  {
    label: "Rental Population %",
    key: "rentalPopulationPct",
    unit: "%",
    source: "Census",
    tooltip: "Percentage of renter-occupied housing. Target: 30-40%",
    evaluate: (v) => numSignal(v as number, (n) => n >= 30 && n <= 40, (n) => (n >= 25 && n < 30) || (n > 40 && n <= 50)),
  },
];

const housingRules: ThresholdRule[] = [
  {
    label: "Median Home Price",
    key: "medianHomePrice",
    unit: "$",
    source: "Census",
    tooltip: "Median home value. Target: <$300k",
    evaluate: (v) => numSignal(v as number, (n) => n < 300000, (n) => n >= 300000 && n <= 500000),
  },
  {
    label: "Affordability Index",
    key: "housingAffordabilityIndex",
    unit: "×",
    source: "Calculated",
    tooltip: "Home price / median income. Target: <4×",
    evaluate: (v) => numSignal(v as number, (n) => n < 4, (n) => n >= 4 && n <= 5),
  },
  {
    label: "Price to Rent Ratio",
    key: "priceToRentRatio",
    unit: "",
    source: "Calculated",
    tooltip: "Home price / annual rent. <15 favors buying. Target: <15",
    evaluate: (v) => numSignal(v as number, (n) => n < 15, (n) => n >= 15 && n <= 20),
  },
  {
    label: "Median Rent",
    key: "medianRent",
    unit: "$/mo",
    source: "Census",
    tooltip: "Median gross rent. Target: >$1,200/mo",
    evaluate: (v) => numSignal(v as number, (n) => n > 1200, (n) => n >= 900 && n <= 1200),
  },
  {
    label: "Annual Rental Income",
    key: "annualRentalIncome",
    unit: "$",
    source: "Calculated",
    tooltip: "Gross annual rental income. Target: >$14,400",
    evaluate: (v) => numSignal(v as number, (n) => n > 14400, (n) => n >= 10800 && n <= 14400),
  },
];

const strRules: ThresholdRule[] = [
  {
    label: "Avg Daily Rate",
    key: "strAdr",
    unit: "$",
    source: "Apify/Airbnb",
    tooltip: "Median nightly rate per booked night. Target: >$150",
    evaluate: (v) => numSignal(v as number, (n) => n > 150, (n) => n >= 100 && n <= 150),
  },
  {
    label: "Occupancy Rate",
    key: "strOccupancyRate",
    unit: "%",
    source: "Apify/Airbnb",
    tooltip: "90-day forward occupancy. Target: >65%",
    evaluate: (v) => numSignal(v as number, (n) => n > 65, (n) => n >= 50 && n <= 65),
  },
  {
    label: "RevPAR",
    key: "strRevpar",
    unit: "$",
    source: "Apify/Airbnb",
    tooltip: "Revenue per available rental. Target: >$100",
    evaluate: (v) => numSignal(v as number, (n) => n > 100, (n) => n >= 60 && n <= 100),
  },
  {
    label: "Annual STR Revenue",
    key: "strAnnualRevenue",
    unit: "$",
    source: "Apify/Airbnb",
    tooltip: "Projected gross annual revenue. Target: >$40k",
    evaluate: (v) => numSignal(v as number, (n) => n > 40000, (n) => n >= 25000 && n <= 40000),
  },
  {
    label: "Seasonality Score",
    key: "strSeasonalityScore",
    unit: "",
    source: "Apify/Airbnb",
    tooltip: "Demand steadiness (0–100). Higher = less seasonal swing. Target: >70",
    evaluate: (v) => numSignal(v as number, (n) => n > 70, (n) => n >= 50 && n <= 70),
  },
  {
    label: "Avg Rating",
    key: "strAvgRating",
    unit: "★",
    source: "Apify/Airbnb",
    tooltip: "Median guest rating across sampled listings. Target: >4.7",
    evaluate: (v) => numSignal(v as number, (n) => n > 4.7, (n) => n >= 4.5 && n <= 4.7),
  },
  {
    label: "Superhost %",
    key: "strSuperhostPct",
    unit: "%",
    source: "Apify/Airbnb",
    tooltip: "Share of sampled listings with Superhost badge. Target: >30%",
    evaluate: (v) => numSignal(v as number, (n) => n > 30, (n) => n >= 15 && n <= 30),
  },
  {
    label: "Listings Sampled",
    key: "strActiveListings",
    source: "Apify/Airbnb",
    tooltip: "Number of listings analyzed in this market sample",
    evaluate: (v) => numSignal(v as number, (n) => n >= 15, (n) => n >= 8 && n < 15),
  },
  {
    label: "2BR+ Entire Home ADR",
    key: "strSegment2brAdr",
    unit: "$",
    source: "Apify/Airbnb",
    tooltip: "Median ADR for 2+ bedroom entire-home listings. Target: >$175",
    evaluate: (v) => numSignal(v as number, (n) => n > 175, (n) => n >= 120 && n <= 175),
  },
];

function regulationLevelSignal(level: StrRegulationLevel | null): SignalColor {
  if (!level) return "gray";
  if (level === "friendly") return "green";
  if (level === "moderate") return "yellow";
  return "red";
}

function boolSignal(
  value: boolean | null,
  greenWhenTrue: boolean
): SignalColor {
  if (value === null || value === undefined) return "gray";
  if (greenWhenTrue) return value ? "green" : "red";
  return value ? "red" : "green";
}

function enforcementSignal(value: string | null): SignalColor {
  if (!value) return "gray";
  if (value === "low") return "green";
  if (value === "moderate") return "yellow";
  return "red";
}

const regulationRules: ThresholdRule[] = [
  {
    label: "STR Legality",
    key: "strRegulationScore",
    source: "Curated",
    tooltip: "Overall regulatory environment. Target: Friendly",
    evaluate: (v) => regulationLevelSignal(v as StrRegulationLevel | null),
  },
  {
    label: "Investor Eligible",
    key: "strInvestorEligible",
    source: "Curated",
    tooltip: "Can a non-owner/investor operate STR legally? Target: Yes",
    evaluate: (v) => boolSignal(v as boolean | null, true),
  },
  {
    label: "Permit Required",
    key: "strPermitRequired",
    source: "Curated",
    tooltip: "Permit or license required to operate. None is ideal.",
    evaluate: (v) => boolSignal(v as boolean | null, false),
  },
  {
    label: "Primary Res. Only",
    key: "strPrimaryResidenceOnly",
    source: "Curated",
    tooltip: "Primary-residence-only rules block absentee investors. Target: No",
    evaluate: (v) => boolSignal(v as boolean | null, false),
  },
  {
    label: "Enforcement",
    key: "strEnforcementLevel",
    source: "Curated",
    tooltip: "Local enforcement intensity. Target: Low",
    evaluate: (v) => enforcementSignal(v as string | null),
  },
];

const investmentRules: ThresholdRule[] = [
  {
    label: "Cap Rate",
    key: "capRateEstimate",
    unit: "%",
    source: "Calculated",
    tooltip: "NOI / Purchase Price. Target: >8%",
    evaluate: (v) => numSignal(v as number, (n) => n > 8, (n) => n >= 5 && n <= 8),
  },
  {
    label: "Cash-on-Cash",
    key: "cashOnCashEstimate",
    unit: "%",
    source: "Calculated",
    tooltip: "Annual cash flow / cash invested. Target: >12%",
    evaluate: (v) => numSignal(v as number, (n) => n > 12, (n) => n >= 8 && n <= 12),
  },
];

const safetyRules: ThresholdRule[] = [
  {
    label: "Violent Crime",
    key: "crimeRateViolent",
    unit: "/100k",
    source: "FBI",
    tooltip: "Violent crimes per 100k population. Target: <200",
    evaluate: (v) => numSignal(v as number, (n) => n < 200, (n) => n >= 200 && n <= 400),
  },
  {
    label: "Property Crime",
    key: "crimeRateProperty",
    unit: "/100k",
    source: "FBI",
    tooltip: "Property crimes per 100k population. Target: <2,000",
    evaluate: (v) => numSignal(v as number, (n) => n < 2000, (n) => n >= 2000 && n <= 3500),
  },
  {
    label: "Walk Score",
    key: "walkScore",
    unit: "",
    source: "Walk Score",
    tooltip: "Walkability score (0-100). Target: >70",
    evaluate: (v) => numSignal(v as number, (n) => n > 70, (n) => n >= 50 && n <= 70),
  },
  {
    label: "State Tax Rate",
    key: "stateTaxRate",
    unit: "%",
    source: "Manual",
    tooltip: "State income tax rate. Target: <5%",
    evaluate: (v) => numSignal(v as number, (n) => n < 5, (n) => n >= 5 && n <= 7),
  },
  {
    label: "Property Tax Rate",
    key: "propertyTaxRate",
    unit: "%",
    source: "Manual",
    tooltip: "Effective property tax rate. Target: <1%",
    evaluate: (v) => numSignal(v as number, (n) => n < 1, (n) => n >= 1 && n <= 1.5),
  },
];

const categoryConfig = [
  { name: "Economic Health", rules: economicRules, weight: 0.10 },
  { name: "Demographics", rules: demographicRules, weight: 0.10 },
  { name: "Housing Fundamentals", rules: housingRules, weight: 0.15 },
  { name: "STR Performance", rules: strRules, weight: 0.30 },
  { name: "STR Regulation", rules: regulationRules, weight: 0.10 },
  { name: "Investment Returns", rules: investmentRules, weight: 0.25 },
  { name: "Safety & Quality", rules: safetyRules, weight: 0.05 },
];

export function evaluateMetric(rule: ThresholdRule, snapshot: MarketSnapshot): MetricThreshold {
  let value: number | string | boolean | null;

  if (rule.key === "strPermitRequired") {
    value = snapshot.strRegulationSignals?.permitRequired ?? null;
  } else if (rule.key === "strPrimaryResidenceOnly") {
    value = snapshot.strRegulationSignals?.primaryResidenceOnly ?? null;
  } else if (rule.key === "strEnforcementLevel") {
    value = snapshot.strRegulationSignals?.enforcementLevel ?? null;
  } else {
    value = snapshot[rule.key as keyof MarketSnapshot] as number | string | boolean | null;
  }

  const displayValue =
    rule.key === "strRegulationScore" && typeof value === "string"
      ? formatRegulationLevel(value as StrRegulationLevel)
      : value;

  return {
    label: rule.label,
    value: displayValue,
    signal: rule.evaluate(value),
    unit: rule.unit,
    source: rule.source,
    tooltip: rule.tooltip,
  };
}

function signalToScore(signal: SignalColor): number {
  switch (signal) {
    case "green": return 3;
    case "yellow": return 2;
    case "red": return 1;
    case "gray": return 0;
  }
}

export function evaluateAllCategories(snapshot: MarketSnapshot): CategoryScore[] {
  return categoryConfig.map(({ name, rules, weight }) => {
    const metrics = rules.map((rule) => evaluateMetric(rule, snapshot));
    const scored = metrics.filter((m) => m.signal !== "gray");
    const score = scored.length > 0
      ? scored.reduce((sum, m) => sum + signalToScore(m.signal), 0) / scored.length
      : 0;
    return {
      category: name,
      score: Math.round(score * 100) / 100,
      weight,
      weightedScore: Math.round(score * weight * 100) / 100,
      metrics,
    };
  });
}

type OverallRating = MarketSnapshot["overallRating"];

const RATING_RANK: Record<NonNullable<OverallRating>, number> = {
  "Strong Buy": 4,
  Buy: 3,
  "Hold / Watch": 2,
  Avoid: 1,
};

const RANK_TO_RATING: Record<number, NonNullable<OverallRating>> = {
  4: "Strong Buy",
  3: "Buy",
  2: "Hold / Watch",
  1: "Avoid",
};

function capRating(
  rating: OverallRating,
  maxRating: NonNullable<OverallRating>
): OverallRating {
  if (!rating) return rating;
  const capped = Math.min(RATING_RANK[rating], RATING_RANK[maxRating]);
  return RANK_TO_RATING[capped];
}

export function getDecisionFlags(snapshot: MarketSnapshot): string[] {
  const flags: string[] = [];
  const signals = snapshot.strRegulationSignals;

  if (!snapshot.strRegulationScore) {
    flags.push("Regulation data unavailable — verify locally before investing");
    return flags;
  }

  if (snapshot.strRegulationScore === "banned" || signals?.operatingAllowed === false) {
    flags.push("STR operation banned or prohibited in this jurisdiction");
  }

  if (snapshot.strRegulationScore === "restrictive") {
    flags.push("Restrictive STR regulations — rating capped at Hold / Watch");
  }

  if (snapshot.strInvestorEligible === false) {
    flags.push("Not investor-eligible — primary residence or owner-occupancy rules apply");
  }

  if (signals?.primaryResidenceOnly) {
    flags.push("Primary residence only — absentee investor STR not viable");
  }

  if (signals?.nightCap != null && signals.nightCap < 90) {
    flags.push(`Night cap (${signals.nightCap} nights/yr) limits investor revenue potential`);
  }

  if (snapshot.strRegulationConfidence === "low") {
    flags.push("Low confidence regulation data — confirm with local ordinance");
  }

  if (snapshot.strRegulationResolution === "state") {
    flags.push("Using state-level default — city ordinance may differ");
  }

  return flags;
}

export function computeOverallScore(
  categories: CategoryScore[],
  snapshot?: MarketSnapshot
): { score: number; rating: OverallRating; flags: string[] } {
  const totalWeight = categories.reduce((s, c) => s + (c.score > 0 ? c.weight : 0), 0);
  if (totalWeight === 0) return { score: 0, rating: null, flags: [] };

  const weightedSum = categories.reduce((s, c) => s + c.weightedScore, 0);
  const score = Math.round((weightedSum / totalWeight) * 100) / 100;

  let rating: OverallRating;
  if (score >= 2.5) rating = "Strong Buy";
  else if (score >= 2.0) rating = "Buy";
  else if (score >= 1.5) rating = "Hold / Watch";
  else rating = "Avoid";

  const flags = snapshot ? getDecisionFlags(snapshot) : [];

  if (snapshot) {
    const signals = snapshot.strRegulationSignals;

    if (
      snapshot.strRegulationScore === "banned" ||
      signals?.operatingAllowed === false
    ) {
      rating = "Avoid";
    } else if (
      snapshot.strInvestorEligible === false ||
      signals?.primaryResidenceOnly ||
      snapshot.strRegulationScore === "restrictive"
    ) {
      rating = capRating(rating, "Hold / Watch");
    }
  }

  return { score, rating, flags };
}

export function scoreMarket(snapshot: MarketSnapshot): {
  scores: CategoryScore[];
  score: number;
  rating: OverallRating;
  flags: string[];
} {
  const scores = evaluateAllCategories(snapshot);
  const { score, rating, flags } = computeOverallScore(scores, snapshot);
  return { scores, score, rating, flags };
}

export function getSignalColor(signal: SignalColor): string {
  switch (signal) {
    case "green": return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "yellow": return "text-amber-600 bg-amber-50 border-amber-200";
    case "red": return "text-rose-600 bg-rose-50 border-rose-200";
    case "gray": return "text-gray-400 bg-gray-50 border-gray-200";
  }
}

export function getRatingColor(rating: MarketSnapshot["overallRating"]): string {
  switch (rating) {
    case "Strong Buy": return "text-emerald-700 bg-emerald-100 border-emerald-300";
    case "Buy": return "text-blue-700 bg-blue-100 border-blue-300";
    case "Hold / Watch": return "text-amber-700 bg-amber-100 border-amber-300";
    case "Avoid": return "text-rose-700 bg-rose-100 border-rose-300";
    default: return "text-gray-500 bg-gray-100 border-gray-300";
  }
}

export { economicRules, demographicRules, housingRules, strRules, regulationRules, investmentRules, safetyRules };
