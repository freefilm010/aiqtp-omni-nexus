import { useCallback, useEffect, useRef, useState } from "react";
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
  type LineData,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useExchangeTicker } from "@/hooks/useExchangeTicker";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  RefreshCw,
  Activity,
  ChevronDown,
} from "lucide-react";

/* ═══════════════════ CONFIG ═══════════════════ */

const SYMBOLS = [
  { value: "BTC/USDT", label: "BTC/USDT" },
  { value: "ETH/USDT", label: "ETH/USDT" },
  { value: "SOL/USDT", label: "SOL/USDT" },
  { value: "BNB/USDT", label: "BNB/USDT" },
  { value: "XRP/USDT", label: "XRP/USDT" },
  { value: "ADA/USDT", label: "ADA/USDT" },
  { value: "DOGE/USDT", label: "DOGE/USDT" },
  { value: "AVAX/USDT", label: "AVAX/USDT" },
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

type StudyId =
  | "sma20"
  | "sma50"
  | "sma200"
  | "ema9"
  | "ema21"
  | "bb"
  | "vwap";

type LowerStudyId = "rsi" | "macd";

interface StudyDef {
  id: StudyId;
  label: string;
  color: string;
  group: "Moving Averages" | "Bands" | "Other";
}

interface LowerStudyDef {
  id: LowerStudyId;
  label: string;
}

const OVERLAY_STUDIES: StudyDef[] = [
  { id: "sma20", label: "SMA 20", color: "#f59e0b", group: "Moving Averages" },
  { id: "sma50", label: "SMA 50", color: "#8b5cf6", group: "Moving Averages" },
  { id: "sma200", label: "SMA 200", color: "#ef4444", group: "Moving Averages" },
  { id: "ema9", label: "EMA 9", color: "#06b6d4", group: "Moving Averages" },
  { id: "ema21", label: "EMA 21", color: "#10b981", group: "Moving Averages" },
  { id: "bb", label: "Bollinger Bands", color: "#6366f1", group: "Bands" },
  { id: "vwap", label: "VWAP", color: "#ec4899", group: "Other" },
];

const LOWER_STUDIES: LowerStudyDef[] = [
  { id: "rsi", label: "RSI (14)" },
  { id: "macd", label: "MACD (12,26,9)" },
];

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
  symbol?: SymbolValue;
  timeframe?: TimeframeValue;
  onSymbolChange?: (symbol: SymbolValue) => void;
  onTimeframeChange?: (timeframe: TimeframeValue) => void;
}

/* ═══════════════════ UTILS ═══════════════════ */

const c = (token: string, alpha?: number) =>
  alpha === undefined ? `hsl(var(--${token}))` : `hsl(var(--${token}) / ${alpha})`;

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

/* ═══════════════════ INDICATOR MATH ═══════════════════ */

const calcSMA = (data: CandlestickData<Time>[], period: number): LineData<Time>[] => {
  const out: LineData<Time>[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += (data[i - j] as any).close;
    out.push({ time: data[i].time, value: sum / period });
  }
  return out;
};

const calcEMA = (data: CandlestickData<Time>[], period: number): LineData<Time>[] => {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const out: LineData<Time>[] = [];
  let ema = (data[0] as any).close;
  for (let i = 0; i < data.length; i++) {
    ema = (data[i] as any).close * k + ema * (1 - k);
    if (i >= period - 1) out.push({ time: data[i].time, value: ema });
  }
  return out;
};

const calcBollingerBands = (
  data: CandlestickData<Time>[],
  period = 20,
  mult = 2
): { upper: LineData<Time>[]; middle: LineData<Time>[]; lower: LineData<Time>[] } => {
  const upper: LineData<Time>[] = [];
  const middle: LineData<Time>[] = [];
  const lower: LineData<Time>[] = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += (data[i - j] as any).close;
    const mean = sum / period;
    let variance = 0;
    for (let j = 0; j < period; j++) variance += Math.pow((data[i - j] as any).close - mean, 2);
    const std = Math.sqrt(variance / period);
    middle.push({ time: data[i].time, value: mean });
    upper.push({ time: data[i].time, value: mean + mult * std });
    lower.push({ time: data[i].time, value: mean - mult * std });
  }
  return { upper, middle, lower };
};

