"use client";

import { Loader2, Sparkles } from "lucide-react";

export function AgentLoadingState({ message = "Analyzing market data…" }: { message?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-6">
      <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
      <div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-primary" />
          {message}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Grounded in your snapshot — no web search, numbers from saved data only.
        </p>
      </div>
    </div>
  );
}
