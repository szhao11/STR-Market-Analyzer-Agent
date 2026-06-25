"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MarketSnapshot } from "@/types/market";
import {
  notifyRecentMarketsChanged,
  RECENT_MARKETS_CHANGED,
} from "@/lib/recent-markets-events";

export function useRecentSnapshots(options?: { limit?: number }) {
  const pathname = usePathname();
  const [snapshots, setSnapshots] = useState<MarketSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/snapshots?recent=true");
    if (!res.ok) return;
    const data: MarketSnapshot[] = await res.json();
    setSnapshots(options?.limit ? data.slice(0, options.limit) : data);
  }, [options?.limit]);

  useEffect(() => {
    let cancelled = false;

    refresh()
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const onChange = () => {
      refresh().catch(() => {});
    };

    window.addEventListener(RECENT_MARKETS_CHANGED, onChange);
    return () => {
      cancelled = true;
      window.removeEventListener(RECENT_MARKETS_CHANGED, onChange);
    };
  }, [refresh, pathname]);

  const dismiss = useCallback(async (id: string) => {
    const res = await fetch(`/api/snapshots/${id}/dismiss`, { method: "POST" });
    if (!res.ok) return false;

    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    notifyRecentMarketsChanged();
    return true;
  }, []);

  return { snapshots, loading, dismiss, refresh };
}
