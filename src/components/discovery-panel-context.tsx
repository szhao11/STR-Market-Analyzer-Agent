"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DiscoveryResult } from "@/lib/agent/discovery/types";

export type DiscoveryStatus = "idle" | "loading" | "ready" | "error";

type DiscoveryPanelContextValue = {
  result: DiscoveryResult | null;
  loading: boolean;
  error: string | null;
  loadingMessage: string;
  isOpen: boolean;
  status: DiscoveryStatus;
  hasSession: boolean;
  startDiscoverySession: () => void;
  setLoadingMessage: (message: string) => void;
  completeDiscoverySession: (result: DiscoveryResult) => void;
  failDiscoverySession: (error: string) => void;
  openPanel: () => void;
  closePanel: () => void;
  clearSession: () => void;
};

const DiscoveryPanelContext = createContext<DiscoveryPanelContextValue | null>(null);

export function DiscoveryPanelProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessageState] = useState("Parsing your criteria…");
  const [isOpen, setIsOpen] = useState(false);

  const hasSession = loading || result !== null || error !== null;

  const status: DiscoveryStatus = loading
    ? "loading"
    : error
      ? "error"
      : result
        ? "ready"
        : "idle";

  const startDiscoverySession = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(true);
    setLoadingMessageState("Parsing your criteria…");
    setIsOpen(true);
  }, []);

  const setLoadingMessage = useCallback((message: string) => {
    setLoadingMessageState(message);
  }, []);

  const completeDiscoverySession = useCallback((next: DiscoveryResult) => {
    setResult(next);
    setError(null);
    setLoading(false);
    setIsOpen(true);
  }, []);

  const failDiscoverySession = useCallback((message: string) => {
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
      loadingMessage,
      isOpen,
      status,
      hasSession,
      startDiscoverySession,
      setLoadingMessage,
      completeDiscoverySession,
      failDiscoverySession,
      openPanel,
      closePanel,
      clearSession,
    }),
    [
      result,
      loading,
      error,
      loadingMessage,
      isOpen,
      status,
      hasSession,
      startDiscoverySession,
      setLoadingMessage,
      completeDiscoverySession,
      failDiscoverySession,
      openPanel,
      closePanel,
      clearSession,
    ]
  );

  return (
    <DiscoveryPanelContext.Provider value={value}>
      {children}
    </DiscoveryPanelContext.Provider>
  );
}

export function useDiscoveryPanel() {
  const ctx = useContext(DiscoveryPanelContext);
  if (!ctx) {
    throw new Error("useDiscoveryPanel must be used within DiscoveryPanelProvider");
  }
  return ctx;
}
