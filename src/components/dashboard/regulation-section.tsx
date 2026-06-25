"use client";

import { MarketSnapshot, MetricThreshold } from "@/types/market";
import { formatRegulationLevel, formatRegulationResolution } from "@/lib/str-regulations";
import { getSignalColor } from "@/lib/thresholds";
import { MetricBadge } from "@/components/metric-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, ExternalLink, AlertTriangle } from "lucide-react";

export function RegulationSection({
  snapshot,
  metrics,
  flags = [],
}: {
  snapshot: MarketSnapshot;
  metrics: MetricThreshold[];
  flags?: string[];
}) {
  const level = snapshot.strRegulationScore;
  const levelColor = level
    ? getSignalColor(
        level === "friendly" ? "green" : level === "moderate" ? "yellow" : "red"
      )
    : getSignalColor("gray");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">STR Regulation &amp; Risk</CardTitle>
          </div>
          {level && (
            <Badge className={`${levelColor} border`}>
              {formatRegulationLevel(level)}
            </Badge>
          )}
        </div>
        {snapshot.strRegulationJurisdiction && (
          <p className="text-sm text-muted-foreground">
            Jurisdiction: {snapshot.strRegulationJurisdiction}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {flags.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
            {flags.map((flag) => (
              <div key={flag} className="flex items-start gap-2 text-sm text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{flag}</span>
              </div>
            ))}
          </div>
        )}

        {metrics.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="min-w-0">
                <MetricBadge metric={metric} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No regulation data for this market — verify local ordinances before investing.
          </p>
        )}

        {snapshot.strRegulationNotes && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {snapshot.strRegulationNotes}
          </p>
        )}

        {snapshot.strRegulationSources && snapshot.strRegulationSources.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {snapshot.strRegulationSources.map((source) => (
              <a
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                {source.label}
                <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
          {snapshot.strRegulationVerifiedAt && (
            <span>Last verified: {snapshot.strRegulationVerifiedAt}</span>
          )}
          {snapshot.strRegulationConfidence && (
            <span>Confidence: {snapshot.strRegulationConfidence}</span>
          )}
          {snapshot.strRegulationResolution && (
            <span>Resolved: {formatRegulationResolution(snapshot.strRegulationResolution)}</span>
          )}
          {snapshot.strInvestorEligible != null && (
            <span>
              Investor eligible: {snapshot.strInvestorEligible ? "Yes" : "No"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
