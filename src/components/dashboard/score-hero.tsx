"use client";

import { MarketSnapshot, CategoryScore } from "@/types/market";
import { getRatingColor } from "@/lib/thresholds";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { MapPin, Users, Building2, AlertTriangle } from "lucide-react";

export function ScoreHero({
  snapshot,
  scores,
  decisionFlags = [],
}: {
  snapshot: MarketSnapshot;
  scores: CategoryScore[];
  decisionFlags?: string[];
}) {
  const ratingColor = getRatingColor(snapshot.overallRating);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{snapshot.identifiers.metroArea}</span>
          </div>
          <h1 className="text-[2rem] font-semibold leading-tight tracking-tight">
            {snapshot.identifiers.city}, {snapshot.identifiers.stateAbbr}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {snapshot.population && (
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>Pop. {formatNumber(snapshot.population)}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span>{snapshot.identifiers.state}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {snapshot.overallScore !== null && (
            <div className="text-right">
              <div className="text-3xl font-semibold tabular-nums">
                {snapshot.overallScore.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">out of 3.0</div>
            </div>
          )}
          {snapshot.overallRating && (
            <Badge className={cn("px-2.5 py-1 text-sm", ratingColor)}>
              {snapshot.overallRating}
            </Badge>
          )}
        </div>
      </div>

      {decisionFlags.length > 0 && (
        <div className="rounded-md border border-amber-200/80 bg-amber-50 px-4 py-3 space-y-1">
          {decisionFlags.map((flag) => (
            <div key={flag} className="flex items-start gap-2 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-md border border-border">
        <div className="grid grid-cols-2 divide-x divide-y divide-border md:grid-cols-4 lg:grid-cols-7">
          {scores.map((cat) => (
            <div key={cat.category} className="bg-background px-3 py-2.5">
              <div className="mb-1 truncate text-[11px] text-muted-foreground">
                {cat.category}
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-semibold tabular-nums">
                  {cat.score > 0 ? cat.score.toFixed(1) : "—"}
                </span>
                <span className="text-xs text-muted-foreground">/3</span>
              </div>
              <div className="mt-1.5 h-1 w-full rounded-sm bg-muted">
                <div
                  className={cn(
                    "h-1 rounded-sm",
                    cat.score >= 2.5
                      ? "bg-emerald-500"
                      : cat.score >= 2
                        ? "bg-primary"
                        : cat.score >= 1.5
                          ? "bg-amber-500"
                          : cat.score > 0
                            ? "bg-rose-500"
                            : "bg-border"
                  )}
                  style={{ width: `${(cat.score / 3) * 100}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {(cat.weight * 100).toFixed(0)}% weight
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
