/**
 * FX History Cache — deterministic, date-keyed FX rate resolution.
 * Ensures the same trade always produces the same PnL regardless of when computed.
 */

const fxCache: Record<string, Record<string, number>> = {};

/** Normalize any timestamp/date-string to YYYY-MM-DD */
function toDayKey(ts?: string | number): string {
  const d = ts ? new Date(ts) : new Date();
  return d.toISOString().split("T")[0];
}

/**
 * Fetch FX rate for a currency on a specific date.
 * Stub: returns 1 for USD, fallback rates for others.
 * Replace with real provider (ECB / Polygon / exchange API) for production.
 */
async function fetchFxRate(currency: string, _date: string): Promise<number> {
  if (currency === "USD" || currency === "USDT" || currency === "USDC") return 1;

  // Known stablecoin / crypto fee tokens — approximate USD parity or market rate
  const knownRates: Record<string, number> = {
    EUR: 1.09,
    GBP: 1.27,
    BNB: 600,
    ETH: 3200,
    BTC: 70000,
    SOL: 150,
    MATIC: 0.7,
  };

  return knownRates[currency.toUpperCase()] ?? 1;
}

/**
 * Get the FX rate (to USD) for a currency at a specific point in time.
 * Results are cached by (currency, date) for deterministic replay.
 */
export async function getFxAtTime(
  currency: string,
  timestamp?: string | number
): Promise<number> {
  const normalized = currency.toUpperCase();
  if (normalized === "USD" || normalized === "USDT" || normalized === "USDC") return 1;

  const day = toDayKey(timestamp);

  if (fxCache[normalized]?.[day] != null) {
    return fxCache[normalized][day];
  }

  const rate = await fetchFxRate(normalized, day);

  if (!fxCache[normalized]) fxCache[normalized] = {};
  fxCache[normalized][day] = rate;

  return rate;
}

/** Clear cache (useful for testing) */
export function clearFxCache() {
  for (const key of Object.keys(fxCache)) {
    delete fxCache[key];
  }
}
