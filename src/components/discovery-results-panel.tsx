"use client";

import Link from "next/link";
import { DiscoveryResult } from "@/lib/agent/discovery/types";
import { getRatingColor } from "@/lib/thresholds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DiscoveryResultsPanel({
  result,
  onCompareTop,
  variant = "page",
}: {
  result: DiscoveryResult;
  onCompareTop: (snapshotIds: string[]) => void;
  variant?: "page" | "panel";
}) {
  if (result.ranked.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">No markets matched</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {result.noResultsReason ?? result.summary}
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Considered {result.considered} metros · hydrated {result.hydrated} new
        </p>
      </div>
    );
  }

  const topIds = result.ranked.map((r) => r.snapshotId);
  const compact = variant === "panel";

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      {result.summary && (
        <p className="text-sm leading-relaxed text-muted-foreground">{result.summary}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Considered {result.considered} metros</span>
        <span>·</span>
        <span>Hydrated {result.hydrated} new</span>
        {result.strPreviewsFetched > 0 && (
          <>
            <span>·</span>
            <span>{result.strPreviewsFetched} STR previews fetched</span>
          </>
        )}
      </div>

      <div className={compact ? "grid gap-3" : "grid gap-4"}>
        {result.ranked.map((market) => (
          <Card key={market.snapshotId} className={compact ? "shadow-none" : undefined}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-medium">
                    #{market.rank}{" "}
                    <Link
                      href={`/market/${market.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {market.city}, {market.stateAbbr}
                    </Link>
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{market.rationale}</p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded border px-2 py-0.5 text-xs font-medium",
                    getRatingColor(market.rating as never)
                  )}
                >
                  {market.rating}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Score {market.overallScore.toFixed(1)}</span>
                <span>{market.keyMetric}</span>
                {market.matchReasons.slice(0, 2).map((reason) => (
                  <span key={reason} className="text-foreground/70">
                    {reason}
                  </span>
                ))}
              </div>
              {market.dataGaps.length > 0 && (
                <p className="mt-2 text-xs text-amber-700">{market.dataGaps[0]}</p>
              )}
              <Link
                href={`/market/${market.slug}`}
                className="mt-3 inline-flex items-center text-xs font-medium text-primary hover:underline"
              >
                Open dashboard
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {result.ranked.length >= 2 && (
        <Button variant="outline" onClick={() => onCompareTop(topIds.slice(0, 8))}>
          <LayoutGrid className="mr-2 h-4 w-4" />
          Compare top {Math.min(result.ranked.length, 8)}
        </Button>
      )}
    </div>
  );
}
