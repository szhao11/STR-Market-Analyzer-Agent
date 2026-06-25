"use client";

import { useState } from "react";
import { MarketSnapshot } from "@/types/market";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, DollarSign, Percent, TrendingUp, AlertTriangle } from "lucide-react";

type RentalMode = "ltr" | "str";

export function InvestmentCalculator({ snapshot }: { snapshot: MarketSnapshot }) {
  const defaultPrice = snapshot.medianHomePrice || 250000;
  const defaultLtrRent = snapshot.medianRent || 1500;
  const defaultStrMonthly = snapshot.strMonthlyRevenue ?? snapshot.strAnnualRevenue
    ? Math.round((snapshot.strAnnualRevenue ?? 0) / 12)
    : null;
  const hasStrData = defaultStrMonthly != null && defaultStrMonthly > 0;

  const [mode, setMode] = useState<RentalMode>(hasStrData ? "str" : "ltr");
  const [purchasePrice, setPurchasePrice] = useState(defaultPrice);
  const [downPaymentPct, setDownPaymentPct] = useState(25);
  const [interestRate, setInterestRate] = useState(7);
  const [loanTermYears, setLoanTermYears] = useState(30);
  const [monthlyRent, setMonthlyRent] = useState(
    mode === "str" && defaultStrMonthly ? defaultStrMonthly : defaultLtrRent
  );
  const [expenseRatio, setExpenseRatio] = useState(mode === "str" ? 40 : 35);
  const [occupancyRate, setOccupancyRate] = useState(
    snapshot.strOccupancyRate ?? 70
  );

  const switchMode = (next: RentalMode) => {
    setMode(next);
    if (next === "str" && defaultStrMonthly) {
      setMonthlyRent(defaultStrMonthly);
      setExpenseRatio(40);
    } else {
      setMonthlyRent(defaultLtrRent);
      setExpenseRatio(35);
    }
  };

  const downPayment = purchasePrice * (downPaymentPct / 100);
  const closingCosts = purchasePrice * 0.03;
  const totalCashInvested = downPayment + closingCosts;
  const loanAmount = purchasePrice - downPayment;

  const monthlyRate = interestRate / 100 / 12;
  const numPayments = loanTermYears * 12;
  const monthlyMortgage =
    monthlyRate > 0
      ? (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numPayments))
      : loanAmount / numPayments;

  const grossAnnualRevenue = monthlyRent * 12;
  const effectiveAnnualRevenue =
    mode === "str" ? grossAnnualRevenue * (occupancyRate / 100) : grossAnnualRevenue;
  const annualExpenses = effectiveAnnualRevenue * (expenseRatio / 100);
  const noi = effectiveAnnualRevenue - annualExpenses;
  const annualMortgage = monthlyMortgage * 12;
  const annualCashFlow = noi - annualMortgage;
  const monthlyCashFlow = annualCashFlow / 12;

  const capRate = (noi / purchasePrice) * 100;
  const cashOnCash = totalCashInvested > 0 ? (annualCashFlow / totalCashInvested) * 100 : 0;
  const breakEvenOccupancy =
    mode === "str" && grossAnnualRevenue > 0
      ? ((annualExpenses + annualMortgage) / grossAnnualRevenue) * 100
      : annualRentBreakEven(grossAnnualRevenue, annualExpenses, annualMortgage);

  const cashFlowSignal = monthlyCashFlow >= 1000 ? "green" : monthlyCashFlow >= 500 ? "yellow" : "red";
  const strRegulationBlocked =
    mode === "str" &&
    (snapshot.strInvestorEligible === false ||
      snapshot.strRegulationScore === "restrictive" ||
      snapshot.strRegulationScore === "banned");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Investment Calculator</CardTitle>
          </div>
          {hasStrData && (
            <div className="flex rounded-lg border p-0.5">
              <Button
                variant={mode === "ltr" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => switchMode("ltr")}
              >
                Long-Term
              </Button>
              <Button
                variant={mode === "str" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => switchMode("str")}
              >
                STR
              </Button>
            </div>
          )}
        </div>
        {mode === "str" && (
          <p className="text-sm text-muted-foreground">
            Pre-filled from Apify STR data
            {snapshot.strTypicalMinNights != null && (
              <span> · typical min stay {snapshot.strTypicalMinNights} nights</span>
            )}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {strRegulationBlocked && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              STR assumptions may not apply — this market has restrictive regulations or is not
              investor-eligible. Consider Long-Term mode or verify local ordinances.
            </span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Inputs
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Purchase Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(Number(e.target.value))}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Down Payment %</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={downPaymentPct}
                      onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Interest Rate %</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      step="0.1"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Number(e.target.value))}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Loan Term (years)</label>
                  <Input
                    type="number"
                    value={loanTermYears}
                    onChange={(e) => setLoanTermYears(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {mode === "str" ? "Gross Monthly Revenue" : "Monthly Rent"}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              {mode === "str" && (
                <div>
                  <label className="text-sm font-medium mb-1 block">Occupancy Rate %</label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="number"
                      value={occupancyRate}
                      onChange={(e) => setOccupancyRate(Number(e.target.value))}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Expense Ratio % (mgmt, repairs, vacancy, insurance)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={expenseRatio}
                    onChange={(e) => setExpenseRatio(Number(e.target.value))}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Results
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <ResultCard
                label="Monthly Cash Flow"
                value={formatCurrency(monthlyCashFlow)}
                signal={cashFlowSignal}
                icon={DollarSign}
              />
              <ResultCard
                label="Cap Rate"
                value={formatPercent(capRate)}
                signal={capRate > 8 ? "green" : capRate >= 5 ? "yellow" : "red"}
                icon={TrendingUp}
              />
              <ResultCard
                label="Cash-on-Cash"
                value={formatPercent(cashOnCash)}
                signal={cashOnCash > 12 ? "green" : cashOnCash >= 8 ? "yellow" : "red"}
                icon={Percent}
              />
              <ResultCard
                label="Break-Even Occ."
                value={formatPercent(breakEvenOccupancy)}
                signal={breakEvenOccupancy < 45 ? "green" : breakEvenOccupancy <= 60 ? "yellow" : "red"}
                icon={AlertTriangle}
              />
            </div>

            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              {mode === "str" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Effective Annual Revenue</span>
                  <span className="font-medium">{formatCurrency(effectiveAnnualRevenue)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Down Payment</span>
                <span className="font-medium">{formatCurrency(downPayment)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Closing Costs (~3%)</span>
                <span className="font-medium">{formatCurrency(closingCosts)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground font-medium">Total Cash Invested</span>
                <span className="font-bold">{formatCurrency(totalCashInvested)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Mortgage</span>
                <span className="font-medium">{formatCurrency(monthlyMortgage)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Expenses</span>
                <span className="font-medium">{formatCurrency(annualExpenses / 12)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Annual NOI</span>
                <span className="font-medium">{formatCurrency(noi)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function annualRentBreakEven(
  annualRent: number,
  annualExpenses: number,
  annualMortgage: number
): number {
  return annualRent > 0 ? ((annualExpenses + annualMortgage) / annualRent) * 100 : 0;
}

function ResultCard({
  label,
  value,
  signal,
  icon: Icon,
}: {
  label: string;
  value: string;
  signal: string;
  icon: React.ElementType;
}) {
  const colorMap: Record<string, string> = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <div className={`rounded-lg border p-3 ${colorMap[signal] || ""}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3.5 w-3.5 opacity-60" />
        <span className="text-xs font-medium opacity-70">{label}</span>
      </div>
      <span className="text-xl font-bold">{value}</span>
    </div>
  );
}
