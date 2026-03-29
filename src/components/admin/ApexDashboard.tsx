import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  Shield,
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Target,
  Zap,
  Copy,
  RefreshCw,
  Lock,
  Unlock,
  Ban,
  Play,
  Pause,
  Eye,
} from "lucide-react";

interface ApexAccount {
  id: string;
  label: string;
  status: "active" | "paused" | "locked" | "payout_pending";
  balance: number;
  dailyPnL: number;
  totalProfit: number;
  drawdown: number;
  maxDrawdown: number;
  contractsUsed: number;
  maxContracts: number;
  consistencyScore: number;
  payoutCycle: number;
  maxPayoutCycles: number;
  lastTrade: string;
  tradeCount: number;
}

const ApexDashboard = () => {
  const [accounts, setAccounts] = useState<ApexAccount[]>([]);
  const [mirrorEnabled, setMirrorEnabled] = useState(true);
  const [dllLock, setDllLock] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('apex_accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (data) {
        setAccounts(data.map(d => ({
          id: d.id,
          label: d.label,
          status: d.status as ApexAccount['status'],
          balance: Number(d.balance),
          dailyPnL: Number(d.daily_pnl),
          totalProfit: Number(d.total_profit),
          drawdown: Number(d.drawdown),
          maxDrawdown: Number(d.max_drawdown),
          contractsUsed: d.contracts_used || 0,
          maxContracts: d.max_contracts || 4,
          consistencyScore: Number(d.consistency_score),
          payoutCycle: d.payout_cycle || 1,
          maxPayoutCycles: d.max_payout_cycles || 6,
          lastTrade: d.last_trade || new Date().toISOString(),
          tradeCount: d.trade_count || 0,
        })));
      }
    };
    load();
  }, []);

  const totalProfit = accounts.reduce((s, a) => s + a.totalProfit, 0);
  const totalDailyPnL = accounts.reduce((s, a) => s + a.dailyPnL, 0);
  const activeCount = accounts.filter((a) => a.status === "active").length;
  const avgConsistency = accounts.reduce((s, a) => s + a.consistencyScore, 0) / accounts.length;
  const atRiskAccounts = accounts.filter((a) => a.drawdown > 2.5 || a.dailyPnL < -800);

  const getStatusBadge = (status: ApexAccount["status"]) => {
    switch (status) {
      case "active": return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Active</Badge>;
      case "paused": return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Paused</Badge>;
      case "locked": return <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">Locked</Badge>;
      case "payout_pending": return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">Payout</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Apex Prop Trading Command Center
          </h2>
          <p className="text-sm text-muted-foreground">
            Shadow Shepherd — 20 × 50K Performance Accounts via Tradovate
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mirror Mode</span>
            <Switch checked={mirrorEnabled} onCheckedChange={setMirrorEnabled} />
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" /> Sync All
          </Button>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-green-500/20">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-green-400 mb-1" />
            <p className="text-xl font-bold text-green-400">${totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-muted-foreground">Total Profit</p>
          </CardContent>
        </Card>
        <Card className={`border-${totalDailyPnL >= 0 ? "green" : "red"}-500/20`}>
          <CardContent className="p-4 text-center">
            {totalDailyPnL >= 0 ? <TrendingUp className="h-5 w-5 mx-auto text-green-400 mb-1" /> : <TrendingDown className="h-5 w-5 mx-auto text-red-400 mb-1" />}
            <p className={`text-xl font-bold ${totalDailyPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
              ${Math.abs(totalDailyPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-muted-foreground">Daily P&L</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 mx-auto text-blue-400 mb-1" />
            <p className="text-xl font-bold">{activeCount}/20</p>
            <p className="text-xs text-muted-foreground">Active Accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-5 w-5 mx-auto text-purple-400 mb-1" />
            <p className="text-xl font-bold">{avgConsistency.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Avg Consistency</p>
          </CardContent>
        </Card>
        <Card className={atRiskAccounts.length > 0 ? "border-red-500/30" : ""}>
          <CardContent className="p-4 text-center">
            <AlertTriangle className={`h-5 w-5 mx-auto mb-1 ${atRiskAccounts.length > 0 ? "text-red-400" : "text-green-400"}`} />
            <p className="text-xl font-bold">{atRiskAccounts.length}</p>
            <p className="text-xs text-muted-foreground">At Risk</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Controls */}
      <Card className="border-yellow-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-yellow-400" />
            2026 Apex Compliance Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Lock className="h-3 w-3" /> DLL Soft-Lock ($1,000)
                </span>
                <Switch checked={dllLock} onCheckedChange={setDllLock} />
              </div>
              <p className="text-xs text-muted-foreground">Auto-pauses when daily loss nears $1,000</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Target className="h-3 w-3" /> 50% Consistency Rule
              </div>
              <p className="text-xs text-muted-foreground">No single day &gt; 50% of total profit</p>
              <Badge className="text-xs bg-green-500/20 text-green-400">Enforced</Badge>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Ban className="h-3 w-3" /> Contract Cap
              </div>
              <p className="text-xs text-muted-foreground">Max 4 Minis / 40 Micro per account</p>
              <Badge className="text-xs bg-green-500/20 text-green-400">Enforced</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Grid */}
      <Tabs defaultValue="grid">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="table">Table View</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {accounts.map((acct) => {
              const dllUsed = acct.dailyPnL < 0 ? Math.abs(acct.dailyPnL) : 0;
              const dllPercent = (dllUsed / 1000) * 100;
              const consistencyOk = acct.consistencyScore <= 50;
              return (
                <Card
                  key={acct.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedAccount === acct.id ? "border-primary" : ""
                  } ${acct.drawdown > 2.5 ? "border-red-500/30" : ""}`}
                  onClick={() => setSelectedAccount(acct.id === selectedAccount ? null : acct.id)}
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-medium">{acct.label}</span>
                      {getStatusBadge(acct.status)}
                    </div>
                    <div className={`text-lg font-bold ${acct.dailyPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {acct.dailyPnL >= 0 ? "+" : ""}${acct.dailyPnL.toFixed(0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total: ${acct.totalProfit.toFixed(0)} | Trades: {acct.tradeCount}
                    </div>
                    {/* DLL Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">DLL</span>
                        <span className={dllPercent > 80 ? "text-red-400" : "text-muted-foreground"}>
                          ${dllUsed.toFixed(0)}/$1,000
                        </span>
                      </div>
                      <Progress value={dllPercent} className={`h-1 ${dllPercent > 80 ? "[&>div]:bg-red-500" : ""}`} />
                    </div>
                    {/* Contracts */}
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Contracts: {acct.contractsUsed}/{acct.maxContracts}</span>
                      <span>Cycle: {acct.payoutCycle}/{acct.maxPayoutCycles}</span>
                    </div>
                    {/* Consistency */}
                    <div className="flex items-center gap-1 text-xs">
                      <span className={acct.consistencyScore > 50 ? "text-yellow-400" : "text-green-400"}>
                        Consistency: {acct.consistencyScore.toFixed(0)}%
                      </span>
                      {acct.consistencyScore > 50 && <AlertTriangle className="h-3 w-3 text-yellow-400" />}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="table">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-muted-foreground font-medium">Account</th>
                      <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Daily P&L</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Total Profit</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Drawdown</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Contracts</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Consistency</th>
                      <th className="text-right p-3 text-muted-foreground font-medium">Payout Cycle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.map((acct) => (
                      <tr key={acct.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-3 font-mono text-xs">{acct.label}</td>
                        <td className="p-3">{getStatusBadge(acct.status)}</td>
                        <td className={`p-3 text-right font-mono ${acct.dailyPnL >= 0 ? "text-green-400" : "text-red-400"}`}>
                          ${acct.dailyPnL.toFixed(0)}
                        </td>
                        <td className="p-3 text-right font-mono text-green-400">${acct.totalProfit.toFixed(0)}</td>
                        <td className="p-3 text-right font-mono">{acct.drawdown.toFixed(1)}%</td>
                        <td className="p-3 text-right">{acct.contractsUsed}/{acct.maxContracts}</td>
                        <td className={`p-3 text-right ${acct.consistencyScore > 50 ? "text-yellow-400" : ""}`}>
                          {acct.consistencyScore.toFixed(0)}%
                        </td>
                        <td className="p-3 text-right">{acct.payoutCycle}/{acct.maxPayoutCycles}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Signal Queue */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-yellow-400" />
            Signal Queue (Human-in-the-Loop)
          </CardTitle>
          <CardDescription>
            Signals from TradingView are queued here for manual approval before execution via PickMyTrade/Tradovate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { signal: "BUY 2 MES @ Market", source: "TV: AlphaScalper", time: "12s ago", risk: "$120" },
              { signal: "SELL 1 MNQ @ 21,445", source: "TV: MomentumBot", time: "45s ago", risk: "$85" },
            ].map((sig, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-yellow-400" />
                  <div>
                    <p className="font-mono text-sm font-medium">{sig.signal}</p>
                    <p className="text-xs text-muted-foreground">{sig.source} • {sig.time} • Risk: {sig.risk}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={() => toast.success(`Executing: ${sig.signal}`)}>
                    <Play className="h-3 w-3 mr-1" /> Approve & Execute
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.info("Signal rejected")}>
                    <Ban className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApexDashboard;
