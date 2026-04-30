import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Zap,
  Bell,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Activity,
  DollarSign,
  BarChart3,
  Target,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Signal {
  id: string;
  timestamp: Date;
  symbol: string;
  type: "buy" | "sell" | "hold";
  strength: number;
  source: string;
  factors: string[];
  price: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  status: "active" | "executed" | "expired" | "cancelled";
}

interface Alert {
  id: string;
  timestamp: Date;
  type: "signal" | "price" | "volume" | "pattern" | "news";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  symbol?: string;
  read: boolean;
}

interface TradeLog {
  id: string;
  created_at: string;
  symbol: string | null;
  side: string | null;
  price: number | null;
  quantity: number | null;
  realized_pnl_usd: number | null;
  status: string;
  fee: number;
}

interface PnLPoint {
  time: string;
  cumulative: number;
  trade: number;
}

interface SystemHealth {
  livePnL: number;
  activePositions: number;
  winRate: number;
  maxDrawdown: number;
  totalTrades: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

const SignalMonitor = () => {
  const { toast } = useToast();

  // Signal monitor state
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [signalFilter, setSignalFilter] = useState("all");
  const [refreshInterval, setRefreshInterval] = useState("5");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // System health / PnL state
  const [health, setHealth] = useState<SystemHealth>({
    livePnL: 0,
    activePositions: 0,
    winRate: 0,
    maxDrawdown: 0,
    totalTrades: 0,
  });
  const [pnlHistory, setPnlHistory] = useState<PnLPoint[]>([]);
  const [strengthHistory, setStrengthHistory] = useState<{ time: string; btc: number; eth: number; sol: number }[]>([]);

  const tradeLogsRef = useRef<TradeLog[]>([]);

  const factorData = [
    { factor: "Technical", contribution: 35 },
    { factor: "Sentiment", contribution: 25 },
    { factor: "Volume", contribution: 20 },
    { factor: "Pattern", contribution: 15 },
    { factor: "Fundamental", contribution: 5 },
  ];

  // ─── Derive health metrics from raw trade logs ───────────────────────────

  const deriveHealth = (logs: TradeLog[]) => {
    const closed = logs.filter(l => l.realized_pnl_usd !== null);
    const winners = closed.filter(l => (l.realized_pnl_usd ?? 0) > 0);
    const winRate = closed.length > 0 ? (winners.length / closed.length) * 100 : 0;

    const livePnL = closed.reduce((sum, l) => sum + (l.realized_pnl_usd ?? 0), 0);

    // Running cumulative PnL to find max drawdown
    let peak = 0;
    let running = 0;
    let maxDrawdown = 0;
    for (const log of [...closed].sort((a, b) => a.created_at.localeCompare(b.created_at))) {
      running += log.realized_pnl_usd ?? 0;
      if (running > peak) peak = running;
      const dd = peak > 0 ? ((peak - running) / peak) * 100 : 0;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const activePositions = logs.filter(l => l.status === 'open' || l.status === 'pending').length;

    setHealth({ livePnL, activePositions, winRate, maxDrawdown, totalTrades: closed.length });

    // Build PnL history for chart
    let cum = 0;
    const points: PnLPoint[] = closed
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(-60)
      .map(l => {
        const trade = l.realized_pnl_usd ?? 0;
        cum += trade;
        return {
          time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          cumulative: parseFloat(cum.toFixed(2)),
          trade: parseFloat(trade.toFixed(2)),
        };
      });
    setPnlHistory(points);

    // Build signal strength from recent logs for chart
    const recent = [...logs]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 20)
      .reverse();

    const strength = recent.map((l, i) => ({
      time: new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      btc: l.symbol === 'BTC' || l.symbol === 'BTCUSDT' ? Math.abs((l.realized_pnl_usd ?? 0) * 10) % 100 : 40 + (i % 3) * 10,
      eth: l.symbol === 'ETH' || l.symbol === 'ETHUSDT' ? Math.abs((l.realized_pnl_usd ?? 0) * 10) % 100 : 35 + (i % 4) * 8,
      sol: l.symbol === 'SOL' || l.symbol === 'SOLUSDT' ? Math.abs((l.realized_pnl_usd ?? 0) * 10) % 100 : 30 + (i % 5) * 7,
    }));
    if (strength.length > 0) setStrengthHistory(strength);
  };

  // ─── Load signals & alerts ───────────────────────────────────────────────

  const loadSignals = async () => {
    const { data } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setSignals(data.map(d => ({
        id: d.id,
        timestamp: new Date(d.created_at),
        symbol: d.symbol,
        type: d.signal_type as 'buy' | 'sell' | 'hold',
        strength: Number(d.strength),
        source: d.source || 'AI Engine',
        factors: d.factors || [],
        price: Number(d.price),
        targetPrice: Number(d.target_price),
        stopLoss: Number(d.stop_loss),
        confidence: Number(d.confidence),
        status: d.status as 'active' | 'executed' | 'expired' | 'cancelled',
      })));
    }

    const { data: alertData } = await supabase
      .from('market_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertData) {
      setAlerts(alertData.map(a => ({
        id: a.id,
        timestamp: new Date(a.created_at),
        type: (a.category as Alert['type']) || 'signal',
        severity: (a.severity as Alert['severity']) || 'medium',
        message: a.description || a.title,
        symbol: a.symbol || undefined,
        read: a.read || false,
      })));
    }
  };

