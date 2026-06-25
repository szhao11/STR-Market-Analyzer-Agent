"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Eye,
} from "lucide-react";
import { MarketBrief, MarketBriefExplain, ScoreExplainSection } from "@/lib/agent/types";
import { AgentLoadingState } from "@/components/agent-loading-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BriefStatus } from "@/components/brief-panel-context";

const VERDICT_STYLES: Record<MarketBrief["verdict"], string> = {
  Pursue: "bg-emerald-100 text-emerald-800 border-emerald-300",
  Watch: "bg-amber-100 text-amber-800 border-amber-300",
  Pass: "bg-rose-100 text-rose-800 border-rose-300",
};

const BRIEF_FETCH_TIMEOUT_MS = 90_000;

export function MarketBriefCard({
  city,
  stateAbbr,
  variant = "card",
  onBriefReady,
  onStatusChange,
}: {
  city: string;
  stateAbbr: string;
  variant?: "card" | "panel";
  onBriefReady?: () => void;
  onStatusChange?: (status: BriefStatus) => void;
}) {
  const [brief, setBrief] = useState<MarketBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainSections, setExplainSections] = useState<ScoreExplainSection[]>([]);
  const [explainError, setExplainError] = useState<string | null>(null);

  const fetchBrief = useCallback(
    async (refresh = false, mode: "brief" | "explain" = "brief") => {
      if (mode === "explain") {
        setExplainLoading(true);
        setExplainError(null);
      } else if (refresh) {
        setRefreshing(true);
        setExplainSections([]);
        setShowExplain(false);
        setExplainError(null);
        onStatusChange?.("loading");
      } else {
        setLoading(true);
        onStatusChange?.("loading");
      }

      setError(null);

      try {
        const params = new URLSearchParams({
          city,
          state: stateAbbr,
          mode,
        });
        if (refresh) params.set("refresh", "true");

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), BRIEF_FETCH_TIMEOUT_MS);

        let res: Response;
        try {
          res = await fetch(`/api/agent/brief?${params}`, { signal: controller.signal });
        } finally {
          window.clearTimeout(timeoutId);
        }

        const data = await res.json();

        if (res.status === 503) {
          setUnavailable(true);
          setBrief(null);
          onStatusChange?.("unavailable");
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || "Failed to load brief");
        }

        setUnavailable(false);

        if (mode === "explain") {
          const explain = (data as MarketBriefExplain).explain;
          if (Array.isArray(explain) && explain.length > 0) {
            setExplainSections(explain);
            setShowExplain(true);
          } else {
            setExplainError("Score explanation was empty — try again.");
          }
        } else {
          setBrief(data);
          onStatusChange?.("ready");
          onBriefReady?.();
        }
      } catch (err) {
        const message =
          err instanceof Error && err.name === "AbortError"
            ? "Request timed out — check that npm run dev is running, then retry."
            : err instanceof Error
              ? err.message
              : "Failed to load brief";
        if (mode === "explain") {
          setExplainError(message);
        } else {
          setError(message);
          onStatusChange?.("error");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setExplainLoading(false);
      }
    },
    [city, stateAbbr, onBriefReady, onStatusChange]
  );

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  if (unavailable) {
    return (
      <BriefFrame variant={variant}>
        <p className="text-sm text-muted-foreground">
          AI brief requires <code className="text-xs">OPENAI_API_KEY</code> in{" "}
          <code className="text-xs">.env.local</code>. Run{" "}
          <code className="text-xs">npm run doctor</code> for setup guidance — the rest of the
          dashboard works without it.
        </p>
      </BriefFrame>
    );
  }

  if (loading) {
    return (
      <BriefFrame variant={variant} title="Investment Brief" icon={Sparkles} iconClassName="text-primary">
        <AgentLoadingState message="Generating investment brief… (first load may take 15–30s)" />
      </BriefFrame>
    );
  }

  if (error || !brief) {
    return (
      <BriefFrame
        variant={variant}
        title="Investment Brief"
        icon={AlertTriangle}
        iconClassName="text-amber-600"
        className={variant === "card" ? "border-amber-200" : undefined}
      >
        <div className="space-y-3">
          <p className="text-sm text-amber-800">{error || "Could not load brief"}</p>
          <Button size="sm" variant="outline" onClick={() => fetchBrief()}>
            Retry
          </Button>
        </div>
      </BriefFrame>
    );
  }

  const explainReady = explainSections.length > 0;

  return (
    <BriefFrame variant={variant}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            {variant === "card" && (
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Investment Brief
              </h3>
            )}
            <p className="text-sm text-muted-foreground">{brief.headline}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={VERDICT_STYLES[brief.verdict]}>
              {brief.verdict}
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fetchBrief(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
              Regenerate
            </Button>
          </div>
        </div>

        {brief.dataCaveats.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {brief.dataCaveats.map((c) => (
              <p key={c}>{c}</p>
            ))}
          </div>
        )}

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Regulation
          </h4>
          <p className="text-sm leading-relaxed">{brief.regulationSummary}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <BulletList title="Strengths" bullets={brief.strengths} icon={CheckCircle2} tone="emerald" />
          <BulletList title="Risks" bullets={brief.risks} icon={XCircle} tone="rose" />
        </div>

        {brief.strOutlook && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              STR Outlook
            </h4>
            <p className="text-sm">{brief.strOutlook}</p>
          </div>
        )}

        {brief.ltrFallback && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              LTR Fallback
            </h4>
            <p className="text-sm">{brief.ltrFallback}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (explainReady) {
                setShowExplain((v) => !v);
                setExplainError(null);
              } else {
                fetchBrief(false, "explain");
              }
            }}
            disabled={explainLoading}
          >
            <Eye className="h-4 w-4 mr-1" />
            {explainLoading ? "Explaining score…" : "Explain my score"}
            {explainReady &&
              (showExplain ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              ))}
          </Button>
          {!brief.verdictAlignsWithRating && (
            <span className="text-xs text-muted-foreground">
              Verdict adjusted for regulation / data gaps vs. raw rating
            </span>
          )}
        </div>

        {explainLoading && (
          <AgentLoadingState message="Generating score explanation…" />
        )}

        {explainError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 space-y-2">
            <p>{explainError}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchBrief(true, "explain")}
              disabled={explainLoading}
            >
              Retry explanation
            </Button>
          </div>
        )}

        {showExplain && explainReady && (
          <div className="space-y-3 rounded-lg bg-muted/40 p-4">
            {explainSections.map((section) => (
              <div key={section.category}>
                <h5 className="text-sm font-semibold">{section.category}</h5>
                <p className="text-sm text-muted-foreground mt-0.5">{section.summary}</p>
                {section.highlights.length > 0 && (
                  <ul className="mt-1 text-xs text-muted-foreground list-disc pl-4">
                    {section.highlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </BriefFrame>
  );
}

function BriefFrame({
  variant,
  title,
  icon: Icon,
  iconClassName,
  className,
  children,
}: {
  variant: "card" | "panel";
  title?: string;
  icon?: React.ElementType;
  iconClassName?: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (variant === "panel") {
    return <div className={className}>{children}</div>;
  }

  return (
    <Card className={className}>
      {title && Icon && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon className={`h-5 w-5 ${iconClassName ?? ""}`} />
            {title}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function BulletList({
  title,
  bullets,
  icon: Icon,
  tone,
}: {
  title: string;
  bullets: { text: string; metricRefs: string[] }[];
  icon: React.ElementType;
  tone: "emerald" | "rose";
}) {
  const color = tone === "emerald" ? "text-emerald-600" : "text-rose-600";

  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        {title}
      </h4>
      <ul className="space-y-2">
        {bullets.map((b) => (
          <li key={b.text} className="text-sm leading-snug">
            {b.text}
            {b.metricRefs.length > 0 && (
              <span className="block text-[10px] text-muted-foreground mt-0.5">
                refs: {b.metricRefs.join(", ")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
