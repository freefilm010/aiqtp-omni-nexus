import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  CandlestickChart,
  LineChart as LineChartIcon,
  Maximize2,
  Settings,
  Crosshair,
  PenTool,
  Ruler,
  Type,
  Shapes,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useKrakenTickers } from "@/hooks/useKrakenTickers";

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AdvancedChartProps {
  symbol?: string;
  basePrice?: number;
}

// Map display symbol to Binance symbol
const symbolMap: Record<string, string> = {
  'BTC/USDT': 'BTCUSDT',
  'ETH/USDT': 'ETHUSDT',
  'SOL/USDT': 'SOLUSDT',
  'XRP/USDT': 'XRPUSDT',
  'ADA/USDT': 'ADAUSDT',
  'AVAX/USDT': 'AVAXUSDT',
  'LINK/USDT': 'LINKUSDT',
  'DOGE/USDT': 'DOGEUSDT',
};

// Map display symbol to CoinGecko ID
const coinGeckoMap: Record<string, string> = {
  'BTC/USDT': 'bitcoin',
  'ETH/USDT': 'ethereum',
  'SOL/USDT': 'solana',
  'XRP/USDT': 'ripple',
  'ADA/USDT': 'cardano',
  'AVAX/USDT': 'avalanche-2',
  'LINK/USDT': 'chainlink',
  'DOGE/USDT': 'dogecoin',
};