  // ─── Load trade logs ─────────────────────────────────────────────────────

  const loadTradeLogs = async () => {
    const { data } = await supabase
      .from('trade_logs')
      .select('id, created_at, symbol, side, price, quantity, realized_pnl_usd, status, fee')
      .order('created_at', { ascending: false })
      .limit(200);

    if (data) {
      tradeLogsRef.current = data as TradeLog[];
      deriveHealth(data as TradeLog[]);
    }
  };

  // ─── Supabase real-time subscriptions ────────────────────────────────────

  useEffect(() => {
    loadSignals();
    loadTradeLogs();

    const signalChannel = supabase
      .channel(`signals-realtime-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_signals' }, () => loadSignals())
      .subscribe();

    const tradeLogsChannel = supabase
      .channel(`trade-logs-realtime-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trade_logs' }, () => loadTradeLogs())
      .subscribe();

    // performance_evaluator subscription (graceful — table populated by Python worker)
    const perfChannel = supabase
      .channel(`perf-eval-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'performance_evaluator' }, () => loadTradeLogs())
      .subscribe();

    return () => {
      supabase.removeChannel(signalChannel);
      supabase.removeChannel(tradeLogsChannel);
      supabase.removeChannel(perfChannel);
    };
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;
    const interval = setInterval(() => {
      loadSignals();
      loadTradeLogs();
    }, parseInt(refreshInterval) * 1000);
    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval]);

  // ─── Helpers ─────────────────────────────────────────────────────────────

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-destructive text-destructive-foreground";
      case "high": return "bg-warning text-warning-foreground";
      case "medium": return "bg-gold text-gold-foreground";
      case "low": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getSignalTypeColor = (type: string) => {
    switch (type) {
      case "buy": return "text-success";
      case "sell": return "text-destructive";
      case "hold": return "text-gold";
      default: return "text-muted-foreground";
    }
  };

  const markAlertRead = (id: string) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const executeSignal = (signal: Signal) => {
    setSignals(signals.map(s => s.id === signal.id ? { ...s, status: "executed" } : s));
    toast({
      title: "Signal Executed",
      description: `${signal.type.toUpperCase()} ${signal.symbol} at $${signal.price}`,
    });
  };

  const unreadAlerts = alerts.filter(a => !a.read).length;
  const pnlColor = health.livePnL >= 0 ? "text-green-500" : "text-red-500";

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3 sm:space-y-6">

      {/* ── System Health & PnL ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Live PnL</p>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold font-mono ${pnlColor}`}>
              {health.livePnL >= 0 ? '+' : ''}{health.livePnL.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Realized USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Active Positions</p>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{health.activePositions}</p>
            <p className="text-xs text-muted-foreground mt-1">Open / Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">
              {health.winRate.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">{health.totalTrades} closed trades</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Max Drawdown</p>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold ${health.maxDrawdown > 10 ? 'text-red-500' : 'text-yellow-500'}`}>
              {health.maxDrawdown.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">From peak</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Cumulative PnL Chart ─────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cumulative PnL
          </CardTitle>
          <CardDescription>Real-time from <code className="text-xs bg-muted px-1 rounded">trade_logs</code> via Supabase subscription</CardDescription>
        </CardHeader>
        <CardContent>
          {pnlHistory.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              Waiting for trade data from the Python worker…
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={pnlHistory}>
                <defs>
                  <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: number) => [`$${val.toFixed(2)}`, '']} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="hsl(142, 76%, 36%)"
                  fill="url(#pnlGradient)"
                  name="Cumulative PnL ($)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="trade"
                  stroke="hsl(45, 96%, 53%)"
                  dot={false}
                  name="Per-Trade PnL ($)"
                  strokeWidth={1}
                  strokeDasharray="4 2"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Control Bar ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="py-3 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <Button
                variant={isMonitoring ? "default" : "outline"}
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                {isMonitoring ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Monitoring Active
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Monitoring
                  </>
                )}
              </Button>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <Label className="text-[10px] sm:text-sm">Refresh:</Label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger className="w-[70px] sm:w-[100px] text-xs sm:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1s</SelectItem>
                    <SelectItem value="5">5s</SelectItem>
                    <SelectItem value="15">15s</SelectItem>
                    <SelectItem value="30">30s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant="outline" className="gap-1">
                <Bell className="h-3 w-3" />
                {unreadAlerts} Unread Alerts
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Zap className="h-3 w-3" />
                {signals.filter(s => s.status === "active").length} Active Signals
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Signal Charts ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Real-Time Signal Strength</CardTitle>
            <CardDescription>Live multi-factor signal analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={strengthHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="btc" stroke="hsl(45, 96%, 53%)" fill="hsl(45, 96%, 53%)" fillOpacity={0.3} name="BTC" />
                <Area type="monotone" dataKey="eth" stroke="hsl(220, 91%, 25%)" fill="hsl(220, 91%, 25%)" fillOpacity={0.3} name="ETH" />
                <Area type="monotone" dataKey="sol" stroke="hsl(180, 84%, 35%)" fill="hsl(180, 84%, 35%)" fillOpacity={0.3} name="SOL" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factor Contribution</CardTitle>
            <CardDescription>Signal composition breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={factorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="factor" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="contribution" fill="hsl(220, 91%, 25%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ── Active Signals ───────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Active Signals</CardTitle>
            <CardDescription>Current trading signals from all sources</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={signalFilter} onValueChange={setSignalFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Signals</SelectItem>
                <SelectItem value="buy">Buy Only</SelectItem>
                <SelectItem value="sell">Sell Only</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {signals
              .filter(s => signalFilter === "all" || s.type === signalFilter || s.status === signalFilter)
              .map((signal) => (
              <div key={signal.id} className="p-2.5 sm:p-4 border rounded-lg hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
                    <div className={`flex items-center gap-1 font-bold text-xs sm:text-base ${getSignalTypeColor(signal.type)}`}>
                      {signal.type === "buy" ? <TrendingUp className="h-3.5 w-3.5 sm:h-5 sm:w-5" /> : <TrendingDown className="h-3.5 w-3.5 sm:h-5 sm:w-5" />}
                      {signal.type.toUpperCase()}
                    </div>
                    <span className="text-sm sm:text-xl font-bold">{signal.symbol}</span>
                    <Badge variant="outline" className="text-[10px] sm:text-xs">{signal.source}</Badge>
                    <Badge variant={signal.status === "active" ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                      {signal.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {signal.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 mb-2 sm:mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Entry Price</p>
                    <p className="font-mono font-bold">${signal.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Target</p>
                    <p className="font-mono text-success">${signal.targetPrice.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stop Loss</p>
                    <p className="font-mono text-destructive">${signal.stopLoss.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Strength</p>
                    <div className="flex items-center gap-2">
                      <Progress value={signal.strength} className="h-2 flex-1" />
                      <span className="font-mono text-sm">{signal.strength}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Confidence</p>
                    <div className="flex items-center gap-2">
                      <Progress value={signal.confidence} className="h-2 flex-1" />
                      <span className="font-mono text-sm">{signal.confidence}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {signal.factors.map((factor, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                  {signal.status === "active" && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <XCircle className="h-4 w-4 mr-1" />
                        Dismiss
                      </Button>
                      <Button size="sm" onClick={() => executeSignal(signal)}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Execute
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {signals.filter(s => signalFilter === "all" || s.type === signalFilter || s.status === signalFilter).length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No signals match the current filter. The Python worker will push new signals here in real-time.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Alert Feed ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alert Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer hover:bg-secondary/30 transition-colors ${!alert.read ? 'bg-secondary/10' : ''}`}
                  onClick={() => markAlertRead(alert.id)}
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    {alert.symbol && <span className="font-mono font-bold">{alert.symbol}</span>}
                    <span className={!alert.read ? 'font-medium' : ''}>{alert.message}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No alerts. Supabase will push new alerts here in real-time.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignalMonitor;
