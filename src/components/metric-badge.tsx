"use client";

import { MetricThreshold } from "@/types/market";
import { formatMetricValue } from "@/lib/calculations";
import { getSignalColor } from "@/lib/thresholds";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function MetricBadge({ metric }: { metric: MetricThreshold }) {
  const colorClasses = getSignalColor(metric.signal);
  const displayValue = formatMetricValue(metric.value, metric.unit);

  return (
    <Tooltip>
      <TooltipTrigger
        className={`flex w-full min-w-0 flex-col gap-1 overflow-hidden rounded-lg border p-3 transition-colors text-left ${colorClasses}`}
      >
        <span className="truncate text-xs font-medium opacity-70">{metric.label}</span>
        <span className="truncate text-lg font-bold">{displayValue}</span>
        {metric.source && (
          <span className="truncate text-[10px] opacity-50">{metric.source}</span>
        )}
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="text-sm">{metric.tooltip || metric.label}</p>
      </TooltipContent>
    </Tooltip>
  );
}
