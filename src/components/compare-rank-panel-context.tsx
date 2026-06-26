"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CompareRankResult } from "@/lib/agent/types";

export type CompareRankStatus = "idle" | "loading" | "ready" | "error";

type CompareRankPanelContextValue = {
  result: CompareRankResult | null;
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  status: CompareRankStatus;
  hasSession: boolean;
  startRankSession: () => void;
  completeRankSession: (result: CompareRankResult) => void;
  failRankSession: (error: string) => void;
  openPanel: () => void;
  closePanel: () => void;
  clearSession: () => void;
};

const CompareRankPanelContext = createContext<CompareRankPanelContextValue | null>(null);

export function CompareRankPanelProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<CompareRankResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const hasSession = loading || result !== null || error !== null;

  const status: CompareRankStatus = loading
    ? "loading"
    : error
      ? "error"
      : result
        ? "ready"
        : "idle";

  const startRankSession = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(true);
    setIsOpen(true);
  }, []);

  const completeRankSession = useCallback((next: CompareRankResult) => {
    setResult(next);
    setError(null);
    setLoading(false);
    setIsOpen(true);
  }, []);

  const failRankSession = useCallback((message: string) => {
    setResult(null);
    setError(message);
    setLoading(false);
    setIsOpen(true);
  }, []);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  const clearSession = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      result,
      loading,
      error,
      isOpen,
      status,
      hasSession,
      startRankSession,
      completeRankSession,
      failRankSession,
      openPanel,
      closePanel,
      clearSession,
    }),
    [
      result,
      loading,
      error,
      isOpen,
      status,
      hasSession,
      startRankSession,
      completeRankSession,
      failRankSession,
      openPanel,
      closePanel,
      clearSession,
    ]
  );

  return (
    <CompareRankPanelContext.Provider value={value}>
      {children}
    </CompareRankPanelContext.Provider>
  );
}

export function useCompareRankPanel() {
  const ctx = useContext(CompareRankPanelContext);
  if (!ctx) {
    throw new Error("useCompareRankPanel must be used within CompareRankPanelProvider");
  }
  return ctx;
}
