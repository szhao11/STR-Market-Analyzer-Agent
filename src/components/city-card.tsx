"use client";

import Link from "next/link";
import { MarketSnapshot } from "@/types/market";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/calculations";
import { getRatingColor } from "@/lib/thresholds";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, TrendingUp, Home, Users, Clock, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function toSlug(city: string, stateAbbr: string): string {
  return `${city.toLowerCase().replace(/\s+/g, "-")}-${stateAbbr.toLowerCase()}`;
}

export function CityCard({
  snapshot,
  variant = "card",
  onDismiss,
}: {
  snapshot: MarketSnapshot;
  variant?: "card" | "row";
  onDismiss?: (id: string) => void;
}) {
  const slug = toSlug(snapshot.identifiers.city, snapshot.identifiers.stateAbbr);
  const ratingColor = getRatingColor(snapshot.overallRating);

  const fetchedDate = new Date(snapshot.fetchedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (variant === "row") {
    return (
      <div className="group flex items-center gap-1 border-b border-border last:border-b-0">
        <Link
          href={`/market/${slug}`}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-hover"
        >
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {snapshot.identifiers.city}, {snapshot.identifiers.stateAbbr}
              </span>
              {snapshot.overallRating && (
                <Badge variant="outline" className={cn("text-xs", ratingColor)}>
                  {snapshot.overallRating}
                </Badge>
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>{snapshot.identifiers.metroArea}</span>
              {snapshot.overallScore !== null && (
                <span>Score {snapshot.overallScore.toFixed(2)}</span>
              )}
              {snapshot.population !== null && (
                <span>Pop. {formatNumber(snapshot.population)}</span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {fetchedDate}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
        {onDismiss && snapshot.id && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="mr-2 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
            aria-label={`Remove ${snapshot.identifiers.city}, ${snapshot.identifiers.stateAbbr} from recent`}
            onClick={() => onDismiss(snapshot.id!)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Link href={`/market/${slug}`}>
      <Card className="group cursor-pointer transition-colors hover:bg-hover">
        <CardContent className="p-4">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {snapshot.identifiers.city}, {snapshot.identifiers.stateAbbr}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {snapshot.identifiers.metroArea}
                </p>
              </div>
            </div>
            {snapshot.overallRating && (
              <Badge variant="outline" className={cn("text-xs", ratingColor)}>
                {snapshot.overallRating}
              </Badge>
            )}
          </div>

          {snapshot.overallScore !== null && (
            <div className="mb-3">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Overall score</span>
                <span className="font-medium">{snapshot.overallScore.toFixed(2)} / 3.0</span>
              </div>
              <div className="h-1 w-full rounded-sm bg-muted">
                <div
                  className={cn(
                    "h-1 rounded-sm transition-all",
                    snapshot.overallScore >= 2.5
                      ? "bg-emerald-500"
                      : snapshot.overallScore >= 2.0
                        ? "bg-primary"
                        : snapshot.overallScore >= 1.5
                          ? "bg-amber-500"
                          : "bg-rose-500"
                  )}
                  style={{ width: `${(snapshot.overallScore / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {snapshot.population !== null && (
              <div className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Pop:</span>
                <span>{formatNumber(snapshot.population)}</span>
              </div>
            )}
            {snapshot.medianHomePrice !== null && (
              <div className="flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Home:</span>
                <span>{formatCurrency(snapshot.medianHomePrice, true)}</span>
              </div>
            )}
            {snapshot.medianIncome !== null && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Income:</span>
                <span>{formatCurrency(snapshot.medianIncome, true)}</span>
              </div>
            )}
            {snapshot.unemploymentRate !== null && (
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Unemp:</span>
                <span>{formatPercent(snapshot.unemploymentRate)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-1 border-t border-border pt-3 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Fetched {fetchedDate}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
