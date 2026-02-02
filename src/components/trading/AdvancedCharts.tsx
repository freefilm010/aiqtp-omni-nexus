import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBinanceTickers } from "@/hooks/useBinanceTickers";
import { supabase } from "@/integrations/supabase/client";
import { 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip, 
  Area, 
  Bar,
  ReferenceLine,
  ReferenceArea
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Layers,
  MousePointer,
  Minus,
  Ruler,
  PenTool,
  Type,
  Shapes,
  Maximize2,
  Loader2,
  Activity,
  Target,
  GitBranch,
  Waves
} from "lucide-react";

const DRAWING_TOOLS = [
  { id: 'pointer', icon: MousePointer, name: 'Select' },
  { id: 'line', icon: Minus, name: 'Trend Line' },
  { id: 'ray', icon: TrendingUp, name: 'Ray' },
  { id: 'fib', icon: Ruler, name: 'Fibonacci' },
  { id: 'channel', icon: Layers, name: 'Channel' },
  { id: 'rectangle', icon: Shapes, name: 'Rectangle' },
  { id: 'text', icon: Type, name: 'Text' },
  { id: 'brush', icon: PenTool, name: 'Brush' },
];

const INDICATORS = [
  { id: 'sma', name: 'SMA (20)', category: 'Trend', enabled: true, color: '#f59e0b' },
  { id: 'ema', name: 'EMA (12)', category: 'Trend', enabled: false, color: '#10b981' },
  { id: 'ema26', name: 'EMA (26)', category: 'Trend', enabled: false, color: '#ef4444' },
  { id: 'bb', name: 'Bollinger Bands', category: 'Volatility', enabled: true, color: '#8b5cf6' },
  { id: 'rsi', name: 'RSI (14)', category: 'Momentum', enabled: false, color: '#06b6d4' },
  { id: 'macd', name: 'MACD', category: 'Momentum', enabled: false, color: '#ec4899' },
  { id: 'stoch', name: 'Stochastic', category: 'Momentum', enabled: false, color: '#f97316' },
  { id: 'atr', name: 'ATR (14)', category: 'Volatility', enabled: false, color: '#84cc16' },
  { id: 'volume', name: 'Volume', category: 'Volume', enabled: true, color: '#64748b' },
  { id: 'vwap', name: 'VWAP', category: 'Volume', enabled: false, color: '#a855f7' },
  { id: 'ichimoku', name: 'Ichimoku Cloud', category: 'Trend', enabled: false, color: '#14b8a6' },
  { id: 'pivot', name: 'Pivot Points', category: 'Support/Resistance', enabled: false, color: '#f43f5e' },
  { id: 'obv', name: 'OBV', category: 'Volume', enabled: false, color: '#0ea5e9' },
  { id: 'supertrend', name: 'SuperTrend', category: 'Trend', enabled: false, color: '#22c55e' },
  { id: 'adx', name: 'ADX (14)', category: 'Trend', enabled: false, color: '#eab308' },
];

const SYMBOLS = [
  { value: 'BTC/USDT', label: 'BTC/USDT', binance: 'BTCUSDT' },
  { value: 'ETH/USDT', label: 'ETH/USDT', binance: 'ETHUSDT' },
  { value: 'SOL/USDT', label: 'SOL/USDT', binance: 'SOLUSDT' },
  { value: 'BNB/USDT', label: 'BNB/USDT', binance: 'BNBUSDT' },
  { value: 'XRP/USDT', label: 'XRP/USDT', binance: 'XRPUSDT' },
  { value: 'ADA/USDT', label: 'ADA/USDT', binance: 'ADAUSDT' },
  { value: 'DOGE/USDT', label: 'DOGE/USDT', binance: 'DOGEUSDT' },
  { value: 'AVAX/USDT', label: 'AVAX/USDT', binance: 'AVAXUSDT' },
];

interface ChartDataPoint {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  sma20: number | null;
  ema12: number | null;
  ema26: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
  rsi: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  vwap: number | null;
  atr: number | null;
  volumeColor: string;
}

