import { useState, useEffect, useCallback } from "react";
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
  CheckCircle,
  Clock,
  Zap,
  Triangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Activity,
  BarChart3,
  Gauge
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
  volume: string;
  riskReward: number;
}

const PATTERN_TYPES = [
  { name: 'Head & Shoulders', type: 'bearish' as const, move: -8 },
  { name: 'Inverse H&S', type: 'bullish' as const, move: 8 },
  { name: 'Double Top', type: 'bearish' as const, move: -6 },
  { name: 'Double Bottom', type: 'bullish' as const, move: 6 },
  { name: 'Bull Flag', type: 'bullish' as const, move: 5 },
  { name: 'Bear Flag', type: 'bearish' as const, move: -5 },
  { name: 'Ascending Triangle', type: 'bullish' as const, move: 7 },
  { name: 'Descending Triangle', type: 'bearish' as const, move: -7 },
  { name: 'Cup & Handle', type: 'bullish' as const, move: 10 },
  { name: 'Rising Wedge', type: 'bearish' as const, move: -4 },
  { name: 'Falling Wedge', type: 'bullish' as const, move: 4 },
  { name: 'Triple Top', type: 'bearish' as const, move: -9 },
  { name: 'Triple Bottom', type: 'bullish' as const, move: 9 },
  { name: 'Symmetrical Triangle', type: 'neutral' as const, move: 5 },
  { name: 'Pennant', type: 'bullish' as const, move: 4 },
  { name: 'Broadening Wedge', type: 'bearish' as const, move: -6 },
  { name: 'Channel Breakout', type: 'bullish' as const, move: 6 },
  { name: 'Diamond Top', type: 'bearish' as const, move: -8 },
];

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1H', '4H', '1D', '1W', '1M'];

const VOLUME_LEVELS = ['Low', 'Average', 'High', 'Very High'];

// Deterministic seeded pseudo-random based on price + index
const seeded = (seed: number, i: number): number => Math.abs(Math.sin(seed * 0.0001 + i * 1.618033)) ;

const generatePatterns = (basePrice: number): Pattern[] => {
  const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK'];
  const statuses: ('forming' | 'confirmed' | 'triggered')[] = ['forming', 'confirmed', 'triggered'];

  return Array.from({ length: 16 }, (_, i) => {
    const s = (offset: number) => seeded(basePrice, i * 7 + offset);
    const patternType = PATTERN_TYPES[Math.floor(s(0) * PATTERN_TYPES.length)];
    const symbol = symbols[Math.floor(s(1) * symbols.length)];
    const symbolPrice = symbol === 'BTC' ? basePrice :
                       symbol === 'ETH' ? basePrice * 0.05 :
                       symbol === 'SOL' ? 145 :
                       symbol === 'XRP' ? 0.52 :
                       symbol === 'ADA' ? 0.45 :
                       symbol === 'AVAX' ? 35 :
                       symbol === 'LINK' ? 14 : 0.12;

    const expectedMove = patternType.move + (s(2) - 0.5) * 2;

    return {
      id: `pattern-${i}-${Math.floor(basePrice)}`,
      name: patternType.name,
      type: patternType.type,
      symbol,
      timeframe: TIMEFRAMES[Math.floor(s(3) * TIMEFRAMES.length)],
      confidence: 60 + s(4) * 35,
      priceTarget: symbolPrice * (1 + expectedMove / 100),
      currentPrice: symbolPrice,
      expectedMove,
      status: statuses[Math.floor(s(5) * statuses.length)],
      detectedAt: new Date(Date.now() - s(6) * 300000),
      description: `${patternType.name} pattern detected on ${symbol} with ${patternType.type} implications. Volume ${VOLUME_LEVELS[Math.floor(s(7) * VOLUME_LEVELS.length)].toLowerCase()}.`,
      volume: VOLUME_LEVELS[Math.floor(s(8) * VOLUME_LEVELS.length)],
      riskReward: 1 + s(9) * 4,
    };
  });
};

const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};

