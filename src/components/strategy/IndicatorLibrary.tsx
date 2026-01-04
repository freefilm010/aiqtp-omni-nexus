import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  TrendingUp,
  Activity,
  BarChart3,
  Zap,
  BookOpen,
  Plus,
  Code
} from "lucide-react";

interface Indicator {
  id: string;
  name: string;
  shortName: string;
  category: 'trend' | 'momentum' | 'volatility' | 'volume' | 'custom';
  description: string;
  params: { name: string; default: number; min: number; max: number }[];
  formula?: string;
}

const indicators: Indicator[] = [
  // Trend
  { id: 'sma', name: 'Simple Moving Average', shortName: 'SMA', category: 'trend', description: 'Average price over N periods', params: [{ name: 'period', default: 20, min: 2, max: 200 }] },
  { id: 'ema', name: 'Exponential Moving Average', shortName: 'EMA', category: 'trend', description: 'Weighted moving average with more weight on recent data', params: [{ name: 'period', default: 20, min: 2, max: 200 }] },
  { id: 'macd', name: 'MACD', shortName: 'MACD', category: 'trend', description: 'Moving Average Convergence Divergence', params: [{ name: 'fast', default: 12, min: 2, max: 50 }, { name: 'slow', default: 26, min: 5, max: 100 }, { name: 'signal', default: 9, min: 2, max: 50 }] },
  { id: 'adx', name: 'Average Directional Index', shortName: 'ADX', category: 'trend', description: 'Measures trend strength', params: [{ name: 'period', default: 14, min: 2, max: 50 }] },
  { id: 'supertrend', name: 'Supertrend', shortName: 'ST', category: 'trend', description: 'Trend-following indicator', params: [{ name: 'period', default: 10, min: 1, max: 50 }, { name: 'multiplier', default: 3, min: 1, max: 10 }] },
  { id: 'ichimoku', name: 'Ichimoku Cloud', shortName: 'ICH', category: 'trend', description: 'Complete trading system', params: [{ name: 'tenkan', default: 9, min: 1, max: 50 }, { name: 'kijun', default: 26, min: 5, max: 100 }, { name: 'senkou', default: 52, min: 10, max: 200 }] },
  
  // Momentum
  { id: 'rsi', name: 'Relative Strength Index', shortName: 'RSI', category: 'momentum', description: 'Momentum oscillator (0-100)', params: [{ name: 'period', default: 14, min: 2, max: 50 }] },
  { id: 'stoch', name: 'Stochastic Oscillator', shortName: 'STOCH', category: 'momentum', description: 'Compares closing price to price range', params: [{ name: 'k', default: 14, min: 2, max: 50 }, { name: 'd', default: 3, min: 1, max: 20 }] },
  { id: 'cci', name: 'Commodity Channel Index', shortName: 'CCI', category: 'momentum', description: 'Measures price deviation from mean', params: [{ name: 'period', default: 20, min: 5, max: 100 }] },
  { id: 'williams', name: 'Williams %R', shortName: 'W%R', category: 'momentum', description: 'Momentum indicator (-100 to 0)', params: [{ name: 'period', default: 14, min: 2, max: 50 }] },
  { id: 'mfi', name: 'Money Flow Index', shortName: 'MFI', category: 'momentum', description: 'Volume-weighted RSI', params: [{ name: 'period', default: 14, min: 2, max: 50 }] },
  
  // Volatility
  { id: 'bb', name: 'Bollinger Bands', shortName: 'BB', category: 'volatility', description: 'Volatility bands around SMA', params: [{ name: 'period', default: 20, min: 5, max: 100 }, { name: 'stdDev', default: 2, min: 1, max: 5 }] },
  { id: 'atr', name: 'Average True Range', shortName: 'ATR', category: 'volatility', description: 'Measures market volatility', params: [{ name: 'period', default: 14, min: 2, max: 50 }] },
  { id: 'keltner', name: 'Keltner Channel', shortName: 'KC', category: 'volatility', description: 'ATR-based volatility channel', params: [{ name: 'period', default: 20, min: 5, max: 100 }, { name: 'multiplier', default: 2, min: 1, max: 5 }] },
  { id: 'donchian', name: 'Donchian Channel', shortName: 'DC', category: 'volatility', description: 'High/Low channel', params: [{ name: 'period', default: 20, min: 5, max: 100 }] },
  
  // Volume
  { id: 'obv', name: 'On-Balance Volume', shortName: 'OBV', category: 'volume', description: 'Cumulative volume flow', params: [] },
  { id: 'vwap', name: 'VWAP', shortName: 'VWAP', category: 'volume', description: 'Volume Weighted Average Price', params: [] },
  { id: 'cmf', name: 'Chaikin Money Flow', shortName: 'CMF', category: 'volume', description: 'Buying/selling pressure', params: [{ name: 'period', default: 20, min: 5, max: 50 }] },
  { id: 'ad', name: 'Accumulation/Distribution', shortName: 'A/D', category: 'volume', description: 'Volume flow indicator', params: [] },
  
  // Custom/AI
  { id: 'ai_momentum', name: 'AI Momentum Score', shortName: 'AI-M', category: 'custom', description: 'ML-based momentum prediction', params: [{ name: 'lookback', default: 50, min: 10, max: 200 }] },
  { id: 'ai_trend', name: 'AI Trend Classifier', shortName: 'AI-T', category: 'custom', description: 'Neural network trend detection', params: [{ name: 'sensitivity', default: 0.5, min: 0.1, max: 1 }] },
  { id: 'sentiment', name: 'Social Sentiment', shortName: 'SENT', category: 'custom', description: 'Real-time social media sentiment', params: [] },
];

