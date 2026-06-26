const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const DEFAULT_MAX_PER_WINDOW = 3;

export function checkRateLimit(key: string, maxPerWindow = DEFAULT_MAX_PER_WINDOW): boolean {
  const now = Date.now();
  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (timestamps.length >= maxPerWindow) {
    hits.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  return true;
}

export function resetRateLimits(): void {
  hits.clear();
}
