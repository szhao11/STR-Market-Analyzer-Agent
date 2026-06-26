"use client";

import { Loader2, Sparkles } from "lucide-react";
import {
  useCompareRankPanel,
  type CompareRankStatus,
} from "@/components/compare-rank-panel-context";
import { Button } from "@/components/ui/button";

function triggerLabel(status: CompareRankStatus): string {
  switch (status) {
    case "loading":
      return "Ranking selected markets…";
    case "ready":
      return "View ranked markets";
    case "error":
      return "Ranking failed — open to retry";
    default:
      return "Open ranked markets";
  }
}

export function CompareRankTrigger() {
  const { isOpen, status, hasSession, openPanel } = useCompareRankPanel();

  if (!hasSession || isOpen) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={openPanel}
    >
      {status === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <Sparkles className="h-4 w-4 text-primary" />
      )}
      {triggerLabel(status)}
    </Button>
  );
}
