import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bot, Play, Pause, Settings, TrendingUp, Activity, Code,
  BarChart3, Zap, RefreshCw
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FreqtradeBot {
  id: string;
  name: string;
  strategy: string;
  status: 'running' | 'stopped' | 'error';
  pair: string;
  timeframe: string;
  profit: number;
  trades: number;
  winRate: number;
  lastTrade: string;
}

interface StrategyTemplate {
  name: string;
  description: string;
  indicators: string[];
  entryLogic: string;
  exitLogic: string;
}

const strategyTemplates: StrategyTemplate[] = [
  { name: 'RSI Momentum', description: 'Buy when RSI < 30, sell when RSI > 70', indicators: ['RSI(14)'], entryLogic: 'RSI < 30', exitLogic: 'RSI > 70' },
  { name: 'MACD Crossover', description: 'Buy on bullish MACD cross, sell on bearish', indicators: ['MACD(12,26,9)'], entryLogic: 'MACD crosses above signal', exitLogic: 'MACD crosses below signal' },
  { name: 'Bollinger Bounce', description: 'Buy at lower band, sell at upper band', indicators: ['BB(20,2)'], entryLogic: 'Price touches lower band', exitLogic: 'Price touches upper band' },
  { name: 'Multi-Timeframe RSI', description: 'RSI confirmation across multiple timeframes', indicators: ['RSI(14)', 'RSI(14) 1d'], entryLogic: 'RSI(5m) < 30 AND RSI(1d) < 30', exitLogic: 'RSI(5m) > 70' },
  { name: 'Golden Cross', description: 'MA50 crosses above MA200', indicators: ['SMA(50)', 'SMA(200)'], entryLogic: 'SMA50 crosses above SMA200', exitLogic: 'SMA50 crosses below SMA200' },
];

