import { getCached, getCacheKey, setCache } from "@/lib/cache";
import { StrListingPin, MarketSnapshot } from "@/types/market";

const APIFY_ACTOR_ID = "malikgen~airbnb-revenue-calculator";
const APIFY_BASE_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items`;

interface ApifyListingResult {
  listingId?: string;
  name?: string;
  url?: string;
  propertyType?: string | null;
  coordinates?: { lat?: number | null; lng?: number | null } | null;
  bedrooms?: number | null;
  beds?: number | null;
  bathrooms?: number | null;
  personCapacity?: number | null;
  rating?: number | null;
  reviewsCount?: number | null;
  isSuperhost?: boolean | null;
  adr: number | null;
  occupancyUsedPct: number | null;
  occupancyPct?: {
    d30?: number | null;
    d60?: number | null;
    d90?: number | null;
    d365?: number | null;
  } | null;
  revPAR?: number | null;
  revpar?: number | null;
  estimatedRevenueMonthly?: number | null;
  estimatedRevenueAnnual: number | null;
  bookedNights?: number | null;
  availableNights?: number | null;
  typicalMinNights?: number | null;
  nextAvailableDate?: string | null;
}

export interface ApifyStrResult {
  strAdr: number | null;
  strOccupancyRate: number | null;
  strRevpar: number | null;
  strAnnualRevenue: number | null;
  strMonthlyRevenue: number | null;
  strActiveListings: number | null;
  strSeasonalityScore: number | null;
  strOccupancyD30: number | null;
  strOccupancyD60: number | null;
  strOccupancyD90: number | null;
  strOccupancyD365: number | null;
  strAvgRating: number | null;
  strMedianReviews: number | null;
  strSuperhostPct: number | null;
  strMedianBedrooms: number | null;
  strTypicalMinNights: number | null;
  strBookedNights: number | null;
  strAvailableNights: number | null;
  strAdrP25: number | null;
  strAdrP75: number | null;
  strSegment2brAdr: number | null;
  strSegment2brOccupancy: number | null;
  strSegment2brRevpar: number | null;
  strSegment2brCount: number | null;
  strListingPins: StrListingPin[];
  strFetchError: string | null;
}

export const EMPTY_APIFY_STR_RESULT: ApifyStrResult = {
  strAdr: null,
  strOccupancyRate: null,
  strRevpar: null,
  strAnnualRevenue: null,
  strMonthlyRevenue: null,
  strActiveListings: null,
  strSeasonalityScore: null,
  strOccupancyD30: null,
  strOccupancyD60: null,
  strOccupancyD90: null,
  strOccupancyD365: null,
  strAvgRating: null,
  strMedianReviews: null,
  strSuperhostPct: null,
  strMedianBedrooms: null,
  strTypicalMinNights: null,
  strBookedNights: null,
  strAvailableNights: null,
  strAdrP25: null,
  strAdrP75: null,
  strSegment2brAdr: null,
  strSegment2brOccupancy: null,
  strSegment2brRevpar: null,
  strSegment2brCount: null,
  strListingPins: [],
  strFetchError: null,
};

export type ApifyStrPhase = "quick" | "full";

export function getApifyStrTargetMax(): number {
  const maxResults = Number(process.env.APIFY_STR_MAX_LISTINGS ?? "3");
  const actorTimeoutSecs = Math.min(
    Number(process.env.APIFY_RUN_TIMEOUT_SECS ?? "300"),
    300
  );
  const listingsCap = Math.max(1, Math.floor(actorTimeoutSecs / 35));
  return Math.min(Number.isFinite(maxResults) ? maxResults : 3, listingsCap);
}

export function isStrResultComplete(
  result: Pick<ApifyStrResult, "strAdr" | "strActiveListings">,
  targetMax = getApifyStrTargetMax()
): boolean {
  return (
    result.strAdr != null &&
    (result.strActiveListings ?? 0) >= targetMax
  );
}

export function isStrSnapshotComplete(
  snapshot: Pick<MarketSnapshot, "strAdr" | "strActiveListings" | "strLoadComplete">
): boolean {
  if (snapshot.strLoadComplete === true) return true;
  if (snapshot.strLoadComplete === false) return false;
  return isStrResultComplete(snapshot);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 100) / 100
    : Math.round(sorted[mid] * 100) / 100;
}

function percentile(values: number[], pct: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (pct / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return round(sorted[lower]);
  const weight = idx - lower;
  return round(sorted[lower] * (1 - weight) + sorted[upper] * weight);
}

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function isEntireHome2brPlus(listing: ApifyListingResult): boolean {
  const bedrooms = listing.bedrooms ?? 0;
  const type = listing.propertyType?.toLowerCase() ?? "";
  const isWholeUnit =
    type.includes("entire") ||
    type.includes("home") ||
    type.includes("house") ||
    type.includes("villa") ||
    type.includes("apartment");
  return bedrooms >= 2 && isWholeUnit;
}

function computeSeasonalityScore(listings: ApifyListingResult[]): number | null {
  const spreads: number[] = [];

  for (const listing of listings) {
    const d30 = listing.occupancyPct?.d30;
    const d365 = listing.occupancyPct?.d365;
    if (d30 == null || d365 == null || d365 === 0) continue;
    spreads.push(Math.abs(d30 - d365) / d365);
  }

  if (spreads.length === 0) return null;

  const avgSpread = spreads.reduce((sum, v) => sum + v, 0) / spreads.length;
  return round(Math.max(0, Math.min(100, 100 - avgSpread * 100)), 1);
}

function medianOccupancyWindow(
  listings: ApifyListingResult[],
  key: "d30" | "d60" | "d90" | "d365"
): number | null {
  const values = listings
    .map((l) => l.occupancyPct?.[key])
    .filter((v): v is number => v != null && v >= 0);
  const result = median(values);
  return result != null ? round(result, 1) : null;
}

function buildListingPins(listings: ApifyListingResult[]): StrListingPin[] {
  return listings
    .filter(
      (l) =>
        l.coordinates?.lat != null &&
        l.coordinates?.lng != null &&
        l.adr != null &&
        l.adr > 0
    )
    .map((l) => ({
      lat: l.coordinates!.lat!,
      lng: l.coordinates!.lng!,
      adr: round(l.adr!),
      rating: l.rating ?? null,
    }));
}

function aggregateSubset(listings: ApifyListingResult[]) {
  const adrs = listings.map((l) => l.adr).filter((v): v is number => v != null && v > 0);
  const occupancies = listings
    .map((l) => l.occupancyUsedPct)
    .filter((v): v is number => v != null && v >= 0);
  const revpars = listings
    .map((l) => l.revPAR ?? l.revpar)
    .filter((v): v is number => v != null && v > 0);

  const strAdr = median(adrs);
  const strOccupancyRate = median(occupancies);
  const strRevpar =
    median(revpars) ??
    (strAdr != null && strOccupancyRate != null
      ? round(strAdr * (strOccupancyRate / 100), 2)
      : null);

  return { strAdr, strOccupancyRate, strRevpar, count: listings.length };
}

function aggregateListings(listings: ApifyListingResult[]): ApifyStrResult {
  if (listings.length === 0) return { ...EMPTY_APIFY_STR_RESULT };

  const adrs = listings.map((l) => l.adr).filter((v): v is number => v != null && v > 0);
  const occupancies = listings
    .map((l) => l.occupancyUsedPct)
    .filter((v): v is number => v != null && v >= 0);
  const revpars = listings
    .map((l) => l.revPAR ?? l.revpar)
    .filter((v): v is number => v != null && v > 0);
  const monthlyRevenues = listings
    .map((l) => l.estimatedRevenueMonthly)
    .filter((v): v is number => v != null && v > 0);
  const annualRevenues = listings
    .map((l) => l.estimatedRevenueAnnual)
    .filter((v): v is number => v != null && v > 0);
  const ratings = listings
    .map((l) => l.rating)
    .filter((v): v is number => v != null && v > 0);
  const reviews = listings
    .map((l) => l.reviewsCount)
    .filter((v): v is number => v != null && v >= 0);
  const bedrooms = listings
    .map((l) => l.bedrooms)
    .filter((v): v is number => v != null && v > 0);
  const minNights = listings
    .map((l) => l.typicalMinNights)
    .filter((v): v is number => v != null && v > 0);
  const booked = listings
    .map((l) => l.bookedNights)
    .filter((v): v is number => v != null && v >= 0);
  const available = listings
    .map((l) => l.availableNights)
    .filter((v): v is number => v != null && v >= 0);

  const superhostCount = listings.filter((l) => l.isSuperhost === true).length;

  const strAdr = median(adrs);
  const strOccupancyRate = median(occupancies);
  const strRevpar =
    median(revpars) ??
    (strAdr != null && strOccupancyRate != null
      ? round(strAdr * (strOccupancyRate / 100), 2)
      : null);
  const strAnnualRevenue =
    median(annualRevenues) ??
    (strRevpar != null ? round(strRevpar * 365) : null);
  const strMonthlyRevenue =
    median(monthlyRevenues) ??
    (strRevpar != null ? round(strRevpar * 30) : null);

  const segment2br = aggregateSubset(listings.filter(isEntireHome2brPlus));

  return {
    strAdr: strAdr != null ? round(strAdr) : null,
    strOccupancyRate: strOccupancyRate != null ? round(strOccupancyRate, 1) : null,
    strRevpar,
    strAnnualRevenue: strAnnualRevenue != null ? round(strAnnualRevenue) : null,
    strMonthlyRevenue: strMonthlyRevenue != null ? round(strMonthlyRevenue) : null,
    strActiveListings: listings.length,
    strSeasonalityScore: computeSeasonalityScore(listings),
    strOccupancyD30: medianOccupancyWindow(listings, "d30"),
    strOccupancyD60: medianOccupancyWindow(listings, "d60"),
    strOccupancyD90: medianOccupancyWindow(listings, "d90"),
    strOccupancyD365: medianOccupancyWindow(listings, "d365"),
    strAvgRating: ratings.length > 0 ? round(median(ratings)!, 2) : null,
    strMedianReviews: median(reviews) != null ? round(median(reviews)!) : null,
    strSuperhostPct:
      listings.length > 0 ? round((superhostCount / listings.length) * 100, 1) : null,
    strMedianBedrooms: median(bedrooms) != null ? round(median(bedrooms)!) : null,
    strTypicalMinNights: median(minNights) != null ? round(median(minNights)!) : null,
    strBookedNights: median(booked) != null ? round(median(booked)!) : null,
    strAvailableNights: median(available) != null ? round(median(available)!) : null,
    strAdrP25: percentile(adrs, 25),
    strAdrP75: percentile(adrs, 75),
    strSegment2brAdr: segment2br.strAdr != null ? round(segment2br.strAdr) : null,
    strSegment2brOccupancy:
      segment2br.strOccupancyRate != null ? round(segment2br.strOccupancyRate, 1) : null,
    strSegment2brRevpar: segment2br.strRevpar,
    strSegment2brCount: segment2br.count > 0 ? segment2br.count : null,
    strListingPins: buildListingPins(listings),
    strFetchError: null,
  };
}

function parseApifyError(status: number, body: string): string {
  try {
    const json = JSON.parse(body);
    const msg = json?.error?.message;
    if (msg) {
      if (json.error.type === "actor-memory-limit-exceeded") {
        return "Apify memory limit reached — stuck actor runs were cleared; retrying. If this persists, open console.apify.com → Runs and abort any running jobs, or upgrade your plan.";
      }
      return `Apify error (${status}): ${msg}`;
    }
  } catch {
    // fall through
  }
  return `Apify request failed (${status})`;
}

async function abortRunningActorRuns(apiToken: string): Promise<number> {
  const listUrl = `https://api.apify.com/v2/actor-runs?token=${apiToken}&status=RUNNING&limit=20`;
  const listRes = await fetch(listUrl, { cache: "no-store" });
  if (!listRes.ok) return 0;

  const listJson = await listRes.json();
  const runs: { id: string }[] = listJson?.data?.items ?? [];
  let aborted = 0;

  for (const run of runs) {
    const abortRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${run.id}/abort?token=${apiToken}`,
      { method: "POST", cache: "no-store" }
    );
    if (abortRes.ok) aborted++;
  }

  if (aborted > 0) {
    console.warn(`Aborted ${aborted} stuck Apify actor run(s) to free memory`);
    await new Promise((r) => setTimeout(r, 3000));
  }

  return aborted;
}

async function callApifyActor(
  apiToken: string,
  location: string,
  effectiveMaxResults: number,
  actorTimeoutSecs: number,
  clientTimeoutMs: number
): Promise<ApifyStrResult> {
  const url = new URL(APIFY_BASE_URL);
  url.searchParams.set("token", apiToken);
  url.searchParams.set("timeout", String(actorTimeoutSecs));

  const controller = new AbortController();
  const clientTimeout = setTimeout(() => controller.abort(), clientTimeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location,
        maxResults: effectiveMaxResults,
        currency: "USD",
      }),
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`Apify STR API error: ${response.status}`, body.slice(0, 500));
      return {
        ...EMPTY_APIFY_STR_RESULT,
        strFetchError: parseApifyError(response.status, body),
      };
    }

    const listings = (await response.json()) as ApifyListingResult[];
    if (!Array.isArray(listings)) {
      return {
        ...EMPTY_APIFY_STR_RESULT,
        strFetchError: "Apify returned an unexpected response format",
      };
    }

    const result = aggregateListings(listings.filter((l) => l && typeof l === "object"));
    if (result.strAdr != null || result.strOccupancyRate != null) {
      return { ...result, strFetchError: null };
    }

    return {
      ...result,
      strFetchError: listings.length === 0
        ? "Apify returned no listings for this market"
        : "Apify listings had no usable ADR or occupancy data",
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ...EMPTY_APIFY_STR_RESULT,
        strFetchError: `Apify timed out after ${Math.round(clientTimeoutMs / 1000)}s — try reducing APIFY_STR_MAX_LISTINGS in .env.local`,
      };
    }
    console.error("Apify STR API fetch error:", error, { location });
    return {
      ...EMPTY_APIFY_STR_RESULT,
      strFetchError: error instanceof Error ? error.message : "Apify request failed",
    };
  } finally {
    clearTimeout(clientTimeout);
  }
}

export async function fetchApifyStrData(
  city: string,
  stateAbbr: string,
  options?: { skipCache?: boolean; phase?: ApifyStrPhase }
): Promise<ApifyStrResult> {
  const location = `${city}, ${stateAbbr}`;
  const phase = options?.phase ?? "full";
  const targetMax = getApifyStrTargetMax();
  const effectiveMaxResults = phase === "quick" ? 1 : targetMax;
  const cacheKey = getCacheKey(
    "str",
    `apify:${phase}:${location.toLowerCase()}`
  );
  if (!options?.skipCache) {
    const cached = getCached<ApifyStrResult>(cacheKey);
    if (cached) return cached;
  }

  const apiToken = process.env.APIFY_API_TOKEN;
  if (!apiToken) {
    return {
      ...EMPTY_APIFY_STR_RESULT,
      strFetchError: "APIFY_API_TOKEN is not set in .env.local",
    };
  }

  const actorTimeoutSecs = Math.min(
    Number(process.env.APIFY_RUN_TIMEOUT_SECS ?? "300"),
    300
  );
  const clientTimeoutMs =
    Number(process.env.APIFY_CLIENT_TIMEOUT_MS) ||
    actorTimeoutSecs * 1000 + 30_000;

  let result = await callApifyActor(
    apiToken,
    location,
    effectiveMaxResults,
    actorTimeoutSecs,
    clientTimeoutMs
  );

  if (result.strFetchError?.includes("memory limit")) {
    await abortRunningActorRuns(apiToken);
    result = await callApifyActor(
      apiToken,
      location,
      effectiveMaxResults,
      actorTimeoutSecs,
      clientTimeoutMs
    );
  }

  const hasUsableData = result.strAdr != null || result.strOccupancyRate != null;
  if (!result.strFetchError && hasUsableData) {
    const complete =
      phase === "full" && isStrResultComplete(result, targetMax);
    if (phase === "quick" || complete) {
      setCache(cacheKey, result, "str");
    }
  }

  return result;
}
