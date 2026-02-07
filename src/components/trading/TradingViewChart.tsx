import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type Time,
} from "lightweight-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBinanceTickers } from "@/hooks/useBinanceTickers";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  RefreshCw,
} from "lucide-react";

const SYMBOLS = [
  { value: "BTC/USDT", label: "BTC/USDT", binance: "BTCUSDT" },
  { value: "ETH/USDT", label: "ETH/USDT", binance: "ETHUSDT" },
  { value: "SOL/USDT", label: "SOL/USDT", binance: "SOLUSDT" },
  { value: "BNB/USDT", label: "BNB/USDT", binance: "BNBUSDT" },
  { value: "XRP/USDT", label: "XRP/USDT", binance: "XRPUSDT" },
  { value: "ADA/USDT", label: "ADA/USDT", binance: "ADAUSDT" },
  { value: "DOGE/USDT", label: "DOGE/USDT", binance: "DOGEUSDT" },
  { value: "AVAX/USDT", label: "AVAX/USDT", binance: "AVAXUSDT" },
] as const;

type SymbolValue = (typeof SYMBOLS)[number]["value"];

type TimeframeValue = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

const TIMEFRAMES: { value: TimeframeValue; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
];

const TF_SECONDS: Record<TimeframeValue, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
  "1w": 604800,
};

type Ticker24h = {
  last: number;
  high: number;
  low: number;
  volume: number;
  quoteVolume: number;
  changePercent: number;
} | null;

interface TradingViewChartProps {
  height?: number;
  showToolbar?: boolean;
  pollMs?: number;

  defaultSymbol?: SymbolValue;
  defaultTimeframe?: TimeframeValue;

  // Controlled mode (optional)
  symbol?: SymbolValue;
  timeframe?: TimeframeValue;
  onSymbolChange?: (symbol: SymbolValue) => void;
  onTimeframeChange?: (timeframe: TimeframeValue) => void;
}

const c = (token: string, alpha?: number) =>
  alpha === undefined
    ? `hsl(var(--${token}))`
    : `hsl(var(--${token}) / ${alpha})`;

const formatPrice = (price: number) =>
  price.toLocaleString(undefined, {
    minimumFractionDigits: price >= 1000 ? 2 : price >= 1 ? 2 : 6,
    maximumFractionDigits: price >= 1000 ? 2 : price >= 1 ? 2 : 6,
  });

const formatCompact = (value: number) => {
  const abs = Math.abs(value);
  if (!Number.isFinite(abs) || abs === 0) return "0";
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
};

const calcSMA = (candles: CandlestickData<Time>[], period: number) => {
  const out: { time: Time; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += (candles[i - j] as any).close;
    out.push({ time: candles[i].time, value: sum / period });
  }
  return out;
};

