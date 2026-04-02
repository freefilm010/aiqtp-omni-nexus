import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Square, BarChart3, TrendingUp, TrendingDown, Activity, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import BacktestHistoricalInsights from "./BacktestHistoricalInsights";
import HistoricalEventsChart from "./HistoricalEventsChart";
import { TradeCheckpointSystem } from "@/lib/infra/tradeCheckpoint";

interface StrategyRow {
  id: string;
  name: string;
  backtest_count: number | null;
  profitability_score: number | null;
  consistency_score: number | null;
  is_graduated: boolean | null;
  status: string;
}

interface TrainingStats {
  passRate: number;
  avgProfitability: number;
  avgConsistency: number;
  avgWinRate: number;
  avgSharpe: number;
  avgDrawdown: number;
  passedCount: number;
}

const TOTAL_CYCLES = 10_000;
const BATCH_SIZE = 500;

const StrategyBacktest = () => {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<StrategyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<Record<string, TrainingStats>>({});
  const abortRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    fetchStrategies();
  }, [user]);

  const fetchStrategies = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ai_strategies")
      .select("id, name, backtest_count, profitability_score, consistency_score, is_graduated, status")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setStrategies(data || []);

    // Seed progress from existing counts
    const prog: Record<string, number> = {};
    (data || []).forEach((s) => {
      prog[s.id] = Math.min(((s.backtest_count || 0) / TOTAL_CYCLES) * 100, 100);
    });
    setProgress(prog);
    setLoading(false);
  };

  const runTraining = async (strategyId: string) => {
    if (runningId) {
      toast.error("Training already in progress");
      return;
    }
    abortRef.current = false;
    setRunningId(strategyId);
    toast.info("Auto-backtest started — running 10,000 cycles in batches of 500");

    let completed = progress[strategyId]
      ? Math.round((progress[strategyId] / 100) * TOTAL_CYCLES)
      : 0;

    while (completed < TOTAL_CYCLES && !abortRef.current) {
      try {
        const { data, error } = await supabase.functions.invoke("train-strategy", {
          body: { strategyId, batchSize: BATCH_SIZE },
        });

        if (error) throw error;
        if (!data?.success) throw new Error(data?.error || "Training failed");

        completed = data.totalCompleted;
        const pct = Math.min((completed / TOTAL_CYCLES) * 100, 100);
        setProgress((p) => ({ ...p, [strategyId]: pct }));

        if (data.stats) {
          setStats((s) => ({ ...s, [strategyId]: data.stats }));
        }

        if (data.completed) {
          if (data.graduated) {
            toast.success(`🎓 Strategy GRADUATED — Pass rate: ${data.stats.passRate.toFixed(1)}%`);
          } else {
            toast.warning(`Training complete — Pass rate ${data.stats.passRate.toFixed(1)}% (needs ≥80%)`);
          }
          break;
        }
      } catch (err: any) {
        toast.error(`Training error: ${err.message}`);
        break;
      }
    }

    if (abortRef.current) toast.info("Training stopped by user");
    setRunningId(null);
    fetchStrategies();
  };

  const stopTraining = () => {
    abortRef.current = true;
  };

  const runAll = async () => {
    const unfinished = strategies.filter(
      (s) => !s.is_graduated && (s.backtest_count || 0) < TOTAL_CYCLES
    );
    if (!unfinished.length) {
      toast.info("All strategies are already trained or graduated");
      return;
    }
    for (const s of unfinished) {
      if (abortRef.current) break;
      await runTraining(s.id);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Sign in to auto-backtest your strategies</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Auto-Backtest Engine</h3>
              <p className="text-xs text-muted-foreground">
                10,000 cycles • 500/batch • Graduate at ≥77% profitability & consistency • Rent-to-earn
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchStrategies} disabled={!!runningId}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            {runningId ? (
              <Button variant="destructive" size="sm" onClick={stopTraining}>
                <Square className="h-4 w-4 mr-1" /> Stop
              </Button>
            ) : (
              <Button size="sm" onClick={runAll}>
                <Play className="h-4 w-4 mr-1" /> Train All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Strategy List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Loading strategies…</CardContent>
        </Card>
      ) : strategies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No strategies found — create one in the Builder tab first.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {strategies.map((s) => {
            const pct = progress[s.id] || 0;
            const cycles = Math.round((pct / 100) * TOTAL_CYCLES);
            const st = stats[s.id];
            const isRunning = runningId === s.id;
            const isDone = pct >= 100;

            return (
              <Card key={s.id} className={isRunning ? "border-primary/50 shadow-md" : ""}>
                <CardContent className="py-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{s.name}</span>
                      {s.is_graduated && <Badge className="bg-green-600 text-white">Graduated</Badge>}
                      {isRunning && (
                        <Badge variant="outline" className="animate-pulse border-primary text-primary">
                          <Activity className="h-3 w-3 mr-1" /> Training
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={isDone ? "outline" : "default"}
                      onClick={() => runTraining(s.id)}
                      disabled={!!runningId || isDone}
                    >
                      {isDone ? "Complete" : <><Play className="h-3 w-3 mr-1" /> Train</>}
                    </Button>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{cycles.toLocaleString()} / {TOTAL_CYCLES.toLocaleString()} cycles</span>
                      <span>{pct.toFixed(1)}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>

                  {/* Stats Grid */}
                  {(st || s.profitability_score != null) && (
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      <StatBox
                        label="Pass Rate"
                        value={st ? `${st.passRate.toFixed(1)}%` : "—"}
                        good={(st?.passRate ?? 0) >= 80}
                      />
                      <StatBox
                        label="Profit"
                        value={st ? `${st.avgProfitability.toFixed(1)}%` : s.profitability_score != null ? `${s.profitability_score.toFixed(1)}%` : "—"}
                        good={(st?.avgProfitability ?? s.profitability_score ?? 0) >= 80}
                      />
                      <StatBox
                        label="Win Rate"
                        value={st ? `${st.avgWinRate.toFixed(1)}%` : "—"}
                        good={(st?.avgWinRate ?? 0) >= 65}
                      />
                      <StatBox
                        label="Sharpe"
                        value={st ? st.avgSharpe.toFixed(2) : "—"}
                        good={(st?.avgSharpe ?? 0) >= 1}
                      />
                      <StatBox
                        label="Drawdown"
                        value={st ? `${st.avgDrawdown.toFixed(1)}%` : "—"}
                        good={(st?.avgDrawdown ?? 100) <= 15}
                      />
                      <StatBox
                        label="Consistency"
                        value={st ? `${st.avgConsistency.toFixed(1)}%` : s.consistency_score != null ? `${s.consistency_score.toFixed(1)}%` : "—"}
                        good={(st?.avgConsistency ?? s.consistency_score ?? 0) >= 85}
                      />
                    </div>
                  )}

                  {/* Historical Insights Panel */}
                  {(st || pct > 0) && (
                    <BacktestHistoricalInsights
                      strategyId={s.id}
                      strategyName={s.name}
                      trainingStats={st ? {
                        avgProfitability: st.avgProfitability,
                        avgWinRate: st.avgWinRate,
                        avgDrawdown: st.avgDrawdown,
                        avgConsistency: st.avgConsistency,
                        passRate: st.passRate,
                      } : null}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Health Cycle Stats */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="h-4 w-4 text-primary" />
            <div>
              <h4 className="text-sm font-semibold text-foreground">200-Trade Health Checkpoint Tracker</h4>
              <p className="text-[10px] text-muted-foreground">Indefinite cycle — audits stale, stuck, underwater & illiquid positions every 200 trades</p>
            </div>
          </div>
          <HealthCycleDisplay />
        </CardContent>
      </Card>

      {/* Interactive Historical Events Chart */}
      <HistoricalEventsChart />
    </div>
  );
};

const StatBox = ({ label, value, good }: { label: string; value: string; good: boolean }) => (
  <div className="rounded-md bg-muted/50 p-2">
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className={`text-sm font-bold ${good ? "text-green-500" : "text-muted-foreground"}`}>
      {value}
    </p>
  </div>
);

// Singleton checkpoint for display
const globalCheckpoint = new TradeCheckpointSystem();

const HealthCycleDisplay = () => {
  const stats = globalCheckpoint.stats;
  const history = globalCheckpoint.history;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[10px] text-muted-foreground">Cycles Completed</p>
        <p className="text-sm font-bold text-foreground">{stats.checkpointsCompleted}</p>
      </div>
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[10px] text-muted-foreground">Lifetime Trades</p>
        <p className="text-sm font-bold text-foreground">{stats.lifetimeTradeCount.toLocaleString()}</p>
      </div>
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[10px] text-muted-foreground">Since Checkpoint</p>
        <p className="text-sm font-bold text-foreground">{stats.tradesSinceCheckpoint} / 200</p>
      </div>
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[10px] text-muted-foreground">Next In</p>
        <p className="text-sm font-bold text-primary">{stats.nextCheckpointIn} trades</p>
      </div>
      <div className="rounded-md bg-muted/50 p-2">
        <p className="text-[10px] text-muted-foreground">Status</p>
        <p className={`text-sm font-bold ${stats.isPaused ? 'text-yellow-500' : 'text-green-500'}`}>
          {stats.isPaused ? '⏸ Paused' : '▶ Active'}
        </p>
      </div>
    </div>
  );
};

export default StrategyBacktest;
