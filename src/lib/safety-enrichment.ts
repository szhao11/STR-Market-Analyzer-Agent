import { getStateCrimeRates } from "@/lib/state-crime-rates";
import { getStatePropertyTaxRate } from "@/lib/state-property-tax-rates";
import { getStateIncomeTaxRate } from "@/lib/state-tax-rates";
import { MarketSnapshot } from "@/types/market";

/** Backfill Safety & Quality fields from static state datasets when API data is missing. */
export function enrichSafetyFields(
  snapshot: Partial<MarketSnapshot>,
  stateAbbr: string
): Partial<MarketSnapshot> {
  const enriched = { ...snapshot };

  if (enriched.crimeRateViolent == null || enriched.crimeRateProperty == null) {
    const fallback = getStateCrimeRates(stateAbbr);
    if (fallback) {
      if (enriched.crimeRateViolent == null) {
        enriched.crimeRateViolent = fallback.violent;
      }
      if (enriched.crimeRateProperty == null) {
        enriched.crimeRateProperty = fallback.property;
      }
    }
  }

  if (enriched.propertyTaxRate == null) {
    enriched.propertyTaxRate = getStatePropertyTaxRate(stateAbbr);
  }

  if (enriched.stateTaxRate == null) {
    enriched.stateTaxRate = getStateIncomeTaxRate(stateAbbr);
  }

  return enriched;
}
