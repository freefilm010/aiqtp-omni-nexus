import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2, Zap, TrendingUp, GraduationCap, DollarSign,
  RefreshCw, Rocket, Activity, Play
} from "lucide-react";

interface PipelineResult {
  id: string;
  name: string;
  profitability: number;
  consistency: number;
  graduated: boolean;
  rentalPrice: number | null;
}

interface PipelineStats {
  total: number;
  draft: number;
  trained: number;
  graduated: number;
  renting: number;
  avgProfitability: number;
  potentialMonthlyRevenue: number;
}

const AutoPipeline = () => {
  const [running, setRunning] = useState(false);
  const [batchSize, setBatchSize] = useState("5");
  const [results, setResults] = useState<PipelineResult[]>([]);
  const [stats, setStats] = useState<PipelineStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoRound, setAutoRound] = useState(0);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-pipeline', {
        body: { action: 'pipeline-status' }
      });
      if (error) throw error;
      setStats(data.stats);
    } catch (err: any) {
      console.error('Stats error:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const runPipeline = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-pipeline', {
        body: { action: 'full-pipeline', batchSize: parseInt(batchSize) }
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setResults(data.results || []);
      toast.success(data.message, { duration: 5000 });
      fetchStats();
    } catch (err: any) {
      toast.error(err.message || "Pipeline failed");
    } finally {
      setRunning(false);
    }
  };

  const startAutoLoop = async () => {
    setAutoRunning(true);
    setAutoRound(0);
    for (let i = 0; i < 5; i++) {
      setAutoRound(i + 1);
      try {
        const { data, error } = await supabase.functions.invoke('auto-pipeline', {
          body: { action: 'full-pipeline', batchSize: parseInt(batchSize) }
        });
        if (error) throw error;
        if (data?.results) setResults(prev => [...data.results, ...prev].slice(0, 50));
        toast.success(`Round ${i + 1}: ${data.graduated} graduated!`);
        fetchStats();
      } catch {
        toast.error(`Round ${i + 1} failed`);
        break;
      }
      if (i < 4) await new Promise(r => setTimeout(r, 2000));
    }
    setAutoRunning(false);
  };

  return (
    <div className="space-y-4">
      {/* Pipeline Stats */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
         <CardTitle className="flex items-center gap-2 text-sm sm:text-lg">
            <Rocket className="h-4 w-4 sm:h-5 sm:w-5" />
            Auto Strategy Pipeline
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-sm">
            Build → Train 10K → Graduate → Rent-to-Earn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStats ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="text-center p-2 rounded bg-background/50">
                <Activity className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <div className="text-xl font-bold">{stats.total}</div>
                <div className="text-[10px] text-muted-foreground">Total Built</div>
              </div>
              <div className="text-center p-2 rounded bg-background/50">
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                <div className="text-xl font-bold">{stats.trained}</div>
                <div className="text-[10px] text-muted-foreground">Trained</div>
              </div>
              <div className="text-center p-2 rounded bg-background/50">
                <GraduationCap className="h-4 w-4 mx-auto mb-1 text-green-500" />
                <div className="text-xl font-bold">{stats.graduated}</div>
                <div className="text-[10px] text-muted-foreground">Graduated</div>
              </div>
              <div className="text-center p-2 rounded bg-background/50">
                <DollarSign className="h-4 w-4 mx-auto mb-1 text-yellow-500" />
                <div className="text-xl font-bold">${stats.potentialMonthlyRevenue}</div>
                <div className="text-[10px] text-muted-foreground">Monthly Potential</div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap">
            <Select value={batchSize} onValueChange={setBatchSize}>
              <SelectTrigger className="w-[70px] sm:w-[100px] text-xs sm:text-sm h-8 sm:h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 bots</SelectItem>
                <SelectItem value="5">5 bots</SelectItem>
                <SelectItem value="10">10 bots</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={runPipeline} disabled={running || autoRunning} size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
              {running ? (
                <><Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />Build...</>
              ) : (
                <><Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />Pipeline</>
              )}
            </Button>

            <Button variant="outline" onClick={startAutoLoop} disabled={running || autoRunning} size="sm" className="text-xs sm:text-sm h-8 sm:h-10">
              {autoRunning ? (
                <><Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />{autoRound}/5</>
              ) : (
                <><Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />5x Loop</>
              )}
            </Button>

            <Button variant="ghost" size="icon" onClick={fetchStats} disabled={loadingStats} className="h-8 w-8 sm:h-10 sm:w-10">
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loadingStats ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {autoRunning && (
            <div className="mt-3">
              <Progress value={(autoRound / 5) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-building round {autoRound}/5 • {parseInt(batchSize) * 5} total strategies
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Latest Pipeline Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {results.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded border bg-card text-sm">
                  <div className="flex items-center gap-2">
                    {r.graduated ? (
                      <GraduationCap className="h-4 w-4 text-green-500" />
                    ) : (
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium truncate max-w-[150px]">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.profitability >= 77 ? "default" : "secondary"} className="text-[10px]">
                      P:{r.profitability}%
                    </Badge>
                    <Badge variant={r.consistency >= 77 ? "default" : "secondary"} className="text-[10px]">
                      C:{r.consistency}%
                    </Badge>
                    {r.graduated && (
                      <Badge className="bg-green-500/20 text-green-700 text-[10px]">
                        ${r.rentalPrice}/mo
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutoPipeline;
