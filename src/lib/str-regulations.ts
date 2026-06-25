import regulationsData from "@/data/str-regulations.json";
import {
  MetroEntry,
  StrRegulationConfidence,
  StrRegulationLevel,
  StrRegulationSignals,
  StrRegulationSource,
  MarketSnapshot,
} from "@/types/market";

export type RegulationResolution = "city" | "county" | "cbsa" | "state";

interface RegulationRecordRaw {
  overall: StrRegulationLevel;
  jurisdiction: string;
  jurisdictionType?: "city" | "county" | "cbsa" | "state";
  signals: StrRegulationSignals;
  summary: string;
  sources?: StrRegulationSource[];
  confidence: StrRegulationConfidence;
  verifiedAt?: string;
}

interface StrRegulationsDataset {
  version: string;
  stateDefaults: Record<string, RegulationRecordRaw>;
  cityOverrides: Array<RegulationRecordRaw & { city: string; stateAbbr: string }>;
  countyOverrides: Array<RegulationRecordRaw & { county: string; stateAbbr: string }>;
  cbsaOverrides: Array<RegulationRecordRaw & { cbsaCode: string }>;
}

const dataset = regulationsData as StrRegulationsDataset;

export function deriveInvestorEligible(signals: StrRegulationSignals): boolean {
  if (!signals.operatingAllowed) return false;
  if (signals.primaryResidenceOnly) return false;
  if (signals.nightCap !== null && signals.nightCap < 90) return false;
  // Saturated caps (e.g. Savannah 20% per-ward) block new non-owner permits
  if (signals.listingCap !== null && signals.listingCap <= 0.25) return false;
  return true;
}

function findCityOverride(metro: MetroEntry): RegulationRecordRaw | null {
  return (
    dataset.cityOverrides.find(
      (entry) =>
        entry.city.toLowerCase() === metro.city.toLowerCase() &&
        entry.stateAbbr.toLowerCase() === metro.stateAbbr.toLowerCase()
    ) ?? null
  );
}

function findCountyOverride(metro: MetroEntry): RegulationRecordRaw | null {
  if (!metro.county) return null;
  return (
    dataset.countyOverrides.find(
      (entry) =>
        entry.county.toLowerCase() === metro.county!.toLowerCase() &&
        entry.stateAbbr.toLowerCase() === metro.stateAbbr.toLowerCase()
    ) ?? null
  );
}

function findCbsaOverride(metro: MetroEntry): RegulationRecordRaw | null {
  return (
    dataset.cbsaOverrides.find((entry) => entry.cbsaCode === metro.cbsaCode) ?? null
  );
}

function findStateDefault(stateAbbr: string): RegulationRecordRaw | null {
  return dataset.stateDefaults[stateAbbr.toUpperCase()] ?? null;
}

export function resolveStrRegulation(
  metro: MetroEntry
): { record: RegulationRecordRaw; resolution: RegulationResolution } | null {
  const city = findCityOverride(metro);
  if (city) return { record: city, resolution: "city" };

  const county = findCountyOverride(metro);
  if (county) return { record: county, resolution: "county" };

  const cbsa = findCbsaOverride(metro);
  if (cbsa) return { record: cbsa, resolution: "cbsa" };

  const state = findStateDefault(metro.stateAbbr);
  if (state) return { record: state, resolution: "state" };

  return null;
}

export function enrichRegulationFields(metro: MetroEntry): Partial<MarketSnapshot> {
  const resolved = resolveStrRegulation(metro);
  if (!resolved) {
    return {
      strRegulationScore: null,
      strRegulationSignals: null,
      strRegulationNotes: null,
      strRegulationSources: null,
      strRegulationVerifiedAt: null,
      strRegulationConfidence: null,
      strRegulationJurisdiction: null,
      strRegulationResolution: null,
      strInvestorEligible: null,
    };
  }

  const { record, resolution } = resolved;

  return {
    strRegulationScore: record.overall,
    strRegulationSignals: record.signals,
    strRegulationNotes: record.summary,
    strRegulationSources: record.sources ?? null,
    strRegulationVerifiedAt: record.verifiedAt ?? dataset.version,
    strRegulationConfidence: record.confidence,
    strRegulationJurisdiction: record.jurisdiction,
    strRegulationResolution: resolution,
    strInvestorEligible: deriveInvestorEligible(record.signals),
  };
}

export function getRegulationDatasetVersion(): string {
  return dataset.version;
}

export function getRegulationDatasetStats(): {
  version: string;
  stateCount: number;
  cityOverrideCount: number;
  countyOverrideCount: number;
  cbsaOverrideCount: number;
} {
  return {
    version: dataset.version,
    stateCount: Object.keys(dataset.stateDefaults).length,
    cityOverrideCount: dataset.cityOverrides.length,
    countyOverrideCount: dataset.countyOverrides.length,
    cbsaOverrideCount: dataset.cbsaOverrides.length,
  };
}

export function getRegulationCoverageGaps(metros: MetroEntry[]): string[] {
  const cityKeys = new Set(
    dataset.cityOverrides.map((e) => `${e.city}|${e.stateAbbr}`.toLowerCase())
  );
  return metros
    .filter((m) => !cityKeys.has(`${m.city}|${m.stateAbbr}`.toLowerCase()))
    .map((m) => `${m.city}, ${m.stateAbbr}`);
}

export function formatRegulationLevel(level: StrRegulationLevel | null): string {
  if (!level) return "N/A";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function formatRegulationResolution(resolution: RegulationResolution | null): string {
  if (!resolution) return "Unknown";
  switch (resolution) {
    case "city":
      return "City";
    case "county":
      return "County";
    case "cbsa":
      return "Metro (CBSA)";
    case "state":
      return "State default";
  }
}
