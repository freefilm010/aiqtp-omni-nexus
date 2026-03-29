import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  BarChart3, TrendingUp, Shield, Target, Award, Plus, X, ArrowUpDown,
  Percent, DollarSign, Clock, Zap, CheckCircle, AlertTriangle
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line
} from "recharts";

interface StrategyData {
  id: string;
  name: string;
  profitability_score: number | null;
  consistency_score: number | null;
  backtest_count: number | null;
  total_rentals: number | null;
  rental_price_monthly: number | null;
  is_graduated: boolean | null;
  status: string;
  created_at: string;
  graduation_date: string | null;
  entry_rules: any;
  exit_rules: any;
  risk_parameters: any;
}

const METRIC_LABELS: Record<string, string> = {
  profitability_score: "Profitability",
  consistency_score: "Consistency",
  backtest_count: "Backtests",
  total_rentals: "Rentals",
  rental_price_monthly: "Monthly Price",
};

const COLORS = [
  "hsl(224, 100%, 58%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
];

const StrategyComparison = () => {
  const { user } = useAuth();
  const [allStrategies, setAllStrategies] = useState<StrategyData[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStrategies = async () => {
      const { data, error } = await supabase
        .from("ai_strategies")
        .select("id, name, profitability_score, consistency_score, backtest_count, total_rentals, rental_price_monthly, is_graduated, status, created_at, graduation_date, entry_rules, exit_rules, risk_parameters")
        .order("profitability_score", { ascending: false });

      if (!error && data) setAllStrategies(data as StrategyData[]);
      setLoading(false);
    };
    fetchStrategies();
  }, []);

  const selected = useMemo(
    () => allStrategies.filter(s => selectedIds.includes(s.id)),
    [allStrategies, selectedIds]
  );

  const addStrategy = (id: string) => {
    if (selectedIds.length >= 4) return;
    if (!selectedIds.includes(id)) setSelectedIds(prev => [...prev, id]);
  };

  const removeStrategy = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  // Radar chart data
  const radarData = useMemo(() => {
    const metrics = [
      { key: "profitability_score", label: "Profitability", max: 100 },
      { key: "consistency_score", label: "Consistency", max: 100 },
      { key: "backtest_count", label: "Backtests", max: 50 },
      { key: "total_rentals", label: "Popularity", max: 20 },
    ];

    return metrics.map(m => {
      const row: any = { metric: m.label };
      selected.forEach((s, i) => {
        const raw = (s as any)[m.key] ?? 0;
        row[s.name] = Math.min((raw / m.max) * 100, 100);
      });
      return row;
    });
  }, [selected]);

  // Bar chart data for direct comparison
  const barData = useMemo(() => {
    return selected.map((s, i) => ({
      name: s.name.length > 15 ? s.name.slice(0, 15) + "…" : s.name,
      Profitability: s.profitability_score ?? 0,
      Consistency: s.consistency_score ?? 0,
      Backtests: s.backtest_count ?? 0,
      fill: COLORS[i],
    }));
  }, [selected]);

  const getGrade = (score: number | null) => {
    if (!score) return { grade: "N/A", color: "text-muted-foreground" };
    if (score >= 95) return { grade: "S", color: "text-yellow-400" };
    if (score >= 90) return { grade: "A+", color: "text-green-400" };
    if (score >= 85) return { grade: "A", color: "text-green-500" };
    if (score >= 75) return { grade: "B", color: "text-blue-400" };
    if (score >= 60) return { grade: "C", color: "text-yellow-500" };
    return { grade: "D", color: "text-red-400" };
  };

  const winner = useMemo(() => {
    if (selected.length < 2) return null;
    return selected.reduce((best, s) =>
      (s.profitability_score ?? 0) > (best.profitability_score ?? 0) ? s : best
    );
  }, [selected]);

  return (
    <div className="space-y-6">
      {/* Strategy Selector */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowUpDown className="h-5 w-5 text-primary" />
            Compare Strategies (up to 4)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 items-center">
            {selected.map((s, i) => (
              <Badge
                key={s.id}
                variant="secondary"
                className="text-sm py-1.5 px-3 gap-2"
                style={{ borderLeft: `3px solid ${COLORS[i]}` }}
              >
                {s.name}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => removeStrategy(s.id)}
                />
              </Badge>
            ))}
            {selectedIds.length < 4 && (
              <Select onValueChange={addStrategy}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Add strategy…" />
                </SelectTrigger>
                <SelectContent>
                  {allStrategies
                    .filter(s => !selectedIds.includes(s.id))
                    .map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.profitability_score?.toFixed(0) ?? "?"})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {selected.length < 2 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-16 text-center">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select at least 2 strategies to compare</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Winner Banner */}
          {winner && (
            <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-500/5 border-yellow-500/30">
              <CardContent className="py-3 flex items-center gap-3">
                <Award className="h-5 w-5 text-yellow-500" />
                <span className="font-medium text-foreground">
                  Top Performer: <strong className="text-yellow-500">{winner.name}</strong>
                  {" "}— {winner.profitability_score?.toFixed(1)}% profitability
                </span>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="charts">Visual Compare</TabsTrigger>
              <TabsTrigger value="details">Detailed Metrics</TabsTrigger>
            </TabsList>

            {/* Overview Table */}
            <TabsContent value="overview">
              <Card className="bg-card border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-muted-foreground font-medium">Metric</th>
                        {selected.map((s, i) => (
                          <th key={s.id} className="text-center p-4 font-medium" style={{ color: COLORS[i] }}>
                            {s.name.length > 18 ? s.name.slice(0, 18) + "…" : s.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Profitability", key: "profitability_score", suffix: "%", icon: TrendingUp },
                        { label: "Consistency", key: "consistency_score", suffix: "%", icon: Target },
                        { label: "Backtests Run", key: "backtest_count", suffix: "", icon: BarChart3 },
                        { label: "Active Rentals", key: "total_rentals", suffix: "", icon: Zap },
                        { label: "Monthly Price", key: "rental_price_monthly", suffix: "", icon: DollarSign, prefix: "$" },
                        { label: "Graduated", key: "is_graduated", suffix: "", icon: Award },
                        { label: "Status", key: "status", suffix: "", icon: Shield },
                      ].map(row => {
                        const vals = selected.map(s => (s as any)[row.key]);
                        const numVals = vals.filter(v => typeof v === "number");
                        const bestVal = row.key !== "rental_price_monthly"
                          ? Math.max(...numVals)
                          : Math.min(...numVals.filter(v => v > 0));

                        return (
                          <tr key={row.key} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-4 flex items-center gap-2 text-muted-foreground">
                              <row.icon className="h-4 w-4" />
                              {row.label}
                            </td>
                            {selected.map((s, i) => {
                              const val = (s as any)[row.key];
                              const isBest = typeof val === "number" && val === bestVal && numVals.length > 1;

                              let display: string;
                              if (row.key === "is_graduated") {
                                display = val ? "✅ Yes" : "❌ No";
                              } else if (typeof val === "number") {
                                display = `${row.prefix ?? ""}${val.toFixed(row.suffix === "%" ? 1 : 0)}${row.suffix}`;
                              } else {
                                display = val ?? "—";
                              }

                              return (
                                <td key={s.id} className={`p-4 text-center font-medium ${isBest ? "text-green-400" : "text-foreground"}`}>
                                  {display}
                                  {isBest && <span className="ml-1 text-xs">👑</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      {/* Grade Row */}
                      <tr className="border-b border-border/50 bg-muted/20">
                        <td className="p-4 flex items-center gap-2 font-medium text-foreground">
                          <Award className="h-4 w-4" />
                          Overall Grade
                        </td>
                        {selected.map((s) => {
                          const combined = ((s.profitability_score ?? 0) + (s.consistency_score ?? 0)) / 2;
                          const { grade, color } = getGrade(combined);
                          return (
                            <td key={s.id} className={`p-4 text-center text-2xl font-black ${color}`}>
                              {grade}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            {/* Charts */}
            <TabsContent value="charts">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Performance Radar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="hsl(var(--border))" />
                        <PolarAngleAxis dataKey="metric" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                        {selected.map((s, i) => (
                          <Radar
                            key={s.id}
                            name={s.name}
                            dataKey={s.name}
                            stroke={COLORS[i]}
                            fill={COLORS[i]}
                            fillOpacity={0.15}
                            strokeWidth={2}
                          />
                        ))}
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Bar */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Score Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="Profitability" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Consistency" fill="hsl(224, 100%, 58%)" radius={[4, 4, 0, 0]} />
                        <Legend />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Detailed Metrics */}
            <TabsContent value="details">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {selected.map((s, i) => {
                  const combined = ((s.profitability_score ?? 0) + (s.consistency_score ?? 0)) / 2;
                  const { grade, color } = getGrade(combined);
                  const riskParams = s.risk_parameters as any;

                  return (
                    <Card key={s.id} className="bg-card border-border" style={{ borderTop: `3px solid ${COLORS[i]}` }}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center justify-between">
                          <span className="truncate">{s.name}</span>
                          <span className={`text-xl font-black ${color}`}>{grade}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profitability</span>
                          <span className="font-medium text-green-400">{s.profitability_score?.toFixed(1) ?? "—"}%</span>
                        </div>
                        <Progress value={s.profitability_score ?? 0} className="h-1.5" />

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Consistency</span>
                          <span className="font-medium">{s.consistency_score?.toFixed(1) ?? "—"}%</span>
                        </div>
                        <Progress value={s.consistency_score ?? 0} className="h-1.5" />

                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Backtests</span>
                          <span className="font-medium">{s.backtest_count ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rentals</span>
                          <span className="font-medium">{s.total_rentals ?? 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant={s.is_graduated ? "default" : "secondary"} className="text-xs">
                            {s.is_graduated ? "Graduated" : s.status}
                          </Badge>
                        </div>
                        {riskParams && (
                          <>
                            <div className="border-t border-border pt-2 mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Risk Parameters</p>
                            </div>
                            {riskParams.stopLoss && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Stop Loss</span>
                                <span className="text-red-400">{riskParams.stopLoss}%</span>
                              </div>
                            )}
                            {riskParams.takeProfit && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Take Profit</span>
                                <span className="text-green-400">{riskParams.takeProfit}%</span>
                              </div>
                            )}
                            {riskParams.maxPositionSize && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Max Position</span>
                                <span>{riskParams.maxPositionSize}%</span>
                              </div>
                            )}
                          </>
                        )}
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-muted-foreground">Created</span>
                          <span>{new Date(s.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default StrategyComparison;
