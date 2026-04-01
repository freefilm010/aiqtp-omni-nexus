import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Zap, Shield, Brain, TrendingUp, TrendingDown, AlertTriangle, Play, Pause, RotateCcw, Users, Eye, Dna } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from "recharts";
import { WorldModelAgent } from "@/lib/ml/worldModelAgent";
import { CollectiveConsciousnessEngine } from "@/lib/collective/collectiveConsciousness";

// --- Types ---

type Regime = "TRENDING" | "MEAN_REVERT" | "VOLATILE" | "DRIFT";

interface SimTick { time: number; price: number; volume: number; regime: Regime; }
interface SimOrder { time: number; side: "BUY" | "SELL" | "HOLD"; size: number; price: number; agent: string; }
interface RiskState { exposure: number; breached: boolean; alerts: number; }
interface RuleState { volatilityFeedback: number; panicAmplification: number; liquidityRate: number; mutations: number; }
interface GenomeEntry { id: string; generation: number; fitness: number; momentum: number; risk: number; alive: boolean; }

// --- Regime Detection ---

function detectRegime(prices: number[], volatility: number): Regime {
  if (prices.length < 5) return "DRIFT";
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) returns.push(prices[i] - prices[i - 1]);
  const trend = returns.reduce((a, b) => a + b, 0);
  const variance = returns.reduce((a, b) => a + b * b, 0) / returns.length;
  if (volatility > 150) return "VOLATILE";
  if (Math.abs(trend) > variance * 1.5) return "TRENDING";
  if (variance < 50) return "MEAN_REVERT";
  return "DRIFT";
}

// --- Genetic helpers ---

function mutateGenome(g: GenomeEntry): GenomeEntry {
  return {
    ...g,
    id: `gen${g.generation + 1}_${Math.random().toString(36).slice(2, 6)}`,
    generation: g.generation + 1,
    fitness: 0,
    momentum: Math.max(0, Math.min(1, g.momentum + (Math.random() - 0.5) * 0.2)),
    risk: Math.max(0, Math.min(1, g.risk + (Math.random() - 0.5) * 0.2)),
    alive: true,
  };
}

// --- Simulation Engine ---

