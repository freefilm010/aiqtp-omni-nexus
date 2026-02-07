import { useEffect, useRef, useState, useCallback } from "react";
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
  type Time,
} from "lightweight-charts";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
];

const TIMEFRAMES = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
];

interface TradingViewChartProps {
  defaultSymbol?: string;
  height?: number;
  showToolbar?: boolean;
}

const TradingViewChart = ({
  defaultSymbol = "BTC/USDT",
  height = 500,
  showToolbar = true,
}: TradingViewChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const [symbol, setSymbol] = useState(defaultSymbol);
  const [timeframe, setTimeframe] = useState("1h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSMA, setShowSMA] = useState(true);

  const symbolConfig = SYMBOLS.find((s) => s.value === symbol) || SYMBOLS[0];
  const { tickers } = useBinanceTickers([symbolConfig.binance]);
  const liveTicker = tickers[symbolConfig.binance];

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(150, 150, 150, 1)",
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      },
      grid: {
        vertLines: { color: "rgba(42, 46, 57, 0.6)" },
        horzLines: { color: "rgba(42, 46, 57, 0.6)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: "rgba(224, 227, 235, 0.3)",
          width: 1,
          style: 2,
          labelBackgroundColor: "hsl(var(--primary))",
        },
        horzLine: {
          color: "rgba(224, 227, 235, 0.3)",
          width: 1,
          style: 2,
          labelBackgroundColor: "hsl(var(--primary))",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(42, 46, 57, 0.6)",
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: "rgba(42, 46, 57, 0.6)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });

    // Candlestick series (v5 API)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    // Volume histogram (v5 API)
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    // SMA line (v5 API)
    const smaSeries = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    smaSeriesRef.current = smaSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Calculate SMA
  const calculateSMA = (data: CandlestickData[], period: number) => {
    const smaData: { time: Time; value: number }[] = [];
    for (let i = period - 1; i < data.length; i++) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += (data[i - j] as any).close;
      }
      smaData.push({ time: data[i].time, value: sum / period });
    }
    return smaData;
  };

  // Fetch OHLCV data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ccxt-trading", {
        body: {
          action: "fetch_ohlcv",
          exchange: "binance",
          symbol,
          timeframe,
          limit: 200,
        },
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch data");

      const ohlcv = data.data;

      const candleData: CandlestickData[] = ohlcv.map((c: any) => ({
        time: Math.floor(c.timestamp / 1000) as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const volumeData = ohlcv.map((c: any) => ({
        time: Math.floor(c.timestamp / 1000) as Time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(34, 197, 94, 0.5)" : "rgba(239, 68, 68, 0.5)",
      }));

      candleSeriesRef.current?.setData(candleData);
      volumeSeriesRef.current?.setData(volumeData);

      if (showSMA) {
        const smaData = calculateSMA(candleData, 20);
        smaSeriesRef.current?.setData(smaData);
      }

      chartRef.current?.timeScale().fitContent();
    } catch (err: any) {
      console.error("Error fetching OHLCV:", err);
      setError(err.message || "Failed to fetch chart data");
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, showSMA]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Update last candle with live price
  useEffect(() => {
    if (!liveTicker || !candleSeriesRef.current) return;

    candleSeriesRef.current.update({
      time: Math.floor(Date.now() / 1000) as Time,
      open: liveTicker.lastPrice,
      high: liveTicker.lastPrice,
      low: liveTicker.lastPrice,
      close: liveTicker.lastPrice,
    });
  }, [liveTicker?.lastPrice]);

  // Toggle SMA visibility
  useEffect(() => {
    if (smaSeriesRef.current) {
      smaSeriesRef.current.applyOptions({
        visible: showSMA,
      });
    }
  }, [showSMA]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Card className={`overflow-hidden ${isFullscreen ? "fixed inset-4 z-50" : ""}`}>
      {showToolbar && (
        <div className="flex items-center justify-between p-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-[130px] h-8 text-sm font-medium">
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
                  onClick={() => setTimeframe(tf.value)}
                >
                  {tf.label}
                </Button>
              ))}
            </div>

            <Button
              variant={showSMA ? "secondary" : "ghost"}
              size="sm"
              className="h-8 text-xs"
              onClick={() => setShowSMA(!showSMA)}
            >
              SMA 20
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {liveTicker && (
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono">
                  ${liveTicker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <Badge
                  variant="outline"
                  className={`${
                    liveTicker.priceChangePercent >= 0
                      ? "text-green-500 border-green-500/50"
                      : "text-red-500 border-red-500/50"
                  }`}
                >
                  {liveTicker.priceChangePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {liveTicker.priceChangePercent >= 0 ? "+" : ""}
                  {liveTicker.priceChangePercent.toFixed(2)}%
                </Badge>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] text-green-500 font-medium">LIVE</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0 relative">
        {loading && !chartRef.current?.timeScale && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading chart...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center gap-3 text-center p-4">
              <p className="text-red-400 font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchData}>
                Retry
              </Button>
            </div>
          </div>
        )}

        <div
          ref={chartContainerRef}
          style={{ height: isFullscreen ? "calc(100vh - 120px)" : height }}
          className="w-full"
        />
      </CardContent>
    </Card>
  );
};

export default TradingViewChart;