const categoryIcons = {
  trend: TrendingUp,
  momentum: Activity,
  volatility: BarChart3,
  volume: Zap,
  custom: BookOpen,
};

const categoryColors = {
  trend: 'text-blue-500 bg-blue-500/10',
  momentum: 'text-purple-500 bg-purple-500/10',
  volatility: 'text-amber-500 bg-amber-500/10',
  volume: 'text-green-500 bg-green-500/10',
  custom: 'text-pink-500 bg-pink-500/10',
};

const IndicatorLibrary = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);

  const filteredIndicators = indicators.filter(ind => {
    const matchesSearch = ind.name.toLowerCase().includes(search.toLowerCase()) ||
                         ind.shortName.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ind.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'trend', 'momentum', 'volatility', 'volume', 'custom'];

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Indicator List */}
      <div className="col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Indicator Library
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search indicators..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-[200px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="w-full rounded-none border-b justify-start">
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="capitalize">
                    {cat === 'all' ? 'All' : cat}
                    <Badge variant="secondary" className="ml-2">
                      {cat === 'all' ? indicators.length : indicators.filter(i => i.category === cat).length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-2 gap-3 p-4">
                  {filteredIndicators.map(indicator => {
                    const Icon = categoryIcons[indicator.category];
                    const colorClass = categoryColors[indicator.category];
                    
                    return (
                      <div
                        key={indicator.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary ${
                          selectedIndicator?.id === indicator.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedIndicator(indicator)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{indicator.name}</span>
                              <Badge variant="outline" className="shrink-0">{indicator.shortName}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {indicator.description}
                            </p>
                            {indicator.params.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {indicator.params.map(p => (
                                  <Badge key={p.name} variant="secondary" className="text-xs">
                                    {p.name}: {p.default}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Indicator Details */}
      <div className="space-y-6">
        {selectedIndicator ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${categoryColors[selectedIndicator.category]}`}>
                    {(() => {
                      const Icon = categoryIcons[selectedIndicator.category];
                      return <Icon className="h-6 w-6" />;
                    })()}
                  </div>
                  <div>
                    <CardTitle>{selectedIndicator.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">{selectedIndicator.shortName}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{selectedIndicator.description}</p>

                {selectedIndicator.params.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Parameters</h4>
                    {selectedIndicator.params.map(param => (
                      <div key={param.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="capitalize">{param.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{param.min} - {param.max}</Badge>
                          <span className="font-mono">Default: {param.default}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Usage</h4>
                  <pre className="text-xs font-mono bg-muted p-3 rounded-lg overflow-x-auto">
{`// Add to strategy
dataframe['${selectedIndicator.id}'] = ta.${selectedIndicator.shortName}(
  dataframe${selectedIndicator.params.length > 0 ? `,\n  ${selectedIndicator.params.map(p => `${p.name}=${p.default}`).join(', ')}` : ''}
);

// Entry condition example
(dataframe['${selectedIndicator.id}'] > threshold)`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Strategy
                </Button>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Select an indicator to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default IndicatorLibrary;
