import { isAgentEnabled } from "@/lib/agent/config";

export function isDiscoveryEnabled(): boolean {
  if (!isAgentEnabled()) return false;
  return process.env.DISCOVERY_ENABLED !== "false";
}

export function assertDiscoveryAvailable():
  | { ok: true }
  | { ok: false; status: number; error: string } {
  if (!isDiscoveryEnabled()) {
    return {
      ok: false,
      status: 503,
      error: "Market discovery is disabled (DISCOVERY_ENABLED=false or AGENT_ENABLED=false)",
    };
  }
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return { ok: false, status: 503, error: "OPENAI_API_KEY is not configured" };
  }
  return { ok: true };
}

export function getDiscoveryStrFetchMax(): number {
  const parsed = Number.parseInt(process.env.DISCOVERY_STR_FETCH_MAX ?? "5", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
}

export function getDiscoveryStrPreviewPool(): number {
  const parsed = Number.parseInt(process.env.DISCOVERY_STR_PREVIEW_POOL ?? "15", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 15;
}

export function getDiscoverySnapshotMaxAgeDays(): number {
  const parsed = Number.parseInt(process.env.DISCOVERY_SNAPSHOT_MAX_AGE_DAYS ?? "30", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 30;
}

export function getDiscoveryHydrateConcurrency(): number {
  const parsed = Number.parseInt(process.env.DISCOVERY_HYDRATE_CONCURRENCY ?? "4", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 4;
}

export function getDiscoveryMaxHydratePerRun(): number {
  const parsed = Number.parseInt(process.env.DISCOVERY_MAX_HYDRATE ?? "25", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 25;
}

export function getDiscoveryPipelineTimeoutMs(): number {
  return 55_000;
}
