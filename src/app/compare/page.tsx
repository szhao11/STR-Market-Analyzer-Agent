"use client";

import { useState, useEffect } from "react";
import { MarketSnapshot } from "@/types/market";
import { CompareRankResult } from "@/lib/agent/types";
import { ComparisonTable } from "@/components/comparison-table";
import { SearchBar } from "@/components/search-bar";
import {
  InvestorProfileForm,
  useInvestorProfile,
} from "@/components/investor-profile-form";
import { CompareRankPanel } from "@/components/compare-rank-panel";
import { PageFrame } from "@/components/page-frame";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

export default function ComparePage() {
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useInvestorProfile();
  const [rankResult, setRankResult] = useState<CompareRankResult | null>(null);
  const [rankLoading, setRankLoading] = useState(false);
  const [rankError, setRankError] = useState<string | null>(null);
  const [agentUnavailable, setAgentUnavailable] = useState(false);

  useEffect(() => {
    fetch("/api/snapshots")
      .then((res) => res.json())
      .then((data) => setSnapshots(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const rankSelected = async () => {
    if (selectedIds.size < 2) return;

    setRankLoading(true);
    setRankError(null);
    setAgentUnavailable(false);

    try {
      const res = await fetch("/api/agent/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshotIds: Array.from(selectedIds),
          profile,
        }),
      });

      const data = await res.json();

      if (res.status === 503) {
        setAgentUnavailable(true);
        setRankResult(null);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || "Failed to rank markets");
      }

      setRankResult(data);
    } catch (err) {
      setRankError(err instanceof Error ? err.message : "Failed to rank markets");
      setRankResult(null);
    } finally {
      setRankLoading(false);
    }
  };

  return (
    <PageFrame
      title="Compare markets"
      description="Side-by-side database of all analyzed markets. Select 2–8 rows and rank them with your investor profile."
      width="full"
    >
      <div className="mb-8 max-w-xl">
        <SearchBar placeholder="Add a city to compare…" />
      </div>

      <div className="mb-8 space-y-6">
        <InvestorProfileForm profile={profile} onChange={setProfile} />

        {agentUnavailable && (
          <div className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Compare & Rank requires <code className="text-xs">OPENAI_API_KEY</code> in{" "}
            <code className="text-xs">.env.local</code>. The comparison table still works
            without it.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={rankSelected}
            disabled={selectedIds.size < 2 || selectedIds.size > 8 || rankLoading}
          >
            {rankLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Rank selected ({selectedIds.size})
          </Button>
          {selectedIds.size > 0 && selectedIds.size < 2 && (
            <span className="text-xs text-muted-foreground">Select at least 2 markets</span>
          )}
        </div>

        {(rankLoading || rankResult || rankError) && (
          <CompareRankPanel result={rankResult} loading={rankLoading} error={rankError} />
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ComparisonTable
          snapshots={snapshots}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      )}
    </PageFrame>
  );
}
