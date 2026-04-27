/**
 * Stale-While-Revalidate Cache
 * 
 * Returns cached data immediately while fetching fresh data in the background.
 * Prevents showing $0 balances or empty screens during API latency.
 * 
 * Lessons from:
 * - Coinbase: Users saw $0 balances during backend lag (mass panic)
 * - Binance: Empty order books during high-load events
 * - Robinhood: Loading spinners for minutes during March 2020
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  /** Whether a background revalidation is in flight */
  revalidating: boolean;
}

const cache = new Map<string, CacheEntry<unknown>>();

interface SWROptions {
  /** Max age in ms before data is considered stale (default: 30000) */
  maxAge?: number;
  /** Max age in ms before stale data is also rejected (default: 300000) */
  staleMaxAge?: number;
}

/**
 * Get data with stale-while-revalidate semantics.
 * 
 * Returns cached data immediately if available, and revalidates in background.
 * Only throws if no cache exists AND the fetch fails.
 */
export async function swr<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: SWROptions = {}
): Promise<{ data: T; isStale: boolean; age: number }> {
  const { maxAge = 30000, staleMaxAge = 300000 } = options;
  const now = Date.now();
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  // Fresh cache — return immediately
  if (entry && now - entry.timestamp < maxAge) {
    return { data: entry.data, isStale: false, age: now - entry.timestamp };
  }

  // Stale cache — return stale + background revalidate
  if (entry && now - entry.timestamp < staleMaxAge) {
    if (!entry.revalidating) {
      entry.revalidating = true;
      fetcher()
        .then((data) => {
          cache.set(key, { data, timestamp: Date.now(), revalidating: false });
        })
        .catch((err) => {
          console.warn('[SWR:%s] Background revalidation failed: %o', key, err);
          entry.revalidating = false;
        });
    }
    return { data: entry.data, isStale: true, age: now - entry.timestamp };
  }

  // No cache or expired — must fetch
  try {
    const data = await fetcher();
    cache.set(key, { data, timestamp: Date.now(), revalidating: false });
    return { data, isStale: false, age: 0 };
  } catch (error) {
    // Last resort — return super stale data if it exists
    if (entry) {
      console.warn(`[SWR:${key}] Fetch failed, returning expired cache (age: ${now - entry.timestamp}ms)`);
      return { data: entry.data, isStale: true, age: now - entry.timestamp };
    }
    throw error;
  }
}

/**
 * Invalidate a specific cache entry.
 */
export function invalidateSWR(key: string): void {
  cache.delete(key);
}

/**
 * Clear all cache entries.
 */
export function clearSWRCache(): void {
  cache.clear();
}
