import metrosData from "@/data/metros.json";
import { MetroEntry } from "@/types/market";

const metros: MetroEntry[] = metrosData as MetroEntry[];

export function searchMetros(query: string, limit = 10): MetroEntry[] {
  if (!query || query.trim().length === 0) return [];

  const q = query.toLowerCase().trim();

  const exactMatches: MetroEntry[] = [];
  const startsWithMatches: MetroEntry[] = [];
  const containsMatches: MetroEntry[] = [];

  for (const metro of metros) {
    const cityLower = metro.city.toLowerCase();
    const metroAreaLower = metro.metroArea.toLowerCase();
    const stateAbbrLower = metro.stateAbbr.toLowerCase();
    const fullName = `${cityLower}, ${stateAbbrLower}`;

    if (cityLower === q || fullName === q) {
      exactMatches.push(metro);
    } else if (cityLower.startsWith(q) || fullName.startsWith(q)) {
      startsWithMatches.push(metro);
    } else if (cityLower.includes(q) || metroAreaLower.includes(q) || metro.state.toLowerCase().includes(q)) {
      containsMatches.push(metro);
    }
  }

  return [...exactMatches, ...startsWithMatches, ...containsMatches].slice(0, limit);
}

export function resolveCity(cityName: string, stateAbbr?: string): MetroEntry | null {
  const q = cityName.toLowerCase().trim();

  for (const metro of metros) {
    const match = metro.city.toLowerCase() === q;
    if (match && (!stateAbbr || metro.stateAbbr.toLowerCase() === stateAbbr.toLowerCase())) {
      return metro;
    }
  }

  // Fuzzy: try partial match
  for (const metro of metros) {
    if (metro.city.toLowerCase().includes(q) && (!stateAbbr || metro.stateAbbr.toLowerCase() === stateAbbr.toLowerCase())) {
      return metro;
    }
  }

  return null;
}

export function getMetroBySlug(slug: string): MetroEntry | null {
  const parts = slug.split("-");
  if (parts.length < 2) return null;

  const stateAbbr = parts[parts.length - 1];
  const cityParts = parts.slice(0, -1);
  const city = cityParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

  return resolveCity(city, stateAbbr);
}

export function toSlug(city: string, stateAbbr: string): string {
  return `${city.toLowerCase().replace(/\s+/g, "-")}-${stateAbbr.toLowerCase()}`;
}

export function getAllMetros(): MetroEntry[] {
  return metros;
}
