"use client";

import { MetricThreshold } from "@/types/market";
import { MetricBadge } from "@/components/metric-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, Loader2 } from "lucide-react";

export function MetricsSection({
  title,
  icon: Icon,
  metrics,
  description,
  loading,
  loadingMessage,
}: {
  title: string;
  icon: LucideIcon;
  metrics: MetricThreshold[];
  description?: string;
  loading?: boolean;
  loadingMessage?: string;
}) {
  const hasData = metrics.some((m) => m.signal !== "gray");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">{title}</CardTitle>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {loading && loadingMessage && (
          <p className="text-sm text-amber-600">{loadingMessage}</p>
        )}
      </CardHeader>
      <CardContent>
        {metrics.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="min-w-0">
                  <MetricBadge metric={metric} />
                </div>
              ))}
            </div>
            {!hasData && !loading && (
              <p className="mt-4 text-xs text-muted-foreground text-center">
                Metrics shown as N/A — add missing API keys or re-fetch to load data.
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Icon className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No metrics configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
