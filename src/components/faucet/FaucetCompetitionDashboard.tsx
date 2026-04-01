import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Swords, Trophy, Users, Droplets, Play, Zap } from "lucide-react";
import { getCompetitionLayer, type CompetitionResult } from "@/lib/faucet/faucetCompetition";
import { getRewardKernel } from "@/lib/faucet/rewardEvolutionKernel";

const FaucetCompetitionDashboard = () => {
  const [leaderboard, setLeaderboard] = useState(getCompetitionLayer().getLeaderboard());
  const [pools, setPools] = useState(getCompetitionLayer().getPoolStatus());
  const [results, setResults] = useState<CompetitionResult[]>([]);
  const [kernelStats, setKernelStats] = useState(getRewardKernel().getStats());

  const competition = getCompetitionLayer();
  const kernel = getRewardKernel();

  const refresh = useCallback(() => {
    setLeaderboard(competition.getLeaderboard());
    setPools(competition.getPoolStatus());
    setResults(competition.getRecentResults(10));
    setKernelStats(kernel.getStats());
  }, [competition, kernel]);

  useEffect(() => {
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const runRound = () => {
    // All agents bid on all pools
    for (const agent of competition.getLeaderboard()) {
      for (const pool of competition.getPoolStatus()) {
        if (Math.random() > 0.3) competition.bid(agent.id, pool.id);
      }
    }
    competition.runRound();

    // Evolve reward kernel
    const scenarios = Array.from({ length: 10 }, () => ({
      tradingPnl: (Math.random() - 0.4) * 0.1,
      faucetIncome: Math.random() * 0.02,
      riskExposure: Math.random() * 0.5,
      drawdown: Math.random() * 0.1,
    }));
    kernel.evaluateGeneration(scenarios);
    kernel.evolve();

    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Agent Competition Arena</h3>
        </div>
        <Button size="sm" onClick={runRound}>
          <Play className="h-3 w-3 mr-1" /> Run Round
        </Button>
      </div>

      {/* Liquidity Pools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {pools.map(pool => (
          <Card key={pool.id}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">{pool.asset} Pool</span>
                <Badge variant="outline" className="text-[10px]">{pool.auctionMode}</Badge>
              </div>
              <Progress value={(pool.remaining / pool.totalSupply) * 100} className="h-2 mb-1" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{pool.remaining.toFixed(1)} remaining</span>
                <span>{pool.claimants.length} bidders</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard + Kernel Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Agent Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {leaderboard.map((agent, i) => (
              <div key={agent.id} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-muted-foreground w-4">{i + 1}</span>
                  <Users className="h-3 w-3" />
                  <span className="font-medium">{agent.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-green-500 font-mono">{agent.totalClaimed.toFixed(2)}</span>
                  <span className="text-muted-foreground">{agent.wins}W/{agent.losses}L</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" /> Reward Evolution Kernel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Generation</div>
                <div className="font-bold text-lg">{kernelStats.generation}</div>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Best Fitness</div>
                <div className="font-bold text-lg">{kernelStats.bestFitness.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Avg Fitness</div>
                <div className="font-bold">{kernelStats.avgFitness.toFixed(4)}</div>
              </div>
              <div className="p-2 rounded bg-muted/30">
                <div className="text-muted-foreground">Rule Drift</div>
                <div className="font-bold">{kernelStats.ruleDrift.toFixed(4)}</div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              Population: {kernelStats.populationSize} genomes evolving reward functions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Droplets className="h-4 w-4" /> Recent Competition Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[200px] overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/20">
                <div className="flex items-center gap-2">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  <span className="font-medium">{r.winnerId}</span>
                  <span className="text-muted-foreground">won {r.poolId}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-500 font-mono">+{r.amount.toFixed(4)}</span>
                  <span className="text-muted-foreground">vs {r.competitorCount - 1}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FaucetCompetitionDashboard;