function useSimulationEngine() {
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState<SimTick[]>([]);
  const [orders, setOrders] = useState<SimOrder[]>([]);
  const [risk, setRisk] = useState<RiskState>({ exposure: 0, breached: false, alerts: 0 });
  const [rules, setRules] = useState<RuleState>({ volatilityFeedback: 1, panicAmplification: 0.5, liquidityRate: 1, mutations: 0 });
  const [fills, setFills] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [regime, setRegime] = useState<Regime>("DRIFT");
  const [collusionPressure, setCollusionPressure] = useState(0);
  const [beliefField, setBeliefField] = useState({ bullish: 0, bearish: 0, consensus: 0, dominantSentiment: "NEUTRAL" as string });
  const [herdingTrend, setHerdingTrend] = useState<number[]>([]);
  const [agentStates, setAgentStates] = useState<ReturnType<WorldModelAgent["getState"]>[]>([]);
  const [genomes, setGenomes] = useState<GenomeEntry[]>(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: `gen0_${i}`, generation: 0, fitness: Math.random() * 10, momentum: Math.random(), risk: Math.random(), alive: true,
    }))
  );
  const [generationCount, setGenerationCount] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const priceRef = useRef(65000);
  const agentsRef = useRef<WorldModelAgent[]>([
    new WorldModelAgent("WM-α"),
    new WorldModelAgent("WM-β"),
    new WorldModelAgent("WM-γ"),
    new WorldModelAgent("WM-δ"),
  ]);
  const consciousnessRef = useRef(new CollectiveConsciousnessEngine());
  const tickCountRef = useRef(0);

  const step = useCallback(() => {
    const now = Date.now();
    tickCountRef.current++;

    // Market tick
    const drift = (Math.random() - 0.5) * 200 * rules.volatilityFeedback;
    priceRef.current = Math.max(50000, Math.min(80000, priceRef.current + drift));
    const price = priceRef.current;
    const volume = Math.random() * 500;
    const volatility = Math.abs(drift);

    setTicks(prev => {
      const prices = [...prev.slice(-29).map(t => t.price), price];
      const r = detectRegime(prices, volatility);
      setRegime(r);
      return [...prev.slice(-99), { time: now, price, volume, regime: r }];
    });

    const worldState = { price, momentum: drift / 200, volatility: volatility / 200 };

    // World-model agents observe + act
    const wmActions = agentsRef.current.map(agent => {
      agent.observe(worldState);
      const action = agent.act();
      const pnlDelta = action === "BUY" ? (Math.random() - 0.3) * 5 : action === "SELL" ? (Math.random() - 0.4) * 4 : 0;
      agent.pnl += pnlDelta;
      agent.trades++;
      return { agentId: agent.id, action, confidence: agent.getState().confidence };
    });

    // Learning step
    for (const agent of agentsRef.current) agent.learn(worldState);
    setAgentStates(agentsRef.current.map(a => a.getState()));

    // Collective consciousness
    const cc = consciousnessRef.current;
    const cp = cc.getCollusionPressure(wmActions);
    const bf = cc.computeBeliefField(wmActions);
    setCollusionPressure(cp);
    setBeliefField(bf);
    setHerdingTrend(cc.getHerdingTrend().slice(-30));

    // Pick a representative order for the feed
    const bestAgent = wmActions.reduce((a, b) => a.confidence > b.confidence ? a : b);
    const side = bestAgent.action;
    const size = Math.random() * 0.5;
    const order: SimOrder = { time: now, side, size, price, agent: bestAgent.agentId };
    setOrders(prev => [...prev.slice(-49), order]);
    setFills(f => f + 1);
    setEventCount(c => c + wmActions.length + 2);

    // Risk update
    setRisk(prev => {
      const delta = side === "BUY" ? size : side === "SELL" ? -size : 0;
      const newExposure = prev.exposure + delta;
      const breached = Math.abs(newExposure) > 5;
      return { exposure: breached ? 0 : newExposure, breached, alerts: prev.alerts + (breached ? 1 : 0) };
    });

    // Rules mutation
    if (Math.random() < 0.05) {
      setRules(prev => ({
        volatilityFeedback: Math.max(0.5, Math.min(2, prev.volatilityFeedback + (Math.random() - 0.5) * 0.1)),
        panicAmplification: Math.max(0.1, Math.min(2, prev.panicAmplification + (Math.random() - 0.5) * 0.05)),
        liquidityRate: Math.max(0.5, Math.min(1.5, prev.liquidityRate + (Math.random() - 0.5) * 0.03)),
        mutations: prev.mutations + 1,
      }));
    }

    // Genetic evolution every 20 ticks
    if (tickCountRef.current % 20 === 0) {
      setGenomes(prev => {
        const scored = prev.map(g => ({ ...g, fitness: g.fitness + (Math.random() - 0.3) * 5 }));
        const sorted = [...scored].sort((a, b) => b.fitness - a.fitness);
        const survivors = sorted.slice(0, Math.ceil(sorted.length / 2));
        const children = survivors.map(s => mutateGenome(s));
        const next = [...survivors.map(s => ({ ...s, alive: true })), ...children].slice(0, 8);
        return next;
      });
      setGenerationCount(g => g + 1);
    }
  }, [rules.volatilityFeedback]);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setRunning(true);
    intervalRef.current = setInterval(step, 500);
  }, [step]);

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setTicks([]); setOrders([]); setFills(0); setEventCount(0);
    setRisk({ exposure: 0, breached: false, alerts: 0 });
    setRules({ volatilityFeedback: 1, panicAmplification: 0.5, liquidityRate: 1, mutations: 0 });
    setRegime("DRIFT"); setCollusionPressure(0);
    setBeliefField({ bullish: 0, bearish: 0, consensus: 0, dominantSentiment: "NEUTRAL" });
    setHerdingTrend([]); setAgentStates([]); setGenerationCount(0);
    priceRef.current = 65000;
    tickCountRef.current = 0;
    agentsRef.current = [new WorldModelAgent("WM-α"), new WorldModelAgent("WM-β"), new WorldModelAgent("WM-γ"), new WorldModelAgent("WM-δ")];
    consciousnessRef.current = new CollectiveConsciousnessEngine();
  }, [stop]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { running, ticks, orders, risk, rules, fills, eventCount, regime, collusionPressure, beliefField, herdingTrend, agentStates, genomes, generationCount, start, stop, reset };
}

