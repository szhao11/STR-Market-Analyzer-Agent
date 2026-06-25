import { getCached, getCacheKey, setCache } from "@/lib/cache";
import { getBeaStateGeoFips } from "@/lib/state-fips";

const BEA_API_URL = "https://apps.bea.gov/api/data";

interface BeaGdpResult {
  gdpCurrent: number | null;
  gdp1yr: number | null;
  gdp5yr: number | null;
  gdp10yr: number | null;
}

function parseGdpValue(raw: unknown): number | null {
  const val = parseFloat(String(raw).replace(/,/g, ""));
  return isNaN(val) ? null : val;
}

function pickGdpForYear(gdpByYear: Record<string, number>, targetYear: number): number | null {
  for (let offset = 0; offset <= 2; offset++) {
    const value = gdpByYear[String(targetYear - offset)];
    if (value !== undefined) return value;
  }
  return null;
}

export async function fetchGdpData(stateAbbr: string): Promise<BeaGdpResult> {
  const geoFips = getBeaStateGeoFips(stateAbbr);
  const cacheKey = getCacheKey("bea", `gdp:${geoFips ?? stateAbbr}`);
  const cached = getCached<BeaGdpResult>(cacheKey);
  if (cached) return cached;

  const empty: BeaGdpResult = {
    gdpCurrent: null,
    gdp1yr: null,
    gdp5yr: null,
    gdp10yr: null,
  };

  const apiKey = process.env.BEA_API_KEY;
  if (!apiKey) {
    console.warn("BEA_API_KEY not set, returning null GDP data");
    return empty;
  }

  if (!geoFips) {
    console.warn(`Unknown state abbreviation for BEA: ${stateAbbr}`);
    return empty;
  }

  try {
    // Metro GDP is not exposed in the current BEA Regional API; use state-level real GDP.
    const params = new URLSearchParams({
      UserID: apiKey,
      method: "GetData",
      datasetname: "Regional",
      TableName: "SAGDP9",
      LineCode: "1",
      GeoFips: geoFips,
      Year: "LAST10",
      ResultFormat: "JSON",
    });

    const response = await fetch(`${BEA_API_URL}?${params}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`BEA API error: ${response.status}`);

    const json = await response.json();
    if (json?.BEAAPI?.Error || json?.BEAAPI?.Results?.Error) {
      console.error("BEA API returned error:", json?.BEAAPI?.Error ?? json?.BEAAPI?.Results?.Error);
      return empty;
    }

    const data = json?.BEAAPI?.Results?.Data;
    if (!Array.isArray(data) || data.length === 0) return empty;

    const gdpByYear: Record<string, number> = {};
    for (const item of data) {
      const val = parseGdpValue(item.DataValue);
      if (val !== null) gdpByYear[item.TimePeriod] = val;
    }

    const years = Object.keys(gdpByYear)
      .map(Number)
      .filter((y) => !isNaN(y))
      .sort((a, b) => b - a);
    if (years.length === 0) return empty;

    const latestYear = years[0];

    const result: BeaGdpResult = {
      gdpCurrent: gdpByYear[String(latestYear)] ?? null,
      gdp1yr: pickGdpForYear(gdpByYear, latestYear - 1),
      gdp5yr: pickGdpForYear(gdpByYear, latestYear - 5),
      gdp10yr: pickGdpForYear(gdpByYear, latestYear - 10),
    };

    setCache(cacheKey, result, "bea");
    return result;
  } catch (error) {
    console.error("BEA API fetch error:", error);
    return empty;
  }
}
