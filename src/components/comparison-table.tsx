"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MarketSnapshot, SignalColor } from "@/types/market";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/calculations";
import { formatRegulationLevel } from "@/lib/str-regulations";
import { getSignalColor, getRatingColor } from "@/lib/thresholds";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Download } from "lucide-react";

type SortField = keyof MarketSnapshot | "city" | "overallScore";
type SortDir = "asc" | "desc";

interface Column {
  key: SortField;
  label: string;
  format: (snapshot: MarketSnapshot) => string;
  signal?: (snapshot: MarketSnapshot) => SignalColor;
  align?: "left" | "right";
}

const columns: Column[] = [
  {
    key: "city",
    label: "City",
    format: (s) => `${s.identifiers.city}, ${s.identifiers.stateAbbr}`,
    align: "left",
  },
  {
    key: "overallScore",
    label: "Score",
    format: (s) => s.overallScore?.toFixed(2) ?? "—",
    align: "right",
  },
  {
    key: "population",
    label: "Population",
    format: (s) => formatNumber(s.population),
    align: "right",
  },
  {
    key: "medianIncome",
    label: "Med. Income",
    format: (s) => formatCurrency(s.medianIncome, true),
    signal: (s) => {
      if (!s.medianIncome) return "gray";
      return s.medianIncome > 55000 ? "green" : s.medianIncome >= 40000 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "medianHomePrice",
    label: "Med. Home",
    format: (s) => formatCurrency(s.medianHomePrice, true),
    signal: (s) => {
      if (!s.medianHomePrice) return "gray";
      return s.medianHomePrice < 300000 ? "green" : s.medianHomePrice <= 500000 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "medianRent",
    label: "Med. Rent",
    format: (s) => s.medianRent ? `${formatCurrency(s.medianRent)}/mo` : "N/A",
    signal: (s) => {
      if (!s.medianRent) return "gray";
      return s.medianRent > 1200 ? "green" : s.medianRent >= 900 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "housingAffordabilityIndex",
    label: "Afford. Index",
    format: (s) => s.housingAffordabilityIndex?.toFixed(1) ?? "N/A",
    signal: (s) => {
      if (!s.housingAffordabilityIndex) return "gray";
      return s.housingAffordabilityIndex < 4 ? "green" : s.housingAffordabilityIndex <= 5 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "priceToRentRatio",
    label: "P/R Ratio",
    format: (s) => s.priceToRentRatio?.toFixed(1) ?? "N/A",
    signal: (s) => {
      if (!s.priceToRentRatio) return "gray";
      return s.priceToRentRatio < 15 ? "green" : s.priceToRentRatio <= 20 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "unemploymentRate",
    label: "Unemp. Rate",
    format: (s) => formatPercent(s.unemploymentRate),
    signal: (s) => {
      if (!s.unemploymentRate) return "gray";
      return s.unemploymentRate < 4 ? "green" : s.unemploymentRate <= 6 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "rentalPopulationPct",
    label: "Rental Pop %",
    format: (s) => formatPercent(s.rentalPopulationPct),
    signal: (s) => {
      if (!s.rentalPopulationPct) return "gray";
      return s.rentalPopulationPct >= 30 && s.rentalPopulationPct <= 40
        ? "green"
        : (s.rentalPopulationPct >= 25 && s.rentalPopulationPct < 30) ||
            (s.rentalPopulationPct > 40 && s.rentalPopulationPct <= 50)
          ? "yellow"
          : "red";
    },
    align: "right",
  },
  {
    key: "crimeRateViolent",
    label: "Crime (Violent)",
    format: (s) => s.crimeRateViolent ? formatNumber(s.crimeRateViolent) : "N/A",
    signal: (s) => {
      if (!s.crimeRateViolent) return "gray";
      return s.crimeRateViolent < 200 ? "green" : s.crimeRateViolent <= 400 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "strAdr",
    label: "STR ADR",
    format: (s) => formatCurrency(s.strAdr, true),
    signal: (s) => {
      if (!s.strAdr) return "gray";
      return s.strAdr > 150 ? "green" : s.strAdr >= 100 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "strOccupancyRate",
    label: "STR Occ.",
    format: (s) => formatPercent(s.strOccupancyRate),
    signal: (s) => {
      if (!s.strOccupancyRate) return "gray";
      return s.strOccupancyRate > 65 ? "green" : s.strOccupancyRate >= 50 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "strRevpar",
    label: "STR RevPAR",
    format: (s) => formatCurrency(s.strRevpar, true),
    signal: (s) => {
      if (!s.strRevpar) return "gray";
      return s.strRevpar > 100 ? "green" : s.strRevpar >= 60 ? "yellow" : "red";
    },
    align: "right",
  },
  {
    key: "strRegulationScore",
    label: "STR Regulation",
    format: (s) => formatRegulationLevel(s.strRegulationScore),
    signal: (s) => {
      const level = s.strRegulationScore;
      if (!level) return "gray";
      if (level === "friendly") return "green";
      if (level === "moderate") return "yellow";
      return "red";
    },
    align: "right",
  },
  {
    key: "strInvestorEligible",
    label: "Investor OK",
    format: (s) =>
      s.strInvestorEligible == null ? "N/A" : s.strInvestorEligible ? "Yes" : "No",
    signal: (s) => {
      if (s.strInvestorEligible == null) return "gray";
      return s.strInvestorEligible ? "green" : "red";
    },
    align: "right",
  },
  {
    key: "strSeasonalityScore",
    label: "Seasonality",
    format: (s) => s.strSeasonalityScore != null ? `${s.strSeasonalityScore}/100` : "N/A",
    signal: (s) => {
      if (!s.strSeasonalityScore) return "gray";
      return s.strSeasonalityScore > 70 ? "green" : s.strSeasonalityScore >= 50 ? "yellow" : "red";
    },
    align: "right",
  },
];

function getSortValue(snapshot: MarketSnapshot, field: SortField): number | string {
  if (field === "city") return snapshot.identifiers.city;
  const val = snapshot[field as keyof MarketSnapshot];
  if (val === null || val === undefined) return -Infinity;
  return val as number | string;
}

export function ComparisonTable({
  snapshots,
  selectable = false,
  selectedIds,
  onSelectionChange,
}: {
  snapshots: MarketSnapshot[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}) {
  const [sortField, setSortField] = useState<SortField>("overallScore");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    return [...snapshots].sort((a, b) => {
      const aVal = getSortValue(a, sortField);
      const bVal = getSortValue(b, sortField);
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const aNum = typeof aVal === "number" ? aVal : -Infinity;
      const bNum = typeof bVal === "number" ? bVal : -Infinity;
      return sortDir === "asc" ? aNum - bNum : bNum - aNum;
    });
  }, [snapshots, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "city" ? "asc" : "desc");
    }
  };

  const exportCsv = () => {
    const headers = columns.map((c) => c.label).join(",");
    const rows = sorted.map((s) => columns.map((c) => `"${c.format(s)}"`).join(","));
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "market-comparison.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelect = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else if (next.size < 8) next.add(id);
    onSelectionChange(next);
  };

  const toggleSelectAll = () => {
    if (!onSelectionChange || !selectedIds) return;
    if (selectedIds.size === sorted.length) {
      onSelectionChange(new Set());
    } else {
      const ids = sorted
        .map((s) => s.id)
        .filter((id): id is string => Boolean(id))
        .slice(0, 8);
      onSelectionChange(new Set(ids));
    }
  };

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg mb-2">No markets analyzed yet</p>
        <p className="text-sm">Search for a city on the home page to start comparing markets.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {snapshots.length} market{snapshots.length !== 1 ? "s" : ""} compared
          {selectable && selectedIds && (
            <span> · {selectedIds.size} selected (2–8 to rank)</span>
          )}
        </p>
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all markets"
                    checked={selectedIds?.size === sorted.length && sorted.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={`cursor-pointer whitespace-nowrap hover:bg-hover ${
                    col.align === "right" ? "text-right" : ""
                  }`}
                  onClick={() => toggleSort(col.key)}
                >
                  <div className={`flex items-center gap-1 ${col.align === "right" ? "justify-end" : ""}`}>
                    <span>{col.label}</span>
                    {sortField === col.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-30" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((snapshot) => {
              const slug = `${snapshot.identifiers.city.toLowerCase().replace(/\s+/g, "-")}-${snapshot.identifiers.stateAbbr.toLowerCase()}`;
              const rowId = snapshot.id;
              return (
                <TableRow key={snapshot.id}>
                  {selectable && rowId && (
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Select ${snapshot.identifiers.city}`}
                        checked={selectedIds?.has(rowId) ?? false}
                        onChange={() => toggleSelect(rowId)}
                        disabled={!selectedIds?.has(rowId) && (selectedIds?.size ?? 0) >= 8}
                        className="rounded border"
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => {
                    const signal = col.signal?.(snapshot);
                    const signalDot = signal && signal !== "gray" ? (
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          signal === "green"
                            ? "bg-emerald-500"
                            : signal === "yellow"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                        }`}
                      />
                    ) : null;

                    if (col.key === "city") {
                      return (
                        <TableCell key={col.key} className="font-medium">
                          <Link
                            href={`/market/${slug}`}
                            className="hover:underline text-primary"
                          >
                            {col.format(snapshot)}
                          </Link>
                        </TableCell>
                      );
                    }

                    if (col.key === "overallScore") {
                      return (
                        <TableCell key={col.key} className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold">{col.format(snapshot)}</span>
                            {snapshot.overallRating && (
                              <Badge
                                variant="outline"
                                className={`text-[10px] px-1.5 py-0 ${getRatingColor(snapshot.overallRating)}`}
                              >
                                {snapshot.overallRating}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell
                        key={col.key}
                        className={col.align === "right" ? "text-right" : ""}
                      >
                        <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : ""}`}>
                          {signalDot}
                          <span>{col.format(snapshot)}</span>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
