import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Target, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

interface CompoundAnalyticsProps {
  engineId: string | null;
}

interface EngineSummary {
  total_capital: number;
  total_deployed: number;
  total_profit: number;
  total_reinvested: number;
  cycle_count: number;
}

interface AnalyticsTransaction {
  amount_usd: number | null;
  asset_symbol: string | null;
  ai_reason: string | null;
  created_at: string;
  status: string;
  transaction_type: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const CompoundAnalytics = ({ engineId }: CompoundAnalyticsProps) => {
  const [transactions, setTransactions] = useState<AnalyticsTransaction[]>([]);
  const [growthData, setGrowthData] = useState<Array<{ date: string; deployed: number }>>([]);
  const [strategyBreakdown, setStrategyBreakdown] = useState<Array<{ name: string; value: number }>>([]);
  const [engineSummary, setEngineSummary] = useState<EngineSummary | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!engineId) return;

    const [{ data: txData }, { data: engineData }] = await Promise.all([
      supabase
        .from("auto_invest_transactions")
        .select("amount_usd, asset_symbol, ai_reason, created_at, status, transaction_type")
        .eq("engine_id", engineId)
        .eq("transaction_type", "reinvest")
        .eq("status", "completed")
        .order("created_at", { ascending: true }),
      supabase
        .from("auto_invest_engine")
        .select("total_capital, total_deployed, total_profit, total_reinvested, cycle_count")
        .eq("id", engineId)
        .maybeSingle(),
    ]);

    const data = (txData || []) as AnalyticsTransaction[];
    setTransactions(data);
    setEngineSummary(engineData || null);

    const dailyAmounts = new Map<string, number>();
    for (const tx of data) {
      const day = new Date(tx.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      dailyAmounts.set(day, (dailyAmounts.get(day) || 0) + (Number(tx.amount_usd) || 0));
    }

    let cumulative = 0;
    const growth = Array.from(dailyAmounts.entries()).map(([date, amount]) => {
      cumulative += amount;
      return {
        date,
        deployed: parseFloat(cumulative.toFixed(2)),
      };
    });
    setGrowthData(growth);

    const stratMap: Record<string, number> = {};
    for (const t of data) {
      const reason = t.ai_reason || "Unknown";
      const stratName = reason.includes("→") ? reason.split("→")[1]?.trim().split("(")[0]?.trim() : reason;
      stratMap[stratName] = (stratMap[stratName] || 0) + (Number(t.amount_usd) || 0);
    }

    setStrategyBreakdown(
      Object.entries(stratMap).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) }))
    );

  }, [engineId]);

  const derivedReinvestedTotal = growthData.length > 0 ? growthData[growthData.length - 1].deployed : 0;
  const displayedCycleCount = Math.max(engineSummary?.cycle_count ?? 0, transactions.length);

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // Realtime subscription for instant auto-invest transaction updates
  useEffect(() => {
    if (!engineId) return;
    const channel = supabase
      .channel(`compound-analytics-${engineId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auto_invest_transactions", filter: `engine_id=eq.${engineId}` },
        () => { loadAnalytics(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [engineId, loadAnalytics]);

  if (!engineId || transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Compound analytics will appear after your first auto-compound deployment.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Growth Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4 text-primary" />
            Reinvested Capital Curve
            <Badge variant="secondary" className="ml-auto text-[9px]">{transactions.length} txns</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} className="fill-muted-foreground" />
              <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ fontSize: 11, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Area type="monotone" dataKey="deployed" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Reinvested" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strategy Attribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4 text-primary" />
              Strategy Attribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={strategyBreakdown} cx="50%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" nameKey="name" paddingAngle={2}>
                  {strategyBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 10, backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} formatter={(v: number) => `$${v.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 mt-2">
              {strategyBreakdown.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate max-w-[120px]">{s.name}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">${s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Projected Earnings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary" />
              Engine Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-xs font-medium">Total Reinvested</p>
              <p className="font-bold text-sm">${derivedReinvestedTotal.toFixed(2)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-xs font-medium">Engine Profit</p>
              <p className="font-bold text-sm">${(engineSummary?.total_profit ?? 0).toFixed(2)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-xs font-medium">Cycles</p>
              <p className="font-bold text-sm">{displayedCycleCount}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2">
              <Zap className="h-3 w-3" />
              Compounding works by logging reinvest buys and adding that quantity into live holdings
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompoundAnalytics;
