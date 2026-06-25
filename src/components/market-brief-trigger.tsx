"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useBriefPanel, type BriefStatus } from "@/components/brief-panel-context";
import { Button } from "@/components/ui/button";

function triggerLabel(status: BriefStatus): string {
  switch (status) {
    case "loading":
      return "Generating investment brief…";
    case "ready":
      return "View investment brief";
    case "error":
      return "Investment brief failed — open to retry";
    case "unavailable":
      return "Investment brief unavailable";
    default:
      return "Open investment brief";
  }
}

export function MarketBriefTrigger() {
  const { isOpen, status, openPanel } = useBriefPanel();

  if (isOpen) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full justify-start gap-2 sm:w-auto"
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
