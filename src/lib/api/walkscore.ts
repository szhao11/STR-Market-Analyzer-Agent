import { getCached, getCacheKey, setCache } from "@/lib/cache";

interface WalkScoreResult {
  walkScore: number | null;
  transitScore: number | null;
}

export async function fetchWalkScore(
  latitude: number,
  longitude: number,
  address: string
): Promise<WalkScoreResult> {
  const cacheKey = getCacheKey("walkscore", `${latitude},${longitude}`);
  const cached = getCached<WalkScoreResult>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.WALKSCORE_API_KEY;
  if (!apiKey) {
    return { walkScore: null, transitScore: null };
  }

  try {
    const params = new URLSearchParams({
      format: "json",
      lat: String(latitude),
      lon: String(longitude),
      address,
      transit: "1",
      bike: "0",
      wsapikey: apiKey,
    });

    const response = await fetch(`https://api.walkscore.com/score?${params}`, {
      cache: "no-store",
    });
    const json = await response.json();

    if (!response.ok || json?.status !== 1) {
      console.warn("Walk Score API error:", json?.status ?? response.status);
      return { walkScore: null, transitScore: null };
    }

    const result: WalkScoreResult = {
      walkScore: typeof json.walkscore === "number" ? json.walkscore : null,
      transitScore:
        typeof json.transit?.score === "number" ? json.transit.score : null,
    };

    setCache(cacheKey, result, "walkscore");
    return result;
  } catch (error) {
    console.error("Walk Score API fetch error:", error);
    return { walkScore: null, transitScore: null };
  }
}