const TradingViewChart = ({
  height = 500,
  showToolbar = true,
  pollMs = 60_000,
  defaultSymbol = "BTC/USDT",
  defaultTimeframe = "1h",
  symbol: controlledSymbol,
  timeframe: controlledTimeframe,
  onSymbolChange,
  onTimeframeChange,
}: TradingViewChartProps) => {
  const symbolControlled = controlledSymbol !== undefined;
  const timeframeControlled = controlledTimeframe !== undefined;

  const [internalSymbol, setInternalSymbol] = useState<SymbolValue>(defaultSymbol);
  const [internalTimeframe, setInternalTimeframe] = useState<TimeframeValue>(defaultTimeframe);

  const symbol = (controlledSymbol ?? internalSymbol) as SymbolValue;
  const timeframe = (controlledTimeframe ?? internalTimeframe) as TimeframeValue;

  const setSymbolSafe = useCallback(
    (next: string) => {
      const val = next as SymbolValue;
      onSymbolChange?.(val);
      if (!symbolControlled) setInternalSymbol(val);
    },
    [onSymbolChange, symbolControlled]
  );

  const setTimeframeSafe = useCallback(
    (next: TimeframeValue) => {
      onTimeframeChange?.(next);
      if (!timeframeControlled) setInternalTimeframe(next);
    },
    [onTimeframeChange, timeframeControlled]
  );

  const symbolConfig = useMemo(
    () => SYMBOLS.find((s) => s.value === symbol) ?? SYMBOLS[0],
    [symbol]
  );

  const { tickers } = useBinanceTickers([symbolConfig.binance]);
  const liveTicker = tickers[symbolConfig.binance];

  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const smaRef = useRef<ISeriesApi<"Line"> | null>(null);

  const lastBarRef = useRef<CandlestickData<Time> | null>(null);
  const lastLivePaintTsRef = useRef(0);
  const requestSeqRef = useRef(0);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSMA, setShowSMA] = useState(true);
  const [ticker24h, setTicker24h] = useState<Ticker24h>(null);

  // Chart init (once)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: Math.max(320, el.clientWidth || 0),
      height: Math.max(240, el.clientHeight || height),
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: c("muted-foreground"),
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: c("chart-grid", 0.55) },
        horzLines: { color: c("chart-grid", 0.55) },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: c("chart-crosshair", 0.6),
          width: 1,
          style: 2,
          labelBackgroundColor: c("primary"),
        },
        horzLine: {
          color: c("chart-crosshair", 0.6),
          width: 1,
          style: 2,
          labelBackgroundColor: c("primary"),
        },
      },
      rightPriceScale: {
        borderColor: c("panel-border", 0.9),
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: c("panel-border", 0.9),
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: c("chart-bull"),
      downColor: c("chart-bear"),
      borderUpColor: c("chart-bull"),
      borderDownColor: c("chart-bear"),
      wickUpColor: c("chart-bull"),
      wickDownColor: c("chart-bear"),
    });

    const volume = chart.addSeries(HistogramSeries, {
      color: c("chart-volume"),
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    const sma = chart.addSeries(LineSeries, {
      color: c("gold"),
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volume;
    smaRef.current = sma;

    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return;
      const w = Math.max(320, containerRef.current.clientWidth || 0);
      const h = Math.max(240, containerRef.current.clientHeight || 0);
      chartRef.current.applyOptions({ width: w, height: h });
    });

    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      smaRef.current = null;
      lastBarRef.current = null;
    };
  }, []);

  // Apply SMA visibility
  useEffect(() => {
    smaRef.current?.applyOptions({ visible: showSMA });
  }, [showSMA]);

  const fetchOHLCV = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);

      const requestId = ++requestSeqRef.current;
      if (!silent) {
        if (!hasLoadedOnce) setIsInitialLoading(true);
        setIsRefreshing(true);
      }
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("ccxt-trading", {
          body: {
            action: "fetch_ohlcv",
            exchange: "binance",
            symbol,
            timeframe,
            limit: 240,
          },
        });

        if (requestId !== requestSeqRef.current) return;
        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || "Failed to fetch OHLCV");

        const ohlcv = Array.isArray(data.data) ? data.data : [];

        const candleData: CandlestickData<Time>[] = ohlcv.map((k: any) => ({
          time: Math.floor(Number(k.timestamp) / 1000) as Time,
          open: Number(k.open),
          high: Number(k.high),
          low: Number(k.low),
          close: Number(k.close),
        }));

        const volumeData: HistogramData<Time>[] = ohlcv.map((k: any) => {
          const isBull = Number(k.close) >= Number(k.open);
          return {
            time: Math.floor(Number(k.timestamp) / 1000) as Time,
            value: Number(k.volume),
            color: isBull ? c("chart-bull", 0.35) : c("chart-bear", 0.35),
          };
        });

        candleRef.current?.setData(candleData);
        volumeRef.current?.setData(volumeData);

        if (showSMA) {
          smaRef.current?.setData(calcSMA(candleData, 20));
        }

        lastBarRef.current = candleData[candleData.length - 1] ?? null;
        chartRef.current?.timeScale().fitContent();

        setHasLoadedOnce(true);
      } catch (err: any) {
        console.error("TradingViewChart OHLCV error:", err);
        setError(err?.message || "Failed to load chart data");
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [hasLoadedOnce, showSMA, symbol, timeframe]
  );

  // Poll OHLCV (low frequency) + fetch on symbol/timeframe change
  useEffect(() => {
    fetchOHLCV();
    const id = window.setInterval(() => fetchOHLCV({ silent: true }), Math.max(20_000, pollMs));
    return () => window.clearInterval(id);
  }, [fetchOHLCV, pollMs]);

  // Fetch 24h ticker stats (high/low/volume)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("ccxt-trading", {
          body: { action: "fetch_ticker", exchange: "binance", symbol },
        });
        if (cancelled) return;
        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || "Failed to fetch ticker");

        const t = data.data;
        setTicker24h({
          last: Number(t.last ?? 0),
          high: Number(t.high ?? 0),
          low: Number(t.low ?? 0),
          volume: Number(t.volume ?? 0),
          quoteVolume: Number(t.quoteVolume ?? 0),
          changePercent: Number(t.changePercent ?? 0),
        });
      } catch {
        // keep previous ticker24h if any
      }
    };

    run();
    const id = window.setInterval(run, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [symbol]);

  // Real-time close updates (throttled) without inventing OHLC
  useEffect(() => {
    if (!liveTicker || !candleRef.current) return;

    const now = Date.now();
    if (now - lastLivePaintTsRef.current < 250) return;
    lastLivePaintTsRef.current = now;

    const tfSec = TF_SECONDS[timeframe] ?? 3600;
    const barTime = (Math.floor(now / 1000 / tfSec) * tfSec) as Time;
    const last = lastBarRef.current;

    const price = Number(liveTicker.lastPrice);
    if (!Number.isFinite(price)) return;

    let next: CandlestickData<Time>;

    if (last && (last.time as number) === (barTime as number)) {
      next = {
        time: barTime,
        open: (last as any).open,
        high: Math.max((last as any).high, price),
        low: Math.min((last as any).low, price),
        close: price,
      };
    } else {
      const open = last ? Number((last as any).close) : price;
      next = {
        time: barTime,
        open,
        high: Math.max(open, price),
        low: Math.min(open, price),
        close: price,
      };
    }

    candleRef.current.update(next);
    lastBarRef.current = next;
  }, [liveTicker?.lastPrice, symbolConfig.binance, timeframe]);

  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  const displayedPrice = liveTicker?.lastPrice ?? ticker24h?.last;
  const displayedChange = liveTicker?.priceChangePercent ?? ticker24h?.changePercent;

  return (
    <Card className={`overflow-hidden ${isFullscreen ? "fixed inset-4 z-50" : ""}`}>
      {showToolbar && (
        <div className="flex flex-col gap-2 p-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Select value={symbol} onValueChange={setSymbolSafe}>
                <SelectTrigger className="w-[140px] h-8 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex rounded-md border overflow-hidden">
                {TIMEFRAMES.map((tf) => (
                  <Button
                    key={tf.value}
                    variant={timeframe === tf.value ? "default" : "ghost"}
                    size="sm"
                    className="rounded-none h-8 px-3 text-xs font-medium"
                    onClick={() => setTimeframeSafe(tf.value)}
                  >
                    {tf.label}
                  </Button>
                ))}
              </div>

              <Button
                variant={showSMA ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setShowSMA((v) => !v)}
              >
                SMA 20
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {Number.isFinite(displayedPrice) && displayedPrice !== undefined ? (
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold font-mono">${formatPrice(displayedPrice)}</span>

                  {typeof displayedChange === "number" && Number.isFinite(displayedChange) && (
                    <Badge
                      variant="outline"
                      className={
                        displayedChange >= 0
                          ? "text-success border-success/50"
                          : "text-destructive border-destructive/50"
                      }
                    >
                      {displayedChange >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {displayedChange >= 0 ? "+" : ""}
                      {displayedChange.toFixed(2)}%
                    </Badge>
                  )}

                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-success font-medium">LIVE</span>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fetchOHLCV()}
                  disabled={isInitialLoading || isRefreshing}
                  aria-label="Refresh chart"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          {ticker24h && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
              <span>H: ${formatPrice(ticker24h.high)}</span>
              <span>L: ${formatPrice(ticker24h.low)}</span>
              <span>Vol: {formatCompact(ticker24h.volume)}</span>
              <span>QVol: ${formatCompact(ticker24h.quoteVolume)}</span>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-0 relative">
        {isInitialLoading && !hasLoadedOnce && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading chart…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
            <div className="flex flex-col items-center gap-3 text-center p-4">
              <p className="text-sm text-destructive font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchOHLCV()}>
                Retry
              </Button>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          style={{ height: isFullscreen ? "calc(100vh - 140px)" : height }}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;
