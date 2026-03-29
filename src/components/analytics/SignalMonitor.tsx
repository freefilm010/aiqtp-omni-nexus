import { useState, useEffect } from "react";
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
  Settings,
  Plus,
  Filter,
  Volume2,
  VolumeX,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const SignalMonitor = () => {
  const { toast } = useToast();
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [signalFilter, setSignalFilter] = useState("all");
  const [refreshInterval, setRefreshInterval] = useState("5");

  const [signals, setSignals] = useState<Signal[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [strengthHistory, setStrengthHistory] = useState<any[]>([]);

  const factorData = [
    { factor: "Technical", contribution: 35 },
    { factor: "Sentiment", contribution: 25 },
    { factor: "Volume", contribution: 20 },
    { factor: "Pattern", contribution: 15 },
    { factor: "Fundamental", contribution: 5 },
  ];

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

    // Load market alerts as alerts
    const { data: alertData } = await supabase
      .from('market_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertData) {
      setAlerts(alertData.map(a => ({
        id: a.id,
        timestamp: new Date(a.created_at),
        type: (a.alert_type as Alert['type']) || 'signal',
        severity: (a.severity as Alert['severity']) || 'medium',
        message: a.message,
        symbol: a.symbol || undefined,
        read: a.is_read || false,
      })));
    }
  };

  useEffect(() => {
    loadSignals();

    const channel = supabase
      .channel('signals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trading_signals' }, () => loadSignals())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;
    const interval = setInterval(loadSignals, parseInt(refreshInterval) * 1000);
    return () => clearInterval(interval);
  }, [isMonitoring, refreshInterval]);

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

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
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

              <div className="flex items-center gap-2">
                <Label className="text-sm">Refresh:</Label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger className="w-[100px]">
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

            <div className="flex items-center gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signal Strength Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Real-Time Signal Strength</CardTitle>
            <CardDescription>Live multi-factor signal analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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

        {/* Factor Contribution */}
        <Card>
          <CardHeader>
            <CardTitle>Factor Contribution</CardTitle>
            <CardDescription>Signal composition breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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

      {/* Active Signals */}
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
              <div key={signal.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 font-bold ${getSignalTypeColor(signal.type)}`}>
                      {signal.type === "buy" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      {signal.type.toUpperCase()}
                    </div>
                    <span className="text-xl font-bold">{signal.symbol}</span>
                    <Badge variant="outline">{signal.source}</Badge>
                    <Badge variant={signal.status === "active" ? "default" : "secondary"}>
                      {signal.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {signal.timestamp.toLocaleTimeString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
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
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
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
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignalMonitor;
