import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getCachedUser } from "@/lib/auth/getCachedUser";
import { formatEngineMix, formatEngineStrategy } from "@/lib/autoInvest/deploymentPlan";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Zap,
  DollarSign,
  PieChart,
  ArrowUpRight,
  Activity,
  Shield,
  Rocket,
  BarChart3,
  Clock,
  Target,
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#3B82F6", "#14B8A6"];

interface Allocation {
  id: string;
  asset_symbol: string;
  asset_name: string;
  allocation_type: string;
  target_percent: number;
  current_percent: number;
  value_usd: number;
  pnl_usd: number;
  pnl_percent: number;
  ai_score: number | null;
  ai_signal: string | null;
  ai_reasoning: string | null;
  is_active: boolean;
}

interface EngineState {
  id: string;
  engine_name: string;
  status: string;
  strategy: string;
  total_capital: number;
  total_deployed: number;
  total_profit: number;
  total_reinvested: number;
  reinvest_percent: number;
  growth_target_percent: number;
  stable_target_percent: number;
  ai_confidence_score: number | null;
  ai_market_regime: string | null;
  cycle_count: number;
  last_rebalance_at: string | null;
  last_ai_analysis_at: string | null;
}

interface AIProposal {
  market_regime: string;
  confidence_score: number;
  summary: string;
  allocations: Array<{
    symbol: string;
    name: string;
    allocation_type: string;
    target_percent: number;
    ai_score?: number;
    signal?: string;
    reasoning: string;
    stop_loss_percent?: number;
    take_profit_percent?: number;
  }>;
}

