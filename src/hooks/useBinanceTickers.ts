import { useEffect, useMemo, useRef, useState } from "react";

export interface LiveTickerQuote {
  symbol: string; // e.g. BTCUSDT
  lastPrice: number;
  priceChangePercent: number;
  volume: number;
  lastUpdate: Date;
}

const DEFAULT_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "AVAXUSDT",
  "LINKUSDT",
  "DOGEUSDT",
] as const;

function toStreams(symbols: string[]) {
  return symbols
    .map((s) => s.toLowerCase())
    .map((s) => `${s}@ticker`)
    .join("/");
}

export function useBinanceTickers(symbols: string[] = [...DEFAULT_SYMBOLS]) {
  const normalized = useMemo(
    () => Array.from(new Set(symbols.map((s) => s.toUpperCase()))),
    [symbols]
  );

  const [tickers, setTickers] = useState<Record<string, LiveTickerQuote>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;

      try {
        const streams = toStreams(normalized);
        const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          if (cancelled) return;
          setConnected(true);
        };

        ws.onmessage = (evt) => {
          if (cancelled) return;
          try {
            const msg = JSON.parse(evt.data as string);
            const data = msg?.data;
            const symbol = (data?.s as string | undefined)?.toUpperCase();
            if (!symbol) return;

            const lastPrice = Number(data?.c);
            const priceChangePercent = Number(data?.P);
            const volume = Number(data?.v);

            if (!Number.isFinite(lastPrice) || !Number.isFinite(priceChangePercent)) return;

            setTickers((prev) => ({
              ...prev,
              [symbol]: {
                symbol,
                lastPrice,
                priceChangePercent,
                volume: Number.isFinite(volume) ? volume : prev[symbol]?.volume ?? 0,
                lastUpdate: new Date(),
              },
            }));
          } catch {
            // ignore malformed message
          }
        };

        const scheduleReconnect = () => {
          if (cancelled) return;
          setConnected(false);
          if (retryRef.current) window.clearTimeout(retryRef.current);
          retryRef.current = window.setTimeout(() => {
            connect();
          }, 1500);
        };

        ws.onerror = scheduleReconnect;
        ws.onclose = scheduleReconnect;
      } catch {
        setConnected(false);
        if (retryRef.current) window.clearTimeout(retryRef.current);
        retryRef.current = window.setTimeout(() => connect(), 1500);
      }
    };

    connect();

    return () => {
      cancelled = true;
      setConnected(false);
      if (retryRef.current) window.clearTimeout(retryRef.current);
      retryRef.current = null;
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    };
  }, [normalized.join("|")]);

  return { tickers, connected };
}
