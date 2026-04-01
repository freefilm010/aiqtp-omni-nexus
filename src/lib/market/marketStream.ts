/**
 * Real Market Data Stream
 * WebSocket tick ingestion for Binance public trades.
 * Browser-compatible (no Node APIs).
 */

export interface MarketTick {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  source: string;
}

export type TickHandler = (tick: MarketTick) => void;

interface StreamOptions {
  /** Binance lowercase stream names, e.g. ["btcusdt@trade","ethusdt@trade"] */
  streams: string[];
  onTick: TickHandler;
  onError?: (err: Event) => void;
  onReconnect?: () => void;
  /** Max reconnect attempts (default 10) */
  maxRetries?: number;
}

/**
 * Connect to Binance combined WebSocket stream.
 * Returns a cleanup function.
 */
export function connectBinanceStream(opts: StreamOptions): () => void {
  const { streams, onTick, onError, onReconnect, maxRetries = 10 } = opts;

  let ws: WebSocket | null = null;
  let retries = 0;
  let disposed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect() {
    if (disposed) return;

    const url =
      streams.length === 1
        ? `wss://stream.binance.com:9443/ws/${streams[0]}`
        : `wss://stream.binance.com:9443/stream?streams=${streams.join("/")}`;

    ws = new WebSocket(url);

    ws.onopen = () => {
      retries = 0;
    };

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const data = raw.data ?? raw; // combined vs single stream

        if (data.e === "trade") {
          onTick({
            symbol: (data.s as string).toUpperCase(),
            price: parseFloat(data.p),
            volume: parseFloat(data.q),
            timestamp: data.T ?? Date.now(),
            source: "binance",
          });
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = (err) => {
      onError?.(err);
    };

    ws.onclose = () => {
      if (disposed) return;
      if (retries < maxRetries) {
        retries++;
        const delay = Math.min(1000 * 2 ** retries, 30_000);
        onReconnect?.();
        reconnectTimer = setTimeout(connect, delay);
      }
    };
  }

  connect();

  return () => {
    disposed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}

/**
 * Connect to BTCC market data socket (custom protocol).
 */
export function connectBTCCStream(onTick: TickHandler): () => void {
  const url = "wss://kapi1.btloginc.com:9082/v2/quot/";
  let ws: WebSocket | null = null;
  let disposed = false;

  function connect() {
    if (disposed) return;
    ws = new WebSocket(url);

    ws.onopen = () => {
      // Subscribe to BTC market
      ws?.send(JSON.stringify({ method: "subscribe", params: ["market.BTC_USDT.trade"] }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.params?.length >= 2) {
          const trade = data.params[1];
          onTick({
            symbol: "BTC_USDT",
            price: parseFloat(trade.price ?? trade.p ?? "0"),
            volume: parseFloat(trade.amount ?? trade.q ?? "0"),
            timestamp: Date.now(),
            source: "btcc",
          });
        }
      } catch {
        // ignore
      }
    };

    ws.onclose = () => {
      if (!disposed) setTimeout(connect, 5000);
    };
  }

  connect();

  return () => {
    disposed = true;
    ws?.close();
  };
}
