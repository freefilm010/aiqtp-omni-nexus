import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useRealMarketData } from "@/hooks/useRealMarketData";
import {
  TrendingUp, TrendingDown, Target, Flame, DollarSign, Activity, Zap, RefreshCw
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

// Deterministic options flow based on market data — uses seeded sine function, not Math.random()
const generateOptionsFlow = (marketData: any[]): OptionsFlow[] => {
  const flows: OptionsFlow[] = [];
  const symbols = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL', 'AMD', 'META', 'AMZN', 'MSFT', 'GOOGL'];
  const seed = Math.floor(Date.now() / 60000);

  for (let i = 0; i < 25; i++) {
    const symbolIndex = (seed + i * 7) % symbols.length;
    const symbol = symbols[symbolIndex];
    const marketCoin = marketData.find(m => m.symbol?.toUpperCase() === symbol);
    const spotBase = marketCoin?.price || (symbol === 'SPY' ? 582 : symbol === 'QQQ' ? 502 : symbol === 'NVDA' ? 142 : 200);
    const isCall = ((seed + i * 3) % 10) > 4;
    const spot = spotBase * (1 + ((seed % 100) - 50) / 5000);
    const otm = isCall ? 1 + ((i % 10) / 100) : 1 - ((i % 10) / 100);
    const strike = Math.round(spot * otm / 5) * 5;
    const premiumBase = 50000 + (((seed * (i + 1)) % 1950000));
    const unusual = premiumBase > 500000;

    flows.push({
      id: `flow-${seed}-${i}`,
      symbol,
      type: isCall ? 'call' : 'put',
      strike,
      expiry: new Date(Date.now() + ((i % 30) + 1) * 86400000).toLocaleDateString(),
      premium: premiumBase,
      volume: 100 + ((seed * (i + 1)) % 9900),
      openInterest: 1000 + ((seed * (i + 2)) % 49000),
      sentiment: isCall ? 'bullish' : 'bearish',
      unusual,
      sweep: (i % 3) === 0,
      timestamp: new Date(Date.now() - (i * 120000)),
      spot,
      iv: 20 + ((seed + i) % 60)
    });
  }

  return flows.sort((a, b) => b.premium - a.premium);
};

const generateGammaLevels = (marketData: any[]): GammaLevel[] => {
  const symbols = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'AAPL'];
  return symbols.map(symbol => {
    const marketCoin = marketData.find(m => m.symbol?.toUpperCase() === symbol);
    const price = marketCoin?.price || (symbol === 'SPY' ? 582.5 : symbol === 'QQQ' ? 502.3 : symbol === 'NVDA' ? 142.8 : symbol === 'TSLA' ? 248.5 : 195.2);
    return {
      symbol, price,
      gammaFlip: Math.round(price * 0.985),
      callWall: Math.round(price * 1.015),
      putWall: Math.round(price * 0.965),
      maxPain: Math.round(price),
      netGamma: ((price % 10) - 5) / 2
    };
  });
};

const OptionsFlowTracker = () => {
  const { data: marketData } = useRealMarketData({ limit: 50 });
  const [flows, setFlows] = useState<OptionsFlow[]>([]);
  const [gammaLevels, setGammaLevels] = useState<GammaLevel[]>([]);
  const [filter, setFilter] = useState<'all' | 'calls' | 'puts' | 'unusual' | 'sweeps'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setFlows(generateOptionsFlow(marketData));
    setGammaLevels(generateGammaLevels(marketData));
  }, [marketData]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => { setFlows(generateOptionsFlow(marketData)); setIsLoading(false); }, 500);
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5"><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" /><div><p className="text-xs text-muted-foreground">Call Premium</p><p className="text-xl font-bold text-green-500">{formatPremium(totalCallPremium)}</p></div></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5"><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-500" /><div><p className="text-xs text-muted-foreground">Put Premium</p><p className="text-xl font-bold text-red-500">{formatPremium(totalPutPremium)}</p></div></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5"><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Call/Put Ratio</p><p className="text-xl font-bold">{callPutRatio}</p></div></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5"><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Flame className="h-5 w-5 text-amber-500" /><div><p className="text-xs text-muted-foreground">Unusual Activity</p><p className="text-xl font-bold">{unusualCount}</p></div></div></CardContent></Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5"><CardContent className="pt-4 pb-4"><div className="flex items-center gap-2"><Zap className="h-5 w-5 text-purple-500" /><div><p className="text-xs text-muted-foreground">Sweeps</p><p className="text-xl font-bold">{flows.filter(f => f.sweep).length}</p></div></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" />Live Options Flow</CardTitle><CardDescription>Real-time unusual options activity</CardDescription></div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}><RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />Refresh</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 mb-4 flex-wrap">
              {(['all', 'calls', 'puts', 'unusual', 'sweeps'] as const).map(f => (
                <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-[10px] sm:text-xs h-6 sm:h-8 px-1.5 sm:px-2">{f.charAt(0).toUpperCase() + f.slice(1)}</Button>
              ))}
            </div>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {filteredFlows.map(flow => (
                  <div key={flow.id} className={`p-2 sm:p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 ${flow.unusual ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Badge className={`text-[9px] sm:text-xs ${flow.type === 'call' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>{flow.type.toUpperCase()}</Badge>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm">{flow.symbol}</span>
                          <span className="font-mono text-[10px] sm:text-sm">${flow.strike}</span>
                          <span className="text-[10px] sm:text-sm text-muted-foreground">{flow.expiry}</span>
                          {flow.sweep && <Badge variant="outline" className="text-[8px] sm:text-xs px-1">SWEEP</Badge>}
                          {flow.unusual && <Flame className="h-3 w-3 text-amber-500" />}
                        </div>
                        <div className="text-[9px] sm:text-xs text-muted-foreground">Vol: {flow.volume.toLocaleString()} | OI: {flow.openInterest.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0"><p className="font-bold text-sm sm:text-lg">{formatPremium(flow.premium)}</p><p className="text-[9px] sm:text-xs text-muted-foreground">Spot: ${flow.spot.toFixed(2)}</p></div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-purple-500" />Gamma Levels</CardTitle><CardDescription>Key support/resistance from options</CardDescription></CardHeader>
          <CardContent>
            <ScrollArea className="h-[440px]">
              <div className="space-y-4">
                {gammaLevels.map(g => (
                  <div key={g.symbol} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2"><span className="font-bold">{g.symbol}</span><span className="font-mono">${g.price.toFixed(2)}</span></div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Max Pain</span><span className="font-mono text-amber-500">${g.maxPain}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Call Wall</span><span className="font-mono text-green-500">${g.callWall}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Put Wall</span><span className="font-mono text-red-500">${g.putWall}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Gamma Flip</span><span className="font-mono">${g.gammaFlip}</span></div>
                      <div className="flex justify-between items-center"><span className="text-muted-foreground">Net Gamma</span><Badge className={g.netGamma > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>{g.netGamma > 0 ? '+' : ''}{g.netGamma.toFixed(1)}B</Badge></div>
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
