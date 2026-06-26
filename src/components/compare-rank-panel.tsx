"use client";

import Link from "next/link";
import { CompareRankResult } from "@/lib/agent/types";
import { AgentLoadingState } from "@/components/agent-loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Ban, AlertTriangle } from "lucide-react";
import { getRatingColor } from "@/lib/thresholds";

function marketSlug(city: string, stateAbbr: string) {
  return `${city.toLowerCase().replace(/\s+/g, "-")}-${stateAbbr.toLowerCase()}`;
}

export function CompareRankPanel({
  result,
  loading,
  error,
  variant = "card",
}: {
  result: CompareRankResult | null;
  loading: boolean;
  error: string | null;
  variant?: "card" | "panel";
}) {
  if (loading) {
    return <AgentLoadingState message="Ranking selected markets…" />;
  }

  if (error) {
    if (variant === "panel") {
      return (
        <div className="flex items-start gap-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      );
    }
    return (
      <Card className="border-amber-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) return null;

  const rankedList = (
    <div className="space-y-3">
      {result.ranked.map((m) => (
        <div
          key={m.snapshotId}
          className="flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3 bg-muted/20"
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-primary">#{m.rank}</span>
              <Link
                href={`/market/${marketSlug(m.city, m.stateAbbr)}`}
                className="font-semibold hover:underline"
              >
                {m.city}, {m.stateAbbr}
              </Link>
              <Badge variant="outline" className={`text-[10px] ${getRatingColor(m.rating as never)}`}>
                {m.rating}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{m.rationale}</p>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-medium">{m.keyMetric}</div>
            <div className="text-xs text-muted-foreground">Score {m.score.toFixed(1)}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const disqualifiedList = result.disqualified.map((m) => (
    <div
      key={m.snapshotId}
      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-2 text-sm"
    >
      <div>
        <Link
          href={`/market/${marketSlug(m.city, m.stateAbbr)}`}
          className="font-medium hover:underline"
        >
          {m.city}, {m.stateAbbr}
        </Link>
        <p className="text-rose-800 text-xs mt-0.5">{m.disqualifyReason}</p>
      </div>
      <span className="text-xs text-muted-foreground">{m.keyMetric}</span>
    </div>
  ));

  if (variant === "panel") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
        {rankedList}
        {result.disqualified.length > 0 && (
          <div className="space-y-3 border-t border-border pt-6">
            <h3 className="text-sm font-medium flex items-center gap-2 text-rose-800">
              <Ban className="h-4 w-4" />
              Disqualified
            </h3>
            <div className="space-y-2">{disqualifiedList}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Ranked Markets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
          {rankedList}
        </CardContent>
      </Card>

      {result.disqualified.length > 0 && (
        <Card className="border-rose-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-rose-800">
              <Ban className="h-4 w-4" />
              Disqualified
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">{disqualifiedList}</CardContent>
        </Card>
      )}
    </div>
  );
}
