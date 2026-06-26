import { z } from "zod";

const allowedRatingSchema = z.enum(["Strong Buy", "Buy", "Hold / Watch"]);

export const discoveryCriteriaSchema = z.object({
  intentSummary: z.string(),
  limit: z.number().int().min(1).max(10),
  statesInclude: z.array(z.string().length(2)).nullable(),
  statesExclude: z.array(z.string().length(2)).nullable(),
  absenteeInvestor: z.boolean().nullable(),
  excludeRestrictive: z.boolean().nullable(),
  excludeSnapshotIds: z.array(z.string()).nullable(),
  maxPurchasePrice: z.number().positive().nullable(),
  minOccupancy: z.number().min(0).max(100).nullable(),
  minRevpar: z.number().positive().nullable(),
  minOverallScore: z.number().min(0).max(10).nullable(),
  minCashOnCash: z.number().nullable(),
  minPopulation: z.number().positive().nullable(),
  maxAffordabilityIndex: z.number().positive().nullable(),
  ratingsAllow: z.array(allowedRatingSchema).nullable(),
  preferUnanalyzed: z.boolean().nullable(),
  requireFresh: z.boolean().nullable(),
});

export const discoverySummarySchema = z.object({
  summary: z.string(),
  ranked: z.array(
    z.object({
      snapshotId: z.string(),
      rationale: z.string(),
    })
  ),
});

export type DiscoveryCriteriaOutput = z.infer<typeof discoveryCriteriaSchema>;
export type DiscoverySummaryOutput = z.infer<typeof discoverySummarySchema>;
