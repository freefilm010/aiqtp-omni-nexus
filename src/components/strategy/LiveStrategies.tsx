import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Play, Pause, TrendingUp, TrendingDown, Activity, Zap, Settings, Bot, Copyright, Bookmark, Sparkles
} from "lucide-react";

interface LiveStrategy {
  id: string;
  personaId: string;
  name: string;
  codeName: string;
  status: 'running' | 'paused' | 'stopped';
  pairs: string[];
  profit: number;
  profitPercent: number;
  trades: number;
  winRate: number;
  uptimeSeconds: number;
  lastTradeAt: string | null;
  openPositions: number;
  drawdown: number;
  personality: string;
  catchphrase: string;
  primaryColor: string;
}

const formatUptime = (seconds: number) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

const formatLastTrade = (ts: string | null) => {
  if (!ts) return "Never";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const LiveStrategies = () => {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<LiveStrategy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("live_strategies")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setStrategies(data.map((s: any) => ({
          id: s.id,
          personaId: s.persona_id || "",
          name: s.name,
          codeName: s.code_name || "",
          status: s.status,
          pairs: s.pairs || [],
          profit: Number(s.profit),
          profitPercent: Number(s.profit_percent),
          trades: s.trades,
          winRate: Number(s.win_rate),
          uptimeSeconds: s.uptime_seconds,
          lastTradeAt: s.last_trade_at,
          openPositions: s.open_positions,
          drawdown: Number(s.drawdown),
          personality: s.personality || "",
          catchphrase: s.catchphrase || "",
          primaryColor: s.primary_color || "primary",
        })));
      }
      setLoading(false);
    };
    load();

    const channel = supabase.channel(`live-strategies-rt-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_strategies', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleStatus = async (id: string) => {
    const strategy = strategies.find(s => s.id === id);
    if (!strategy) return;
    const newStatus = strategy.status === 'running' ? 'paused' : 'running';
    await supabase.from("live_strategies").update({ status: newStatus }).eq("id", id);
    setStrategies(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const totalProfit = strategies.reduce((sum, s) => sum + s.profit, 0);
  const totalTrades = strategies.reduce((sum, s) => sum + s.trades, 0);
  const runningCount = strategies.filter(s => s.status === 'running').length;

  if (loading) return <p className="text-muted-foreground text-center py-12">Loading live strategies...</p>;

  if (strategies.length === 0) {
    return (
      <div className="text-center py-16">
        <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Live Strategies</h3>
        <p className="text-muted-foreground text-sm">Deploy a strategy from the Strategy Builder or Marketplace to start live trading.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              {totalProfit >= 0 ? <TrendingUp className="h-8 w-8 text-green-500" /> : <TrendingDown className="h-8 w-8 text-red-500" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Strategies</p>
                <p className="text-3xl font-bold">{runningCount}/{strategies.length}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-3xl font-bold">{totalTrades}</p>
              </div>
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="text-3xl font-bold">{strategies.reduce((sum, s) => sum + s.openPositions, 0)}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {strategies.map(strategy => (
          <Card key={strategy.id} className={`${strategy.status === 'paused' ? 'opacity-75' : ''} transition-colors`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Bot className="h-6 w-6 text-primary" />
                    <div className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ${
                      strategy.status === 'running' ? 'bg-green-500 animate-pulse' :
                      strategy.status === 'paused' ? 'bg-yellow-500' : 'bg-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <Copyright className="h-3 w-3 text-muted-foreground" />
                      <Bookmark className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">{strategy.codeName}</p>
                    <div className="flex gap-1 mt-1">
                      {strategy.pairs.map(pair => <Badge key={pair} variant="secondary" className="text-xs">{pair}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(strategy.id)}>
                    {strategy.status === 'running' ? <><Pause className="h-4 w-4 mr-1" /> Pause</> : <><Play className="h-4 w-4 mr-1" /> Resume</>}
                  </Button>
                  <Button variant="ghost" size="sm"><Settings className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {strategy.catchphrase && (
                <div className="mb-4 p-2 rounded bg-muted/30 border-l-2 border-[hsl(43,96%,56%)]/50">
                  <p className="text-xs italic text-muted-foreground">"{strategy.catchphrase}"</p>
                </div>
              )}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className={`text-lg font-bold ${strategy.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {strategy.profit >= 0 ? '+' : ''}{strategy.profitPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">${Math.abs(strategy.profit).toLocaleString()}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className="text-lg font-bold">{strategy.winRate}%</p>
                  <p className="text-xs text-muted-foreground">{strategy.trades} trades</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Drawdown</p>
                  <p className="text-lg font-bold text-red-500">-{strategy.drawdown}%</p>
                  <p className="text-xs text-muted-foreground">Max</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Open</p>
                  <p className="text-lg font-bold">{strategy.openPositions}</p>
                  <p className="text-xs text-muted-foreground">positions</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Uptime: <span className="font-medium text-foreground">{formatUptime(strategy.uptimeSeconds)}</span></span>
                  <span className="text-muted-foreground">Last trade: <span className="font-medium text-foreground">{formatLastTrade(strategy.lastTradeAt)}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={strategy.status === 'running' ? 'default' : 'secondary'} className="capitalize">{strategy.status}</Badge>
                  <Badge variant="outline" className="border-[hsl(43,96%,56%)]/30 text-[hsl(43,96%,56%)] text-xs">
                    <Sparkles className="h-3 w-3 mr-1" /> NFT Card
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LiveStrategies;
