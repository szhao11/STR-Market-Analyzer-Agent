"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type BriefStatus = "idle" | "loading" | "ready" | "error" | "unavailable";

export type BriefMarket = { city: string; stateAbbr: string };

type BriefPanelContextValue = {
  market: BriefMarket | null;
  isOpen: boolean;
  status: BriefStatus;
  setMarket: (market: BriefMarket | null) => void;
  setStatus: (status: BriefStatus) => void;
  openPanel: () => void;
  closePanel: () => void;
  onBriefReady: () => void;
};

const BriefPanelContext = createContext<BriefPanelContextValue | null>(null);

export function BriefPanelProvider({ children }: { children: ReactNode }) {
  const [market, setMarketState] = useState<BriefMarket | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<BriefStatus>("idle");

  const setMarket = useCallback((next: BriefMarket | null) => {
    setMarketState(next);
    setStatus("idle");
    if (!next) setIsOpen(false);
  }, []);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  const onBriefReady = useCallback(() => {
    setStatus("ready");
    setIsOpen(true);
  }, []);

  const value = useMemo(
    () => ({
      market,
      isOpen,
      status,
      setMarket,
      setStatus,
      openPanel,
      closePanel,
      onBriefReady,
    }),
    [market, isOpen, status, setMarket, openPanel, closePanel, onBriefReady]
  );

  return (
    <BriefPanelContext.Provider value={value}>{children}</BriefPanelContext.Provider>
  );
}

export function useBriefPanel() {
  const ctx = useContext(BriefPanelContext);
  if (!ctx) {
    throw new Error("useBriefPanel must be used within BriefPanelProvider");
  }
  return ctx;
}
