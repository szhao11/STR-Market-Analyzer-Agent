"use client";

import { Loader2, Sparkles } from "lucide-react";
import {
  useDiscoveryPanel,
  type DiscoveryStatus,
} from "@/components/discovery-panel-context";
import { Button } from "@/components/ui/button";

function triggerLabel(status: DiscoveryStatus): string {
  switch (status) {
    case "loading":
      return "Discovering markets…";
    case "ready":
      return "View discovery results";
    case "error":
      return "Discovery failed — open to retry";
    default:
      return "Open discovery results";
  }
}

export function DiscoveryTrigger() {
  const { isOpen, status, hasSession, openPanel } = useDiscoveryPanel();

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
