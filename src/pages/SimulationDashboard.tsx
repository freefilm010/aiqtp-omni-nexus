import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Zap, Shield, Brain, TrendingUp, TrendingDown, AlertTriangle, Play, Pause, RotateCcw } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from "recharts";

// --- Simulation Engine (client-side) ---

interface SimTick {
  time: number;
  price: number;
  volume: number;
}

interface SimOrder {
  time: number;
  side: "BUY" | "SELL";
  size: number;
  price: number;
  agent: string;
}

interface RiskState {
  exposure: number;
  breached: boolean;
  alerts: number;
}

interface RuleState {
  volatilityFeedback: number;
  panicAmplification: number;
  liquidityRate: number;
  mutations: number;
}

function useSimulationEngine() {
  const [running, setRunning] = useState(false);
  const [ticks, setTicks] = useState<SimTick[]>([]);
  const [orders, setOrders] = useState<SimOrder[]>([]);
  const [risk, setRisk] = useState<RiskState>({ exposure: 0, breached: false, alerts: 0 });
  const [rules, setRules] = useState<RuleState>({ volatilityFeedback: 1, panicAmplification: 0.5, liquidityRate: 1, mutations: 0 });
  const [fills, setFills] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const priceRef = useRef(65000);

  const step = useCallback(() => {
    const now = Date.now();

    // Market tick
    const drift = (Math.random() - 0.5) * 200 * rules.volatilityFeedback;
    priceRef.current = Math.max(50000, Math.min(80000, priceRef.current + drift));
    const price = priceRef.current;
    const volume = Math.random() * 500;

    setTicks((prev) => [...prev.slice(-99), { time: now, price, volume }]);

    // Agent decisions
    const agents = ["alpha", "beta", "gamma"];
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const side: "BUY" | "SELL" = price > 65000 + Math.random() * 2000 ? "SELL" : "BUY";
    const size = Math.random() * 0.5;
    const order: SimOrder = { time: now, side, size, price, agent };

    setOrders((prev) => [...prev.slice(-49), order]);
    setFills((f) => f + 1);
    setEventCount((c) => c + 3);

    // Risk update
    setRisk((prev) => {
      const newExposure = prev.exposure + (side === "BUY" ? size : -size);
      const breached = Math.abs(newExposure) > 5;
      return {
        exposure: breached ? 0 : newExposure,
        breached,
        alerts: prev.alerts + (breached ? 1 : 0),
      };
    });

    // Rules mutation (every ~20 ticks)
    if (Math.random() < 0.05) {
      setRules((prev) => ({
        volatilityFeedback: Math.max(0.5, Math.min(2, prev.volatilityFeedback + (Math.random() - 0.5) * 0.1)),
        panicAmplification: Math.max(0.1, Math.min(2, prev.panicAmplification + (Math.random() - 0.5) * 0.05)),
        liquidityRate: Math.max(0.5, Math.min(1.5, prev.liquidityRate + (Math.random() - 0.5) * 0.03)),
        mutations: prev.mutations + 1,
      }));
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
    setTicks([]);
    setOrders([]);
    setRisk({ exposure: 0, breached: false, alerts: 0 });
    setRules({ volatilityFeedback: 1, panicAmplification: 0.5, liquidityRate: 1, mutations: 0 });
    setFills(0);
    setEventCount(0);
    priceRef.current = 65000;
  }, [stop]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { running, ticks, orders, risk, rules, fills, eventCount, start, stop, reset };
}

// --- Page ---

const SimulationDashboard = () => {
  const sim = useSimulationEngine();
  const lastPrice = sim.ticks[sim.ticks.length - 1]?.price ?? 65000;
  const prevPrice = sim.ticks[sim.ticks.length - 2]?.price ?? lastPrice;
  const priceUp = lastPrice >= prevPrice;

  const buyCount = sim.orders.filter((o) => o.side === "BUY").length;
  const sellCount = sim.orders.filter((o) => o.side === "SELL").length;
  const agentBreakdown = sim.orders.reduce((acc, o) => { acc[o.agent] = (acc[o.agent] || 0) + 1; return acc; }, {} as Record<string, number>);

  const riskHeat = Math.min(1, Math.abs(sim.risk.exposure) / 5);
  const riskColor = riskHeat > 0.7 ? "text-destructive" : riskHeat > 0.4 ? "text-accent-foreground" : "text-primary";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Live Simulation Engine
            </h1>
            <p className="text-sm text-muted-foreground">Self-writing economy • multi-agent • real-time event flow</p>
          </div>
          <div className="flex gap-2">
            {sim.running ? (
              <Button size="sm" variant="outline" onClick={sim.stop}><Pause className="h-4 w-4 mr-1" /> Pause</Button>
            ) : (
              <Button size="sm" onClick={sim.start}><Play className="h-4 w-4 mr-1" /> Start</Button>
            )}
            <Button size="sm" variant="ghost" onClick={sim.reset}><RotateCcw className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Events</p>
            <p className="text-xl font-bold text-primary">{sim.eventCount}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Fills</p>
            <p className="text-xl font-bold">{sim.fills}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Risk Alerts</p>
            <p className="text-xl font-bold text-destructive">{sim.risk.alerts}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Rule Mutations</p>
            <p className="text-xl font-bold text-accent-foreground">{sim.rules.mutations}</p>
          </CardContent></Card>
          <Card><CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">BTC Price</p>
            <p className={`text-xl font-bold ${priceUp ? "text-primary" : "text-destructive"}`}>
              ${lastPrice.toFixed(0)}
            </p>
          </CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Price Chart */}
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

          {/* Risk Heatmap */}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Agent Activity */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4" /> Agent Orders
            </CardTitle></CardHeader>
            <CardContent className="p-3">
              <div className="flex gap-2 mb-3">
                <Badge variant="secondary" className="text-primary">{buyCount} BUY</Badge>
                <Badge variant="secondary" className="text-destructive">{sellCount} SELL</Badge>
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={Object.entries(agentBreakdown).map(([agent, count]) => ({ agent, count }))}>
                  <XAxis dataKey="agent" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {Object.entries(agentBreakdown).map(([, ], i) => (
                      <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Volume Chart */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Volume Feed</CardTitle></CardHeader>
            <CardContent className="p-2">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={sim.ticks.slice(-30).map((t, i) => ({ i, vol: t.volume }))}>
                  <XAxis dataKey="i" hide />
                  <YAxis hide />
                  <Bar dataKey="vol" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Self-Writing Rules */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4" /> Self-Writing Rules
              <Badge variant="outline" className="text-[10px]">{sim.rules.mutations} mutations</Badge>
            </CardTitle></CardHeader>
            <CardContent className="p-3 space-y-2">
              {([
                ["Volatility Feedback", sim.rules.volatilityFeedback, 2],
                ["Panic Amplification", sim.rules.panicAmplification, 2],
                ["Liquidity Rate", sim.rules.liquidityRate, 1.5],
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
