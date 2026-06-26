import crypto from "crypto";
import { getCached, setCached } from "@/lib/agent/cache";
import { InvestorProfile } from "@/lib/agent/types";
import { DISCOVERY_PROMPT_VERSION } from "./prompts";
import { DiscoveryCriteria, DiscoveryResult } from "./types";

export function discoveryCacheKey(
  query: string,
  limit: number,
  profile: InvestorProfile,
  criteria: DiscoveryCriteria,
  profileApplied: boolean
): string {
  const normalizedQuery = query.trim().toLowerCase();
  const payload = JSON.stringify({
    normalizedQuery,
    limit,
    profile: profileApplied ? profile : null,
    profileApplied,
    criteria,
  });
  const hash = crypto.createHash("sha256").update(payload).digest("hex").slice(0, 24);
  return `discover:${hash}:${DISCOVERY_PROMPT_VERSION}`;
}

export function getDiscoveryCached(key: string): DiscoveryResult | null {
  return getCached<DiscoveryResult>(key);
}

export function setDiscoveryCached(key: string, result: DiscoveryResult): void {
  setCached(key, result);
}
