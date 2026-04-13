import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ScanSearch, Bot, Workflow, PieChart, Brain, Zap, Target, GitBranch, Sparkles, Gauge
} from "lucide-react";
import { useState, useEffect } from "react";

export const AIPatternRecognition = () => {
  const [activePattern, setActivePattern] = useState(0);
  const patterns = [
    { name: "Head & Shoulders", confidence: 94, signal: "Bearish", color: "hsl(355,88%,58%)" },
    { name: "Double Bottom", confidence: 87, signal: "Bullish", color: "hsl(162,91%,32%)" },
    { name: "Bull Flag", confidence: 91, signal: "Bullish", color: "hsl(162,91%,32%)" },
    { name: "Ascending Triangle", confidence: 82, signal: "Bullish", color: "hsl(162,91%,32%)" },
    { name: "Bearish Wedge", confidence: 78, signal: "Bearish", color: "hsl(355,88%,58%)" },
  ];

  useEffect(() => {
    const interval = setInterval(() => setActivePattern(p => (p + 1) % patterns.length), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4 md:p-6 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)] overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <ScanSearch className="w-5 h-5 text-[hsl(270,91%,65%)]" />
        <h3 className="font-bold text-foreground text-sm">Auto Pattern Recognition</h3>
        <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[10px]">LIVE</Badge>
      </div>
      <div className="relative h-28 md:h-32 bg-[hsl(223,18%,7%)] rounded-lg mb-3 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
          <path d="M 0 60 L 30 55 L 50 30 L 70 45 L 90 20 L 110 40 L 130 25 L 150 55 L 170 35 L 200 40" stroke="hsl(224,100%,58%)" strokeWidth="2" fill="none" className="animate-pulse" />
          <circle cx="90" cy="20" r="4" fill={patterns[activePattern].color} className="animate-pulse" />
          <circle cx="130" cy="25" r="4" fill={patterns[activePattern].color} className="animate-pulse" />
        </svg>
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-[hsl(223,18%,12%)] border border-[hsl(222,14%,20%)]">
          <span className="font-mono text-[10px] text-foreground">{patterns[activePattern].name}</span>
        </div>
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded" style={{ backgroundColor: `${patterns[activePattern].color}20` }}>
          <span className="font-mono text-[11px] font-bold" style={{ color: patterns[activePattern].color }}>{patterns[activePattern].confidence}% conf.</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {patterns.map((pattern, i) => (
          <div key={pattern.name} className={`flex items-center justify-between p-1.5 rounded transition-all ${i === activePattern ? 'bg-[hsl(223,18%,12%)] border border-[hsl(222,14%,22%)]' : ''}`}>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${pattern.signal === 'Bullish' ? 'bg-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%)]'}`} />
              <span className="font-mono text-[11px] text-foreground">{pattern.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[9px] ${pattern.signal === 'Bullish' ? 'text-[hsl(162,91%,32%)] border-[hsl(162,91%,32%,0.3)]' : 'text-[hsl(355,88%,58%)] border-[hsl(355,88%,58%,0.3)]'}`}>{pattern.signal}</Badge>
              <span className="font-mono text-[10px] text-muted-foreground">{pattern.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const RoboAdvisor = () => {
  const recommendations = [
    { asset: "BTC", action: "HOLD", allocation: 35, reason: "Strong momentum, await pullback" },
    { asset: "ETH", action: "BUY", allocation: 25, reason: "L2 growth catalyst" },
    { asset: "SOL", action: "BUY", allocation: 20, reason: "DeFi TVL surge" },
    { asset: "AVAX", action: "REDUCE", allocation: 10, reason: "Overbought RSI" },
    { asset: "LINK", action: "HOLD", allocation: 10, reason: "Oracle dominance" },
  ];

  return (
    <Card className="p-4 md:p-6 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[hsl(43,96%,56%)]" />
          <h3 className="font-bold text-foreground text-sm">AI Robo-Advisor</h3>
        </div>
        <Badge className="bg-[hsl(270,91%,65%,0.15)] text-[hsl(270,91%,65%)] text-[10px]">QAQI™</Badge>
      </div>
      <div className="flex items-center gap-3 mb-3 p-2.5 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,15%)]">
        <Gauge className="w-7 h-7 text-[hsl(162,91%,32%)]" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[11px] text-foreground">Risk Score</span>
            <span className="font-mono text-[11px] font-bold text-[hsl(162,91%,32%)]">Moderate</span>
          </div>
          <Progress value={62} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-[hsl(162,91%,32%)] [&>div]:to-[hsl(43,96%,56%)]" />
        </div>
      </div>
      <div className="space-y-1.5">
        {recommendations.map((rec) => (
          <div key={rec.asset} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[hsl(223,18%,15%)] flex items-center justify-center">
                <span className="font-mono text-[9px] font-bold text-foreground">{rec.asset}</span>
              </div>
              <div>
                <Badge className={`text-[9px] ${rec.action === 'BUY' ? 'bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]' : rec.action === 'REDUCE' ? 'bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)]' : 'bg-[hsl(43,96%,56%,0.15)] text-[hsl(43,96%,56%)]'}`}>{rec.action}</Badge>
                <p className="font-mono text-[8px] text-muted-foreground mt-0.5">{rec.reason}</p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-foreground">{rec.allocation}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const AutoStrategyBuilder = () => {
  const strategies = [
    { name: "Mean Reversion RSI", winRate: 72, pnl: "+18.4%", status: "active" },
    { name: "MACD Crossover", winRate: 68, pnl: "+12.1%", status: "active" },
    { name: "Breakout Scanner", winRate: 65, pnl: "+9.8%", status: "testing" },
  ];

  return (
    <Card className="p-4 md:p-6 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      <div className="flex items-center gap-2 mb-3">
        <Workflow className="w-5 h-5 text-[hsl(224,100%,58%)]" />
        <h3 className="font-bold text-foreground text-sm">Auto Strategy Builder</h3>
      </div>
      <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,15%)] overflow-x-auto">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[hsl(270,91%,65%,0.15)] text-[hsl(270,91%,65%)]">
          <Brain className="w-3 h-3" /><span className="font-mono text-[10px]">Signal</span>
        </div>
        <GitBranch className="w-3 h-3 text-muted-foreground" />
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[hsl(224,100%,58%,0.15)] text-[hsl(224,100%,58%)]">
          <Target className="w-3 h-3" /><span className="font-mono text-[10px]">Filter</span>
        </div>
        <GitBranch className="w-3 h-3 text-muted-foreground" />
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]">
          <Zap className="w-3 h-3" /><span className="font-mono text-[10px]">Execute</span>
        </div>
      </div>
      <div className="space-y-1.5">
        {strategies.map((strat) => (
          <div key={strat.name} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${strat.status === 'active' ? 'bg-[hsl(162,91%,32%)] animate-pulse' : 'bg-[hsl(43,96%,56%)]'}`} />
              <span className="font-mono text-[11px] text-foreground">{strat.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{strat.winRate}% WR</span>
              <span className="font-mono text-xs font-bold text-[hsl(162,91%,32%)]">{strat.pnl}</span>
            </div>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-full mt-3 border-[hsl(222,14%,22%)] hover:bg-[hsl(223,18%,15%)] text-xs">
        <Sparkles className="w-3 h-3 mr-2 text-[hsl(270,91%,65%)]" />
        Create New Strategy
      </Button>
    </Card>
  );
};

export const QuantAnalytics = () => {
  const metrics = [
    { label: "Sharpe Ratio", value: "2.34" },
    { label: "Sortino", value: "3.12" },
    { label: "Max DD", value: "-8.2%" },
    { label: "Win Rate", value: "67%" },
  ];

  return (
    <Card className="p-4 md:p-6 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      <div className="flex items-center gap-2 mb-3">
        <PieChart className="w-5 h-5 text-[hsl(162,91%,32%)]" />
        <h3 className="font-bold text-foreground text-sm">Quant Analytics</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {metrics.map((m) => (
          <div key={m.label} className="p-2.5 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
            <p className="font-mono text-[9px] text-muted-foreground uppercase">{m.label}</p>
            <p className="font-mono text-base font-bold text-[hsl(162,91%,32%)]">{m.value}</p>
          </div>
        ))}
      </div>
      <div className="p-2.5 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,15%)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-muted-foreground">Monte Carlo Simulation</span>
          <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[9px]">10K runs</Badge>
        </div>
        <div className="h-10 flex items-end gap-0.5">
          {Array.from({ length: 24 }, (_, i) => {
            const height = Math.abs(Math.sin(i * 1.618 + 0.5)) * 100;
            return (
              <div key={i} className={`flex-1 rounded-t-sm ${height > 60 ? 'bg-[hsl(162,91%,32%,0.6)]' : 'bg-[hsl(224,100%,58%,0.4)]'}`} style={{ height: `${20 + height * 0.8}%` }} />
            );
          })}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[9px] text-muted-foreground">95% CI: +12% to +38%</span>
          <span className="font-mono text-[9px] text-[hsl(162,91%,32%)]">Median: +24.5%</span>
        </div>
      </div>
    </Card>
  );
};
