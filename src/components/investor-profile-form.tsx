"use client";

import { useEffect, useState } from "react";
import { InvestorProfile, DEFAULT_INVESTOR_PROFILE } from "@/lib/agent/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ma-investor-profile";
const DISCOVER_PROFILE_ENABLED_KEY = "ma-discover-use-profile";

export function InvestorProfileForm({
  profile,
  onChange,
  enabled,
  onEnabledChange,
}: {
  profile: InvestorProfile;
  onChange: (profile: InvestorProfile) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
}) {
  const [open, setOpen] = useState(true);
  const profileEnabled = enabled ?? true;

  return (
    <Card className={!profileEnabled ? "opacity-60" : undefined}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            Investor Profile
          </CardTitle>
          <div className="flex items-center gap-2">
            {onEnabledChange && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileEnabled}
                  onChange={(e) => onEnabledChange(e.target.checked)}
                  className="rounded border"
                />
                Apply to discovery
              </label>
            )}
            <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {onEnabledChange
            ? profileEnabled
              ? "Budget, absentee, and cash-flow defaults shape discovery results alongside your query."
              : "Off — discovery uses only what you type in the query."
            : "Used for compare, rank, and discover — saved locally in your browser."}
        </p>
      </CardHeader>
      {open && (
        <CardContent
          className={cn(
            "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
            !profileEnabled && "pointer-events-none"
          )}
        >
          <Field
            label="Max purchase price"
            type="number"
            value={profile.maxPurchasePrice}
            onChange={(v) => onChange({ ...profile, maxPurchasePrice: v })}
            prefix="$"
          />
          <Field
            label="Down payment %"
            type="number"
            value={profile.downPaymentPct}
            onChange={(v) => onChange({ ...profile, downPaymentPct: v })}
            suffix="%"
          />
          <Field
            label="Interest rate %"
            type="number"
            step="0.1"
            value={profile.interestRate}
            onChange={(v) => onChange({ ...profile, interestRate: v })}
            suffix="%"
          />
          <Field
            label="Loan term (years)"
            type="number"
            value={profile.loanTermYears}
            onChange={(v) => onChange({ ...profile, loanTermYears: v })}
          />
          <Field
            label="STR expense ratio %"
            type="number"
            value={profile.expenseRatioPct}
            onChange={(v) => onChange({ ...profile, expenseRatioPct: v })}
            suffix="%"
          />
          <Field
            label="Min monthly cash flow"
            type="number"
            value={profile.minMonthlyCashFlow}
            onChange={(v) => onChange({ ...profile, minMonthlyCashFlow: v })}
            prefix="$"
          />
          <label className="flex items-center gap-2 text-sm sm:col-span-2 lg:col-span-3 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.absenteeInvestor}
              onChange={(e) => onChange({ ...profile, absenteeInvestor: e.target.checked })}
              className="rounded border"
            />
            Absentee investor (apply regulation gates strictly)
          </label>
        </CardContent>
      )}
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
  prefix,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  type?: string;
  step?: string;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {prefix}
          </span>
        )}
        <Input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className={prefix ? "pl-7" : suffix ? "pr-7" : ""}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function useInvestorProfile(): [InvestorProfile, (p: InvestorProfile) => void] {
  const [profile, setProfile] = useState<InvestorProfile>(DEFAULT_INVESTOR_PROFILE);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<InvestorProfile>;
        setProfile({ ...DEFAULT_INVESTOR_PROFILE, ...parsed });
      }
    } catch {
      // ignore
    }
  }, []);

  const update = (next: InvestorProfile) => {
    setProfile(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return [profile, update];
}

export function useDiscoverProfileEnabled(): [boolean, (enabled: boolean) => void] {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISCOVER_PROFILE_ENABLED_KEY);
      if (raw != null) {
        setEnabled(raw === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const update = (next: boolean) => {
    setEnabled(next);
    try {
      localStorage.setItem(DISCOVER_PROFILE_ENABLED_KEY, String(next));
    } catch {
      // ignore
    }
  };

  return [enabled, update];
}