const AdvancedTradingChart = ({ symbol = "BTC/USDT" }: AdvancedChartProps) => {
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("15m");
  const [chartType, setChartType] = useState<'candle' | 'line' | 'bar'>('candle');
  const [indicators, setIndicators] = useState<string[]>(['MA20', 'Volume']);
  const [drawingTool, setDrawingTool] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { tickers } = useKrakenTickers([symbol], 12_000);
  const liveTicker = tickers[symbol];

  const latestCandle = candleData[candleData.length - 1];
  const previousCandle = candleData[candleData.length - 2];
  const priceChange = latestCandle && previousCandle
    ? ((latestCandle.close - previousCandle.close) / previousCandle.close * 100)
    : 0;

  // Fetch real OHLCV data from Kraken
  useEffect(() => {
    const fetchOHLCV = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("ccxt-trading", {
          body: {
            action: "fetch_ohlcv",
            exchange: "kraken",
            symbol,
            timeframe,
            limit: 100,
          },
        });

        if (!error && data?.success && Array.isArray(data.data)) {
          const mapped: CandleData[] = data.data.map((c: any) => ({
            time: Number(c.timestamp),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
            volume: Number(c.volume) || 0,
          }));
          setCandleData(mapped);
        } else {
          setCandleData([]);
        }
      } catch (err) {
        console.error("Error fetching OHLCV:", err);
        setCandleData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOHLCV();
  }, [symbol, timeframe]);

  // Update last candle with live price
  useEffect(() => {
    if (!liveTicker || candleData.length === 0) return;
    
    setCandleData(prev => {
      const newData = [...prev];
      const lastCandle = { ...newData[newData.length - 1] };
      lastCandle.close = liveTicker.lastPrice;
      lastCandle.high = Math.max(lastCandle.high, liveTicker.lastPrice);
      lastCandle.low = Math.min(lastCandle.low, liveTicker.lastPrice);
      newData[newData.length - 1] = lastCandle;
      return newData;
    });
  }, [liveTicker?.lastPrice]);

  // Calculate indicators
  const calculateMA = (period: number): number[] => {
    return candleData.map((_, i) => {
      if (i < period - 1) return 0;
      const slice = candleData.slice(i - period + 1, i + 1);
      return slice.reduce((sum, c) => sum + c.close, 0) / period;
    });
  };

  const ma20 = calculateMA(20);
  const ma50 = calculateMA(50);

  // Draw chart on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candleData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const chartHeight = height * 0.75;
    const volumeHeight = height * 0.2;

    // Clear canvas
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, width, height);

    // Calculate price range
    const prices = candleData.flatMap(c => [c.high, c.low]);
    const minPrice = Math.min(...prices) * 0.998;
    const maxPrice = Math.max(...prices) * 1.002;
    const priceRange = maxPrice - minPrice;

    const maxVolume = Math.max(...candleData.map(c => c.volume));

    const candleWidth = (width - 60) / candleData.length;
    const candleSpacing = candleWidth * 0.2;

    // Draw grid
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 60, y);
      ctx.stroke();
      
      // Price labels
      const price = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = 'hsl(var(--muted-foreground))';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`$${price.toFixed(2)}`, width - 58, y + 4);
    }

    // Draw candles or line
    candleData.forEach((candle, i) => {
      const x = i * candleWidth + candleSpacing;
      const isGreen = candle.close >= candle.open;

      if (chartType === 'candle') {
        // Wick
        ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        const wickX = x + (candleWidth - candleSpacing * 2) / 2;
        const highY = ((maxPrice - candle.high) / priceRange) * chartHeight;
        const lowY = ((maxPrice - candle.low) / priceRange) * chartHeight;
        ctx.moveTo(wickX, highY);
        ctx.lineTo(wickX, lowY);
        ctx.stroke();

        // Body
        ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
        const openY = ((maxPrice - candle.open) / priceRange) * chartHeight;
        const closeY = ((maxPrice - candle.close) / priceRange) * chartHeight;
        const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
        ctx.fillRect(x, Math.min(openY, closeY), candleWidth - candleSpacing * 2, bodyHeight);
      } else if (chartType === 'line') {
        const closeY = ((maxPrice - candle.close) / priceRange) * chartHeight;
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(x, closeY);
        } else {
          ctx.lineTo(x, closeY);
        }
        if (i === candleData.length - 1) {
          ctx.strokeStyle = 'hsl(var(--primary))';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Volume bars
      const volHeight = (candle.volume / maxVolume) * volumeHeight;
      ctx.fillStyle = isGreen ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)';
      ctx.fillRect(x, chartHeight + 10 + (volumeHeight - volHeight), candleWidth - candleSpacing * 2, volHeight);
    });

    // Draw MA lines
    if (indicators.includes('MA20')) {
      ctx.beginPath();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ma20.forEach((ma, i) => {
        if (ma === 0) return;
        const x = i * candleWidth + candleWidth / 2;
        const y = ((maxPrice - ma) / priceRange) * chartHeight;
        if (i === ma20.findIndex(v => v > 0)) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    if (indicators.includes('MA50')) {
      ctx.beginPath();
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1.5;
      ma50.forEach((ma, i) => {
        if (ma === 0) return;
        const x = i * candleWidth + candleWidth / 2;
        const y = ((maxPrice - ma) / priceRange) * chartHeight;
        if (i === ma50.findIndex(v => v > 0)) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    }

    // Current price line
    if (latestCandle) {
      const currentY = ((maxPrice - latestCandle.close) / priceRange) * chartHeight;
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = latestCandle.close >= (previousCandle?.close || 0) ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(width - 60, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price tag
      ctx.fillStyle = latestCandle.close >= (previousCandle?.close || 0) ? '#22c55e' : '#ef4444';
      ctx.fillRect(width - 58, currentY - 10, 58, 20);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`$${latestCandle.close.toFixed(2)}`, width - 29, currentY + 4);
    }

  }, [candleData, chartType, indicators, ma20, ma50, latestCandle, previousCandle]);

  const toggleIndicator = (indicator: string) => {
    setIndicators(prev =>
      prev.includes(indicator)
        ? prev.filter(i => i !== indicator)
        : [...prev, indicator]
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="text-xl">{symbol}</CardTitle>
            <div className="flex items-center gap-2">
              {liveTicker ? (
                <>
                  <span className={`text-2xl font-bold ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ${liveTicker.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <Badge variant={liveTicker.priceChangePercent >= 0 ? 'default' : 'destructive'}>
                    {liveTicker.priceChangePercent >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {liveTicker.priceChangePercent >= 0 ? '+' : ''}{liveTicker.priceChangePercent.toFixed(2)}%
                  </Badge>
                  <Badge variant="outline" className="text-green-500 border-green-500 text-[10px]">LIVE</Badge>
                </>
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">--</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mt-2">
          {/* Timeframe */}
          <div className="flex gap-1">
            {['1m', '5m', '15m', '1h', '4h', '1D', '1W'].map((tf) => (
              <Button
                key={tf}
                variant={timeframe === tf ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </Button>
            ))}
          </div>

          {/* Chart type */}
          <div className="flex gap-1">
            <Button
              variant={chartType === 'candle' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setChartType('candle')}
            >
              <CandlestickChart className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setChartType('line')}
            >
              <LineChartIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="icon"
              onClick={() => setChartType('bar')}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Drawing tools */}
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setDrawingTool('crosshair')}>
              <Crosshair className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDrawingTool('line')}>
              <PenTool className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDrawingTool('measure')}>
              <Ruler className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDrawingTool('text')}>
              <Type className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDrawingTool('shapes')}>
              <Shapes className="h-4 w-4" />
            </Button>
          </div>

          {/* Indicators */}
          <div className="flex gap-1">
            {['MA20', 'MA50', 'RSI', 'MACD', 'BB'].map((ind) => (
              <Button
                key={ind}
                variant={indicators.includes(ind) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => toggleIndicator(ind)}
              >
                {ind}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="w-full h-[500px] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : candleData.length === 0 ? (
          <div className="w-full h-[500px] flex flex-col items-center justify-center text-muted-foreground">
            <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
            <p className="font-medium">No Chart Data Available</p>
            <p className="text-sm">OHLCV data will appear once synced from market feeds.</p>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={900}
            height={500}
            className="w-full h-[500px]"
            style={{ imageRendering: 'crisp-edges' }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default AdvancedTradingChart;