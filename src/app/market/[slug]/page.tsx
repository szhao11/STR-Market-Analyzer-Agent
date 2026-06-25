"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { MarketSnapshot, CategoryScore, AnalyzeResponse } from "@/types/market";
import { ScoreHero } from "@/components/dashboard/score-hero";
import { useBriefPanel } from "@/components/brief-panel-context";
import { MarketBriefTrigger } from "@/components/market-brief-trigger";
import { MetricsSection } from "@/components/dashboard/metrics-section";
import { GdpChart } from "@/components/dashboard/gdp-chart";
import { InvestmentCalculator } from "@/components/dashboard/investment-calculator";
import { StrSeasonalityChart } from "@/components/dashboard/str-seasonality-chart";
import { StrListingMap } from "@/components/dashboard/str-listing-map";
import { StrSupplySection } from "@/components/dashboard/str-supply-section";
import { RegulationSection } from "@/components/dashboard/regulation-section";
import { PageFrame } from "@/components/page-frame";
import { getDecisionFlags } from "@/lib/thresholds";
import { isStrAutoFetchEnabled } from "@/lib/str-config";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Users,
  Home,
  Building2,
  Shield,
  RefreshCw,
  Loader2,
  PiggyBank,
} from "lucide-react";

function parseSlug(slug: string) {
  const parts = slug.split("-");
  const stateAbbr = parts[parts.length - 1];
  const city = parts
    .slice(0, -1)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  return { city, stateAbbr };
}

function snapshotNeedsStr(snapshot: MarketSnapshot): boolean {
  if (snapshot.strLoadComplete === true) return false;
  if (!snapshot.strAdr) return true;
  if (snapshot.strLoadComplete === false) return true;
  return (snapshot.strActiveListings ?? 0) < 3;
}

