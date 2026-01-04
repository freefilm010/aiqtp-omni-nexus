import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, ReferenceLine } from "recharts";
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
  Crosshair,
  Clock,
  Maximize2
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

const generateChartData = (basePrice: number, points: number = 100) => {
  const data = [];
  let price = basePrice;
  
  for (let i = 0; i < points; i++) {
    price = price * (1 + (Math.random() - 0.48) * 0.02);
    const high = price * (1 + Math.random() * 0.005);
    const low = price * (1 - Math.random() * 0.005);
    const open = price * (1 + (Math.random() - 0.5) * 0.002);
    const close = price;
    
    data.push({
      time: i,
      price: close,
      open,
      high,
      low,
      close,
      volume: Math.random() * 1000000,
      sma20: null,
      bb_upper: null,
      bb_lower: null,
    });
  }

  // Calculate SMA
  for (let i = 20; i < data.length; i++) {
    const sum = data.slice(i - 20, i).reduce((s, d) => s + d.close, 0);
    data[i].sma20 = sum / 20;
  }

  // Calculate Bollinger Bands
  for (let i = 20; i < data.length; i++) {
    const slice = data.slice(i - 20, i);
    const avg = slice.reduce((s, d) => s + d.close, 0) / 20;
    const stdDev = Math.sqrt(slice.reduce((s, d) => s + Math.pow(d.close - avg, 2), 0) / 20);
    data[i].bb_upper = avg + stdDev * 2;
    data[i].bb_lower = avg - stdDev * 2;
  }

  return data;
};

const AdvancedCharts = () => {
  const { prices } = useMarketPrices();
  const [symbol, setSymbol] = useState('BTC');
  const [timeframe, setTimeframe] = useState('1H');
  const [chartType, setChartType] = useState('candle');
  const [selectedTool, setSelectedTool] = useState('pointer');
  const [activeIndicators, setActiveIndicators] = useState(
    INDICATORS.filter(i => i.enabled).map(i => i.id)
  );

  const basePrice = prices[symbol]?.priceNumeric || 67500;
  const chartData = generateChartData(basePrice);

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
              <Badge variant="outline" className="text-green-500">
                ${basePrice.toLocaleString()}
              </Badge>
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