const calcVWAP = (data: CandlestickData<Time>[]): LineData<Time>[] => {
  const out: LineData<Time>[] = [];
  let cumTPV = 0;
  let cumVol = 0;
  for (let i = 0; i < data.length; i++) {
    const d = data[i] as any;
    const tp = (d.high + d.low + d.close) / 3;
    const vol = d.volume ?? 1;
    cumTPV += tp * vol;
    cumVol += vol;
    if (cumVol > 0) out.push({ time: d.time, value: cumTPV / cumVol });
  }
  return out;
};

const calcRSI = (data: CandlestickData<Time>[], period = 14): LineData<Time>[] => {
  if (data.length < period + 1) return [];
  const out: LineData<Time>[] = [];
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = (data[i] as any).close - (data[i - 1] as any).close;
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  out.push({ time: data[period].time, value: 100 - 100 / (1 + rs) });
  for (let i = period + 1; i < data.length; i++) {
    const diff = (data[i] as any).close - (data[i - 1] as any).close;
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period;
    const rs2 = avgLoss === 0 ? 100 : avgGain / avgLoss;
    out.push({ time: data[i].time, value: 100 - 100 / (1 + rs2) });
  }
  return out;
};

const calcMACD = (
  data: CandlestickData<Time>[],
  fast = 12,
  slow = 26,
  signal = 9
): { macdLine: LineData<Time>[]; signalLine: LineData<Time>[]; histogram: HistogramData<Time>[] } => {
  const emaFast = calcEMA(data, fast);
  const emaSlow = calcEMA(data, slow);
  const macdLine: LineData<Time>[] = [];
  const slowStart = slow - fast;
  for (let i = 0; i < emaSlow.length; i++) {
    const fastIdx = i + slowStart;
    if (fastIdx < emaFast.length) {
      macdLine.push({
        time: emaSlow[i].time,
        value: emaFast[fastIdx].value - emaSlow[i].value,
      });
    }
  }
  // Signal line = EMA of MACD line
  const signalLine: LineData<Time>[] = [];
  if (macdLine.length >= signal) {
    const k = 2 / (signal + 1);
    let ema = macdLine[0].value;
    for (let i = 0; i < macdLine.length; i++) {
      ema = macdLine[i].value * k + ema * (1 - k);
      if (i >= signal - 1) signalLine.push({ time: macdLine[i].time, value: ema });
    }
  }
  const histogram: HistogramData<Time>[] = [];
  const sigOffset = macdLine.length - signalLine.length;
  for (let i = 0; i < signalLine.length; i++) {
    const macdVal = macdLine[i + sigOffset].value;
    const sigVal = signalLine[i].value;
    const diff = macdVal - sigVal;
    histogram.push({
      time: signalLine[i].time,
      value: diff,
      color: diff >= 0 ? "rgba(8, 153, 129, 0.6)" : "rgba(242, 54, 69, 0.6)",
    });
  }
  return { macdLine, signalLine, histogram };
};

/* ═══════════════════ OHLC LEGEND ═══════════════════ */

const OHLCLegend = ({
  bar,
  symbol,
  studies,
}: {
  bar: CandlestickData<Time> | null;
  symbol: string;
  studies: StudyId[];
}) => {
  if (!bar) return null;
  const d = bar as any;
  const isGreen = d.close >= d.open;
  return (
    <div className="absolute top-2 left-3 z-10 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] font-mono pointer-events-none select-none">
      <span className="font-semibold text-foreground/80">{symbol}</span>
      <span className="text-muted-foreground">
        O <span className={isGreen ? "text-success" : "text-destructive"}>{formatPrice(d.open)}</span>
      </span>
      <span className="text-muted-foreground">
        H <span className={isGreen ? "text-success" : "text-destructive"}>{formatPrice(d.high)}</span>
      </span>
      <span className="text-muted-foreground">
        L <span className={isGreen ? "text-success" : "text-destructive"}>{formatPrice(d.low)}</span>
      </span>
      <span className="text-muted-foreground">
        C <span className={isGreen ? "text-success" : "text-destructive"}>{formatPrice(d.close)}</span>
      </span>
      {studies.length > 0 && (
        <span className="text-muted-foreground/50 ml-1">
          {studies.map((s) => {
            const def = OVERLAY_STUDIES.find((o) => o.id === s);
            return def ? (
              <span key={s} className="mr-2" style={{ color: def.color }}>
                {def.label}
              </span>
            ) : null;
          })}
        </span>
      )}
    </div>
  );
};

