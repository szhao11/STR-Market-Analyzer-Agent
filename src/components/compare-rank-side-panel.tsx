"use client";

import { X } from "lucide-react";
import { CompareRankPanel } from "@/components/compare-rank-panel";
import { useCompareRankPanel } from "@/components/compare-rank-panel-context";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function CompareRankSidePanel() {
  const { result, loading, error, isOpen, closePanel, hasSession } = useCompareRankPanel();

  if (!hasSession) return null;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-border bg-background transition-[width] duration-200 ease-out",
        isOpen ? "w-[min(420px,40vw)]" : "w-0 overflow-hidden border-l-0"
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="truncate text-sm font-medium">Ranked Markets</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Close ranked markets panel"
          onClick={closePanel}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="p-4">
          <CompareRankPanel
            result={result}
            loading={loading}
            error={error}
            variant="panel"
          />
        </div>
      </ScrollArea>
    </aside>
  );
}
