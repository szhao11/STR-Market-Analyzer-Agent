import { getCached, getCacheKey, setCache } from "@/lib/cache";
import { getStateCrimeRates } from "@/lib/state-crime-rates";

const FBI_API_URL = "https://api.usa.gov/crime/fbi/sapi";

interface FbiCrimeResult {
  crimeRateViolent: number | null;
  crimeRateProperty: number | null;
}

export async function fetchCrimeData(stateAbbr: string, _city?: string): Promise<FbiCrimeResult> {
  const cacheKey = getCacheKey("fbi", `crime:${stateAbbr}`);
  const cached = getCached<FbiCrimeResult>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.FBI_API_KEY;

  if (!apiKey) {
    const fallback = getStateCrimeRates(stateAbbr);
    if (fallback) {
      return {
        crimeRateViolent: fallback.violent,
        crimeRateProperty: fallback.property,
      };
    }
    console.warn("FBI_API_KEY not set — using static state crime estimates");
    return { crimeRateViolent: null, crimeRateProperty: null };
  }

  try {
    const endYear = new Date().getFullYear() - 1;
    const startYear = endYear - 3;
    const url = `${FBI_API_URL}/api/estimates/states/${stateAbbr.toLowerCase()}/${startYear}/${endYear}?API_KEY=${apiKey}`;

    const response = await fetch(url, { cache: "no-store" });
    const json = await response.json();

    if (!response.ok || json?.error) {
      console.warn("FBI Crime API error:", json?.error?.message ?? response.status);
      const fallback = getStateCrimeRates(stateAbbr);
      if (fallback) {
        return {
          crimeRateViolent: fallback.violent,
          crimeRateProperty: fallback.property,
        };
      }
      return { crimeRateViolent: null, crimeRateProperty: null };
    }

    const results = json?.results;

    if (!Array.isArray(results) || results.length === 0) {
      const fallback = getStateCrimeRates(stateAbbr);
      if (fallback) {
        return {
          crimeRateViolent: fallback.violent,
          crimeRateProperty: fallback.property,
        };
      }
      return { crimeRateViolent: null, crimeRateProperty: null };
    }

    // Get the most recent year's data
    const sorted = [...results].sort((a: { year: number }, b: { year: number }) => b.year - a.year);
    const latest = sorted[0];

    const population = latest.population || 1;
    const violentCrime = (latest.violent_crime ?? 0);
    const propertyCrime = (latest.property_crime ?? 0);

    const result: FbiCrimeResult = {
      crimeRateViolent: Math.round((violentCrime / population) * 100000),
      crimeRateProperty: Math.round((propertyCrime / population) * 100000),
    };

    setCache(cacheKey, result, "fbi");
    return result;
  } catch (error) {
    console.error("FBI Crime API fetch error:", error);
    const fallback = getStateCrimeRates(stateAbbr);
    if (fallback) {
      return {
        crimeRateViolent: fallback.violent,
        crimeRateProperty: fallback.property,
      };
    }
    return { crimeRateViolent: null, crimeRateProperty: null };
  }
}
