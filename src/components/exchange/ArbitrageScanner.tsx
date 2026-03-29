import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Zap,
  TrendingUp,
  ArrowRightLeft,
  DollarSign,
  Clock,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  RefreshCw,
  Filter
} from "lucide-react";

interface ArbitrageOpportunity {
  id: string;
  pair: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  volume: number;
  estimatedProfit: number;
  expiresIn: number;
  type: 'simple' | 'triangular' | 'cross-chain';
  risk: 'low' | 'medium' | 'high';
}

const ArbitrageScanner = () => {
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [minSpread, setMinSpread] = useState("0.1");
  const [autoExecute, setAutoExecute] = useState(false);
  const [showTriangular, setShowTriangular] = useState(true);
  const [showCrossChain, setShowCrossChain] = useState(true);

  const fetchOpportunities = async () => {
    const { data } = await supabase
      .from('arbitrage_opportunities')
      .select('*')
      .order('spread_percent', { ascending: false })
      .limit(20);

    if (data) {
      setOpportunities(data.map(d => ({
        id: d.id,
        pair: d.pair,
        buyExchange: d.buy_exchange,
        sellExchange: d.sell_exchange,
        buyPrice: Number(d.buy_price),
        sellPrice: Number(d.sell_price),
        spread: Number(d.spread),
        spreadPercent: Number(d.spread_percent),
        volume: Number(d.volume),
        estimatedProfit: Number(d.estimated_profit),
        expiresIn: d.expires_at ? Math.max(0, Math.floor((new Date(d.expires_at).getTime() - Date.now()) / 1000)) : 0,
        type: (d.arb_type as 'simple' | 'triangular' | 'cross-chain') || 'simple',
        risk: (d.risk as 'low' | 'medium' | 'high') || 'low',
      })));
    }
  };

  useEffect(() => {
    fetchOpportunities();

    const channel = supabase
      .channel('arbitrage-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'arbitrage_opportunities' }, () => {
        fetchOpportunities();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(fetchOpportunities, 5000);
    return () => clearInterval(interval);
  }, [isScanning]);

  const filteredOpportunities = opportunities.filter(opp => {
    if (opp.spreadPercent < parseFloat(minSpread)) return false;
    if (opp.type === 'triangular' && !showTriangular) return false;
    if (opp.type === 'cross-chain' && !showCrossChain) return false;
    return true;
  });

  const totalProfit = filteredOpportunities.reduce((sum, opp) => sum + opp.estimatedProfit, 0);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'high': return 'text-red-500 bg-red-500/10';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Zap className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Opportunities</p>
                <p className="text-2xl font-bold">{filteredOpportunities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Potential Profit</p>
                <p className="text-2xl font-bold">${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Best Spread</p>
                <p className="text-2xl font-bold">{filteredOpportunities[0]?.spreadPercent.toFixed(3) || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <RefreshCw className={`h-5 w-5 text-blue-500 ${isScanning ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scanner Status</p>
                <p className="text-2xl font-bold">{isScanning ? 'Active' : 'Paused'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Scanner Settings
            </CardTitle>
            <Button
              variant={isScanning ? 'destructive' : 'default'}
              onClick={() => setIsScanning(!isScanning)}
            >
              {isScanning ? <PauseCircle className="h-4 w-4 mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
              {isScanning ? 'Pause Scanner' : 'Start Scanner'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Minimum Spread (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={minSpread}
                onChange={(e) => setMinSpread(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label>Auto-Execute Trades</Label>
              <Switch checked={autoExecute} onCheckedChange={setAutoExecute} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label>Triangular Arb</Label>
              <Switch checked={showTriangular} onCheckedChange={setShowTriangular} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label>Cross-Chain Arb</Label>
              <Switch checked={showCrossChain} onCheckedChange={setShowCrossChain} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Live Arbitrage Opportunities
          </CardTitle>
          <CardDescription>Real-time cross-exchange price discrepancies</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 text-xs text-muted-foreground px-4 py-2 border-b bg-muted/30">
            <span>Pair</span>
            <span>Type</span>
            <span>Buy</span>
            <span>Sell</span>
            <span className="text-right">Spread</span>
            <span className="text-right">Est. Profit</span>
            <span className="text-right">Expires</span>
            <span className="text-right">Action</span>
          </div>
          <ScrollArea className="h-[400px]">
            {filteredOpportunities.map((opp) => (
              <div key={opp.id} className="grid grid-cols-8 items-center px-4 py-3 border-b hover:bg-muted/50">
                <div>
                  <span className="font-medium">{opp.pair}</span>
                </div>
                <div>
                  <Badge variant="outline" className={`capitalize ${opp.type === 'triangular' ? 'border-purple-500 text-purple-500' : opp.type === 'cross-chain' ? 'border-blue-500 text-blue-500' : ''}`}>
                    {opp.type}
                  </Badge>
                </div>
                <div>
                  <div className="text-green-500">{opp.buyExchange}</div>
                  <div className="text-xs text-muted-foreground">${opp.buyPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-red-500">{opp.sellExchange}</div>
                  <div className="text-xs text-muted-foreground">${opp.sellPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${getRiskColor(opp.risk)} px-2 py-0.5 rounded`}>
                    {opp.spreadPercent.toFixed(3)}%
                  </span>
                </div>
                <div className="text-right font-medium text-green-500">
                  ${opp.estimatedProfit.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className={opp.expiresIn < 10 ? 'text-red-500' : 'text-muted-foreground'}>
                      {opp.expiresIn}s
                    </span>
                  </div>
                  <Progress value={(opp.expiresIn / 30) * 100} className="h-1 mt-1" />
                </div>
                <div className="text-right">
                  <Button size="sm" className="h-7">
                    <Zap className="h-3 w-3 mr-1" />
                    Execute
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArbitrageScanner;
