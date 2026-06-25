"use client";

import { MarketSnapshot } from "@/types/market";
import {
  computeGdpGrowthPct,
  formatCurrency,
  formatGdpGrowthLabel,
} from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { TrendingUp } from "lucide-react";

type GdpChartPoint = {
  year: string;
  gdp: number;
  growthPct: number | null;
  growthLabel: string | null;
};

function GrowthBarLabel({
  x,
  y,
  width,
  index,
  payload,
}: {
  x?: number;
  y?: number;
  width?: number;
  index?: number;
  payload?: GdpChartPoint;
}) {
  if (
    x == null ||
    y == null ||
    width == null ||
    index == null ||
    index === 0 ||
    !payload?.growthLabel
  ) {
    return null;
  }

  return (
    <text
      x={x + width / 2}
      y={y - 6}
      textAnchor="middle"
      fontSize={11}
      fill="var(--muted-foreground)"
    >
      {payload.growthLabel}
    </text>
  );
}

function GdpTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: GdpChartPoint }>;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-foreground">{point.year}</p>
      <p className="text-muted-foreground">
        GDP: {formatCurrency(point.gdp * 1_000_000, true)}
      </p>
      {point.growthLabel && (
        <p className="text-muted-foreground">Growth: {point.growthLabel}</p>
      )}
    </div>
  );
}

export function GdpChart({ snapshot }: { snapshot: MarketSnapshot }) {
  const currentYear = new Date().getFullYear();

  const rawPoints = [
    { year: currentYear - 10, gdp: snapshot.gdp10yr },
    { year: currentYear - 5, gdp: snapshot.gdp5yr },
    { year: currentYear - 1, gdp: snapshot.gdp1yr },
    { year: currentYear, gdp: snapshot.gdpCurrent },
  ].filter((d): d is { year: number; gdp: number } => d.gdp !== null);

  const data: GdpChartPoint[] = rawPoints.map((point, index) => {
    if (index === 0) {
      return {
        year: String(point.year),
        gdp: point.gdp,
        growthPct: null,
        growthLabel: null,
      };
    }

    const prior = rawPoints[index - 1];
    const yearGap = point.year - prior.year;

    return {
      year: String(point.year),
      gdp: point.gdp,
      growthPct: computeGdpGrowthPct(point.gdp, prior.gdp, yearGap),
      growthLabel: formatGdpGrowthLabel(point.gdp, prior.gdp, yearGap),
    };
  });

  if (data.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">GDP Trend</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Metropolitan GDP over time (millions USD); YoY growth labeled on bars
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="year" className="text-xs" />
            <YAxis
              tickFormatter={(v) => formatCurrency(v * 1000000, true)}
              className="text-xs"
              width={70}
            />
            <Tooltip content={<GdpTooltip />} />
            <Bar
              dataKey="gdp"
              fill="#dbd9d4"
              radius={[4, 4, 0, 0]}
            >
              <LabelList content={<GrowthBarLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