// Calculate EMA
const calculateEMA = (data: number[], period: number): (number | null)[] => {
  const multiplier = 2 / (period + 1);
  const emaValues: (number | null)[] = [];
  
  data.forEach((price, i) => {
    if (i < period - 1) {
      emaValues.push(null);
    } else if (i === period - 1) {
      const sma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      emaValues.push(sma);
    } else {
      const prevEma = emaValues[i - 1] || price;
      emaValues.push((price - prevEma) * multiplier + prevEma);
    }
  });
  
  return emaValues;
};

// Calculate RSI
const calculateRSI = (closes: number[], period: number = 14): (number | null)[] => {
  const rsiValues: (number | null)[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      rsiValues.push(null);
      continue;
    }
    
    const change = closes[i] - closes[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
    
    if (i < period) {
      rsiValues.push(null);
    } else {
      const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      rsiValues.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsiValues;
};

// Calculate ATR
const calculateATR = (highs: number[], lows: number[], closes: number[], period: number = 14): (number | null)[] => {
  const atrValues: (number | null)[] = [];
  const trueRanges: number[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    if (i === 0) {
      trueRanges.push(highs[i] - lows[i]);
      atrValues.push(null);
      continue;
    }
    
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
    trueRanges.push(tr);
    
    if (i < period) {
      atrValues.push(null);
    } else {
      const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
      atrValues.push(atr);
    }
  }
  
  return atrValues;
};

const AdvancedCharts = () => {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [chartType, setChartType] = useState('candle');
  const [selectedTool, setSelectedTool] = useState('pointer');
  const [activeIndicators, setActiveIndicators] = useState(
    INDICATORS.filter(i => i.enabled).map(i => i.id)
  );
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const symbolConfig = SYMBOLS.find(s => s.value === symbol) || SYMBOLS[0];
  const { tickers } = useBinanceTickers([symbolConfig.binance]);
  const liveTicker = tickers[symbolConfig.binance];
  const livePrice = liveTicker?.lastPrice || 0;
  const priceChange = liveTicker?.priceChangePercent || 0;

  // Fetch real OHLCV data from CCXT endpoint
  useEffect(() => {
    const fetchOHLCV = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error: fnError } = await supabase.functions.invoke('ccxt-trading', {
          body: {
            action: 'fetch_ohlcv',
            exchange: 'binance',
            symbol,
            timeframe,
            limit: 100
          }
        });

        if (fnError) throw fnError;
        if (!data?.success) throw new Error(data?.error || 'Failed to fetch data');

        const ohlcv = data.data;
        const closes = ohlcv.map((c: any) => c.close);
        const highs = ohlcv.map((c: any) => c.high);
        const lows = ohlcv.map((c: any) => c.low);
        
        // Calculate indicators
        const ema12Values = calculateEMA(closes, 12);
        const ema26Values = calculateEMA(closes, 26);
        const rsiValues = calculateRSI(closes, 14);
        const atrValues = calculateATR(highs, lows, closes, 14);
        
        // Calculate MACD
        const macdLine: (number | null)[] = ema12Values.map((v, i) => {
          if (v === null || ema26Values[i] === null) return null;
          return v - (ema26Values[i] as number);
        });
        const macdSignal = calculateEMA(macdLine.filter(v => v !== null) as number[], 9);
        
        const mapped: ChartDataPoint[] = ohlcv.map((c: any, i: number) => {
          const closePrice = c.close;
          
          // Calculate SMA20
          let sma20: number | null = null;
          if (i >= 19) {
            const sum = ohlcv.slice(i - 19, i + 1).reduce((s: number, d: any) => s + d.close, 0);
            sma20 = sum / 20;
          }
          
          // Calculate Bollinger Bands
          let bb_upper: number | null = null;
          let bb_middle: number | null = null;
          let bb_lower: number | null = null;
          if (i >= 19) {
            const slice = ohlcv.slice(i - 19, i + 1);
            const avg = slice.reduce((s: number, d: any) => s + d.close, 0) / 20;
            const stdDev = Math.sqrt(slice.reduce((s: number, d: any) => s + Math.pow(d.close - avg, 2), 0) / 20);
            bb_upper = avg + stdDev * 2;
            bb_middle = avg;
            bb_lower = avg - stdDev * 2;
          }
          
          // Calculate VWAP (simplified - cumulative)
          let vwap: number | null = null;
          if (i > 0) {
            const typicalPrices = ohlcv.slice(0, i + 1).map((d: any) => (d.high + d.low + d.close) / 3);
            const volumes = ohlcv.slice(0, i + 1).map((d: any) => d.volume);
            const tpv = typicalPrices.reduce((s: number, tp: number, j: number) => s + tp * volumes[j], 0);
            const totalVol = volumes.reduce((s: number, v: number) => s + v, 0);
            vwap = totalVol > 0 ? tpv / totalVol : null;
          }
          
          // Format time
          const date = new Date(c.timestamp);
          const timeStr = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          });
          
          return {
            time: `${date.getMonth() + 1}/${date.getDate()} ${timeStr}`,
            timestamp: c.timestamp,
            open: c.open,
            high: c.high,
            low: c.low,
            close: closePrice,
            volume: c.volume,
            quoteVolume: c.quoteVolume,
            sma20,
            ema12: ema12Values[i],
            ema26: ema26Values[i],
            bb_upper,
            bb_middle,
            bb_lower,
            rsi: rsiValues[i],
            macd: macdLine[i],
            macdSignal: macdSignal[Math.min(i, macdSignal.length - 1)] || null,
            macdHist: macdLine[i] !== null && macdSignal[i] !== null ? macdLine[i]! - macdSignal[i]! : null,
            vwap,
            atr: atrValues[i],
            volumeColor: closePrice >= c.open ? 'hsl(142.1 76.2% 36.3%)' : 'hsl(0 84.2% 60.2%)',
          };
        });
        
        setChartData(mapped);
      } catch (err: any) {
        console.error('Error fetching OHLCV:', err);
        setError(err.message || 'Failed to fetch chart data');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOHLCV();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchOHLCV, 30000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  const toggleIndicator = (id: string) => {
    setActiveIndicators(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Calculate price domain
  const priceDomain = useMemo(() => {
    if (chartData.length === 0) return ['auto', 'auto'];
    const prices = chartData.flatMap(d => [d.high, d.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.05;
    return [min - padding, max + padding];
  }, [chartData]);

  // Calculate support/resistance levels
  const pivotLevels = useMemo(() => {
    if (chartData.length === 0) return null;
    const last = chartData[chartData.length - 1];
    const pivot = (last.high + last.low + last.close) / 3;
    return {
      pivot,
      r1: 2 * pivot - last.low,
      r2: pivot + (last.high - last.low),
      s1: 2 * pivot - last.high,
      s2: pivot - (last.high - last.low),
    };
  }, [chartData]);

  const lastCandle = chartData[chartData.length - 1];
  const prevCandle = chartData[chartData.length - 2];
  const candleChange = lastCandle && prevCandle 
    ? ((lastCandle.close - prevCandle.close) / prevCandle.close * 100).toFixed(2)
    : '0.00';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4 flex-wrap">
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SYMBOLS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg overflow-hidden">
                {['1m', '5m', '15m', '1h', '4h', '1d', '1w'].map(tf => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none px-3"
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf.toUpperCase()}
                  </Button>
                ))}
              </div>

              <div className="h-6 w-px bg-border hidden md:block" />

              <div className="flex gap-1 hidden md:flex">
                {DRAWING_TOOLS.map(tool => (
                  <Button
                    key={tool.id}
                    variant={selectedTool === tool.id ? 'default' : 'ghost'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setSelectedTool(tool.id)}
                    title={tool.name}
                  >
                    <tool.icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {livePrice > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold font-mono">
                    ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={priceChange >= 0 ? 'text-green-500 border-green-500/50' : 'text-red-500 border-red-500/50'}
                  >
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </Badge>
                </div>
              )}
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-green-500 font-medium">LIVE</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Main Chart */}
        <Card className="lg:col-span-4">
          <CardContent className="p-4">
            {loading ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading {symbol} data...</span>
                </div>
              </div>
            ) : error ? (
              <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
                <p className="font-medium text-red-400">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
                <p className="font-medium">No Chart Data Available</p>
              </div>
            ) : (
              <>
                {/* Price Chart */}
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 60, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.1} />
                          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={priceDomain}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(v) => `$${v.toLocaleString()}`}
                        orientation="right"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload as ChartDataPoint;
                          return (
                            <div className="bg-background/95 border rounded-lg p-3 shadow-lg text-sm">
                              <p className="text-muted-foreground mb-2">{d.time}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                <span className="text-muted-foreground">O:</span>
                                <span className="font-mono">${d.open.toLocaleString()}</span>
                                <span className="text-muted-foreground">H:</span>
                                <span className="font-mono text-green-500">${d.high.toLocaleString()}</span>
                                <span className="text-muted-foreground">L:</span>
                                <span className="font-mono text-red-500">${d.low.toLocaleString()}</span>
                                <span className="text-muted-foreground">C:</span>
                                <span className="font-mono">${d.close.toLocaleString()}</span>
                                <span className="text-muted-foreground">Vol:</span>
                                <span className="font-mono">{d.volume.toLocaleString()}</span>
                              </div>
                              {d.rsi && (
                                <div className="mt-2 pt-2 border-t">
                                  <span className="text-muted-foreground">RSI: </span>
                                  <span className={d.rsi > 70 ? 'text-red-400' : d.rsi < 30 ? 'text-green-400' : ''}>
                                    {d.rsi.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />

                      {/* Bollinger Bands fill */}
                      {activeIndicators.includes('bb') && (
                        <Area
                          type="monotone"
                          dataKey="bb_upper"
                          stroke="transparent"
                          fill="url(#bbGradient)"
                        />
                      )}

                      {/* Price Area */}
                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke="hsl(var(--primary))" 
                        fill="url(#priceGradient)"
                        strokeWidth={2}
                      />

                      {/* Pivot Points */}
                      {activeIndicators.includes('pivot') && pivotLevels && (
                        <>
                          <ReferenceLine y={pivotLevels.pivot} stroke="#fbbf24" strokeDasharray="3 3" />
                          <ReferenceLine y={pivotLevels.r1} stroke="#22c55e" strokeDasharray="3 3" />
                          <ReferenceLine y={pivotLevels.s1} stroke="#ef4444" strokeDasharray="3 3" />
                        </>
                      )}

                      {/* SMA */}
                      {activeIndicators.includes('sma') && (
                        <Line type="monotone" dataKey="sma20" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                      )}

                      {/* EMA 12 */}
                      {activeIndicators.includes('ema') && (
                        <Line type="monotone" dataKey="ema12" stroke="#10b981" strokeWidth={1.5} dot={false} />
                      )}

                      {/* EMA 26 */}
                      {activeIndicators.includes('ema26') && (
                        <Line type="monotone" dataKey="ema26" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                      )}

                      {/* Bollinger Bands lines */}
                      {activeIndicators.includes('bb') && (
                        <>
                          <Line type="monotone" dataKey="bb_upper" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                          <Line type="monotone" dataKey="bb_middle" stroke="#8b5cf6" strokeWidth={1} dot={false} />
                          <Line type="monotone" dataKey="bb_lower" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="4 2" dot={false} />
                        </>
                      )}

                      {/* VWAP */}
                      {activeIndicators.includes('vwap') && (
                        <Line type="monotone" dataKey="vwap" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Volume Chart */}
                {activeIndicators.includes('volume') && (
                  <div className="h-[80px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                        <XAxis dataKey="time" hide />
                        <YAxis hide />
                        <Bar 
                          dataKey="volume" 
                          fill="hsl(var(--muted))"
                          radius={[2, 2, 0, 0]}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* RSI Chart */}
                {activeIndicators.includes('rsi') && (
                  <div className="h-[80px] mt-2 border-t pt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-3 w-3 text-cyan-400" />
                      <span className="text-xs text-muted-foreground">RSI (14)</span>
                      {lastCandle?.rsi && (
                        <Badge variant="outline" className={`text-xs ${lastCandle.rsi > 70 ? 'text-red-400' : lastCandle.rsi < 30 ? 'text-green-400' : ''}`}>
                          {lastCandle.rsi.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 100]} hide />
                        <ReferenceArea y1={70} y2={100} fill="rgba(239, 68, 68, 0.1)" />
                        <ReferenceArea y1={0} y2={30} fill="rgba(34, 197, 94, 0.1)" />
                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                        <ReferenceLine y={30} stroke="#22c55e" strokeDasharray="3 3" />
                        <Line type="monotone" dataKey="rsi" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* MACD Chart */}
                {activeIndicators.includes('macd') && (
                  <div className="h-[80px] mt-2 border-t pt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch className="h-3 w-3 text-pink-400" />
                      <span className="text-xs text-muted-foreground">MACD (12, 26, 9)</span>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
                        <XAxis dataKey="time" hide />
                        <YAxis hide />
                        <ReferenceLine y={0} stroke="hsl(var(--border))" />
                        <Bar dataKey="macdHist" fill="#ec4899" />
                        <Line type="monotone" dataKey="macd" stroke="#3b82f6" strokeWidth={1} dot={false} />
                        <Line type="monotone" dataKey="macdSignal" stroke="#f97316" strokeWidth={1} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Indicators Panel */}
        <Card className="lg:col-span-1">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <Tabs defaultValue="trend" className="w-full">
                <TabsList className="w-full grid grid-cols-3 px-2">
                  <TabsTrigger value="trend" className="text-xs">Trend</TabsTrigger>
                  <TabsTrigger value="momentum" className="text-xs">Mom</TabsTrigger>
                  <TabsTrigger value="volume" className="text-xs">Vol</TabsTrigger>
                </TabsList>

                <TabsContent value="trend" className="p-2 space-y-1">
                  {INDICATORS.filter(i => ['Trend', 'Volatility', 'Support/Resistance'].includes(i.category))
                    .map(indicator => (
                      <Button
                        key={indicator.id}
                        variant={activeIndicators.includes(indicator.id) ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => toggleIndicator(indicator.id)}
                      >
                        <div 
                          className="h-2 w-2 rounded-full mr-2" 
                          style={{ backgroundColor: activeIndicators.includes(indicator.id) ? indicator.color : 'hsl(var(--muted))' }}
                        />
                        {indicator.name}
                      </Button>
                    ))}
                </TabsContent>

                <TabsContent value="momentum" className="p-2 space-y-1">
                  {INDICATORS.filter(i => i.category === 'Momentum')
                    .map(indicator => (
                      <Button
                        key={indicator.id}
                        variant={activeIndicators.includes(indicator.id) ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => toggleIndicator(indicator.id)}
                      >
                        <div 
                          className="h-2 w-2 rounded-full mr-2" 
                          style={{ backgroundColor: activeIndicators.includes(indicator.id) ? indicator.color : 'hsl(var(--muted))' }}
                        />
                        {indicator.name}
                      </Button>
                    ))}
                </TabsContent>

                <TabsContent value="volume" className="p-2 space-y-1">
                  {INDICATORS.filter(i => i.category === 'Volume')
                    .map(indicator => (
                      <Button
                        key={indicator.id}
                        variant={activeIndicators.includes(indicator.id) ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => toggleIndicator(indicator.id)}
                      >
                        <div 
                          className="h-2 w-2 rounded-full mr-2" 
                          style={{ backgroundColor: activeIndicators.includes(indicator.id) ? indicator.color : 'hsl(var(--muted))' }}
                        />
                        {indicator.name}
                      </Button>
                    ))}
                </TabsContent>
              </Tabs>

              {/* Live Stats */}
              <div className="p-3 border-t mt-2">
                <p className="text-xs font-medium mb-2">Live Stats</p>
                <div className="space-y-2 text-xs">
                  {lastCandle && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24h High</span>
                        <span className="text-green-400 font-mono">${lastCandle.high.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">24h Low</span>
                        <span className="text-red-400 font-mono">${lastCandle.low.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-mono">{lastCandle.volume.toFixed(2)}</span>
                      </div>
                      {lastCandle.atr && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ATR</span>
                          <span className="font-mono">${lastCandle.atr.toFixed(2)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Active Indicators */}
              <div className="p-3 border-t">
                <p className="text-xs text-muted-foreground mb-2">Active ({activeIndicators.length})</p>
                <div className="flex flex-wrap gap-1">
                  {activeIndicators.map(id => {
                    const indicator = INDICATORS.find(i => i.id === id);
                    return (
                      <Badge
                        key={id}
                        variant="outline"
                        className="text-[10px] cursor-pointer"
                        style={{ borderColor: indicator?.color, color: indicator?.color }}
                        onClick={() => toggleIndicator(id)}
                      >
                        {indicator?.name.split(' ')[0]} ×
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedCharts;
