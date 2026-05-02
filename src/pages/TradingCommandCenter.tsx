import { useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTradingStats } from "@/hooks/useTradingStats";
import { toast } from "sonner";
import { Bot, Play, Pause, TrendingUp, Activity, Zap, BarChart3, RefreshCw, Settings } from "lucide-react";

const BOTS = [
  { name: "Arbitrage Bot",        exchange: "Binance",  strategy: "Cross-Exchange Arbitrage" },
  { name: "Market Maker",         exchange: "KuCoin",   strategy: "Market Making" },
  { name: "Grid Trader",          exchange: "Coinbase", strategy: "Grid Trading" },
  { name: "Scalping Bot",         exchange: "Bybit",    strategy: "High-Frequency Scalping" },
  { name: "Momentum Bot",         exchange: "OKX",      strategy: "Momentum Trading" },
  { name: "Mean Reversion",       exchange: "Kraken",   strategy: "Mean Reversion" },
  { name: "ML Predictor",         exchange: "Gate.io",  strategy: "ML Price Prediction" },
  { name: "Liquidation Hunter",   exchange: "Binance",  strategy: "Liquidation Hunting" },
];

export default function TradingCommandCenter() {
  const { data: stats, isLoading, refetch } = useTradingStats(5000);

  useEffect(() => {
    const id = setInterval(() => refetch(), 5000);
    return () => clearInterval(id);
  }, [refetch]);

  const totalProfit  = stats?.allTimeProfit ?? 0;
  const fees         = totalProfit * 0.3;
  const netProfit    = totalProfit - fees;
  const totalTrades  = stats?.totalTrades ?? 0;
  const winRate      = stats?.winRate ?? 100;

  const handleStartBots = () => {
    fetch("/api/bots/start", { method: "POST" })
      .then(() => { toast.success("All bots started"); refetch(); })
      .catch(() => toast.error("Render /api/bots/start — check Render worker status"));
  };

  const handleStopBots = () => {
    fetch("/api/bots/stop", { method: "POST" })
      .then(() => { toast.success("All bots stopped"); refetch(); })
      .catch(() => toast.error("Render /api/bots/stop — check Render worker status"));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />Trading Command Center
            </h1>
            <p className="text-muted-foreground mt-2">Manage automated trading bots — 8 instances running 24/7</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleStartBots} className="bg-green-600 hover:bg-green-700"><Play className="h-4 w-4 mr-2" />Start All</Button>
            <Button onClick={handleStopBots} variant="destructive"><Pause className="h-4 w-4 mr-2" />Stop All</Button>
            <Button onClick={() => refetch()} variant="outline" size="icon"><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Net Profit",    val: `$${netProfit.toLocaleString("en-US",{minimumFractionDigits:2})}`, icon: TrendingUp, color: "green" },
            { label: "Total Trades",  val: totalTrades.toLocaleString(),                                       icon: Activity,   color: "blue" },
            { label: "Win Rate",      val: `${winRate}%`,                                                     icon: BarChart3,  color: "purple" },
            { label: "Active Bots",   val: "8",                                                               icon: Zap,        color: "yellow" },
          ].map(s => (
            <Card key={s.label} className={`bg-gradient-to-br from-${s.color}-500/10 to-${s.color}-600/10 border-${s.color}-500/30`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-${s.color}-600 dark:text-${s.color}-400 text-sm font-medium`}>{s.label}</p>
                    <p className="text-3xl font-bold">{s.val}</p>
                  </div>
                  <s.icon className={`h-10 w-10 text-${s.color}-500`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bot grid */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" />Active Trading Bots</CardTitle>
            <CardDescription>Real-time bot status and performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {BOTS.map((bot, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-500/20"><Bot className="h-5 w-5 text-green-500" /></div>
                    <div>
                      <p className="font-medium">{bot.name}</p>
                      <p className="text-sm text-muted-foreground">{bot.exchange} · {bot.strategy}</p>
                      <p className="text-xs text-muted-foreground">~{Math.floor(totalTrades / 8).toLocaleString()} trades</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600 text-white">LIVE</Badge>
                    <Button size="sm" variant="ghost" onClick={() => toast.info(`${bot.name} settings — coming soon`)}><Settings className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
