import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Flame,
  AlertTriangle,
  DollarSign,
  Activity,
  Zap,
  Eye,
  Filter,
  RefreshCw
} from "lucide-react";

interface OptionsFlow {
  id: string;
  symbol: string;
  type: 'call' | 'put';
  strike: number;
  expiry: string;
  premium: number;
  volume: number;
  openInterest: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  unusual: boolean;
  sweep: boolean;
  timestamp: Date;
  spot: number;
  iv: number;
}

interface GammaLevel {
  symbol: string;
  price: number;
  gammaFlip: number;
  callWall: number;
  putWall: number;
  maxPain: number;
  netGamma: number;
}

const generateOptionsFlow = (): OptionsFlow[] => {
  const symbols = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'AMD', 'META', 'AMZN', 'MSFT', 'GOOGL'];
  const flows: OptionsFlow[] = [];
  
  for (let i = 0; i < 25; i++) {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const isCall = Math.random() > 0.45;
    const spotBase = symbol === 'SPY' ? 580 : symbol === 'QQQ' ? 500 : symbol === 'NVDA' ? 140 : 200;
    const spot = spotBase * (1 + (Math.random() - 0.5) * 0.02);
    const otm = isCall ? 1 + Math.random() * 0.1 : 1 - Math.random() * 0.1;
    const strike = Math.round(spot * otm / 5) * 5;
    const premium = (50000 + Math.random() * 2000000);
    const unusual = premium > 500000;
    
    flows.push({
      id: `flow-${i}`,
      symbol,
      type: isCall ? 'call' : 'put',
      strike,
      expiry: new Date(Date.now() + (Math.random() * 30 + 1) * 86400000).toLocaleDateString(),
      premium,
      volume: Math.floor(100 + Math.random() * 10000),
      openInterest: Math.floor(1000 + Math.random() * 50000),
      sentiment: isCall ? 'bullish' : 'bearish',
      unusual,
      sweep: Math.random() > 0.7,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      spot,
      iv: 20 + Math.random() * 60
    });
  }
  
  return flows.sort((a, b) => b.premium - a.premium);
};

const generateGammaLevels = (): GammaLevel[] => {
  return [
    { symbol: 'SPY', price: 582.5, gammaFlip: 575, callWall: 590, putWall: 565, maxPain: 580, netGamma: 2.3 },
    { symbol: 'QQQ', price: 502.3, gammaFlip: 495, callWall: 510, putWall: 485, maxPain: 500, netGamma: 1.8 },
    { symbol: 'NVDA', price: 142.8, gammaFlip: 135, callWall: 150, putWall: 125, maxPain: 140, netGamma: -0.5 },
    { symbol: 'TSLA', price: 248.5, gammaFlip: 240, callWall: 260, putWall: 230, maxPain: 245, netGamma: 0.8 },
    { symbol: 'AAPL', price: 195.2, gammaFlip: 190, callWall: 200, putWall: 185, maxPain: 195, netGamma: 1.2 },
  ];
};

const OptionsFlowTracker = () => {
  const [flows, setFlows] = useState<OptionsFlow[]>([]);
  const [gammaLevels, setGammaLevels] = useState<GammaLevel[]>([]);
  const [filter, setFilter] = useState<'all' | 'calls' | 'puts' | 'unusual' | 'sweeps'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFlows(generateOptionsFlow());
    setGammaLevels(generateGammaLevels());
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setFlows(generateOptionsFlow());
      setIsLoading(false);
    }, 500);
  };

  const filteredFlows = flows.filter(f => {
    if (filter === 'calls') return f.type === 'call';
    if (filter === 'puts') return f.type === 'put';
    if (filter === 'unusual') return f.unusual;
    if (filter === 'sweeps') return f.sweep;
    return true;
  });

  const totalCallPremium = flows.filter(f => f.type === 'call').reduce((s, f) => s + f.premium, 0);
  const totalPutPremium = flows.filter(f => f.type === 'put').reduce((s, f) => s + f.premium, 0);
  const callPutRatio = totalPutPremium > 0 ? (totalCallPremium / totalPutPremium).toFixed(2) : '∞';
  const unusualCount = flows.filter(f => f.unusual).length;

  const formatPremium = (p: number) => p >= 1000000 ? `$${(p/1000000).toFixed(1)}M` : `$${(p/1000).toFixed(0)}K`;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Call Premium</p>
                <p className="text-xl font-bold text-green-500">{formatPremium(totalCallPremium)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Put Premium</p>
                <p className="text-xl font-bold text-red-500">{formatPremium(totalPutPremium)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Call/Put Ratio</p>
                <p className="text-xl font-bold">{callPutRatio}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Unusual Activity</p>
                <p className="text-xl font-bold">{unusualCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Sweeps</p>
                <p className="text-xl font-bold">{flows.filter(f => f.sweep).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Options Flow */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Live Options Flow
                </CardTitle>
                <CardDescription>Real-time unusual options activity</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {(['all', 'calls', 'puts', 'unusual', 'sweeps'] as const).map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
            
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredFlows.map(flow => (
                  <div
                    key={flow.id}
                    className={`p-3 rounded-lg border flex items-center justify-between ${flow.unusual ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={flow.type === 'call' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                        {flow.type.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{flow.symbol}</span>
                          <span className="font-mono">${flow.strike}</span>
                          <span className="text-sm text-muted-foreground">{flow.expiry}</span>
                          {flow.sweep && <Badge variant="outline" className="text-xs">SWEEP</Badge>}
                          {flow.unusual && <Flame className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Vol: {flow.volume.toLocaleString()} | OI: {flow.openInterest.toLocaleString()} | IV: {flow.iv.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatPremium(flow.premium)}</p>
                      <p className="text-xs text-muted-foreground">
                        Spot: ${flow.spot.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Gamma Exposure */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Gamma Levels
            </CardTitle>
            <CardDescription>Key support/resistance from options</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[440px]">
              <div className="space-y-4">
                {gammaLevels.map(g => (
                  <div key={g.symbol} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold">{g.symbol}</span>
                      <span className="font-mono">${g.price.toFixed(2)}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Pain</span>
                        <span className="font-mono text-amber-500">${g.maxPain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Call Wall</span>
                        <span className="font-mono text-green-500">${g.callWall}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Put Wall</span>
                        <span className="font-mono text-red-500">${g.putWall}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gamma Flip</span>
                        <span className="font-mono">${g.gammaFlip}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Net Gamma</span>
                        <Badge className={g.netGamma > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                          {g.netGamma > 0 ? '+' : ''}{g.netGamma.toFixed(1)}B
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OptionsFlowTracker;