const AutoInvestPage = () => {
  const [engine, setEngine] = useState<EngineState | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [proposals, setProposals] = useState<AIProposal | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchEngine();
  }, []);

  const fetchEngine = async () => {
    setLoading(true);
    const user = await getCachedUser();

    if (!user) {
      setEngine(null);
      setAllocations([]);
      setLoading(false);
      return;
    }

    const { data: engines } = await supabase
      .from("auto_invest_engine")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (engines && engines.length > 0) {
      setEngine(engines[0] as unknown as EngineState);
      // Fetch allocations
      const { data: allocs } = await supabase
        .from("auto_invest_allocations")
        .select("*")
        .eq("engine_id", engines[0].id)
        .eq("is_active", true)
        .order("target_percent", { ascending: false });
      setAllocations((allocs || []) as unknown as Allocation[]);
    } else {
      setEngine(null);
      setAllocations([]);
    }
    setLoading(false);
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0 || !engine) {
      toast.error("Enter a valid deposit amount");
      return;
    }

    const { data, error } = await supabase.functions.invoke("auto-invest", {
      body: { action: "deposit", engine_id: engine.id, amount },
    });

    if (error) {
      toast.error("Deposit failed");
      return;
    }
    toast.success(`$${amount.toLocaleString()} deposited into engine`);
    setDepositAmount("");
    fetchEngine();
  };

  const handleAnalyze = async () => {
    if (!engine) return;
    setAnalyzing(true);
    setProposals(null);

    const { data, error } = await supabase.functions.invoke("auto-invest", {
      body: { action: "analyze", engine_id: engine.id },
    });

    if (error || !data?.proposals) {
      toast.error(data?.error || "AI analysis failed");
      setAnalyzing(false);
      return;
    }

    setProposals(data.proposals);
    toast.success("AI analysis complete");
    setAnalyzing(false);
    fetchEngine();
  };

  const handleExecute = async () => {
    if (!engine || !proposals) return;
    setExecuting(true);

    const { error } = await supabase.functions.invoke("auto-invest", {
      body: {
        action: "execute_allocations",
        engine_id: engine.id,
        allocations: proposals.allocations,
      },
    });

    if (error) {
      toast.error("Execution failed");
      setExecuting(false);
      return;
    }

    toast.success("Allocations executed — capital deployed");
    setProposals(null);
    setExecuting(false);
    fetchEngine();
  };

  const pieData = allocations.map((a) => ({ name: a.asset_symbol, value: a.value_usd }));
  const totalPnl = allocations.reduce((acc, a) => acc + (a.pnl_usd || 0), 0);
  const strategyLabel = formatEngineStrategy(engine?.strategy);
  const targetMixLabel = formatEngineMix({
    strategy: engine?.strategy,
    growthTargetPercent: engine?.growth_target_percent,
    stableTargetPercent: engine?.stable_target_percent,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24 flex items-center justify-center h-[60vh]">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl sm:text-3xl font-bold">Auto-Invest Engine</h1>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                <Brain className="w-3 h-3 mr-1" />
                QAQI Managed
              </Badge>
            </div>
            <p className="text-muted-foreground">
              AI-driven autonomous allocation • Configurable reinvestment • Adaptive rebalancing
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Beta feature. No guaranteed returns. Trading involves risk of loss.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleAnalyze}
              disabled={analyzing || !engine?.total_capital}
            >
              {analyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              {analyzing ? "Analyzing..." : "AI Analyze"}
            </Button>
          </div>
        </div>

        {/* Engine Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3 w-3" /> Total Capital
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(engine?.total_capital || 0).toLocaleString()}
              </div>
              <Badge
                variant="outline"
                className={`text-xs mt-1 ${
                  engine?.status === "active"
                    ? "bg-green-500/10 text-green-500 border-green-500/30"
                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                }`}
              >
                {engine?.status || "inactive"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Rocket className="h-3 w-3" /> Deployed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${(engine?.total_deployed || 0).toLocaleString()}
              </div>
              <Progress
                value={
                  engine?.total_capital
                    ? ((engine.total_deployed || 0) / engine.total_capital) * 100
                    : 0
                }
                className="h-1.5 mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Total Profit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(engine?.total_profit || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {(engine?.total_profit || 0) >= 0 ? "+" : ""}${(engine?.total_profit || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-xs sm:text-sm">
                {engine?.reinvest_percent}% reinvested
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Brain className="h-3 w-3" /> AI Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {engine?.ai_confidence_score ? `${engine.ai_confidence_score}%` : "—"}
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-[10px]">
                  {engine?.ai_market_regime || "awaiting"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Cycle #{engine?.cycle_count || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deposit Section */}
        <Card className="border-dashed border-2 border-primary/30">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <DollarSign className="h-5 w-5 text-primary" />
                <span className="font-medium whitespace-nowrap">Fund Engine</span>
                <Input
                  type="number"
                  placeholder="Enter USD amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="max-w-[200px]"
                />
              </div>
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(String(amt))}
                  >
                    ${amt}
                  </Button>
                ))}
                <Button onClick={handleDeposit} disabled={!depositAmount}>
                  <Zap className="h-4 w-4 mr-1" />
                  Deposit
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Proposals */}
        {proposals && (
          <Card className="border-purple-500/50 bg-purple-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  QAQI Recommendation
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {proposals.market_regime} market
                  </Badge>
                  <Badge variant="outline">
                    {proposals.confidence_score}% confidence
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{proposals.summary}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposals.allocations.map((alloc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{alloc.symbol}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {alloc.allocation_type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{alloc.reasoning}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{alloc.target_percent}%</span>
                    <p className="text-xs text-muted-foreground">
                      ~$
                      {(
                        (engine?.total_capital || 0) *
                        (alloc.target_percent / 100)
                      ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              ))}
              <Button
                className="w-full mt-4"
                onClick={handleExecute}
                disabled={executing}
              >
                {executing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Rocket className="h-4 w-4 mr-2" />
                )}
                {executing ? "Deploying Capital..." : "Execute Allocations"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Current Allocations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {allocations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" /> Portfolio Allocation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Active Positions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allocations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No Active Positions</p>
                  <p className="text-sm">
                    Fund the engine and run AI analysis to deploy capital
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allocations.map((alloc, i) => (
                    <div
                      key={alloc.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {alloc.asset_name}
                          </span>
                          <span className="font-medium text-sm">
                            ${alloc.value_usd.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{alloc.target_percent}%</span>
                          <span
                            className={
                              alloc.pnl_usd >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            }
                          >
                            {alloc.pnl_usd >= 0 ? "+" : ""}
                            ${alloc.pnl_usd.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Engine Info */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last Analysis:{" "}
                {engine?.last_ai_analysis_at
                  ? new Date(engine.last_ai_analysis_at).toLocaleString()
                  : "Never"}
              </div>
              <div className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                Last Rebalance:{" "}
                {engine?.last_rebalance_at
                  ? new Date(engine.last_rebalance_at).toLocaleString()
                  : "Never"}
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Strategy: {strategyLabel}
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Target Mix: {targetMixLabel}
              </div>
              <div className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Reinvest: {engine?.reinvest_percent}%
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AutoInvestPage;
