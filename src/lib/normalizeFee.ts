/**
 * Normalize a fee denominated in any currency to USD at trade time.
 */
import { getFxAtTime } from "./fxHistory";

export async function normalizeFeeToUsd(
  fee: number,
  feeCurrency: string,
  timestamp?: string | number
): Promise<number> {
  if (!fee || fee === 0) return 0;
  const rate = await getFxAtTime(feeCurrency, timestamp);
  return fee * rate;
}
