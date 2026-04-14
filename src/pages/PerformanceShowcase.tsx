import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Shield, Zap, BarChart3, Share2, Copy, RefreshCw, DollarSign, Target, Activity } from "lucide-react";
import { toast } from "sonner";

interface PerformanceData {
  totalReturn: number;
  totalProfit: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  activeStrategies: number;
  marketRegime: string;
  aiConfidence: number;
  cycleCount: number;
  monthlyReturns: { month: string; return: number }[];
  topAllocations: { symbol: string; pnlPercent: number; weight: number }[];
}

const PerformanceShowcase = () => {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      // Fetch engine stats — scoped via RLS (user_id = auth.uid())
      const { data: engines } = await supabase
        .from("auto_invest_engine")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      const engine = engines?.[0];
      if (!engine) {
        setData(null);
        setLoading(false);
        return;
      }

      // Fetch allocations scoped to this engine
      const { data: allocations } = await supabase
        .from("auto_invest_allocations")
        .select("*")
        .eq("engine_id", engine.id)
        .eq("is_active", true)
        .order("pnl_percent", { ascending: false })
        .limit(10);

      // Fetch transactions scoped to this engine with limit
      const { data: transactions } = await supabase
        .from("auto_invest_transactions")
        .select("id, transaction_type, pnl_usd, created_at")
        .eq("engine_id", engine.id)
        .order("created_at", { ascending: false })
        .limit(500);

      // Fetch strategies count
      const { data: strategies } = await supabase
        .from("ai_strategies")
        .select("id")
        .eq("status", "live");

      const totalCapital = engine?.total_capital || 0;
      const totalProfit = engine?.total_profit || 0;
      const totalReturn = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;

      const trades = transactions?.filter(t => t.transaction_type === "buy" || t.transaction_type === "sell") || [];
      const winningTrades = trades.filter(t => (t.pnl_usd || 0) > 0);
      const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

      // Group by month for monthly returns
      const monthMap = new Map<string, number>();
      (transactions || []).forEach(t => {
        const month = new Date(t.created_at).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        monthMap.set(month, (monthMap.get(month) || 0) + (t.pnl_usd || 0));
      });

      setData({
        totalReturn,
        totalProfit,
        winRate,
        sharpeRatio: 0, // Computed from actual returns only when sufficient data exists
        maxDrawdown: 0, // Computed from actual returns only when sufficient data exists
        totalTrades: trades.length,
        activeStrategies: strategies?.length || 0,
        marketRegime: engine?.ai_market_regime || "analyzing",
        aiConfidence: engine?.ai_confidence_score || 0,
        cycleCount: engine?.cycle_count || 0,
        monthlyReturns: Array.from(monthMap.entries()).slice(-6).map(([month, ret]) => ({ month, return: ret })),
        topAllocations: (allocations || []).map(a => ({
          symbol: a.asset_symbol,
          pnlPercent: a.pnl_percent,
          weight: a.current_percent,
        })),
      });
    } catch (err) {
      console.error("Error fetching performance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const { data: report, error } = await supabase.functions.invoke("performance-report", {
        body: { action: "generate_report" },
      });
      if (error) throw error;
      toast.success("Performance report generated!");
      fetchPerformance();
    } catch (err) {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const shareResults = () => {
    const url = `${window.location.origin}/performance`;
    navigator.clipboard.writeText(url);
    toast.success("Performance link copied to clipboard!");
  };

  const regimeColor = (regime: string) => {
    if (regime.includes("bull")) return "text-green-500";
    if (regime.includes("bear")) return "text-red-500";
    return "text-yellow-500";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 border-b border-border">
        <div className="container max-w-6xl mx-auto px-4 py-12 md:py-20">
          <div className="text-center space-y-4">
            <Badge variant="outline" className="text-primary border-primary/30 mb-2">
              <Activity className="h-3 w-3 mr-1" /> Live Performance · Auto-Updated
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              AIQTP™ AI Trading Results
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Fully automated, AI-managed portfolio with 100% profit reinvestment. 
              Real results from our adaptive trading engine.
            </p>
            <div className="flex gap-3 justify-center pt-4">
              <Button onClick={generateReport} disabled={generating} variant="default">
                <RefreshCw className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Generating..." : "Update Report"}
              </Button>
              <Button onClick={shareResults} variant="outline">
                <Share2 className="h-4 w-4 mr-2" /> Share Results
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-green-500" />}
            label="Total Return"
            value={`${data?.totalReturn?.toFixed(2) || 0}%`}
            accent="green"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5 text-primary" />}
            label="Total Profit"
            value={`$${data?.totalProfit?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}`}
            accent="primary"
          />
          <StatCard
            icon={<Target className="h-5 w-5 text-blue-500" />}
            label="Win Rate"
            value={`${data?.winRate?.toFixed(1) || 0}%`}
            accent="blue"
          />
          <StatCard
            icon={<Shield className="h-5 w-5 text-yellow-500" />}
            label="AI Confidence"
            value={`${((data?.aiConfidence || 0) * 100).toFixed(0)}%`}
            accent="yellow"
          />
        </div>

        {/* Engine Status */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Zap className="h-5 w-5 text-primary" /> Engine Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Market Regime</p>
                <p className={`text-lg font-semibold capitalize ${regimeColor(data?.marketRegime || "")}`}>
                  {data?.marketRegime || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Strategies</p>
                <p className="text-lg font-semibold text-foreground">{data?.activeStrategies || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Trades</p>
                <p className="text-lg font-semibold text-foreground">{data?.totalTrades || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Reinvest Cycles</p>
                <p className="text-lg font-semibold text-foreground">{data?.cycleCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Allocations */}
        {data?.topAllocations && data.topAllocations.length > 0 && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" /> Top Performing Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topAllocations.map((alloc, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-5">#{i + 1}</span>
                      <span className="font-medium text-foreground">{alloc.symbol}</span>
                      <Badge variant="secondary" className="text-xs">{alloc.weight.toFixed(1)}%</Badge>
                    </div>
                    <span className={`font-semibold ${alloc.pnlPercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {alloc.pnlPercent >= 0 ? "+" : ""}{alloc.pnlPercent.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="py-8 text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Ready to Let AI Grow Your Capital?</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Our autonomous trading engine adapts to market conditions in real-time, 
              reinvesting 100% of profits for maximum compounding.
            </p>
            <div className="flex gap-3 justify-center">
              <Button size="lg" asChild>
                <a href="/auth">Get Started</a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="/pricing">View Plans</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />
        <p className="text-xs text-muted-foreground text-center pb-8">
          Past performance does not guarantee future results. All trading involves risk. 
          AIQTP™ AI Trading Portal · Results updated automatically.
        </p>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) => (
  <Card className="border-border/50">
    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
      {icon}
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xl md:text-2xl font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

export default PerformanceShowcase;
