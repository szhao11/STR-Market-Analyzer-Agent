"use client";

import { MarketSnapshot } from "@/types/market";
import { formatCurrency } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import { MapPin } from "lucide-react";

export function StrListingMap({ snapshot }: { snapshot: MarketSnapshot }) {
  const pins = snapshot.strListingPins ?? [];
  if (pins.length === 0) return null;

  const centerLat = snapshot.identifiers.latitude;
  const centerLng = snapshot.identifiers.longitude;

  const data = pins.map((pin, i) => ({
    id: i,
    lat: pin.lat,
    lng: pin.lng,
    adr: pin.adr,
    rating: pin.rating,
    label: formatCurrency(pin.adr),
  }));

  const latMin = Math.min(...data.map((d) => d.lat), centerLat) - 0.02;
  const latMax = Math.max(...data.map((d) => d.lat), centerLat) + 0.02;
  const lngMin = Math.min(...data.map((d) => d.lng), centerLng) - 0.02;
  const lngMax = Math.max(...data.map((d) => d.lng), centerLng) + 0.02;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-lg">Listing Supply Map</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {pins.length} sampled listings — bubble size reflects ADR
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              type="number"
              dataKey="lng"
              domain={[lngMin, lngMax]}
              tickFormatter={(v) => v.toFixed(2)}
              className="text-xs"
              name="Longitude"
            />
            <YAxis
              type="number"
              dataKey="lat"
              domain={[latMin, latMax]}
              tickFormatter={(v) => v.toFixed(2)}
              className="text-xs"
              width={50}
              name="Latitude"
            />
            <ZAxis type="number" dataKey="adr" range={[40, 400]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border bg-popover p-2 text-xs shadow-md">
                    <p className="font-medium">{formatCurrency(d.adr)}/night</p>
                    {d.rating != null && <p>Rating: {d.rating.toFixed(2)}★</p>}
                    <p className="text-muted-foreground">
                      {d.lat.toFixed(4)}, {d.lng.toFixed(4)}
                    </p>
                  </div>
                );
              }}
            />
            <Scatter
              name="Listings"
              data={data}
              fill="hsl(var(--primary))"
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
