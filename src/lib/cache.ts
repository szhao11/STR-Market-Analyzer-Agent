interface CacheEntry {
  data: unknown;
  fetchedAt: number;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

const CACHE_DURATIONS: Record<string, number> = {
  bea: 90 * 24 * 60 * 60 * 1000,     // 90 days
  census: 90 * 24 * 60 * 60 * 1000,   // 90 days
  bls: 30 * 24 * 60 * 60 * 1000,      // 30 days
  fbi: 90 * 24 * 60 * 60 * 1000,      // 90 days
  str: 7 * 24 * 60 * 60 * 1000,       // 7 days
  rentcast: 14 * 24 * 60 * 60 * 1000, // 14 days
  walkscore: 90 * 24 * 60 * 60 * 1000,// 90 days
};

export function getCacheKey(source: string, identifier: string): string {
  return `${source}:${identifier}`;
}

export function getCached<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, source: string): void {
  const duration = CACHE_DURATIONS[source] || 24 * 60 * 60 * 1000;
  memoryCache.set(key, {
    data,
    fetchedAt: Date.now(),
    expiresAt: Date.now() + duration,
  });
}

export function clearCache(key?: string): void {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}
