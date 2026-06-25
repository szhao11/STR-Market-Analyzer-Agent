import { getCached, getCacheKey, setCache } from "@/lib/cache";
import { getStateFips } from "@/lib/state-fips";

const BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/";

interface BlsResult {
  unemploymentRate: number | null;
  jobGrowthPct: number | null;
}

interface BlsDataPoint {
  year: string;
  period: string;
  value: string;
}

function buildUnemploymentSeriesId(stateFips: string, cbsaCode: string): string {
  return `LAUMT${stateFips}${cbsaCode}00000003`;
}

function buildEmploymentSeriesId(stateFips: string, cbsaCode: string): string {
  return `SMU${stateFips}${cbsaCode}0000000001`;
}

function sortBlsData(data: BlsDataPoint[]): BlsDataPoint[] {
  return [...data].sort((a, b) => {
    const aDate = `${a.year}-${a.period}`;
    const bDate = `${b.year}-${b.period}`;
    return bDate.localeCompare(aDate);
  });
}

export async function fetchBlsData(cbsaCode: string, stateAbbr: string): Promise<BlsResult> {
  const stateFips = getStateFips(stateAbbr);
  const cacheKey = getCacheKey("bls", `employment:${stateAbbr}:${cbsaCode}`);
  const cached = getCached<BlsResult>(cacheKey);
  if (cached) return cached;

  const empty: BlsResult = { unemploymentRate: null, jobGrowthPct: null };

  if (!stateFips) {
    console.warn(`Unknown state abbreviation for BLS: ${stateAbbr}`);
    return empty;
  }

  const apiKey = process.env.BLS_API_KEY;

  try {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 4;

    const unemploymentId = buildUnemploymentSeriesId(stateFips, cbsaCode);
    const employmentId = buildEmploymentSeriesId(stateFips, cbsaCode);

    const body: Record<string, unknown> = {
      seriesid: [unemploymentId, employmentId],
      startyear: String(startYear),
      endyear: String(currentYear),
    };
    if (apiKey) body.registrationkey = apiKey;

    const response = await fetch(BLS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`BLS API error: ${response.status}`);

    const json = await response.json();
    if (json?.status !== "REQUEST_SUCCEEDED") {
      console.error("BLS API request failed:", json?.message);
      return empty;
    }

    const series = json?.Results?.series;
    let unemploymentRate: number | null = null;
    let jobGrowthPct: number | null = null;

    if (Array.isArray(series)) {
      for (const s of series) {
        const data = s?.data;
        if (!Array.isArray(data) || data.length === 0) continue;

        const seriesId = String(s.seriesID ?? s.seriesId ?? "");

        if (seriesId === unemploymentId) {
          const latest = data[0];
          const val = parseFloat(latest.value);
          if (!isNaN(val)) unemploymentRate = val;
        }

        if (seriesId === employmentId) {
          const sorted = sortBlsData(data);
          if (sorted.length >= 13) {
            const current = parseFloat(sorted[0].value);
            const yearAgo = parseFloat(sorted[12].value);
            if (!isNaN(current) && !isNaN(yearAgo) && yearAgo > 0) {
              jobGrowthPct = Math.round(((current - yearAgo) / yearAgo) * 100 * 10) / 10;
            }
          }
        }
      }
    }

    const result: BlsResult = { unemploymentRate, jobGrowthPct };
    if (unemploymentRate !== null || jobGrowthPct !== null) {
      setCache(cacheKey, result, "bls");
    }
    return result;
  } catch (error) {
    console.error("BLS API fetch error:", error, { cbsaCode, stateAbbr, stateFips });
    return empty;
  }
}
