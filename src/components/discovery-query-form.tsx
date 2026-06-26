"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const EXAMPLE_QUERIES = [
  "5 markets under $400k with friendly STR rules",
  "Best cash flow in Texas, occupancy above 55%",
  "Low regulation risk, RevPAR over $80, not California",
];

export function DiscoveryQueryForm({
  onSubmit,
  loading,
  useProfile = true,
}: {
  onSubmit: (query: string) => void;
  loading: boolean;
  useProfile?: boolean;
}) {
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="discovery-query" className="text-sm font-medium">
          Describe the markets you want
        </label>
        <textarea
          id="discovery-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Find 5 cash-flowing STR markets under $400k with low regulation risk and occupancy above 60%"
          rows={4}
          className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Searches all 73 supported metros. Results are ranked by your query
          {useProfile ? " and investor profile" : " only"}.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => setQuery(example)}
            className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {example}
          </button>
        ))}
      </div>

      <Button
        onClick={() => onSubmit(query.trim())}
        disabled={loading || query.trim().length < 10}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        Discover markets
      </Button>
    </div>
  );
}
