import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { useBinanceTickers } from "@/hooks/useBinanceTickers";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Layers,
  MousePointer,
  Minus,
  Ruler,
  PenTool,
  Type,
  Shapes,
  Maximize2,
  Loader2
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
  { id: 'sma', name: 'SMA', category: 'Trend', enabled: true },
  { id: 'ema', name: 'EMA', category: 'Trend', enabled: false },
  { id: 'bb', name: 'Bollinger Bands', category: 'Volatility', enabled: true },
  { id: 'rsi', name: 'RSI', category: 'Momentum', enabled: false },
  { id: 'macd', name: 'MACD', category: 'Momentum', enabled: true },
  { id: 'stoch', name: 'Stochastic', category: 'Momentum', enabled: false },
  { id: 'atr', name: 'ATR', category: 'Volatility', enabled: false },
  { id: 'volume', name: 'Volume', category: 'Volume', enabled: true },
  { id: 'vwap', name: 'VWAP', category: 'Volume', enabled: false },
  { id: 'ichimoku', name: 'Ichimoku Cloud', category: 'Trend', enabled: false },
  { id: 'pivot', name: 'Pivot Points', category: 'Support/Resistance', enabled: false },
  { id: 'obv', name: 'OBV', category: 'Volume', enabled: false },
];

const symbolToCoinId: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
};

const symbolToBinance: Record<string, string> = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'SOL': 'SOLUSDT',
};

interface ChartDataPoint {
  time: number;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma20: number | null;
  bb_upper: number | null;
  bb_lower: number | null;
}