const FreqtradeStudio = () => {
  const [bots, setBots] = useState<FreqtradeBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState('RSI Momentum');
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m');
  const [dryRun, setDryRun] = useState(true);
  const [botName, setBotName] = useState('New Bot');

  const loadBots = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data } = await supabase
      .from("trading_bots" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as any;

    if (data) {
      setBots(data.map((b: any) => ({
        id: b.id,
        name: b.name,
        strategy: b.strategy,
        status: b.status as FreqtradeBot['status'],
        pair: b.pair,
        timeframe: b.timeframe,
        profit: Number(b.profit) || 0,
        trades: b.trades || 0,
        winRate: Number(b.win_rate) || 0,
        lastTrade: b.last_trade_at ? new Date(b.last_trade_at).toLocaleString() : 'Never',
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadBots(); }, [loadBots]);

  const toggleBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;
    const newStatus = bot.status === 'running' ? 'stopped' : 'running';

    await supabase.from("trading_bots" as any).update({ status: newStatus } as any).eq("id", botId);
    setBots(prev => prev.map(b => b.id === botId ? { ...b, status: newStatus as any } : b));
    toast.success(`Bot ${bot.name} ${newStatus}`);
  };

  const createBot = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in first"); return; }

    const { error } = await supabase.from("trading_bots" as any).insert({
      user_id: user.id,
      name: botName,
      strategy: selectedStrategy,
      status: dryRun ? 'stopped' : 'running',
      pair: selectedPair,
      timeframe: selectedTimeframe,
      is_dry_run: dryRun,
    } as any);

    if (error) { toast.error("Failed to create bot"); return; }
    toast.success(`Bot "${botName}" created with ${selectedStrategy} strategy`);
    setBotName('New Bot');
    loadBots();
  };

  const generateStrategyCode = (template: StrategyTemplate) => {
    return `from freqtrade.strategy import IStrategy
from pandas import DataFrame
import talib.abstract as ta

class ${template.name.replace(/\s/g, '')}Strategy(IStrategy):
    
    timeframe = '${selectedTimeframe}'
    stoploss = -0.10
    minimal_roi = {"0": 0.01}
    
    def populate_indicators(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # ${template.indicators.join(', ')}
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        return dataframe
    
    def populate_entry_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Entry: ${template.entryLogic}
        dataframe.loc[
            (dataframe['rsi'] < 30),
            'enter_long'] = 1
        return dataframe
    
    def populate_exit_trend(self, dataframe: DataFrame, metadata: dict) -> DataFrame:
        # Exit: ${template.exitLogic}
        dataframe.loc[
            (dataframe['rsi'] > 70),
            'exit_long'] = 1
        return dataframe`;
  };

  return (
    <Tabs defaultValue="bots" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="bots" className="flex items-center gap-2"><Bot className="h-4 w-4" />Active Bots</TabsTrigger>
        <TabsTrigger value="create" className="flex items-center gap-2"><Zap className="h-4 w-4" />Create Bot</TabsTrigger>
        <TabsTrigger value="strategies" className="flex items-center gap-2"><Code className="h-4 w-4" />Strategies</TabsTrigger>
        <TabsTrigger value="performance" className="flex items-center gap-2"><BarChart3 className="h-4 w-4" />Performance</TabsTrigger>
      </TabsList>

      <TabsContent value="bots">
        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Loading bots...</CardContent></Card>
          ) : bots.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">No bots yet — create your first trading bot</CardContent></Card>
          ) : bots.map(bot => (
            <Card key={bot.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-3 w-3 rounded-full ${
                      bot.status === 'running' ? 'bg-green-500 animate-pulse' :
                      bot.status === 'error' ? 'bg-red-500' : 'bg-muted-foreground'
                    }`} />
                    <div>
                      <h3 className="font-semibold text-lg">{bot.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{bot.pair}</span><span>•</span><span>{bot.timeframe}</span><span>•</span><span>{bot.strategy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className={`text-xl font-bold ${bot.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {bot.profit >= 0 ? '+' : ''}{bot.profit}%
                      </div>
                      <div className="text-xs text-muted-foreground">Profit</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{bot.trades}</div>
                      <div className="text-xs text-muted-foreground">Trades</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{bot.winRate}%</div>
                      <div className="text-xs text-muted-foreground">Win Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{bot.lastTrade}</div>
                      <div className="text-xs text-muted-foreground">Last Trade</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant={bot.status === 'running' ? 'destructive' : 'default'}
                        onClick={() => toggleBot(bot.id)}
                      >
                        {bot.status === 'running' ? <><Pause className="h-4 w-4 mr-1" /> Stop</> : <><Play className="h-4 w-4 mr-1" /> Start</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="create">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary" />Create New Trading Bot</CardTitle>
              <CardDescription>Configure a Freqtrade-style automated trading bot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Bot Name</Label>
                <Input value={botName} onChange={(e) => setBotName(e.target.value)} placeholder="Enter bot name" />
              </div>
              <div className="space-y-2">
                <Label>Strategy</Label>
                <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {strategyTemplates.map(s => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Trading Pair</Label>
                  <Select value={selectedPair} onValueChange={setSelectedPair}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                      <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                      <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                      <SelectItem value="XRP/USDT">XRP/USDT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timeframe</Label>
                  <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1m">1 minute</SelectItem>
                      <SelectItem value="5m">5 minutes</SelectItem>
                      <SelectItem value="15m">15 minutes</SelectItem>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="4h">4 hours</SelectItem>
                      <SelectItem value="1d">1 day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label className="text-base">Dry Run Mode</Label>
                  <p className="text-sm text-muted-foreground">Test with dry run mode before going live</p>
                </div>
                <Switch checked={dryRun} onCheckedChange={setDryRun} />
              </div>
              <Button className="w-full" size="lg" onClick={createBot}>
                <Zap className="h-4 w-4 mr-2" />Create Bot
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Strategy Preview</CardTitle>
              <CardDescription>{strategyTemplates.find(s => s.name === selectedStrategy)?.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto">
                  <code>{generateStrategyCode(strategyTemplates.find(s => s.name === selectedStrategy) || strategyTemplates[0])}</code>
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="strategies">
        <div className="grid grid-cols-2 gap-4">
          {strategyTemplates.map(strategy => (
            <Card key={strategy.name}>
              <CardHeader>
                <CardTitle className="text-lg">{strategy.name}</CardTitle>
                <CardDescription>{strategy.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Indicators</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {strategy.indicators.map(ind => (<Badge key={ind} variant="secondary">{ind}</Badge>))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                    <div className="text-xs text-muted-foreground mb-1">Entry</div>
                    <div className="text-green-500 font-mono text-xs">{strategy.entryLogic}</div>
                  </div>
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/20">
                    <div className="text-xs text-muted-foreground mb-1">Exit</div>
                    <div className="text-red-500 font-mono text-xs">{strategy.exitLogic}</div>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => { setSelectedStrategy(strategy.name); toast.info(`Selected ${strategy.name} strategy`); }}>
                  Use This Strategy
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="performance">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 text-center">
              <div className={`text-3xl font-bold ${bots.reduce((s,b) => s + b.profit, 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {bots.reduce((s,b) => s + b.profit, 0) >= 0 ? '+' : ''}{bots.reduce((s,b) => s + b.profit, 0).toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">Total Profit</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{bots.reduce((s,b) => s + b.trades, 0)}</div>
              <div className="text-sm text-muted-foreground">Total Trades</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">
                {bots.length > 0 ? (bots.reduce((s,b) => s + b.winRate, 0) / bots.length).toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-muted-foreground">Avg Win Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold">{bots.filter(b => b.status === 'running').length}</div>
              <div className="text-sm text-muted-foreground">Active Bots</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Bot Performance Comparison</CardTitle></CardHeader>
          <CardContent>
            {bots.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Create bots to see performance data</p>
            ) : (
              <div className="space-y-4">
                {bots.map(bot => (
                  <div key={bot.id} className="flex items-center gap-4 p-4 rounded-lg border">
                    <div className="flex-1">
                      <div className="font-medium">{bot.name}</div>
                      <div className="text-sm text-muted-foreground">{bot.strategy}</div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="w-32 text-center">
                        <div className={`font-bold ${bot.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {bot.profit >= 0 ? '+' : ''}{bot.profit}%
                        </div>
                      </div>
                      <div className="w-20 text-center">{bot.trades} trades</div>
                      <div className="w-20 text-center">{bot.winRate}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default FreqtradeStudio;
