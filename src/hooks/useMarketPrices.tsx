import { useEffect, useMemo, useState } from "react";
import {
  fetchCoinGeckoUsdQuotes,
  type CryptoSymbol,
} from "@/lib/market/coingecko";

export interface MarketPrice {
  symbol: string;
  name: string;
  price: string;
  priceNumeric: number;
  change: string;
  changePercent: number;
  volume: string;
  trend: "up" | "down";
  lastUpdate: Date;
}

const INITIAL_PRICES: Record<string, MarketPrice> = {
  "BTC/USD": {
    symbol: "BTC/USD",
    name: "Bitcoin",
    price: "67234.89",
    priceNumeric: 67234.89,
    change: "+5.23%",
    changePercent: 5.23,
    volume: "$2.4B",
    trend: "up",
    lastUpdate: new Date(),
  },
  "ETH/USD": {
    symbol: "ETH/USD",
    name: "Ethereum",
    price: "3456.12",
    priceNumeric: 3456.12,
    change: "+3.45%",
    changePercent: 3.45,
    volume: "$1.2B",
    trend: "up",
    lastUpdate: new Date(),
  },
  "GOLD/USD": {
    symbol: "GOLD/USD",
    name: "Gold",
    price: "2123.45",
    priceNumeric: 2123.45,
    change: "-0.23%",
    changePercent: -0.23,
    volume: "$890M",
    trend: "down",
    lastUpdate: new Date(),
  },
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc",
    price: "178.34",
    priceNumeric: 178.34,
    change: "+1.23%",
    changePercent: 1.23,
    volume: "$3.2B",
    trend: "up",
    lastUpdate: new Date(),
  },
  "RE-NYC-01": {
    symbol: "RE-NYC-01",
    name: "NYC Property Token",
    price: "245.67",
    priceNumeric: 245.67,
    change: "+2.34%",
    changePercent: 2.34,
    volume: "$45M",
    trend: "up",
    lastUpdate: new Date(),
  },
  "ART-MON-01": {
    symbol: "ART-MON-01",
    name: "Monet NFT",
    price: "1234567",
    priceNumeric: 1234567,
    change: "-1.23%",
    changePercent: -1.23,
    volume: "$12M",
    trend: "down",
    lastUpdate: new Date(),
  },
  BTC: {
    symbol: "BTC",
    name: "Bitcoin",
    price: "67234.89",
    priceNumeric: 67234.89,
    change: "+5.23%",
    changePercent: 5.23,
    volume: "$2.4B",
    trend: "up",
    lastUpdate: new Date(),
  },
  ETH: {
    symbol: "ETH",
    name: "Ethereum",
    price: "3456.12",
    priceNumeric: 3456.12,
    change: "+3.45%",
    changePercent: 3.45,
    volume: "$1.2B",
    trend: "up",
    lastUpdate: new Date(),
  },
  USDC: {
    symbol: "USDC",
    name: "USD Coin",
    price: "1.00",
    priceNumeric: 1.0,
    change: "+0.00%",
    changePercent: 0,
    volume: "$450M",
    trend: "up",
    lastUpdate: new Date(),
  },
};

const LIVE_CRYPTO: CryptoSymbol[] = ["BTC", "ETH", "USDC"];

const SYMBOL_ALIASES: Record<CryptoSymbol, string[]> = {
  BTC: ["BTC", "BTC/USD"],
  ETH: ["ETH", "ETH/USD"],
  USDC: ["USDC"],
  SOL: ["SOL"],
  PEPE: ["PEPE"],
  WIF: ["WIF"],
  UNI: ["UNI"],
  AAVE: ["AAVE"],
  ARB: ["ARB"],
  BONK: ["BONK"],
};

const formatPrice = (symbolKey: string, priceUsd: number) => {
  if (symbolKey.includes("ART")) return priceUsd.toFixed(0);
  return priceUsd.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatChange = (pct: number) =>
  `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

export const useMarketPrices = (pollIntervalMs: number = 15000) => {
  const [prices, setPrices] = useState<Record<string, MarketPrice>>(INITIAL_PRICES);
  const [isLive, setIsLive] = useState(true);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const effectivePollInterval = useMemo(
    () => Math.max(15000, pollIntervalMs),
    [pollIntervalMs]
  );

  useEffect(() => {
    if (!isLive) return;

    const ac = new AbortController();

    const refresh = async () => {
      try {
        const quotes = await fetchCoinGeckoUsdQuotes(LIVE_CRYPTO, ac.signal);

        setPrices((prev) => {
          const next = { ...prev };

          for (const symbol of LIVE_CRYPTO) {
            const q = quotes[symbol];
            if (!q) continue;

            const aliases = SYMBOL_ALIASES[symbol] ?? [symbol];
            for (const key of aliases) {
              if (!next[key]) continue;

              const changePct =
                typeof q.change24hPercent === "number"
                  ? q.change24hPercent
                  : next[key].changePercent;

              next[key] = {
                ...next[key],
                priceNumeric: q.priceUsd,
                price: formatPrice(key, q.priceUsd),
                changePercent: changePct,
                change: formatChange(changePct),
                trend: changePct >= 0 ? "up" : "down",
                lastUpdate: new Date(),
              };
            }
          }

          return next;
        });

        setLastSyncError(null);
      } catch (e) {
        if (ac.signal.aborted) return;
        setLastSyncError(e instanceof Error ? e.message : "Failed to sync prices");
      }
    };

    // initial sync + interval polling
    refresh();
    const interval = setInterval(refresh, effectivePollInterval);

    return () => {
      ac.abort();
      clearInterval(interval);
    };
  }, [effectivePollInterval, isLive]);

  const getPrice = (symbol: string): MarketPrice | undefined => prices[symbol];

  const getAllPrices = (): MarketPrice[] => Object.values(prices);

  const toggleLive = () => setIsLive((v) => !v);

  return {
    prices,
    getPrice,
    getAllPrices,
    isLive,
    toggleLive,
    lastSyncError,
  };
};

