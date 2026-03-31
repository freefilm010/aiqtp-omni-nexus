import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BarChart3, Target, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

interface CompoundAnalyticsProps {
  engineId: string | null;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const CompoundAnalytics = ({ engineId }: CompoundAnalyticsProps) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [strategyBreakdown, setStrategyBreakdown] = useState<any[]>([]);

  const loadAnalytics = useCallback(async () => {
    if (!engineId) return;
    const { data } = await supabase
      .from("auto_invest_transactions")
      .select("amount_usd, asset_symbol, ai_reason, created_at, status")
      .eq("engine_id", engineId)
      .order("created_at", { ascending: true })
      .limit(500) as any;

    if (!data?.length) return;
    setTransactions(data);

    // Build cumulative growth curve
    let cumulative = 0;
    const growth = data.map((t: any) => {
      cumulative += Number(t.amount_usd) || 0;
      return {
        date: new Date(t.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        deployed: parseFloat(cumulative.toFixed(2)),
      };
    });
    setGrowthData(growth);

    // Strategy attribution
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

  useEffect(() => { loadAnalytics(); }, [loadAnalytics]);

  // Realtime: auto-refresh when new compound transactions arrive
  useEffect(() => {
    if (!engineId) return;
    const channel = supabase
      .channel('compound-analytics-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'auto_invest_transactions' },
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
            Compound Growth Curve
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
              <Area type="monotone" dataKey="deployed" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} name="Deployed" />
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
              Deployment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-xs font-medium">Total Deployed</p>
              <p className="font-bold text-sm">${growthData.length > 0 ? growthData[growthData.length - 1].deployed.toFixed(2) : '0.00'}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/20">
              <p className="text-xs font-medium">Transactions</p>
              <p className="font-bold text-sm">{transactions.length}</p>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-2">
              <Zap className="h-3 w-3" />
              Actual deployment records only • not withdrawable cash
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompoundAnalytics;
