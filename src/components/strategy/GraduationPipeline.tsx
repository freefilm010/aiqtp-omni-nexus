import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STRATEGY_FEES } from "@/lib/fees/platformFees";
import { toast } from "sonner";
import {
  Award, Play, CheckCircle, XCircle, Clock, TrendingUp, Target,
  BarChart3, Zap, Loader2, AlertTriangle, Wand2, RotateCcw, Rocket
} from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  status: string;
  profitability_score: number | null;
  consistency_score: number | null;
  backtest_count: number;
  is_graduated: boolean;
  is_available_for_rent: boolean;
  entry_rules: any;
  exit_rules: any;
  risk_parameters: any;
}

const PROFITABILITY_THRESHOLD = STRATEGY_FEES.graduationThreshold;
const CONSISTENCY_THRESHOLD = STRATEGY_FEES.consistencyThreshold;
const MIN_WIN_RATE = 65;
const MAX_DRAWDOWN = 15;
const TOTAL_CYCLES = 10000;
const BATCH_SIZE = 200;

const GraduationPipeline = () => {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState<string | null>(null);
  const [training, setTraining] = useState<string | null>(null);
  const [trainingProgress, setTrainingProgress] = useState<Record<string, { completed: number; stats: any }>>({});

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_strategies')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrategies((data as Strategy[]) || []);

      // Fetch existing test counts for progress
      const progressMap: Record<string, { completed: number; stats: any }> = {};
      for (const s of data || []) {
        const { count } = await supabase
          .from('graduation_tests')
          .select('*', { count: 'exact', head: true })
          .eq('strategy_id', s.id);
        progressMap[s.id] = { completed: count || 0, stats: null };
      }
      setTrainingProgress(progressMap);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const enhanceStrategy = async (strategyId: string) => {
    setEnhancing(strategyId);
    try {
      const { data, error } = await supabase.functions.invoke('enhance-strategy', {
        body: { strategyId }
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success("Strategy enhanced by AI!", {
        description: data.enhancement_notes?.slice(0, 2).join(', ') || 'Improvements applied'
      });
      fetchData();
    } catch (err: any) {
      console.error('Enhance error:', err);
      toast.error(err.message || "Enhancement failed");
    } finally {
      setEnhancing(null);
    }
  };

  const runTrainingBatch = useCallback(async (strategyId: string) => {
    setTraining(strategyId);
    let isComplete = false;

    try {
      while (!isComplete) {
        const { data, error } = await supabase.functions.invoke('train-strategy', {
          body: { strategyId, batchSize: BATCH_SIZE }
        });

        if (error) throw error;
        if (data?.error) {
          toast.error(data.error);
          return;
        }

        setTrainingProgress(prev => ({
          ...prev,
          [strategyId]: {
            completed: data.totalCompleted,
            stats: data.stats,
          }
        }));

        if (data.completed) {
          isComplete = true;
          if (data.graduated) {
            toast.success("🎉 Strategy GRADUATED! Now available for rental!", { duration: 6000 });
          } else {
            toast.warning("Training complete but strategy didn't meet graduation thresholds. Consider enhancing and re-training.");
          }
          fetchData();
        } else {
          toast.info(`Training: ${data.totalCompleted}/${TOTAL_CYCLES} cycles completed`);
          // Small delay between batches
          await new Promise(r => setTimeout(r, 500));
        }
      }
    } catch (err: any) {
      console.error('Training error:', err);
      toast.error(err.message || "Training failed");
    } finally {
      setTraining(null);
    }
  }, []);

  const resetTraining = async (strategyId: string) => {
    try {
      // Delete existing tests (via edge function or direct)
      const { error } = await supabase
        .from('graduation_tests')
        .delete()
        .eq('strategy_id', strategyId);

      if (error) throw error;

      await supabase.from('ai_strategies').update({
        profitability_score: null,
        consistency_score: null,
        backtest_count: 0,
        is_graduated: false,
        graduation_date: null,
        status: 'draft',
      }).eq('id', strategyId);

      setTrainingProgress(prev => ({ ...prev, [strategyId]: { completed: 0, stats: null } }));
      toast.success("Training reset. Ready for re-training.");
      fetchData();
    } catch (err: any) {
      toast.error("Failed to reset: " + err.message);
    }
  };

  const autoEnhanceAndTrain = async (strategyId: string) => {
    toast.info("Starting auto-pipeline: Enhance → Train → Graduate");
    await enhanceStrategy(strategyId);
    await runTrainingBatch(strategyId);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading strategies...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Requirements Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Graduation Pipeline — 10,000 Cycle Training
          </CardTitle>
          <CardDescription>
            Strategies auto-enhanced by AI → trained through 10K simulated cycles with real market data patterns → graduated if meeting thresholds → auto-listed for rental
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/50 border">
              <TrendingUp className="h-6 w-6 mx-auto text-green-500 mb-1" />
              <p className="font-bold">{PROFITABILITY_THRESHOLD}%+</p>
              <p className="text-xs text-muted-foreground">Profitability</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border">
              <Target className="h-6 w-6 mx-auto text-blue-500 mb-1" />
              <p className="font-bold">{CONSISTENCY_THRESHOLD}%+</p>
              <p className="text-xs text-muted-foreground">Consistency</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border">
              <CheckCircle className="h-6 w-6 mx-auto text-amber-500 mb-1" />
              <p className="font-bold">{MIN_WIN_RATE}%+</p>
              <p className="text-xs text-muted-foreground">Win Rate</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border">
              <AlertTriangle className="h-6 w-6 mx-auto text-red-500 mb-1" />
              <p className="font-bold">&lt;{MAX_DRAWDOWN}%</p>
              <p className="text-xs text-muted-foreground">Max Drawdown</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background/50 border">
              <BarChart3 className="h-6 w-6 mx-auto text-purple-500 mb-1" />
              <p className="font-bold">10,000</p>
              <p className="text-xs text-muted-foreground">Training Cycles</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategies.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No strategies yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create strategies in the Strategy Builder or Factor Library to begin the pipeline
              </p>
            </CardContent>
          </Card>
        ) : (
          strategies.map(strategy => {
            const progress = trainingProgress[strategy.id] || { completed: 0, stats: null };
            const progressPct = (progress.completed / TOTAL_CYCLES) * 100;
            const isTraining = training === strategy.id;
            const isEnhancing = enhancing === strategy.id;

            return (
              <Card key={strategy.id} className={strategy.is_graduated ? 'border-green-500 shadow-green-500/10 shadow-lg' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <div className="flex gap-1">
                      {strategy.status === 'enhanced' && (
                        <Badge variant="outline" className="text-purple-500 border-purple-500">
                          <Wand2 className="h-3 w-3 mr-1" />
                          Enhanced
                        </Badge>
                      )}
                      {strategy.is_graduated ? (
                        <Badge className="bg-green-500">
                          <Award className="h-3 w-3 mr-1" />
                          Graduated
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          {progress.completed.toLocaleString()}/{TOTAL_CYCLES.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{strategy.description || "AI-generated strategy"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Training Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Training Progress</span>
                      <span className={progressPct >= 100 ? 'text-green-500 font-bold' : ''}>
                        {progressPct.toFixed(1)}% ({progress.completed.toLocaleString()} cycles)
                      </span>
                    </div>
                    <Progress value={Math.min(100, progressPct)} className="h-3" />
                  </div>

                  {/* Stats */}
                  {(progress.stats || strategy.profitability_score) && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground text-xs">Avg Profit</p>
                        <p className={`font-bold ${(progress.stats?.avgProfitability || strategy.profitability_score || 0) >= PROFITABILITY_THRESHOLD ? 'text-green-500' : 'text-red-500'}`}>
                          {(progress.stats?.avgProfitability || strategy.profitability_score || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground text-xs">Win Rate</p>
                        <p className={`font-bold ${(progress.stats?.avgWinRate || 0) >= MIN_WIN_RATE ? 'text-green-500' : 'text-red-500'}`}>
                          {(progress.stats?.avgWinRate || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground text-xs">Pass Rate</p>
                        <p className={`font-bold ${(progress.stats?.passRate || 0) >= 80 ? 'text-green-500' : 'text-amber-500'}`}>
                          {(progress.stats?.passRate || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground text-xs">Consistency</p>
                        <p className="font-bold">
                          {(progress.stats?.avgConsistency || strategy.consistency_score || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground text-xs">Sharpe</p>
                        <p className="font-bold">{(progress.stats?.avgSharpe || 0).toFixed(2)}</p>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <p className="text-muted-foreground text-xs">Drawdown</p>
                        <p className={`font-bold ${(progress.stats?.avgDrawdown || 0) <= MAX_DRAWDOWN ? 'text-green-500' : 'text-red-500'}`}>
                          {(progress.stats?.avgDrawdown || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!strategy.is_graduated ? (
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        variant="default"
                        onClick={() => autoEnhanceAndTrain(strategy.id)}
                        disabled={isTraining || isEnhancing}
                      >
                        {isEnhancing ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enhancing...</>
                        ) : isTraining ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Training {progress.completed.toLocaleString()}/{TOTAL_CYCLES.toLocaleString()}...</>
                        ) : (
                          <><Rocket className="h-4 w-4 mr-2" />Auto: Enhance → Train → Graduate</>
                        )}
                      </Button>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          size="sm" variant="outline"
                          onClick={() => enhanceStrategy(strategy.id)}
                          disabled={isTraining || isEnhancing}
                        >
                          <Wand2 className="h-3 w-3 mr-1" />Enhance
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          onClick={() => runTrainingBatch(strategy.id)}
                          disabled={isTraining || isEnhancing}
                        >
                          <Play className="h-3 w-3 mr-1" />Train
                        </Button>
                        <Button
                          size="sm" variant="ghost"
                          onClick={() => resetTraining(strategy.id)}
                          disabled={isTraining || isEnhancing}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />Reset
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 p-3 rounded bg-green-500/10 text-green-500 text-sm">
                      <Award className="h-5 w-5" />
                      {strategy.is_available_for_rent
                        ? "Graduated & Listed for Rental!"
                        : "Graduated — Pending Admin Approval"
                      }
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GraduationPipeline;