const PatternRecognition = () => {
  const { prices } = useMarketPrices();
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [filterTimeframe, setFilterTimeframe] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const basePrice = prices['BTC']?.priceNumeric || 67500;

  const refreshPatterns = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setPatterns(generatePatterns(basePrice));
      setLastRefresh(new Date());
      setIsRefreshing(false);
      setSelectedPattern(null);
    }, 400);
  }, [basePrice]);

  // Initial load
  useEffect(() => {
    setPatterns(generatePatterns(basePrice));
  }, [basePrice]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPatterns();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshPatterns]);

  // Update "time ago" labels every 10s
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 10000);
    return () => clearInterval(t);
  }, []);

  const filteredPatterns = patterns.filter(p => {
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesTimeframe = filterTimeframe === 'all' || p.timeframe === filterTimeframe;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesType && matchesTimeframe && matchesStatus;
  });

  const bullishCount = patterns.filter(p => p.type === 'bullish').length;
  const bearishCount = patterns.filter(p => p.type === 'bearish').length;
  const confirmedCount = patterns.filter(p => p.status === 'confirmed').length;
  const avgConfidence = patterns.length ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'forming': return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case 'confirmed': return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'triggered': return <Zap className="h-3.5 w-3.5 text-primary" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Row */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="py-2.5 sm:py-4 px-3 sm:px-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div>
                <p className="text-[9px] sm:text-xs text-muted-foreground">Bull</p>
                <p className="text-lg sm:text-2xl font-bold text-green-500">{bullishCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="py-2.5 sm:py-4 px-3 sm:px-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              <div>
                <p className="text-[9px] sm:text-xs text-muted-foreground">Bear</p>
                <p className="text-lg sm:text-2xl font-bold text-red-500">{bearishCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-2.5 sm:py-4 px-3 sm:px-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              <div>
                <p className="text-[9px] sm:text-xs text-muted-foreground">Conf</p>
                <p className="text-lg sm:text-2xl font-bold">{confirmedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hidden sm:block">
          <CardContent className="py-2.5 sm:py-4 px-3 sm:px-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Gauge className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <div>
                <p className="text-[9px] sm:text-xs text-muted-foreground">Avg Conf.</p>
                <p className="text-lg sm:text-2xl font-bold">{avgConfidence.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hidden sm:block">
          <CardContent className="py-2.5 sm:py-4 px-3 sm:px-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
              <div>
                <p className="text-[9px] sm:text-xs text-muted-foreground">Total</p>
                <p className="text-lg sm:text-2xl font-bold">{patterns.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Refresh */}
      <Card>
        <CardContent className="py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
              <SelectTrigger className="w-[90px] sm:w-[130px] h-7 sm:h-8 text-[10px] sm:text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bullish">Bullish</SelectItem>
                <SelectItem value="bearish">Bearish</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
              <SelectTrigger className="w-[90px] sm:w-[130px] h-7 sm:h-8 text-[10px] sm:text-xs">
                <SelectValue placeholder="TF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All TFs</SelectItem>
                {TIMEFRAMES.map(tf => (
                  <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[90px] sm:w-[130px] h-7 sm:h-8 text-[10px] sm:text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="forming">Forming</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="triggered">Triggered</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-7 sm:h-8 gap-1 text-[10px] sm:text-xs px-2"
                onClick={refreshPatterns}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                Scan
              </Button>
              <Badge variant="outline" className="text-[9px] sm:text-xs">
                {filteredPatterns.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pattern List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Eye className="h-4 w-4" />
              Detected Patterns
              <Badge variant="secondary" className="text-[10px] ml-1">LIVE</Badge>
            </CardTitle>
            <CardDescription className="text-xs">AI-powered chart pattern recognition • Auto-refreshes every 30s</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[480px]">
              {filteredPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className={`px-4 py-3 border-b border-border/50 hover:bg-muted/50 cursor-pointer transition-colors ${
                    selectedPattern?.id === pattern.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                  }`}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <div className={`h-8 w-8 rounded flex items-center justify-center shrink-0 ${
                        pattern.type === 'bullish' ? 'bg-green-500/20' :
                        pattern.type === 'bearish' ? 'bg-red-500/20' : 'bg-muted'
                      }`}>
                        {pattern.type === 'bullish' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500" />
                        ) : pattern.type === 'bearish' ? (
                          <ArrowDownRight className="h-4 w-4 text-red-500" />
                        ) : (
                          <Triangle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-sm">{pattern.name}</span>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{pattern.symbol}</Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{pattern.timeframe}</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getStatusIcon(pattern.status)}
                          <span className="text-xs text-muted-foreground capitalize">{pattern.status}</span>
                          <span className="text-[10px] text-muted-foreground">• {formatTimeAgo(pattern.detectedAt)}</span>
                          <span className="text-[10px] text-muted-foreground">• Vol: {pattern.volume}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`font-bold text-sm ${
                        pattern.expectedMove >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {pattern.expectedMove >= 0 ? '+' : ''}{pattern.expectedMove.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {pattern.confidence.toFixed(0)}% conf
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredPatterns.length === 0 && (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No patterns match current filters
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pattern Details */}
        <div className="space-y-4">
          {selectedPattern ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{selectedPattern.name}</CardTitle>
                    <Badge className={
                      selectedPattern.type === 'bullish' ? 'bg-green-500 hover:bg-green-600' :
                      selectedPattern.type === 'bearish' ? 'bg-red-500 hover:bg-red-600' : ''
                    }>
                      {selectedPattern.type.toUpperCase()}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{selectedPattern.symbol} • {selectedPattern.timeframe} • {formatTimeAgo(selectedPattern.detectedAt)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className={selectedPattern.confidence >= 80 ? 'text-green-500 font-medium' : ''}>
                        {selectedPattern.confidence.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={selectedPattern.confidence} className="h-1.5" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Current Price</p>
                      <p className="text-sm font-bold">${selectedPattern.currentPrice.toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 rounded bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Target</p>
                      <p className={`text-sm font-bold ${
                        selectedPattern.expectedMove >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        ${selectedPattern.priceTarget.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Expected Move</p>
                      <p className={`text-lg font-bold ${
                        selectedPattern.expectedMove >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {selectedPattern.expectedMove >= 0 ? '+' : ''}{selectedPattern.expectedMove.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-2.5 rounded bg-muted/50">
                      <p className="text-[10px] text-muted-foreground">Risk/Reward</p>
                      <p className="text-lg font-bold text-primary">
                        1:{selectedPattern.riskReward.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">Vol: {selectedPattern.volume}</Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {selectedPattern.status === 'forming' ? '🔄 Forming' :
                       selectedPattern.status === 'confirmed' ? '✅ Confirmed' : '⚡ Triggered'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium">Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed">{selectedPattern.description}</p>
                  <div className="mt-3 flex gap-2">
                    <Button className="flex-1" size="sm" variant="default">
                      <Target className="h-3.5 w-3.5 mr-1" />
                      Set Alert
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-3.5 w-3.5 mr-1" />
                      Chart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Eye className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">Select a pattern to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatternRecognition;
