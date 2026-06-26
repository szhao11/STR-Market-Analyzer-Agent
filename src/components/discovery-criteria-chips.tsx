"use client";

import { DiscoveryCriteria } from "@/lib/agent/discovery/types";
import { formatCurrency } from "@/lib/calculations";

export function DiscoveryCriteriaChips({ criteria }: { criteria: DiscoveryCriteria }) {
  const chips: string[] = [criteria.intentSummary];

  if (criteria.statesInclude?.length) {
    chips.push(`States: ${criteria.statesInclude.join(", ")}`);
  }
  if (criteria.statesExclude?.length) {
    chips.push(`Exclude: ${criteria.statesExclude.join(", ")}`);
  }
  if (criteria.maxPurchasePrice) {
    chips.push(`Budget ≤ ${formatCurrency(criteria.maxPurchasePrice, true)}`);
  }
  if (criteria.minOccupancy != null) {
    chips.push(`Occupancy ≥ ${criteria.minOccupancy}%`);
  }
  if (criteria.minRevpar != null) {
    chips.push(`RevPAR ≥ ${formatCurrency(criteria.minRevpar, true)}`);
  }
  if (criteria.minOverallScore != null) {
    chips.push(`Score ≥ ${criteria.minOverallScore}`);
  }
  if (criteria.minCashOnCash != null) {
    chips.push(`CoC ≥ ${criteria.minCashOnCash}%`);
  }
  if (criteria.excludeRestrictive) {
    chips.push("Investor-eligible only");
  }
  chips.push(`Top ${criteria.limit}`);

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}
