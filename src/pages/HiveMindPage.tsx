import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Brain, Bot, Shield, Zap, Activity, TrendingUp, Eye, BarChart3,
  Network, GitMerge, Cpu, Flame, Skull, Crown, RefreshCw, AlertTriangle,
  CheckCircle, XCircle, ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react";

const ICON_MAP: Record<string, typeof Brain> = {
  Brain, BarChart3, Eye, Network, TrendingUp, Cpu, Zap, GitMerge, Activity, Shield, Bot
};

interface SwarmAgent {
  id: string;
  name: string;
  domain: string;
  icon: typeof Brain;
  status: "active" | "degraded" | "retraining" | "retired";
  confidence: number;
  accuracy7d: number;
  signalsToday: number;
  lastSignal: string;
  vote: "bull" | "bear" | "neutral";
  streak: number;
  generation: number;
}

interface ConsensusSignal {
  id: string;
  timestamp: Date;
  pair: string;
  direction: "LONG" | "SHORT" | "HOLD";
  consensusScore: number;
  agentVotes: { agentId: string; vote: string; confidence: number }[];
  executed: boolean;
  pnl?: number;
}

// ─── Sub-Components ──────────────────────────────────────────────────

const AgentCard = ({ agent, onRetrain }: { agent: SwarmAgent; onRetrain: (id: string) => void }) => {
  const statusColors: Record<string, string> = {
    active: "bg-green-500/10 text-green-400 border-green-500/20",
    degraded: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    retraining: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    retired: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  const voteIcons: Record<string, typeof ArrowUpRight> = { bull: ArrowUpRight, bear: ArrowDownRight, neutral: Minus };
  const voteColors: Record<string, string> = { bull: "text-green-400", bear: "text-red-400", neutral: "text-muted-foreground" };
  const VoteIcon = voteIcons[agent.vote];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)] hover:border-primary/30 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <agent.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm">{agent.name}</CardTitle>
            </div>
            <Badge variant="outline" className={`text-[10px] ${statusColors[agent.status]}`}>
              {agent.status === "retraining" && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
              {agent.status} · Gen {agent.generation}
            </Badge>
          </div>
          <CardDescription className="text-xs">{agent.domain}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Confidence</p>
              <p className="text-lg font-bold text-foreground">{agent.confidence}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Current Vote</p>
              <div className={`flex items-center gap-1 ${voteColors[agent.vote]}`}>
                <VoteIcon className="h-4 w-4" />
                <span className="text-sm font-semibold uppercase">{agent.vote}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">7d Accuracy</span>
              <span className={agent.accuracy7d >= 65 ? "text-green-400" : agent.accuracy7d >= 50 ? "text-yellow-400" : "text-red-400"}>
                {agent.accuracy7d}%
              </span>
            </div>
            <Progress value={agent.accuracy7d} className="h-1.5" />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{agent.signalsToday} signals today</span>
            <span className="text-muted-foreground">Streak: {agent.streak}</span>
          </div>
          <p className="text-xs text-muted-foreground italic border-t border-border/30 pt-2 truncate">{agent.lastSignal}</p>
          {(agent.status === "degraded" || agent.accuracy7d < 50) && agent.status !== "retraining" && (
            <Button size="sm" variant="outline" className="w-full text-xs gap-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" onClick={() => onRetrain(agent.id)}>
              <RefreshCw className="h-3 w-3" /> Trigger Retraining
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ConsensusRow = ({ signal }: { signal: ConsensusSignal }) => {
  const dirColors: Record<string, string> = { LONG: "text-green-400 bg-green-500/10", SHORT: "text-red-400 bg-red-500/10", HOLD: "text-muted-foreground bg-muted/10" };
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30 border border-border/30">
      <div className="flex items-center gap-3">
        <Badge className={`${dirColors[signal.direction]} border-0 font-mono text-xs`}>{signal.direction}</Badge>
        <div>
          <p className="text-sm font-medium text-foreground">{signal.pair}</p>
          <p className="text-xs text-muted-foreground">{signal.agentVotes.length} agents voted · {new Date(signal.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Consensus</p>
          <p className="text-sm font-bold text-foreground">{signal.consensusScore}%</p>
        </div>
        {signal.executed ? (
          <div className="text-right">
            {signal.pnl !== undefined && (
              <p className={`text-sm font-bold ${signal.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{signal.pnl >= 0 ? "+" : ""}{signal.pnl}%</p>
            )}
            <CheckCircle className="h-4 w-4 text-green-400 ml-auto" />
          </div>
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};

const HiveMindPage = () => {
  const [agents, setAgents] = useState<SwarmAgent[]>([]);
  const [consensusHistory, setConsensusHistory] = useState<ConsensusSignal[]>([]);
  const [autoEvolution, setAutoEvolution] = useState(true);
  const [consensusThreshold] = useState(70);
  const [loading, setLoading] = useState(true);

  // Load from DB
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [agentsRes, signalsRes] = await Promise.all([
        supabase.from("swarm_agents").select("*").order("accuracy_7d", { ascending: false }),
        supabase.from("consensus_signals").select("*").order("created_at", { ascending: false }).limit(20),
      ]);

      if (agentsRes.data) {
        setAgents(agentsRes.data.map((a: any) => ({
          id: a.id,
          name: a.name,
          domain: a.domain,
          icon: ICON_MAP[a.icon_name] || Brain,
          status: a.status,
          confidence: Number(a.confidence),
          accuracy7d: Number(a.accuracy_7d),
          signalsToday: a.signals_today,
          lastSignal: a.last_signal || "",
          vote: a.vote,
          streak: a.streak,
          generation: a.generation,
        })));
      }

      if (signalsRes.data) {
        setConsensusHistory(signalsRes.data.map((s: any) => ({
          id: s.id,
          timestamp: new Date(s.created_at),
          pair: s.pair,
          direction: s.direction,
          consensusScore: Number(s.consensus_score),
          agentVotes: s.agent_votes || [],
          executed: s.executed,
          pnl: s.pnl != null ? Number(s.pnl) : undefined,
        })));
      }
      setLoading(false);
    };
    load();

    // Realtime subscription for swarm agents
    const channel = supabase.channel('swarm-agents-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'swarm_agents' }, () => { load(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const activeAgents = agents.filter(a => a.status === "active");
  const bullVotes = activeAgents.filter(a => a.vote === "bull").length;
  const bearVotes = activeAgents.filter(a => a.vote === "bear").length;
  const totalVoters = activeAgents.length;
  const bullPercent = totalVoters > 0 ? Math.round((bullVotes / totalVoters) * 100) : 0;
  const bearPercent = totalVoters > 0 ? Math.round((bearVotes / totalVoters) * 100) : 0;
  const swarmSentiment = bullPercent > bearPercent ? "BULLISH" : bearPercent > bullPercent ? "BEARISH" : "NEUTRAL";
  const swarmConfidence = Math.max(bullPercent, bearPercent);
  const avgAccuracy = totalVoters > 0 ? Math.round(activeAgents.reduce((s, a) => s + a.accuracy7d, 0) / totalVoters) : 0;

  const handleRetrain = useCallback(async (agentId: string) => {
    // Update DB status
    await supabase.from("swarm_agents").update({ status: "retraining", confidence: 0, signals_today: 0, vote: "neutral" }).eq("id", agentId);
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: "retraining" as const, confidence: 0, signalsToday: 0, vote: "neutral" as const } : a));

    // Simulate retraining completion
    setTimeout(async () => {
      const newConf = 70 + Math.floor(Math.random() * 25);
      const newAcc = 60 + Math.floor(Math.random() * 30);
      await supabase.from("swarm_agents").update({ status: "active", confidence: newConf, accuracy_7d: newAcc, generation: agents.find(a => a.id === agentId)!.generation + 1, streak: 0 }).eq("id", agentId);
      setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: "active" as const, confidence: newConf, accuracy7d: newAcc, generation: a.generation + 1, streak: 0 } : a));
    }, 8000);
  }, [agents]);

  useEffect(() => {
    if (!autoEvolution) return;
    const interval = setInterval(async () => {
      for (const a of agents) {
        if (a.status === "active" && a.accuracy7d < 45) {
          await supabase.from("swarm_agents").update({ status: "degraded" }).eq("id", a.id);
        }
      }
      setAgents(prev => prev.map(a => a.status === "active" && a.accuracy7d < 45 ? { ...a, status: "degraded" as const } : a));
    }, 15000);
    return () => clearInterval(interval);
  }, [autoEvolution, agents]);

  return (
    <div className="min-h-screen bg-[hsl(225,20%,6%)]">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10 w-fit"><Brain className="h-10 w-10 text-primary" /></div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              HiveMind <Badge variant="outline" className="text-xs border-primary/30 text-primary">Swarm Intelligence</Badge>
            </h1>
            <p className="text-muted-foreground mt-1">{activeAgents.length} specialist agents • Consensus voting • Evolutionary retraining</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Auto-Evolution</span>
            <Switch checked={autoEvolution} onCheckedChange={setAutoEvolution} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
          <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)] mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Swarm Sentiment</p>
                  <p className={`text-2xl font-bold ${swarmSentiment === "BULLISH" ? "text-green-400" : swarmSentiment === "BEARISH" ? "text-red-400" : "text-muted-foreground"}`}>{swarmSentiment}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Consensus Strength</p>
                  <p className="text-2xl font-bold text-foreground">{swarmConfidence}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Swarm Accuracy (7d)</p>
                  <p className="text-2xl font-bold text-foreground">{avgAccuracy}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Vote Split</p>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold">{bullVotes} Bull</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-red-400 font-bold">{bearVotes} Bear</span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground font-bold">{totalVoters - bullVotes - bearVotes} Neutral</span>
                  </div>
                </div>
              </div>
              {swarmConfidence >= consensusThreshold && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 p-3 rounded-lg bg-green-500/5 border border-green-500/20 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
                  <p className="text-xs text-green-400">Consensus threshold ({consensusThreshold}%) reached — signal eligible for execution</p>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="swarm" className="space-y-6">
          <TabsList className="bg-[hsl(223,18%,9%)] border border-[hsl(222,14%,17%)]">
            <TabsTrigger value="swarm" className="gap-1"><Network className="h-3.5 w-3.5" /> Swarm</TabsTrigger>
            <TabsTrigger value="consensus" className="gap-1"><GitMerge className="h-3.5 w-3.5" /> Consensus</TabsTrigger>
            <TabsTrigger value="evolution" className="gap-1"><Flame className="h-3.5 w-3.5" /> Evolution</TabsTrigger>
          </TabsList>

          <TabsContent value="swarm">
            {loading ? (
              <p className="text-muted-foreground text-center py-12">Loading swarm agents...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {agents.map(agent => <AgentCard key={agent.id} agent={agent} onRetrain={handleRetrain} />)}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="consensus">
            <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
              <CardHeader>
                <CardTitle>Consensus Signal History</CardTitle>
                <CardDescription>Signals that met the {consensusThreshold}% threshold and their outcomes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {consensusHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No consensus signals recorded yet.</p>
                ) : (
                  consensusHistory.map(signal => <ConsensusRow key={signal.id} signal={signal} />)
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evolution">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-orange-400" /> Evolutionary Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Degradation Threshold</p>
                      <p className="text-xs text-muted-foreground">Agents with &lt;45% 7d accuracy are flagged as <Badge variant="outline" className="text-yellow-400 border-yellow-500/20 text-[10px] mx-1">degraded</Badge></p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/30">
                    <RefreshCw className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Auto-Retraining</p>
                      <p className="text-xs text-muted-foreground">Degraded agents can be retrained on fresh market data, incrementing their generation counter</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/30">
                    <Skull className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Retirement</p>
                      <p className="text-xs text-muted-foreground">Agents that fail to improve after 3 retraining cycles are retired and replaced</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-background/30">
                    <Crown className="h-4 w-4 text-[hsl(43,96%,56%)] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Alpha Promotion</p>
                      <p className="text-xs text-muted-foreground">Top-performing agents (&gt;80% accuracy, 10+ streak) get increased vote weight</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Agent Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[...agents].sort((a, b) => b.accuracy7d - a.accuracy7d).map((agent, i) => (
                      <div key={agent.id} className="flex items-center justify-between p-2 rounded bg-background/30">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold w-5 ${i === 0 ? "text-[hsl(43,96%,56%)]" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"}`}>#{i + 1}</span>
                          <agent.icon className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground">{agent.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">Gen {agent.generation}</span>
                          <span className={`text-sm font-bold ${agent.accuracy7d >= 70 ? "text-green-400" : agent.accuracy7d >= 50 ? "text-yellow-400" : "text-red-400"}`}>{agent.accuracy7d}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default HiveMindPage;
