import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import {
  Eye,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Triangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface Pattern {
  id: string;
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  symbol: string;
  timeframe: string;
  confidence: number;
  priceTarget: number;
  currentPrice: number;
  expectedMove: number;
  status: 'forming' | 'confirmed' | 'triggered';
  detectedAt: Date;
  description: string;
}

const PATTERN_TYPES = [
  { name: 'Head & Shoulders', type: 'bearish' as const, icon: '⬇️', move: -8 },
  { name: 'Inverse H&S', type: 'bullish' as const, icon: '⬆️', move: 8 },
  { name: 'Double Top', type: 'bearish' as const, icon: '🔻', move: -6 },
  { name: 'Double Bottom', type: 'bullish' as const, icon: '🔺', move: 6 },
  { name: 'Bull Flag', type: 'bullish' as const, icon: '🚀', move: 5 },
  { name: 'Bear Flag', type: 'bearish' as const, icon: '📉', move: -5 },
  { name: 'Ascending Triangle', type: 'bullish' as const, icon: '📈', move: 7 },
  { name: 'Descending Triangle', type: 'bearish' as const, icon: '📉', move: -7 },
  { name: 'Cup & Handle', type: 'bullish' as const, icon: '☕', move: 10 },
  { name: 'Rising Wedge', type: 'bearish' as const, icon: '⚠️', move: -4 },
  { name: 'Falling Wedge', type: 'bullish' as const, icon: '✅', move: 4 },
  { name: 'Triple Top', type: 'bearish' as const, icon: '🔻', move: -9 },
  { name: 'Triple Bottom', type: 'bullish' as const, icon: '🔺', move: 9 },
  { name: 'Symmetrical Triangle', type: 'neutral' as const, icon: '◀️▶️', move: 5 },
];

const generatePatterns = (basePrice: number): Pattern[] => {
  const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'];
  const timeframes = ['1H', '4H', '1D', '1W'];
  const statuses: ('forming' | 'confirmed' | 'triggered')[] = ['forming', 'confirmed', 'triggered'];

  return Array.from({ length: 12 }, (_, i) => {
    const patternType = PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const symbolPrice = symbol === 'BTC' ? basePrice : 
                       symbol === 'ETH' ? basePrice * 0.05 : 
                       symbol === 'SOL' ? 145 : 
                       symbol === 'XRP' ? 0.52 : 0.12;
    
    const expectedMove = patternType.move + (Math.random() - 0.5) * 2;
    
    return {
      id: `pattern-${i}`,
      name: patternType.name,
      type: patternType.type,
      symbol,
      timeframe: timeframes[Math.floor(Math.random() * timeframes.length)],
      confidence: 65 + Math.random() * 30,
      priceTarget: symbolPrice * (1 + expectedMove / 100),
      currentPrice: symbolPrice,
      expectedMove,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      detectedAt: new Date(Date.now() - Math.random() * 86400000),
      description: `${patternType.name} pattern detected with ${patternType.type} implications`,
    };
  });
};

const PatternRecognition = () => {
  const { prices } = useMarketPrices();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [filterTimeframe, setFilterTimeframe] = useState('all');

  const basePrice = prices['BTC']?.priceNumeric || 67500;

  useEffect(() => {
    setPatterns(generatePatterns(basePrice));
  }, [basePrice]);

  const filteredPatterns = patterns.filter(p => {
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesTimeframe = filterTimeframe === 'all' || p.timeframe === filterTimeframe;
    return matchesType && matchesTimeframe;
  });

  const bullishCount = patterns.filter(p => p.type === 'bullish').length;
  const bearishCount = patterns.filter(p => p.type === 'bearish').length;
  const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'forming': return <Clock className="h-4 w-4 text-amber-500" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'triggered': return <Zap className="h-4 w-4 text-primary" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bullish Patterns</p>
                <p className="text-3xl font-bold text-green-500">{bullishCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Bearish Patterns</p>
                <p className="text-3xl font-bold text-red-500">{bearishCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-3xl font-bold">{avgConfidence.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Detected</p>
                <p className="text-3xl font-bold">{patterns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Pattern Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bullish">Bullish Only</SelectItem>
                <SelectItem value="bearish">Bearish Only</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timeframes</SelectItem>
                <SelectItem value="1H">1 Hour</SelectItem>
                <SelectItem value="4H">4 Hours</SelectItem>
                <SelectItem value="1D">Daily</SelectItem>
                <SelectItem value="1W">Weekly</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="ml-auto">
              {filteredPatterns.length} patterns found
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Pattern List */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detected Patterns
            </CardTitle>
            <CardDescription>AI-powered chart pattern recognition</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedPattern?.id === pattern.id ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        pattern.type === 'bullish' ? 'bg-green-500/20' :
                        pattern.type === 'bearish' ? 'bg-red-500/20' : 'bg-muted'
                      }`}>
                        {pattern.type === 'bullish' ? (
                          <ArrowUpRight className="h-5 w-5 text-green-500" />
                        ) : pattern.type === 'bearish' ? (
                          <ArrowDownRight className="h-5 w-5 text-red-500" />
                        ) : (
                          <Triangle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pattern.name}</span>
                          <Badge variant="outline">{pattern.symbol}</Badge>
                          <Badge variant="secondary">{pattern.timeframe}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(pattern.status)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {pattern.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {pattern.detectedAt.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${
                        pattern.expectedMove >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {pattern.expectedMove >= 0 ? '+' : ''}{pattern.expectedMove.toFixed(1)}%
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-muted-foreground">Conf:</span>
                        <span className={pattern.confidence >= 80 ? 'text-green-500' : ''}>
                          {pattern.confidence.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pattern Details */}
        <div className="space-y-4">
          {selectedPattern ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{selectedPattern.name}</CardTitle>
                    <Badge className={
                      selectedPattern.type === 'bullish' ? 'bg-green-500' :
                      selectedPattern.type === 'bearish' ? 'bg-red-500' : ''
                    }>
                      {selectedPattern.type.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription>{selectedPattern.symbol} • {selectedPattern.timeframe}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className={selectedPattern.confidence >= 80 ? 'text-green-500' : ''}>
                        {selectedPattern.confidence.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={selectedPattern.confidence} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Current Price</p>
                      <p className="text-lg font-bold">
                        ${selectedPattern.currentPrice.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Price Target</p>
                      <p className={`text-lg font-bold ${
                        selectedPattern.expectedMove >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        ${selectedPattern.priceTarget.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Expected Move</p>
                    <p className={`text-2xl font-bold ${
                      selectedPattern.expectedMove >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {selectedPattern.expectedMove >= 0 ? '+' : ''}{selectedPattern.expectedMove.toFixed(1)}%
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pattern Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{selectedPattern.description}</p>
                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1" size="sm">
                      <Target className="h-4 w-4 mr-1" />
                      Set Alert
                    </Button>
                    <Button variant="outline" size="sm">
                      View Chart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a pattern to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatternRecognition;
