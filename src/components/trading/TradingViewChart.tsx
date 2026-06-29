/**
 * TradingViewChart — first-party institutional candlestick surface.
 * Uses live exchange OHLCV through the backend ccxt-trading function; no synthetic candles.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  type UTCTimestamp,
} from "lightweight-charts";
import { supabase } from "@/integrations/supabase/client";

type SymbolValue =
  | "BTC/USDT"
  | "ETH/USDT"
  | "SOL/USDT"
  | "BNB/USDT"
  | "XRP/USDT"
  | "ADA/USDT"
  | "DOGE/USDT"
  | "AVAX/USDT";

type TimeframeValue = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

const toTVSymbol = (sym: SymbolValue): string =>
  `BINANCE:${sym.replace("/", "")}`;

const toTVInterval = (tf: TimeframeValue): string =>
  ({ "1m": "1", "5m": "5", "15m": "15", "1h": "60", "4h": "240", "1d": "D", "1w": "W" })[tf];

interface TradingViewChartProps {
  height?: number;
  showToolbar?: boolean;
  defaultSymbol?: SymbolValue;
  defaultTimeframe?: TimeframeValue;
  symbol?: SymbolValue;
  timeframe?: TimeframeValue;
  onSymbolChange?: (symbol: SymbolValue) => void;
  onTimeframeChange?: (timeframe: TimeframeValue) => void;
}

type OhlcvCandle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  quoteVolume?: number;
};

const intervalSeconds: Record<TimeframeValue, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
  "1w": 604800,
};

const cssHsl = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value})` : fallback;
};

const normalizeCandles = (candles: OhlcvCandle[], timeframe: TimeframeValue) => {
  const step = intervalSeconds[timeframe] ?? 3600;
  const deduped = new Map<number, OhlcvCandle>();

  for (const candle of candles) {
    const ts = Math.floor(Number(candle.timestamp) / 1000);
    const bucket = Math.floor(ts / step) * step;
    if (!Number.isFinite(bucket) || bucket <= 0) continue;
    if (![candle.open, candle.high, candle.low, candle.close].every((value) => Number.isFinite(value) && value > 0)) continue;
    deduped.set(bucket, candle);
  }

  return [...deduped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([time, candle]) => ({
      time: time as UTCTimestamp,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: Number(candle.quoteVolume ?? candle.volume ?? 0),
    }));
};

const TradingViewChart = ({
  height = 600,
  showToolbar = true,
  defaultSymbol = "BTC/USDT",
  defaultTimeframe = "1h",
  symbol: controlledSymbol,
  timeframe: controlledTimeframe,
}: TradingViewChartProps) => {
  const symbol = controlledSymbol ?? defaultSymbol;
  const timeframe = controlledTimeframe ?? defaultTimeframe;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRootRef = useRef<HTMLDivElement>(null);
  const [isVisible] = useState(true);
  const [candles, setCandles] = useState<ReturnType<typeof normalizeCandles>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const chartMeta = useMemo(() => {
    const closes = candles.map((candle) => candle.close);
    const last = candles[candles.length - 1];
    const first = candles[0];
    const high = Math.max(...candles.map((candle) => candle.high));
    const low = Math.min(...candles.map((candle) => candle.low));
    const change = first && last ? ((last.close - first.open) / first.open) * 100 : 0;
    const avg = closes.length ? closes.reduce((sum, close) => sum + close, 0) / closes.length : 0;
    return {
      last: last?.close ?? 0,
      high: Number.isFinite(high) ? high : 0,
      low: Number.isFinite(low) ? low : 0,
      avg,
      change,
    };
  }, [candles]);

  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const loadCandles = async (showLoading: boolean) => {
      if (showLoading) setLoading(true);
      const { data, error: fnError } = await supabase.functions.invoke("ccxt-trading", {
        body: {
          action: "fetch_ohlcv",
          exchange: "binance",
          symbol,
          timeframe,
          limit: showToolbar ? 240 : 160,
        },
      });

      if (cancelled) return;

      if (fnError || !data?.success || !Array.isArray(data?.data)) {
        setError(fnError?.message || data?.error || "Live OHLCV feed unavailable");
        setLoading(false);
        return;
      }

      const normalized = normalizeCandles(data.data as OhlcvCandle[], timeframe);
      setCandles(normalized);
      setError(normalized.length ? null : "No candles returned by live feed");
      setLoading(false);
    };

    void loadCandles(true);
    timer = setInterval(() => void loadCandles(false), 10_000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [isVisible, showToolbar, symbol, timeframe]);

  useEffect(() => {
    const root = chartRootRef.current;
    if (!root || candles.length === 0) return;

    root.replaceChildren();

    const panel = cssHsl("--panel", "hsl(223 18% 14%)");
    const foreground = cssHsl("--foreground", "hsl(220 15% 93%)");
    const muted = cssHsl("--muted-foreground", "hsl(220 10% 55%)");
    const grid = cssHsl("--chart-grid", "hsl(222 14% 18%)");
    const bull = cssHsl("--chart-bull", "hsl(162 91% 32%)");
    const bear = cssHsl("--chart-bear", "hsl(355 88% 58%)");
    const volume = cssHsl("--chart-volume", "hsl(224 100% 58%)");

    const chart = createChart(root, {
      width: Math.max(root.clientWidth, 320),
      height,
      layout: {
        background: { type: ColorType.Solid, color: panel },
        textColor: foreground,
        fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace",
      },
      grid: {
        vertLines: { color: grid, style: LineStyle.Dotted },
        horzLines: { color: grid, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: muted, labelBackgroundColor: panel },
        horzLine: { color: muted, labelBackgroundColor: panel },
      },
      rightPriceScale: {
        borderColor: grid,
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: grid,
        timeVisible: true,
        secondsVisible: timeframe === "1m" || timeframe === "5m",
        rightOffset: 8,
      },
      localization: {
        priceFormatter: (price: number) => {
          if (price >= 1_000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
          if (price >= 1) return price.toFixed(2);
          if (price >= 0.01) return price.toFixed(4);
          return price.toFixed(8);
        },
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: bull,
      downColor: bear,
      borderUpColor: bull,
      borderDownColor: bear,
      wickUpColor: bull,
      wickDownColor: bear,
      priceLineVisible: true,
      lastValueVisible: true,
    });

    candleSeries.setData(candles.map(({ volume: _volume, ...candle }) => candle));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      color: volume,
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    volumeSeries.setData(
      candles.map((candle) => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? bull : bear,
      }))
    );

    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(([entry]) => {
      chart.applyOptions({ width: Math.max(Math.floor(entry.contentRect.width), 320), height });
    });
    resizeObserver.observe(root);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [candles, height, timeframe]);

  return (
    <div ref={containerRef} className="relative overflow-hidden border-panel-border bg-panel" data-focus-area="chart">
      {showToolbar ? (
        <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-2 border border-panel-border bg-panel/95 px-3 py-2 shadow-panel backdrop-blur">
          <span className="font-mono text-xs font-bold text-foreground">{toTVSymbol(symbol as SymbolValue)}</span>
          <span className={chartMeta.change >= 0 ? "font-mono text-xs text-success" : "font-mono text-xs text-destructive"}>
            {chartMeta.change >= 0 ? "+" : ""}{chartMeta.change.toFixed(2)}%
          </span>
          <span className="font-mono text-[10px] uppercase text-muted-foreground">{toTVInterval(timeframe as TimeframeValue)} OHLCV</span>
          {chartMeta.high > 0 ? <span className="font-mono text-[10px] text-muted-foreground">H {chartMeta.high.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span> : null}
          {chartMeta.low > 0 ? <span className="font-mono text-[10px] text-muted-foreground">L {chartMeta.low.toLocaleString(undefined, { maximumFractionDigits: 4 })}</span> : null}
        </div>
      ) : null}

      <div
        ref={chartRootRef}
        style={{ width: "100%", height }}
        aria-label={`${symbol} live candlestick chart`}
      />

      {loading || !isVisible ? (
        <div className="absolute inset-0 flex items-center justify-center bg-panel/80">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-x-4 bottom-4 border border-warning bg-panel-header px-3 py-2 font-mono text-xs text-warning shadow-panel">
          {error}
        </div>
      ) : null}
    </div>
  );
};

export default TradingViewChart;
