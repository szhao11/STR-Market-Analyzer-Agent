"use client";

import { MarketSnapshot } from "@/types/market";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

export function StrSupplySection({ snapshot }: { snapshot: MarketSnapshot }) {
  const hasSupplyData =
    snapshot.strAdrP25 != null ||
    snapshot.strMedianBedrooms != null ||
    snapshot.strMedianReviews != null ||
    snapshot.strTypicalMinNights != null;

  if (!hasSupplyData) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Supply & Competition</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Market composition from {snapshot.strActiveListings ?? 0} sampled listings
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {snapshot.strAdrP25 != null && snapshot.strAdrP75 != null && (
            <StatItem
              label="ADR Range (P25–P75)"
              value={`${formatCurrency(snapshot.strAdrP25)} – ${formatCurrency(snapshot.strAdrP75)}`}
            />
          )}
          {snapshot.strMedianBedrooms != null && (
            <StatItem
              label="Median Bedrooms"
              value={formatNumber(snapshot.strMedianBedrooms, 1)}
            />
          )}
          {snapshot.strMedianReviews != null && (
            <StatItem
              label="Median Reviews"
              value={formatNumber(snapshot.strMedianReviews)}
            />
          )}
          {snapshot.strTypicalMinNights != null && (
            <StatItem
              label="Typical Min Nights"
              value={`${formatNumber(snapshot.strTypicalMinNights)} nights`}
            />
          )}
          {snapshot.strBookedNights != null && snapshot.strAvailableNights != null && (
            <StatItem
              label="Booked / Available Nights"
              value={`${formatNumber(snapshot.strBookedNights)} / ${formatNumber(snapshot.strAvailableNights)}`}
            />
          )}
          {snapshot.strSegment2brCount != null && snapshot.strSegment2brCount > 0 && (
            <>
              <StatItem
                label="2BR+ Entire Homes (sample)"
                value={formatNumber(snapshot.strSegment2brCount)}
              />
              {snapshot.strSegment2brOccupancy != null && (
                <StatItem
                  label="2BR+ Occupancy"
                  value={formatPercent(snapshot.strSegment2brOccupancy)}
                />
              )}
              {snapshot.strSegment2brRevpar != null && (
                <StatItem
                  label="2BR+ RevPAR"
                  value={formatCurrency(snapshot.strSegment2brRevpar)}
                />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
