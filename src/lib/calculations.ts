import { MarketSnapshot } from "@/types/market";

export function calculateDerivedMetrics(snapshot: Partial<MarketSnapshot>): Partial<MarketSnapshot> {
  const derived: Partial<MarketSnapshot> = {};

  // GDP Growth (annualized over 5 years)
  if (snapshot.gdpCurrent && snapshot.gdp5yr && snapshot.gdp5yr > 0) {
    derived.gdpGrowth = Math.round(
      (((snapshot.gdpCurrent - snapshot.gdp5yr) / 5) / snapshot.gdp5yr) * 100 * 100
    ) / 100;
  }

  // Housing Affordability Index = Median Home Price / Median Income
  if (snapshot.medianHomePrice && snapshot.medianIncome && snapshot.medianIncome > 0) {
    derived.housingAffordabilityIndex = Math.round(
      (snapshot.medianHomePrice / snapshot.medianIncome) * 100
    ) / 100;
  }

  // Annual Rental Income from median rent
  if (snapshot.medianRent) {
    derived.annualRentalIncome = snapshot.medianRent * 12;
  }

  // Price to Rent Ratio = Median Home Price / Annual Rental Income
  const annualRent = derived.annualRentalIncome || snapshot.annualRentalIncome;
  if (snapshot.medianHomePrice && annualRent && annualRent > 0) {
    derived.priceToRentRatio = Math.round(
      (snapshot.medianHomePrice / annualRent) * 100
    ) / 100;
  }

  // STR RevPAR = ADR × Occupancy
  if (snapshot.strAdr && snapshot.strOccupancyRate) {
    derived.strRevpar = Math.round(snapshot.strAdr * (snapshot.strOccupancyRate / 100) * 100) / 100;
  }

  // STR Annual Revenue from RevPAR
  if (derived.strRevpar || snapshot.strRevpar) {
    const revpar = derived.strRevpar || snapshot.strRevpar!;
    derived.strAnnualRevenue = Math.round(revpar * 365);
  }

  // Cap Rate & Cash-on-Cash — prefer STR revenue, fall back to long-term rent
  const annualRevenue =
    derived.strAnnualRevenue ||
    snapshot.strAnnualRevenue ||
    derived.annualRentalIncome ||
    snapshot.annualRentalIncome;

  if (annualRevenue && snapshot.medianHomePrice && snapshot.medianHomePrice > 0) {
    const usesStr = !!(derived.strAnnualRevenue || snapshot.strAnnualRevenue);
    const expenseRatio = usesStr ? 0.4 : 0.35;
    const estimatedExpenses = annualRevenue * expenseRatio;
    const noi = annualRevenue - estimatedExpenses;
    derived.capRateEstimate = Math.round((noi / snapshot.medianHomePrice) * 100 * 100) / 100;

    const downPayment = snapshot.medianHomePrice * 0.25;
    const closingCosts = snapshot.medianHomePrice * 0.03;
    const totalCashInvested = downPayment + closingCosts;
    const loanAmount = snapshot.medianHomePrice * 0.75;
    const monthlyMortgage = (loanAmount * (0.07 / 12)) / (1 - Math.pow(1 + 0.07 / 12, -360));
    const annualMortgage = monthlyMortgage * 12;
    const operatingExpenses = annualRevenue * expenseRatio;
    const annualCashFlow = annualRevenue - annualMortgage - operatingExpenses;

    if (totalCashInvested > 0) {
      derived.cashOnCashEstimate = Math.round((annualCashFlow / totalCashInvested) * 100 * 100) / 100;
    }
  }

  return derived;
}

/** Growth vs prior GDP point; true YoY when yearGap is 1, otherwise annualized (CAGR). */
export function computeGdpGrowthPct(
  current: number,
  prior: number,
  yearGap: number
): number | null {
  if (prior <= 0 || yearGap <= 0) return null;
  const pct =
    yearGap === 1
      ? ((current - prior) / prior) * 100
      : (Math.pow(current / prior, 1 / yearGap) - 1) * 100;
  return Math.round(pct * 10) / 10;
}

export function formatGdpGrowthLabel(
  current: number,
  prior: number,
  yearGap: number
): string | null {
  const pct = computeGdpGrowthPct(current, prior, yearGap);
  if (pct === null) return null;
  const sign = pct > 0 ? "+" : "";
  if (yearGap === 1) return `${sign}${pct}% YoY`;
  return `${sign}${pct}%/yr`;
}

export function formatCurrency(value: number | null, compact?: boolean): string {
  if (value === null || value === undefined) return "N/A";
  if (compact && Math.abs(value) >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (compact && Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (compact && Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null, decimals = 0): string {
  if (value === null || value === undefined) return "N/A";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || value === undefined) return "N/A";
  return `${value.toFixed(decimals)}%`;
}

export function formatMetricValue(value: number | string | boolean | null, unit?: string): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value;

  if (unit === "$") return formatCurrency(value, true);
  if (unit === "$/mo") return `${formatCurrency(value)}/mo`;
  if (unit === "%") return formatPercent(value);
  if (unit === "×") return `${value.toFixed(1)}×`;
  if (unit === "/100k") return formatNumber(value, 0);
  if (unit === "★") return `${value.toFixed(2)}★`;

  return formatNumber(value);
}