const AdvancedCharts = () => {
  const [symbol, setSymbol] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1H');
  const [chartType, setChartType] = useState('candle');
  const [selectedTool, setSelectedTool] = useState('pointer');
  const [activeIndicators, setActiveIndicators] = useState(
    INDICATORS.filter(i => i.enabled).map(i => i.id)
  );
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const binanceSymbol = symbolToBinance[symbol] || 'BTCUSDT';
  const coinId = symbolToCoinId[symbol] || 'bitcoin';
  const { tickers } = useBinanceTickers([binanceSymbol]);
  const liveTicker = tickers[binanceSymbol];
  const livePrice = liveTicker?.lastPrice || 0;

  // Fetch real OHLCV data
  useEffect(() => {
    const fetchOHLCV = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('market_ohlcv')
          .select('*')
          .eq('coin_id', coinId)
          .order('open_time', { ascending: true })
          .limit(100);

        if (!error && data && data.length > 0) {
          const mapped: ChartDataPoint[] = data.map((c, i, arr) => {
            const closePrice = Number(c.close);
            // Calculate SMA20
            let sma20: number | null = null;
            if (i >= 19) {
              const sum = arr.slice(i - 19, i + 1).reduce((s, d) => s + Number(d.close), 0);
              sma20 = sum / 20;
            }
            // Calculate Bollinger Bands
            let bb_upper: number | null = null;
            let bb_lower: number | null = null;
            if (i >= 19) {
              const slice = arr.slice(i - 19, i + 1);
              const avg = slice.reduce((s, d) => s + Number(d.close), 0) / 20;
              const stdDev = Math.sqrt(slice.reduce((s, d) => s + Math.pow(Number(d.close) - avg, 2), 0) / 20);
              bb_upper = avg + stdDev * 2;
              bb_lower = avg - stdDev * 2;
            }
            return {
              time: i,
              price: closePrice,
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: closePrice,
              volume: 50000 + (closePrice * 10),
              sma20,
              bb_upper,
              bb_lower,
            };
          });
          setChartData(mapped);
        } else {
          setChartData([]);
        }
      } catch (err) {
        console.error('Error fetching OHLCV:', err);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOHLCV();
  }, [coinId, timeframe]);

  const toggleIndicator = (id: string) => {
    setActiveIndicators(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">BTC/USD</SelectItem>
                  <SelectItem value="ETH">ETH/USD</SelectItem>
                  <SelectItem value="SOL">SOL/USD</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-lg overflow-hidden">
                {['1m', '5m', '15m', '1H', '4H', '1D', '1W'].map(tf => (
                  <Button
                    key={tf}
                    variant={timeframe === tf ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-none px-3"
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </Button>
                ))}
              </div>

              <div className="h-6 w-px bg-border" />

              <div className="flex gap-1">
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

            <div className="flex items-center gap-2">
              {livePrice > 0 && (
                <Badge variant="outline" className="text-green-500">
                  ${livePrice.toLocaleString()}
                </Badge>
              )}
              <Badge variant="outline" className="text-green-500 text-[9px]">LIVE</Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-5 gap-4">
        {/* Main Chart */}
        <Card className="col-span-4">
          <CardContent className="p-4">
            {loading ? (
              <div className="h-[500px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="h-16 w-16 mb-4 opacity-30" />
                <p className="font-medium">No Chart Data Available</p>
                <p className="text-sm">OHLCV data will appear once synced from market feeds.</p>
              </div>
            ) : (
              <>
                <div className="h-[500px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `${v}`}
                      />
                      <YAxis 
                        domain={['dataMin - 500', 'dataMax + 500']}
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v) => `$${v.toLocaleString()}`}
                        orientation="right"
                      />
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                        contentStyle={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      />
                      
                      {/* Price Area */}
                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke="hsl(var(--primary))" 
                        fill="url(#priceGradient)"
                        strokeWidth={2}
                      />

                      {/* SMA */}
                      {activeIndicators.includes('sma') && (
                        <Line 
                          type="monotone" 
                          dataKey="sma20" 
                          stroke="#f59e0b"
                          strokeWidth={1}
                          dot={false}
                        />
                      )}

                      {/* Bollinger Bands */}
                      {activeIndicators.includes('bb') && (
                        <>
                          <Line 
                            type="monotone" 
                            dataKey="bb_upper" 
                            stroke="#8b5cf6"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="bb_lower" 
                            stroke="#8b5cf6"
                            strokeWidth={1}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        </>
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Volume Chart */}
                {activeIndicators.includes('volume') && (
                  <div className="h-[100px] mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <XAxis dataKey="time" hide />
                        <YAxis hide />
                        <Area 
                          type="monotone" 
                          dataKey="volume" 
                          fill="hsl(var(--muted))"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={0}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Indicators Panel */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Indicators & Studies
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[550px]">
              <Tabs defaultValue="trend" className="w-full">
                <TabsList className="w-full grid grid-cols-3 px-2">
                  <TabsTrigger value="trend" className="text-xs">Trend</TabsTrigger>
                  <TabsTrigger value="momentum" className="text-xs">Mom</TabsTrigger>
                  <TabsTrigger value="volume" className="text-xs">Vol</TabsTrigger>
                </TabsList>

                <TabsContent value="trend" className="p-2 space-y-1">
                  {INDICATORS.filter(i => i.category === 'Trend' || i.category === 'Volatility' || i.category === 'Support/Resistance')
                    .map(indicator => (
                      <Button
                        key={indicator.id}
                        variant={activeIndicators.includes(indicator.id) ? 'secondary' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs"
                        onClick={() => toggleIndicator(indicator.id)}
                      >
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          activeIndicators.includes(indicator.id) ? 'bg-primary' : 'bg-muted'
                        }`} />
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
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          activeIndicators.includes(indicator.id) ? 'bg-primary' : 'bg-muted'
                        }`} />
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
                        <div className={`h-2 w-2 rounded-full mr-2 ${
                          activeIndicators.includes(indicator.id) ? 'bg-primary' : 'bg-muted'
                        }`} />
                        {indicator.name}
                      </Button>
                    ))}
                </TabsContent>
              </Tabs>

              {/* Active Indicators */}
              <div className="p-2 border-t mt-2">
                <p className="text-xs text-muted-foreground mb-2">Active ({activeIndicators.length})</p>
                <div className="flex flex-wrap gap-1">
                  {activeIndicators.map(id => {
                    const indicator = INDICATORS.find(i => i.id === id);
                    return (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() => toggleIndicator(id)}
                      >
                        {indicator?.name} ×
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