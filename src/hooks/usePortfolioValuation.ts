/**
 * usePortfolioValuation — production-grade hook.
 *
 * Rules enforced:
 *  1. Stale prices are EXCLUDED from net worth.
 *  2. Missing/unavailable prices are EXCLUDED from net worth.
 *  3. Testnet assets are separated and never counted.
 *  4. Status flags surface data quality to UI.
 *
 * Usage:
 *   const { realAssets, testAssets, netWorth, hasStaleData, hasMissingPrices, ... } = usePortfolioValuation();
 */
import { useEffect, useMemo, useRef } from "react";
import { useHoldingsQuery } from "@/hooks/usePortfolioQuery";
import { useAssetValuation, type AssetValuation } from "@/hooks/useAssetValuation";

const COLLAPSE_RATIO_THRESHOLD = 0.25;
const COLLAPSE_NET_WORTH_FLOOR = 100_000;

const isSuspiciousCollapse = (
  current: PortfolioValuationResult,
  previous: PortfolioValuationResult
) => {
  if (previous.netWorth < COLLAPSE_NET_WORTH_FLOOR) return false;

  return (
    current.netWorth > 0 &&
    current.netWorth < previous.netWorth * COLLAPSE_RATIO_THRESHOLD &&
    current.validAssetCount < previous.validAssetCount &&
    current.realAssets.length < previous.realAssets.length
  );
};

export interface PortfolioValuationResult {
  /** Real assets with live, valid prices */
  realAssets: AssetValuation[];
  /** Testnet/faucet assets ($0 value) */
  testAssets: AssetValuation[];
  /** Net worth computed ONLY from live, non-stale, non-missing prices */
  netWorth: number;
  /** Net worth including stale data (for comparison / display with warning) */
  netWorthIncludingStale: number;
  /** Count of real assets with valid prices contributing to net worth */
  validAssetCount: number;
  /** Count of real assets with stale prices (excluded from net worth) */
  staleAssetCount: number;
  /** Count of real assets with missing prices (excluded from net worth) */
  missingPriceCount: number;
  /** true if ANY real asset has stale data */
  hasStaleData: boolean;
  /** true if ANY real asset has no price */
  hasMissingPrices: boolean;
  /** true when the live ledger appears partially loaded and the last verified total is being held */
  hasDegradedData: boolean;
  /** React Query state */
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePortfolioValuation(): PortfolioValuationResult {
  const { data: holdings, isLoading, error, refetch } = useHoldingsQuery();
  const { getValuation } = useAssetValuation();
  const lastStableRef = useRef<PortfolioValuationResult | null>(null);

  const computed = useMemo(() => {
    const empty: PortfolioValuationResult = {
      realAssets: [],
      testAssets: [],
      netWorth: 0,
      netWorthIncludingStale: 0,
      validAssetCount: 0,
      staleAssetCount: 0,
      missingPriceCount: 0,
      hasStaleData: false,
      hasMissingPrices: false,
      hasDegradedData: false,
      isLoading,
      error: error instanceof Error ? error : error ? new Error(String(error)) : null,
      refetch,
    };

    if (!holdings || holdings.length === 0) return empty;

    const active = holdings.filter((h) => h.quantity > 0);
    const valuations = active.map((h) => getValuation(h.symbol, h.quantity));

    const realAssets = valuations
      .filter((v) => !v.isTestnet)
      .sort((a, b) => b.valueUsd - a.valueUsd); // R4: sorted by value desc
    const testAssets = valuations.filter((v) => v.isTestnet);

    let netWorthRaw = 0;
    let netWorthIncludingStaleRaw = 0;
    let validAssetCount = 0;
    let staleAssetCount = 0;
    let missingPriceCount = 0;

    for (const v of realAssets) {
      if (v.priceUnavailable) {
        missingPriceCount++;
        continue;
      }

      if (v.isStale) {
        staleAssetCount++;
        netWorthIncludingStaleRaw += v.valueUsd;
        // EXCLUDED from net worth — stale data is not trusted
        continue;
      }

      // Only live, valid prices contribute
      netWorthRaw += v.valueUsd;
      netWorthIncludingStaleRaw += v.valueUsd;
      validAssetCount++;
    }

    // R2: Round to cents to avoid floating-point drift in financial display
    const netWorth = Math.round(netWorthRaw * 100) / 100;
    const netWorthIncludingStale = Math.round(netWorthIncludingStaleRaw * 100) / 100;

    return {
      realAssets,
      testAssets,
      netWorth,
      netWorthIncludingStale,
      validAssetCount,
      staleAssetCount,
      missingPriceCount,
      hasStaleData: staleAssetCount > 0,
      hasMissingPrices: missingPriceCount > 0,
      hasDegradedData: false,
      isLoading,
      error: error instanceof Error ? error : error ? new Error(String(error)) : null,
      refetch,
    };
  }, [holdings, getValuation, isLoading, error, refetch]);

  const lastStable = lastStableRef.current;
  const suspiciousCollapse = Boolean(
    lastStable &&
      !computed.isLoading &&
      !computed.error &&
      !computed.hasStaleData &&
      !computed.hasMissingPrices &&
      computed.validAssetCount > 0 &&
      isSuspiciousCollapse(computed, lastStable)
  );

  useEffect(() => {
    if (
      !computed.isLoading &&
      !computed.error &&
      !computed.hasStaleData &&
      !computed.hasMissingPrices &&
      computed.validAssetCount > 0 &&
      !suspiciousCollapse
    ) {
      lastStableRef.current = computed;
    }
  }, [computed, suspiciousCollapse]);

  if (suspiciousCollapse && lastStable) {
    return {
      ...lastStable,
      isLoading: computed.isLoading,
      error: computed.error,
      refetch: computed.refetch,
      hasDegradedData: true,
    };
  }

  return computed;
}
