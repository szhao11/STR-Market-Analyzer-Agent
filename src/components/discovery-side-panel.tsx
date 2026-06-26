"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { DiscoveryResultsPanel } from "@/components/discovery-results-panel";
import { DiscoveryCriteriaChips } from "@/components/discovery-criteria-chips";
import { useDiscoveryPanel } from "@/components/discovery-panel-context";
import { AgentLoadingState } from "@/components/agent-loading-state";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function DiscoverySidePanel() {
  const router = useRouter();
  const { result, loading, error, loadingMessage, isOpen, closePanel, hasSession } =
    useDiscoveryPanel();

  if (!hasSession) return null;

  const compareTop = (snapshotIds: string[]) => {
    const params = new URLSearchParams({ select: snapshotIds.join(",") });
    router.push(`/compare?${params.toString()}`);
  };

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-l border-border bg-background transition-[width] duration-200 ease-out",
        isOpen ? "w-[min(420px,40vw)]" : "w-0 overflow-hidden border-l-0"
      )}
      aria-hidden={!isOpen}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="truncate text-sm font-medium">Discovery Results</span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="Close discovery results panel"
          onClick={closePanel}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {loading && <AgentLoadingState message={loadingMessage} />}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {result && !loading && (
            <>
              <DiscoveryCriteriaChips criteria={result.criteria} />
              <DiscoveryResultsPanel
                result={result}
                onCompareTop={compareTop}
                variant="panel"
              />
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