export default function MarketDashboard({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [scores, setScores] = useState<CategoryScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [strLoading, setStrLoading] = useState(false);
  const [strRefining, setStrRefining] = useState(false);
  const [strError, setStrError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setMarket } = useBriefPanel();

  const applyStrResponse = useCallback((data: AnalyzeResponse) => {
    setSnapshot(data.snapshot);
    setScores(data.scores);

    if (data.strError || data.snapshot.strFetchError) {
      setStrError(data.strError || data.snapshot.strFetchError);
    } else if (!data.snapshot.strAdr) {
      setStrError("Apify returned no STR data for this market.");
    } else {
      setStrError(null);
    }
  }, []);

  const fetchStrPhase = useCallback(
    async (
      city: string,
      stateAbbr: string,
      phase: "quick" | "full",
      refresh: boolean,
      options?: { background?: boolean }
    ): Promise<AnalyzeResponse | null> => {
      if (options?.background) setStrRefining(true);
      else setStrLoading(true);

      try {
        const res = await fetch(
          `/api/analyze/str?city=${encodeURIComponent(city)}&state=${encodeURIComponent(stateAbbr)}&refresh=${refresh}&phase=${phase}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `STR fetch failed (${res.status})`);
        }

        const data: AnalyzeResponse = await res.json();
        applyStrResponse(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load STR data";
        if (!options?.background) setStrError(message);
        console.error("STR data fetch error:", err);
        return null;
      } finally {
        if (options?.background) setStrRefining(false);
        else setStrLoading(false);
      }
    },
    [applyStrResponse]
  );

  const fetchStrData = useCallback(
    async (city: string, stateAbbr: string, refresh = false, snapshot?: MarketSnapshot) => {
      setStrError(null);

      if (refresh) {
        await fetchStrPhase(city, stateAbbr, "full", true);
        return;
      }

      if (!snapshot?.strAdr) {
        const quick = await fetchStrPhase(city, stateAbbr, "quick", false);
        if (quick && (quick.strPartial || !quick.snapshot.strLoadComplete)) {
          await fetchStrPhase(city, stateAbbr, "full", false, { background: true });
        }
        return;
      }

      await fetchStrPhase(city, stateAbbr, "full", false);
    },
    [fetchStrPhase]
  );

  const fetchData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    const { city, stateAbbr } = parseSlug(slug);

    try {
      const res = await fetch(
        `/api/analyze?city=${encodeURIComponent(city)}&state=${encodeURIComponent(stateAbbr)}&refresh=${refresh}`
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch data");
      }

      const data: AnalyzeResponse = await res.json();
      setSnapshot(data.snapshot);
      setScores(data.scores);
      setError(null);

      if (isStrAutoFetchEnabled() && snapshotNeedsStr(data.snapshot)) {
        fetchStrData(city, stateAbbr, false, data.snapshot);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slug, fetchStrData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!snapshot) {
      setMarket(null);
      return;
    }

    setMarket({
      city: snapshot.identifiers.city,
      stateAbbr: snapshot.identifiers.stateAbbr,
    });

    return () => setMarket(null);
  }, [snapshot, setMarket]);

  if (loading) {
    return (
      <PageFrame width="document">
        <div className="flex flex-col items-center gap-3 py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading market data…</p>
        </div>
      </PageFrame>
    );
  }

  if (error || !snapshot) {
    return (
      <PageFrame
        breadcrumb={[{ label: "Search", href: "/" }]}
        title="Market not found"
        width="document"
      >
        <p className="mb-6 text-sm text-muted-foreground">
          {error || "Could not load market data."}
        </p>
        <Button variant="outline" onClick={() => router.push("/")}>
          Back to search
        </Button>
      </PageFrame>
    );
  }

  const economicMetrics = scores.find((s) => s.category === "Economic Health")?.metrics || [];
  const demographicMetrics = scores.find((s) => s.category === "Demographics")?.metrics || [];
  const housingMetrics = scores.find((s) => s.category === "Housing Fundamentals")?.metrics || [];
  const strMetrics = scores.find((s) => s.category === "STR Performance")?.metrics || [];
  const regulationMetrics = scores.find((s) => s.category === "STR Regulation")?.metrics || [];
  const investmentMetrics = scores.find((s) => s.category === "Investment Returns")?.metrics || [];
  const safetyMetrics = scores.find((s) => s.category === "Safety & Quality")?.metrics || [];
  const decisionFlags = getDecisionFlags(snapshot);

  const handleRefresh = () => {
    const { city, stateAbbr } = parseSlug(slug);
    fetchData(true).then(() => fetchStrData(city, stateAbbr, true));
  };

  return (
    <PageFrame
      breadcrumb={[
        { label: "Search", href: "/" },
        {
          label: `${snapshot.identifiers.city}, ${snapshot.identifiers.stateAbbr}`,
        },
      ]}
      width="document"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || strLoading || strRefining}
        >
          {refreshing || strLoading || strRefining ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Re-fetch data
        </Button>
      }
    >
      <div className="space-y-8">
      <ScoreHero snapshot={snapshot} scores={scores} decisionFlags={decisionFlags} />

      <MarketBriefTrigger />

      <RegulationSection snapshot={snapshot} metrics={regulationMetrics} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="housing">Housing</TabsTrigger>
          <TabsTrigger value="str">STR Data</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricsSection
              title="Economic Health"
              icon={TrendingUp}
              metrics={economicMetrics}
              description="GDP growth, employment, and income indicators"
            />
            <GdpChart snapshot={snapshot} />
          </div>

          <MetricsSection
            title="Demographics & Population"
            icon={Users}
            metrics={demographicMetrics}
            description="Population size, growth, and renter demographics"
          />

          <MetricsSection
            title="Investment Returns"
            icon={PiggyBank}
            metrics={investmentMetrics}
            description="Cap rate and cash-on-cash estimates (LTR baseline; STR updates when Apify data loads)"
          />

          <MetricsSection
            title="Safety & Quality of Life"
            icon={Shield}
            metrics={safetyMetrics}
            description="Crime rates, walkability, and tax environment"
          />
        </TabsContent>

        <TabsContent value="housing" className="space-y-6">
          <MetricsSection
            title="Housing Market Fundamentals"
            icon={Home}
            metrics={housingMetrics}
            description="Home prices, rents, affordability, and market indicators"
          />
        </TabsContent>

        <TabsContent value="str" className="space-y-6">
          {!isStrAutoFetchEnabled() &&
            snapshotNeedsStr(snapshot) &&
            !strLoading &&
            !strRefining && (
              <div className="rounded-md border border-dashed border-border px-4 py-5 text-center space-y-3">
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  STR metrics are loaded from Apify on demand. Open this tab and
                  click below when you want Airbnb data — nothing runs until you
                  do.
                </p>
                <Button
                  onClick={() => {
                    const { city, stateAbbr } = parseSlug(slug);
                    fetchStrData(city, stateAbbr, false, snapshot);
                  }}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Load STR Data
                </Button>
              </div>
            )}
          {strError && (
            <div className="rounded-md border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {strError}
            </div>
          )}
          {strRefining && !strLoading && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
              Refining STR metrics with additional listings…
            </div>
          )}
          <MetricsSection
            title="Short-Term Rental Performance"
            icon={Building2}
            metrics={strMetrics}
            loading={strLoading}
            loadingMessage="Fetching initial Airbnb preview from Apify — usually ~30 seconds…"
            description="ADR, occupancy, RevPAR, revenue, and competition metrics from Apify Airbnb data"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StrSeasonalityChart snapshot={snapshot} />
            <StrListingMap snapshot={snapshot} />
          </div>
          <StrSupplySection snapshot={snapshot} />
        </TabsContent>

        <TabsContent value="calculator" className="space-y-6">
          <InvestmentCalculator snapshot={snapshot} />
        </TabsContent>
      </Tabs>
      </div>
    </PageFrame>
  );
}