// --- Helpers ---

const REGIME_COLORS: Record<Regime, string> = {
  TRENDING: "text-primary",
  MEAN_REVERT: "text-chart-2",
  VOLATILE: "text-destructive",
  DRIFT: "text-muted-foreground",
};

const REGIME_BADGES: Record<Regime, "default" | "secondary" | "destructive" | "outline"> = {
  TRENDING: "default",
  MEAN_REVERT: "secondary",
  VOLATILE: "destructive",
  DRIFT: "outline",
};

// --- Page ---

const SimulationDashboard = () => {
  const sim = useSimulationEngine();
  const lastPrice = sim.ticks[sim.ticks.length - 1]?.price ?? 65000;
  const prevPrice = sim.ticks[sim.ticks.length - 2]?.price ?? lastPrice;
  const priceUp = lastPrice >= prevPrice;
  const buyCount = sim.orders.filter(o => o.side === "BUY").length;
  const sellCount = sim.orders.filter(o => o.side === "SELL").length;

  const riskHeat = Math.min(1, Math.abs(sim.risk.exposure) / 5);
  const riskColor = riskHeat > 0.7 ? "text-destructive" : riskHeat > 0.4 ? "text-accent-foreground" : "text-primary";

  const beliefPie = useMemo(() => [
    { name: "Bullish", value: Math.round(sim.beliefField.bullish * 100), fill: "hsl(var(--chart-1))" },
    { name: "Bearish", value: Math.round(sim.beliefField.bearish * 100), fill: "hsl(var(--destructive))" },
    { name: "Neutral", value: Math.max(0, 100 - Math.round(sim.beliefField.bullish * 100) - Math.round(sim.beliefField.bearish * 100)), fill: "hsl(var(--muted-foreground))" },
  ], [sim.beliefField]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Live Simulation Engine
            </h1>
            <p className="text-sm text-muted-foreground">World-model agents • genetic evolution • collective consciousness</p>
          </div>
          <div className="flex gap-2">
            {sim.running
              ? <Button size="sm" variant="outline" onClick={sim.stop}><Pause className="h-4 w-4 mr-1" /> Pause</Button>
              : <Button size="sm" onClick={sim.start}><Play className="h-4 w-4 mr-1" /> Start</Button>}
            <Button size="sm" variant="ghost" onClick={sim.reset}><RotateCcw className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            ["Events", sim.eventCount, "text-primary"],
            ["Fills", sim.fills, ""],
            ["Alerts", sim.risk.alerts, "text-destructive"],
            ["Mutations", sim.rules.mutations, "text-accent-foreground"],
            ["Generation", sim.generationCount, "text-chart-2"],
            ["BTC", `$${lastPrice.toFixed(0)}`, priceUp ? "text-primary" : "text-destructive"],
          ].map(([label, value, cls]) => (
            <Card key={String(label)}><CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">{String(label)}</p>
              <p className={`text-lg font-bold ${cls}`}>{String(value)}</p>
            </CardContent></Card>
          ))}
        </div>

        {/* Regime + Belief Field */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" /> Market Regime
            </CardTitle></CardHeader>
            <CardContent className="p-4 text-center">
              <Badge variant={REGIME_BADGES[sim.regime]} className="text-lg px-4 py-1 mb-2">
                {sim.regime}
              </Badge>
              <p className={`text-3xl font-bold ${REGIME_COLORS[sim.regime]}`}>{sim.regime}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Belief Field
            </CardTitle></CardHeader>
            <CardContent className="p-2 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={beliefPie} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={50} paddingAngle={2}>
                    {beliefPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4" /> Collusion Pressure
            </CardTitle></CardHeader>
            <CardContent className="p-4 text-center">
              <p className="text-4xl font-bold" style={{ color: `hsl(${(1 - sim.collusionPressure) * 120}, 80%, 50%)` }}>
                {(sim.collusionPressure * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">Herding alignment</p>
              <div className="w-full h-2 bg-muted rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${sim.collusionPressure * 100}%` }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Price Chart + Risk */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" /> Price Feed
              {priceUp ? <TrendingUp className="h-3 w-3 text-primary" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
            </CardTitle></CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={sim.ticks.map((t, i) => ({ i, price: t.price }))}>
                  <defs>
                    <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="i" hide />
                  <YAxis domain={["auto", "auto"]} hide />
                  <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="url(#priceGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> Risk Exposure
              {sim.risk.breached && <Badge variant="destructive" className="text-[10px]">BREACHED</Badge>}
            </CardTitle></CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32 rounded-full border-4 flex items-center justify-center"
                  style={{ borderColor: `hsl(${(1 - riskHeat) * 120}, 80%, 50%)` }}>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${riskColor}`}>{(riskHeat * 100).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">exposure</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Net: {sim.risk.exposure.toFixed(3)}</span>
                <span>Alerts: {sim.risk.alerts}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* World-Model Agents + Genetic Evolution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" /> World-Model Agents
            </CardTitle></CardHeader>
            <CardContent className="p-3">
              <div className="space-y-2">
                {sim.agentStates.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div>
                      <span className="font-mono text-sm font-bold">{a.id}</span>
                      <span className="text-xs text-muted-foreground ml-2">{a.trades} trades</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={a.pnl >= 0 ? "text-primary font-bold" : "text-destructive font-bold"}>
                        {a.pnl >= 0 ? "+" : ""}{a.pnl.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground">err: {a.predictionError.toFixed(3)}</span>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${a.confidence * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {sim.agentStates.length === 0 && <p className="text-muted-foreground text-center py-4 text-sm">Press Start</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Dna className="h-4 w-4" /> Genetic Evolution
              <Badge variant="outline" className="text-[10px]">Gen {sim.generationCount}</Badge>
            </CardTitle></CardHeader>
            <CardContent className="p-3">
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={sim.genomes.map(g => ({ id: g.id.slice(-4), fitness: Math.max(0, g.fitness), momentum: g.momentum * 100 }))}>
                  <XAxis dataKey="id" tick={{ fontSize: 9 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="fitness" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Herding Trend + Agent Orders + Self-Writing Rules */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" /> Herding Trend
            </CardTitle></CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={sim.herdingTrend.map((v, i) => ({ i, herd: v * 100 }))}>
                  <XAxis dataKey="i" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip formatter={(v: number) => `${v.toFixed(0)}%`} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="herd" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" /> Agent Orders
            </CardTitle></CardHeader>
            <CardContent className="p-3">
              <div className="flex gap-2 mb-3">
                <Badge variant="secondary" className="text-primary">{buyCount} BUY</Badge>
                <Badge variant="secondary" className="text-destructive">{sellCount} SELL</Badge>
              </div>
              <ResponsiveContainer width="100%" height={80}>
                <BarChart data={sim.orders.slice(-10).map((o, i) => ({ i, size: o.size, fill: o.side === "BUY" ? 1 : 0 }))}>
                  <XAxis dataKey="i" hide />
                  <YAxis hide />
                  <Bar dataKey="size" radius={[2, 2, 0, 0]}>
                    {sim.orders.slice(-10).map((o, i) => (
                      <Cell key={i} fill={o.side === "BUY" ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" /> Self-Writing Rules
              <Badge variant="outline" className="text-[10px]">{sim.rules.mutations} mutations</Badge>
            </CardTitle></CardHeader>
            <CardContent className="p-3 space-y-2">
              {([
                ["Volatility FB", sim.rules.volatilityFeedback, 2],
                ["Panic Amp", sim.rules.panicAmplification, 2],
                ["Liquidity", sim.rules.liquidityRate, 1.5],
              ] as [string, number, number][]).map(([label, value, max]) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono">{value.toFixed(3)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(value / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Event Log */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Live Event Feed</CardTitle></CardHeader>
          <CardContent className="p-3">
            <div className="max-h-48 overflow-y-auto space-y-1 font-mono text-xs">
              {sim.orders.slice(-20).reverse().map((o, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5 border-b border-border/30">
                  <Badge variant={o.side === "BUY" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0 min-w-[32px] justify-center">{o.side}</Badge>
                  <span className="text-muted-foreground">[{o.agent}]</span>
                  <span>{o.size.toFixed(3)} BTC</span>
                  <span className="text-muted-foreground">@ ${o.price.toFixed(0)}</span>
                </div>
              ))}
              {sim.orders.length === 0 && <p className="text-muted-foreground text-center py-4">Press Start to begin simulation</p>}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default SimulationDashboard;
