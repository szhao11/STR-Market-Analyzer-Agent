"use client";

import { MarketSnapshot } from "@/types/market";
import { formatPercent } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { CalendarDays } from "lucide-react";

export function StrSeasonalityChart({ snapshot }: { snapshot: MarketSnapshot }) {
  const data = [
    { window: "30-day", occupancy: snapshot.strOccupancyD30 },
    { window: "60-day", occupancy: snapshot.strOccupancyD60 },
    { window: "90-day", occupancy: snapshot.strOccupancyD90 },
    { window: "365-day", occupancy: snapshot.strOccupancyD365 },
  ].filter((d) => d.occupancy !== null);

  if (data.length < 2) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Occupancy by Forward Window</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Median occupancy across forward booking windows — wider gaps indicate seasonality
          {snapshot.strSeasonalityScore != null && (
            <span className="ml-1">
              (steadiness score: {snapshot.strSeasonalityScore}/100)
            </span>
          )}
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="window" className="text-xs" />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              className="text-xs"
              width={45}
            />
            <Tooltip
              formatter={(value) => [formatPercent(Number(value)), "Occupancy"]}
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <ReferenceLine y={65} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "65% target", position: "insideTopRight", fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="occupancy"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
