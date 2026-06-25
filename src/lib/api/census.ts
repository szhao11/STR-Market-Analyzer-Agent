import { getCached, getCacheKey, setCache } from "@/lib/cache";

const CENSUS_API_URL = "https://api.census.gov/data";

interface CensusResult {
  population: number | null;
  medianIncome: number | null;
  medianHomePrice: number | null;
  rentalPopulationPct: number | null;
  medianRent: number | null;
  netMigrationPct: number | null;
}

const ACS_VARIABLES =
  "B01003_001E,B19013_001E,B25077_001E,B25003_001E,B25003_003E,B25064_001E";

async function fetchAcsPopulation(
  cbsaCode: string,
  year: number,
  apiKey?: string
): Promise<number | null> {
  const keyParam = apiKey ? `&key=${apiKey}` : "";
  const url = `${CENSUS_API_URL}/${year}/acs/acs5?get=B01003_001E&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:${cbsaCode}${keyParam}`;

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;

  const json = await response.json();
  if (!Array.isArray(json) || json.length < 2) return null;

  const idx = json[0].indexOf("B01003_001E");
  if (idx === -1) return null;

  const val = parseInt(json[1][idx], 10);
  return isNaN(val) || val < 0 ? null : val;
}

function calculatePopulationGrowthPct(currentPop: number, priorPop: number, years: number): number {
  if (priorPop <= 0 || years <= 0) return 0;
  const totalGrowth = (currentPop - priorPop) / priorPop;
  return Math.round((totalGrowth / years) * 100 * 100) / 100;
}

export async function fetchCensusData(cbsaCode: string): Promise<CensusResult> {
  const cacheKey = getCacheKey("census", `acs:${cbsaCode}`);
  const cached = getCached<CensusResult>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.CENSUS_API_KEY;
  const empty: CensusResult = {
    population: null,
    medianIncome: null,
    medianHomePrice: null,
    rentalPopulationPct: null,
    medianRent: null,
    netMigrationPct: null,
  };

  try {
    const year = new Date().getFullYear() - 2;
    const keyParam = apiKey ? `&key=${apiKey}` : "";
    const url = `${CENSUS_API_URL}/${year}/acs/acs5?get=${ACS_VARIABLES}&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:${cbsaCode}${keyParam}`;

    let response = await fetch(url, { cache: "no-store" });
    let acsYear = year;

    if (!response.ok) {
      acsYear = year - 1;
      const fallbackUrl = `${CENSUS_API_URL}/${acsYear}/acs/acs5?get=${ACS_VARIABLES}&for=metropolitan%20statistical%20area/micropolitan%20statistical%20area:${cbsaCode}${keyParam}`;
      response = await fetch(fallbackUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`Census API error: ${response.status}`);
    }

    const json = await response.json();
    const result = parseCensusResponse(json);

    const priorYear = acsYear - 5;
    const [currentPop, priorPop] = await Promise.all([
      result.population ?? fetchAcsPopulation(cbsaCode, acsYear, apiKey),
      fetchAcsPopulation(cbsaCode, priorYear, apiKey),
    ]);

    if (currentPop && priorPop) {
      result.netMigrationPct = calculatePopulationGrowthPct(currentPop, priorPop, 5);
    }

    setCache(cacheKey, result, "census");
    return result;
  } catch (error) {
    console.error("Census API fetch error:", error);
    return empty;
  }
}

function parseCensusResponse(json: string[][]): CensusResult {
  if (!Array.isArray(json) || json.length < 2) {
    return {
      population: null,
      medianIncome: null,
      medianHomePrice: null,
      rentalPopulationPct: null,
      medianRent: null,
      netMigrationPct: null,
    };
  }

  const headers = json[0];
  const values = json[1];

  const getValue = (varName: string): number | null => {
    const idx = headers.indexOf(varName);
    if (idx === -1) return null;
    const val = parseInt(values[idx], 10);
    return isNaN(val) || val < 0 ? null : val;
  };

  const totalTenure = getValue("B25003_001E");
  const renterOccupied = getValue("B25003_003E");

  return {
    population: getValue("B01003_001E"),
    medianIncome: getValue("B19013_001E"),
    medianHomePrice: getValue("B25077_001E"),
    rentalPopulationPct:
      totalTenure && renterOccupied
        ? Math.round((renterOccupied / totalTenure) * 100 * 10) / 10
        : null,
    medianRent: getValue("B25064_001E"),
    netMigrationPct: null,
  };
}