/* ═══════════════════ MAIN COMPONENT ═══════════════════ */

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

  const { ticker: ticker24h, isLive: tickerLive } = useExchangeTicker({
    exchange: "kraken",
    symbol,
    pollMs: 10_000,
  }) as { ticker: Ticker24h; isLive: boolean };

  // Active studies
  const [overlayStudies, setOverlayStudies] = useState<StudyId[]>(["ema9", "ema21"]);
  const [lowerStudies, setLowerStudies] = useState<LowerStudyId[]>([]);

  // Refs
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const macdChartRef = useRef<IChartApi | null>(null);

  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const overlaySeriesRef = useRef<Map<string, ISeriesApi<"Line">>>(new Map());

  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiLowerRef = useRef<ISeriesApi<"Line"> | null>(null);

  const macdLineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const candleDataRef = useRef<CandlestickData<Time>[]>([]);
  const rawOHLCVRef = useRef<any[]>([]);
  const requestSeqRef = useRef(0);

  const [crosshairBar, setCrosshairBar] = useState<CandlestickData<Time> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ─── Chart layout config ─── */
  const chartOpts = useCallback(
    (el: HTMLElement, h: number) => ({
      width: Math.max(320, el.clientWidth || 0),
      height: h,
      layout: {
        background: { type: ColorType.Solid as const, color: "transparent" },
        textColor: c("muted-foreground"),
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: c("chart-grid", 0.4) },
        horzLines: { color: c("chart-grid", 0.4) },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: c("chart-crosshair", 0.5), width: 1 as const, style: 2 as const, labelBackgroundColor: c("primary") },
        horzLine: { color: c("chart-crosshair", 0.5), width: 1 as const, style: 2 as const, labelBackgroundColor: c("primary") },
      },
      rightPriceScale: { borderColor: c("panel-border", 0.7), scaleMargins: { top: 0.05, bottom: 0.2 } },
      timeScale: { borderColor: c("panel-border", 0.7), timeVisible: true, secondsVisible: false },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    }),
    []
  );

  /* ─── Main chart init ─── */
  useEffect(() => {
    const el = mainContainerRef.current;
    if (!el) return;

    const chart = createChart(el, chartOpts(el, height));

    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#089981",
      downColor: "#f23645",
      borderUpColor: "#089981",
      borderDownColor: "#f23645",
      wickUpColor: "#089981",
      wickDownColor: "#f23645",
    });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candles;
    volumeRef.current = volume;

    // Crosshair move -> OHLC legend
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.seriesData) {
        setCrosshairBar(null);
        return;
      }
      const d = param.seriesData.get(candles) as CandlestickData<Time> | undefined;
      if (d) setCrosshairBar(d);
    });

    const ro = new ResizeObserver(() => {
      if (!mainContainerRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({
        width: Math.max(320, mainContainerRef.current.clientWidth || 0),
      });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      overlaySeriesRef.current.clear();
    };
  }, [height, chartOpts]);

  /* ─── RSI sub-chart ─── */
  useEffect(() => {
    if (!lowerStudies.includes("rsi")) {
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
        rsiSeriesRef.current = null;
        rsiUpperRef.current = null;
        rsiLowerRef.current = null;
      }
      return;
    }
    const el = rsiContainerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      ...chartOpts(el, 120),
      height: 120,
      rightPriceScale: { borderColor: c("panel-border", 0.7), scaleMargins: { top: 0.05, bottom: 0.05 } },
      timeScale: { visible: !lowerStudies.includes("macd"), borderColor: c("panel-border", 0.7), timeVisible: true, secondsVisible: false },
    });

    const rsiLine = chart.addSeries(LineSeries, {
      color: "#8b5cf6",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    // Overbought/oversold lines
    const upper = chart.addSeries(LineSeries, {
      color: "rgba(239, 68, 68, 0.3)",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const lower = chart.addSeries(LineSeries, {
      color: "rgba(34, 197, 94, 0.3)",
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    rsiChartRef.current = chart;
    rsiSeriesRef.current = rsiLine;
    rsiUpperRef.current = upper;
    rsiLowerRef.current = lower;

    // Sync time scales
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) rsiChartRef.current?.timeScale().setVisibleLogicalRange(range);
      });
    }

    const ro = new ResizeObserver(() => {
      if (el && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({ width: Math.max(320, el.clientWidth || 0) });
      }
    });
    ro.observe(el);

    // Populate with existing data
    updateLowerStudies();

    return () => {
      ro.disconnect();
      chart.remove();
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
      rsiUpperRef.current = null;
      rsiLowerRef.current = null;
    };
  }, [lowerStudies.includes("rsi")]);

  /* ─── MACD sub-chart ─── */
  useEffect(() => {
    if (!lowerStudies.includes("macd")) {
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
        macdLineRef.current = null;
        macdSignalRef.current = null;
        macdHistRef.current = null;
      }
      return;
    }
    const el = macdContainerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      ...chartOpts(el, 120),
      height: 120,
      rightPriceScale: { borderColor: c("panel-border", 0.7), scaleMargins: { top: 0.05, bottom: 0.05 } },
      timeScale: { visible: true, borderColor: c("panel-border", 0.7), timeVisible: true, secondsVisible: false },
    });

    const hist = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "price", precision: 4, minMove: 0.0001 },
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const macdLine = chart.addSeries(LineSeries, {
      color: "#2962ff",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const signalLine = chart.addSeries(LineSeries, {
      color: "#ff6d00",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
    });

    macdChartRef.current = chart;
    macdHistRef.current = hist;
    macdLineRef.current = macdLine;
    macdSignalRef.current = signalLine;

    // Sync time scales
    if (chartRef.current) {
      chartRef.current.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) macdChartRef.current?.timeScale().setVisibleLogicalRange(range);
      });
    }

    const ro = new ResizeObserver(() => {
      if (el && macdChartRef.current) {
        macdChartRef.current.applyOptions({ width: Math.max(320, el.clientWidth || 0) });
      }
    });
    ro.observe(el);

    updateLowerStudies();

    return () => {
      ro.disconnect();
      chart.remove();
      macdChartRef.current = null;
      macdLineRef.current = null;
      macdSignalRef.current = null;
      macdHistRef.current = null;
    };
  }, [lowerStudies.includes("macd")]);

  /* ─── Update overlay studies ─── */
  const updateOverlayStudies = useCallback(() => {
    const chart = chartRef.current;
    const candles = candleDataRef.current;
    if (!chart || candles.length === 0) return;

    // Remove old series not in overlayStudies
    overlaySeriesRef.current.forEach((series, id) => {
      if (!overlayStudies.includes(id as StudyId)) {
        chart.removeSeries(series);
        overlaySeriesRef.current.delete(id);
      }
    });

    const getOrCreate = (id: string, color: string, lineWidth = 2) => {
      let series = overlaySeriesRef.current.get(id);
      if (!series) {
        series = chart.addSeries(LineSeries, {
          color,
          lineWidth: lineWidth as any,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        overlaySeriesRef.current.set(id, series);
      }
      return series;
    };

    for (const studyId of overlayStudies) {
      const def = OVERLAY_STUDIES.find((s) => s.id === studyId);
      if (!def) continue;

      const series = getOrCreate(studyId, def.color);

      switch (studyId) {
        case "sma20":
          series.setData(calcSMA(candles, 20));
          break;
        case "sma50":
          series.setData(calcSMA(candles, 50));
          break;
        case "sma200":
          series.setData(calcSMA(candles, 200));
          break;
        case "ema9":
          series.setData(calcEMA(candles, 9));
          break;
        case "ema21":
          series.setData(calcEMA(candles, 21));
          break;
        case "vwap": {
          // VWAP needs volume data
          const vwapData = rawOHLCVRef.current.length > 0
            ? (() => {
                const out: LineData<Time>[] = [];
                let cumTPV = 0;
                let cumVol = 0;
                for (const k of rawOHLCVRef.current) {
                  const tp = (Number(k.high) + Number(k.low) + Number(k.close)) / 3;
                  const vol = Number(k.volume) || 1;
                  cumTPV += tp * vol;
                  cumVol += vol;
                  if (cumVol > 0)
                    out.push({ time: (Math.floor(Number(k.timestamp) / 1000)) as Time, value: cumTPV / cumVol });
                }
                return out;
              })()
            : [];
          series.setData(vwapData);
          break;
        }
        case "bb": {
          const bb = calcBollingerBands(candles);
          series.setData(bb.middle);
          // Upper and lower bands
          const upperSeries = getOrCreate("bb_upper", def.color + "80", 1);
          const lowerSeries = getOrCreate("bb_lower", def.color + "80", 1);
          upperSeries.setData(bb.upper);
          lowerSeries.setData(bb.lower);
          break;
        }
      }
    }

    // Clean up BB band series if BB is not active
    if (!overlayStudies.includes("bb")) {
      ["bb_upper", "bb_lower"].forEach((id) => {
        const s = overlaySeriesRef.current.get(id);
        if (s) {
          chart.removeSeries(s);
          overlaySeriesRef.current.delete(id);
        }
      });
    }
  }, [overlayStudies]);

  /* ─── Update lower studies ─── */
  const updateLowerStudies = useCallback(() => {
    const candles = candleDataRef.current;
    if (candles.length === 0) return;

    // RSI
    if (rsiSeriesRef.current) {
      const rsiData = calcRSI(candles, 14);
      rsiSeriesRef.current.setData(rsiData);
      // Set overbought/oversold reference lines
      if (rsiUpperRef.current && rsiData.length > 0) {
        rsiUpperRef.current.setData(rsiData.map((d) => ({ time: d.time, value: 70 })));
      }
      if (rsiLowerRef.current && rsiData.length > 0) {
        rsiLowerRef.current.setData(rsiData.map((d) => ({ time: d.time, value: 30 })));
      }
      rsiChartRef.current?.timeScale().fitContent();
    }

    // MACD
    if (macdLineRef.current && macdSignalRef.current && macdHistRef.current) {
      const macdData = calcMACD(candles);
      macdHistRef.current.setData(macdData.histogram);
      macdLineRef.current.setData(macdData.macdLine);
      macdSignalRef.current.setData(macdData.signalLine);
      macdChartRef.current?.timeScale().fitContent();
    }
  }, []);

  /* ─── Fetch OHLCV ─── */
  const fetchOHLCV = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = Boolean(opts?.silent);
      const requestId = ++requestSeqRef.current;
      if (!silent) setIsRefreshing(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("ccxt-trading", {
          body: { action: "fetch_ohlcv", exchange: "kraken", symbol, timeframe, limit: 300 },
        });

        if (requestId !== requestSeqRef.current) return;
        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || "Failed to fetch OHLCV");

        const ohlcv: any[] = Array.isArray(data.data) ? data.data : [];
        rawOHLCVRef.current = ohlcv;

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
            color: isBull ? "rgba(8, 153, 129, 0.35)" : "rgba(242, 54, 69, 0.35)",
          };
        });

        candleDataRef.current = candleData;
        candleRef.current?.setData(candleData);
        volumeRef.current?.setData(volumeData);

        // Set last bar for OHLC legend
        setCrosshairBar(candleData[candleData.length - 1] ?? null);

        // Update all studies
        updateOverlayStudies();
        updateLowerStudies();

        chartRef.current?.timeScale().fitContent();
        setHasLoadedOnce(true);
      } catch (err: any) {
        console.error("TradingViewChart OHLCV error:", err);
        setError(err?.message || "Failed to load chart data");
      } finally {
        setIsRefreshing(false);
      }
    },
    [symbol, timeframe, updateOverlayStudies, updateLowerStudies]
  );

  // Re-apply overlay studies when selection changes
  useEffect(() => {
    updateOverlayStudies();
  }, [overlayStudies, updateOverlayStudies]);

  // Poll OHLCV
  useEffect(() => {
    fetchOHLCV();
    const id = window.setInterval(() => fetchOHLCV({ silent: true }), Math.max(20_000, pollMs));
    return () => window.clearInterval(id);
  }, [fetchOHLCV, pollMs]);

  const toggleFullscreen = () => setIsFullscreen((v) => !v);

  const toggleOverlay = (id: StudyId) => {
    setOverlayStudies((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleLower = (id: LowerStudyId) => {
    setLowerStudies((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const displayedPrice = ticker24h?.last;
  const displayedChange = ticker24h?.changePercent;

  const mainChartHeight = isFullscreen
    ? `calc(100vh - ${140 + lowerStudies.length * 130}px)`
    : height;

  return (
    <Card className={`overflow-hidden border-panel-border ${isFullscreen ? "fixed inset-4 z-50 bg-background" : ""}`}>
      {showToolbar && (
        <div className="flex flex-col gap-1.5 px-3 py-2 border-b border-panel-border bg-panel-header/80 backdrop-blur-sm">
          {/* Row 1: Symbol, Timeframe, Studies, Price */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Symbol selector */}
              <Select value={symbol} onValueChange={setSymbolSafe}>
                <SelectTrigger className="w-[130px] h-7 text-xs font-mono font-semibold border-panel-border bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map((s) => (
                    <SelectItem key={s.value} value={s.value} className="font-mono text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Timeframe pills */}
              <div className="flex rounded-md border border-panel-border overflow-hidden bg-secondary/30">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf.value}
                    className={`px-2.5 py-1 text-[10px] font-mono font-semibold transition-all ${
                      timeframe === tf.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    }`}
                    onClick={() => setTimeframeSafe(tf.value)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Studies dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-[10px] font-mono gap-1 text-muted-foreground hover:text-foreground">
                    <Activity className="h-3.5 w-3.5" />
                    Studies ({overlayStudies.length + lowerStudies.length})
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel className="text-[10px] font-mono text-muted-foreground">
                    OVERLAYS
                  </DropdownMenuLabel>
                  {OVERLAY_STUDIES.map((s) => (
                    <DropdownMenuCheckboxItem
                      key={s.id}
                      checked={overlayStudies.includes(s.id)}
                      onCheckedChange={() => toggleOverlay(s.id)}
                      className="text-xs"
                    >
                      <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: s.color }} />
                      {s.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] font-mono text-muted-foreground">
                    LOWER PANES
                  </DropdownMenuLabel>
                  {LOWER_STUDIES.map((s) => (
                    <DropdownMenuCheckboxItem
                      key={s.id}
                      checked={lowerStudies.includes(s.id)}
                      onCheckedChange={() => toggleLower(s.id)}
                      className="text-xs"
                    >
                      {s.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Price + controls */}
            <div className="flex items-center gap-3">
              {Number.isFinite(displayedPrice) && displayedPrice !== undefined ? (
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono">${formatPrice(displayedPrice)}</span>
                  {typeof displayedChange === "number" && Number.isFinite(displayedChange) && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono ${
                        displayedChange >= 0
                          ? "text-success border-success/40"
                          : "text-destructive border-destructive/40"
                      }`}
                    >
                      {displayedChange >= 0 ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                      {displayedChange >= 0 ? "+" : ""}
                      {displayedChange.toFixed(2)}%
                    </Badge>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[9px] text-success font-mono font-medium">LIVE</span>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => fetchOHLCV()}
                  disabled={isRefreshing}
                  aria-label="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Row 2: OHLCV stats */}
          {ticker24h && (
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-muted-foreground font-mono">
              <span>H: <span className="text-foreground/80">${formatPrice(ticker24h.high)}</span></span>
              <span>L: <span className="text-foreground/80">${formatPrice(ticker24h.low)}</span></span>
              <span>Vol: <span className="text-foreground/80">{formatCompact(ticker24h.volume)}</span></span>
              <span>QVol: <span className="text-foreground/80">${formatCompact(ticker24h.quoteVolume)}</span></span>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-0 relative">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2 text-center p-4">
              <p className="text-xs text-destructive font-mono">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchOHLCV()} className="text-xs">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* OHLC Legend overlay */}
        <OHLCLegend bar={crosshairBar} symbol={symbol} studies={overlayStudies} />

        {/* Main chart */}
        <div
          ref={mainContainerRef}
          style={{ height: mainChartHeight }}
          className="w-full"
        />

        {/* RSI pane */}
        {lowerStudies.includes("rsi") && (
          <div className="border-t border-panel-border relative">
            <span className="absolute top-1 left-3 z-10 text-[10px] font-mono text-muted-foreground pointer-events-none">
              RSI (14)
            </span>
            <div ref={rsiContainerRef} style={{ height: 120 }} className="w-full" />
          </div>
        )}

        {/* MACD pane */}
        {lowerStudies.includes("macd") && (
          <div className="border-t border-panel-border relative">
            <span className="absolute top-1 left-3 z-10 text-[10px] font-mono text-muted-foreground pointer-events-none">
              MACD (12, 26, 9)
            </span>
            <div ref={macdContainerRef} style={{ height: 120 }} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;
