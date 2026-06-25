import { z } from "zod";

export const briefBulletSchema = z.object({
  text: z.string(),
  metricRefs: z.array(z.string()),
});

export const marketBriefSchema = z.object({
  verdict: z.enum(["Pursue", "Watch", "Pass"]),
  verdictAlignsWithRating: z.boolean(),
  headline: z.string(),
  regulationSummary: z.string(),
  strengths: z.array(briefBulletSchema).max(3),
  risks: z.array(briefBulletSchema).max(3),
  strOutlook: z.string().nullable(),
  ltrFallback: z.string().nullable(),
  dataCaveats: z.array(z.string()),
});

export const scoreExplainSectionSchema = z.object({
  category: z.string(),
  summary: z.string(),
  highlights: z.array(z.string()),
});

export const marketBriefExplainSchema = marketBriefSchema.extend({
  explain: z.array(scoreExplainSectionSchema),
});

export const rankedMarketSchema = z.object({
  rank: z.number().int().positive(),
  city: z.string(),
  stateAbbr: z.string(),
  snapshotId: z.string(),
  score: z.number(),
  rating: z.string(),
  rationale: z.string(),
  keyMetric: z.string(),
});

export const compareRankResultSchema = z.object({
  summary: z.string(),
  ranked: z.array(rankedMarketSchema),
});

export const investorProfileSchema = z.object({
  maxPurchasePrice: z.number().positive(),
  downPaymentPct: z.number().min(0).max(100),
  interestRate: z.number().min(0).max(30),
  loanTermYears: z.number().int().min(1).max(40),
  expenseRatioPct: z.number().min(0).max(100),
  absenteeInvestor: z.boolean(),
  minMonthlyCashFlow: z.number(),
});

export type MarketBriefOutput = z.infer<typeof marketBriefSchema>;
export type MarketBriefExplainOutput = z.infer<typeof marketBriefExplainSchema>;
export type CompareRankOutput = z.infer<typeof compareRankResultSchema>;
