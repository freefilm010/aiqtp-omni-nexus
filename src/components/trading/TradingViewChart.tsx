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

const TIMEFRAMES: TimeframeValue[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

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

const cssHslAlpha = (name: string, alpha: number, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value ? `hsl(${value} / ${alpha})` : fallback;
};

const formatChartPrice = (price: number) => {
  if (!Number.isFinite(price) || price <= 0) return "—";
  if (price >= 1_000) return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(8);
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
  onTimeframeChange,
}: TradingViewChartProps) => {
  const symbol = controlledSymbol ?? defaultSymbol;
  const [internalTimeframe, setInternalTimeframe] = useState<TimeframeValue>(defaultTimeframe);
  const timeframe = controlledTimeframe ?? internalTimeframe;
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRootRef = useRef<HTMLDivElement>(null);
  const [isVisible] = useState(true);
  const [candles, setCandles] = useState<ReturnType<typeof normalizeCandles>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setTimeframe = (next: TimeframeValue) => {
    if (!controlledTimeframe) setInternalTimeframe(next);
    onTimeframeChange?.(next);
  };

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
    const panelHeader = cssHsl("--panel-header", "hsl(223 18% 12%)");
    const foreground = cssHsl("--foreground", "hsl(220 15% 93%)");
    const muted = cssHsl("--muted-foreground", "hsl(220 10% 55%)");
    const grid = cssHslAlpha("--chart-grid", 0.45, "hsl(222 14% 18% / 0.45)");
    const bull = cssHsl("--chart-bull", "hsl(162 91% 32%)");
    const bear = cssHsl("--chart-bear", "hsl(355 88% 58%)");
    const bullVolume = cssHslAlpha("--chart-bull", 0.35, "hsl(162 91% 32% / 0.35)");
    const bearVolume = cssHslAlpha("--chart-bear", 0.35, "hsl(355 88% 58% / 0.35)");
    const priceLine = cssHsl("--primary", "hsl(224 100% 58%)");

    const chart = createChart(root, {
      width: Math.max(root.clientWidth, 320),
      height,
      layout: {
        background: { type: ColorType.Solid, color: panel },
        textColor: foreground,
        fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace",
        panes: {
          separatorColor: grid,
          separatorHoverColor: grid,
        },
      },
      grid: {
        vertLines: { color: grid, style: LineStyle.SparseDotted },
        horzLines: { color: grid, style: LineStyle.SparseDotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: muted, labelBackgroundColor: panelHeader, style: LineStyle.Dashed },
        horzLine: { color: muted, labelBackgroundColor: panelHeader, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: grid,
        entireTextOnly: true,
        scaleMargins: { top: 0.06, bottom: 0.2 },
      },
      timeScale: {
        borderColor: grid,
        timeVisible: true,
        secondsVisible: timeframe === "1m" || timeframe === "5m",
        rightOffset: 12,
        barSpacing: 8,
        minBarSpacing: 4,
        fixLeftEdge: false,
        fixRightEdge: false,
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
      borderVisible: false,
      wickUpColor: bull,
      wickDownColor: bear,
      priceLineVisible: true,
      priceLineColor: priceLine,
      priceLineStyle: LineStyle.Dashed,
      priceLineWidth: 1,
      lastValueVisible: true,
    });

    candleSeries.setData(candles.map(({ volume: _volume, ...candle }) => candle));

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      color: bullVolume,
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    volumeSeries.setData(
      candles.map((candle) => ({
        time: candle.time,
        value: candle.volume,
        color: candle.close >= candle.open ? bullVolume : bearVolume,
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
    <div ref={containerRef} className="relative overflow-hidden border border-panel-border bg-panel shadow-panel" data-focus-area="chart">
      {showToolbar ? (
        <div className="flex min-h-14 flex-col gap-2 border-b border-panel-border bg-panel-header px-3 py-2 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-sm font-bold text-foreground md:text-base">{toTVSymbol(symbol as SymbolValue)}</span>
            <span className="font-mono text-sm font-semibold text-foreground">{formatChartPrice(chartMeta.last)}</span>
            <span className={chartMeta.change >= 0 ? "font-mono text-xs text-success" : "font-mono text-xs text-destructive"}>
              {chartMeta.change >= 0 ? "+" : ""}{chartMeta.change.toFixed(2)}%
            </span>
            <span className="font-mono text-[10px] uppercase text-muted-foreground">{toTVInterval(timeframe as TimeframeValue)} OHLCV</span>
            {chartMeta.high > 0 ? <span className="font-mono text-[10px] text-muted-foreground">H {formatChartPrice(chartMeta.high)}</span> : null}
            {chartMeta.low > 0 ? <span className="font-mono text-[10px] text-muted-foreground">L {formatChartPrice(chartMeta.low)}</span> : null}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {TIMEFRAMES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTimeframe(item)}
                className={
                  "h-7 min-w-9 border px-2 font-mono text-[10px] uppercase transition-smooth " +
                  (timeframe === item
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-panel-border bg-secondary/40 text-muted-foreground hover:border-primary/60 hover:text-foreground")
                }
                aria-pressed={timeframe === item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-4 z-[1] font-mono text-5xl font-bold text-muted-foreground/5 md:text-7xl">
          {symbol.split("/")[0]}
        </div>
        <div
          ref={chartRootRef}
          style={{ width: "100%", height }}
          aria-label={`${symbol} live candlestick chart`}
        />
      </div>

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
