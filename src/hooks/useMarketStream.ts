/**
 * React hook for live market tick streaming.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  connectBinanceStream,
  type MarketTick,
  type TickHandler,
} from "@/lib/market/marketStream";

interface UseMarketStreamOpts {
  /** Binance symbol pairs in lowercase, e.g. ["btcusdt","ethusdt"] */
  symbols: string[];
  enabled?: boolean;
  /** Buffer ticks and flush at interval (ms). 0 = immediate. */
  throttleMs?: number;
}

export function useMarketStream({
  symbols,
  enabled = true,
  throttleMs = 250,
}: UseMarketStreamOpts) {
  const [latestTicks, setLatestTicks] = useState<Record<string, MarketTick>>(
    {}
  );
  const [connected, setConnected] = useState(false);
  const bufferRef = useRef<Record<string, MarketTick>>({});
  const flushRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onTick: TickHandler = useCallback(
    (tick) => {
      if (throttleMs > 0) {
        bufferRef.current[tick.symbol] = tick;
      } else {
        setLatestTicks((prev) => ({ ...prev, [tick.symbol]: tick }));
      }
    },
    [throttleMs]
  );

  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    const streams = symbols.map((s) => `${s.toLowerCase()}@trade`);

    const cleanup = connectBinanceStream({
      streams,
      onTick,
      onReconnect: () => setConnected(false),
    });

    setConnected(true);

    if (throttleMs > 0) {
      flushRef.current = setInterval(() => {
        const buf = bufferRef.current;
        if (Object.keys(buf).length > 0) {
          setLatestTicks((prev) => ({ ...prev, ...buf }));
          bufferRef.current = {};
        }
      }, throttleMs);
    }

    return () => {
      cleanup();
      setConnected(false);
      if (flushRef.current) clearInterval(flushRef.current);
    };
  }, [symbols.join(","), enabled, throttleMs, onTick]);

  return { ticks: latestTicks, connected };
}
