import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Zap, 
  Shield, 
  Brain, 
  Globe, 
  Lock, 
  TrendingUp,
  Users,
  RefreshCw,
  Eye,
  Smartphone,
  Bot,
  Atom,
  LineChart,
  Wallet,
  Target,
  BarChart3,
  Layers,
  Cpu,
  Trophy,
  Boxes,
  Database,
  Coins,
  Network,
  Sparkles,
  ScanSearch,
  Crosshair,
  Activity,
  Workflow,
  GitBranch,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Triangle,
  BarChart2,
  Gauge,
  PieChart
} from "lucide-react";
import { useState, useEffect } from "react";

// AI Pattern Recognition Module - TrendSpider-inspired
const AIPatternRecognition = () => {
  const [activePattern, setActivePattern] = useState(0);
  
  const patterns = [
    { name: "Head & Shoulders", confidence: 94, signal: "Bearish", color: "hsl(355,88%,58%)" },
    { name: "Double Bottom", confidence: 87, signal: "Bullish", color: "hsl(162,91%,32%)" },
    { name: "Bull Flag", confidence: 91, signal: "Bullish", color: "hsl(162,91%,32%)" },
    { name: "Ascending Triangle", confidence: 82, signal: "Bullish", color: "hsl(162,91%,32%)" },
    { name: "Bearish Wedge", confidence: 78, signal: "Bearish", color: "hsl(355,88%,58%)" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePattern(p => (p + 1) % patterns.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)] overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <ScanSearch className="w-5 h-5 text-[hsl(270,91%,65%)]" />
        <h3 className="font-bold text-foreground">Auto Pattern Recognition</h3>
        <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[10px]">LIVE</Badge>
      </div>
      
      {/* Pattern Visualization */}
      <div className="relative h-32 bg-[hsl(223,18%,7%)] rounded-lg mb-4 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <pattern id="patternGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(222,14%,15%)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#patternGrid)" />
        </svg>
        
        {/* Animated Pattern Line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 80" preserveAspectRatio="none">
          <path 
            d="M 0 60 L 30 55 L 50 30 L 70 45 L 90 20 L 110 40 L 130 25 L 150 55 L 170 35 L 200 40" 
            stroke="hsl(224,100%,58%)" 
            strokeWidth="2" 
            fill="none"
            className="animate-pulse"
          />
          {/* Pattern highlight */}
          <circle cx="90" cy="20" r="4" fill={patterns[activePattern].color} className="animate-pulse" />
          <circle cx="130" cy="25" r="4" fill={patterns[activePattern].color} className="animate-pulse" />
        </svg>
        
        {/* Pattern Label */}
        <div className="absolute top-2 left-2 px-2 py-1 rounded bg-[hsl(223,18%,12%)] border border-[hsl(222,14%,20%)]">
          <span className="font-mono text-[10px] text-foreground">{patterns[activePattern].name}</span>
        </div>
        
        {/* Confidence */}
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded" style={{ backgroundColor: `${patterns[activePattern].color}20` }}>
          <span className="font-mono text-[11px] font-bold" style={{ color: patterns[activePattern].color }}>
            {patterns[activePattern].confidence}% conf.
          </span>
        </div>
      </div>
      
      {/* Pattern List */}
      <div className="space-y-2">
        {patterns.map((pattern, i) => (
          <div 
            key={pattern.name}
            className={`flex items-center justify-between p-2 rounded transition-all ${i === activePattern ? 'bg-[hsl(223,18%,12%)] border border-[hsl(222,14%,22%)]' : ''}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${pattern.signal === 'Bullish' ? 'bg-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%)]'}`} />
              <span className="font-mono text-xs text-foreground">{pattern.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-[9px] ${pattern.signal === 'Bullish' ? 'text-[hsl(162,91%,32%)] border-[hsl(162,91%,32%,0.3)]' : 'text-[hsl(355,88%,58%)] border-[hsl(355,88%,58%,0.3)]'}`}>
                {pattern.signal}
              </Badge>
              <span className="font-mono text-[10px] text-muted-foreground">{pattern.confidence}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// AI Robo-Advisor Module
const RoboAdvisor = () => {
  const recommendations = [
    { asset: "BTC", action: "HOLD", allocation: 35, reason: "Strong momentum, await pullback" },
    { asset: "ETH", action: "BUY", allocation: 25, reason: "L2 growth catalyst" },
    { asset: "SOL", action: "BUY", allocation: 20, reason: "DeFi TVL surge" },
    { asset: "AVAX", action: "REDUCE", allocation: 10, reason: "Overbought RSI" },
    { asset: "LINK", action: "HOLD", allocation: 10, reason: "Oracle dominance" },
  ];

  return (
    <Card className="p-6 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-[hsl(43,96%,56%)]" />
          <h3 className="font-bold text-foreground">AI Robo-Advisor</h3>
        </div>
        <Badge className="bg-[hsl(270,91%,65%,0.15)] text-[hsl(270,91%,65%)] text-[10px]">QAQI™ POWERED</Badge>
      </div>
      
      {/* Risk Profile */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,15%)]">
        <Gauge className="w-8 h-8 text-[hsl(162,91%,32%)]" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs text-foreground">Risk Score</span>
            <span className="font-mono text-xs font-bold text-[hsl(162,91%,32%)]">Moderate</span>
          </div>
          <Progress value={62} className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-[hsl(162,91%,32%)] [&>div]:to-[hsl(43,96%,56%)]" />
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="space-y-2">
        {recommendations.map((rec) => (
          <div key={rec.asset} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[hsl(223,18%,15%)] flex items-center justify-center">
                <span className="font-mono text-[10px] font-bold text-foreground">{rec.asset}</span>
              </div>
              <div>
                <Badge 
                  className={`text-[9px] ${
                    rec.action === 'BUY' ? 'bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]' :
                    rec.action === 'REDUCE' ? 'bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)]' :
                    'bg-[hsl(43,96%,56%,0.15)] text-[hsl(43,96%,56%)]'
                  }`}
                >
                  {rec.action}
                </Badge>
                <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{rec.reason}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-bold text-foreground">{rec.allocation}%</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Automated Strategy Builder
const AutoStrategyBuilder = () => {
  const strategies = [
    { name: "Mean Reversion RSI", winRate: 72, pnl: "+18.4%", status: "active" },
    { name: "MACD Crossover", winRate: 68, pnl: "+12.1%", status: "active" },
    { name: "Breakout Scanner", winRate: 65, pnl: "+9.8%", status: "testing" },
  ];

  return (
    <Card className="p-6 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      <div className="flex items-center gap-2 mb-4">
        <Workflow className="w-5 h-5 text-[hsl(224,100%,58%)]" />
        <h3 className="font-bold text-foreground">Auto Strategy Builder</h3>
      </div>
      
      {/* Strategy Flow */}
      <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,15%)] overflow-x-auto">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[hsl(270,91%,65%,0.15)] text-[hsl(270,91%,65%)]">
          <Brain className="w-3 h-3" />
          <span className="font-mono text-[10px]">Signal</span>
        </div>
        <GitBranch className="w-3 h-3 text-muted-foreground" />
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[hsl(224,100%,58%,0.15)] text-[hsl(224,100%,58%)]">
          <Target className="w-3 h-3" />
          <span className="font-mono text-[10px]">Filter</span>
        </div>
        <GitBranch className="w-3 h-3 text-muted-foreground" />
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]">
          <Zap className="w-3 h-3" />
          <span className="font-mono text-[10px]">Execute</span>
        </div>
      </div>
      
      {/* Active Strategies */}
      <div className="space-y-2">
        {strategies.map((strat) => (
          <div key={strat.name} className="flex items-center justify-between p-2 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${strat.status === 'active' ? 'bg-[hsl(162,91%,32%)] animate-pulse' : 'bg-[hsl(43,96%,56%)]'}`} />
              <span className="font-mono text-xs text-foreground">{strat.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground">{strat.winRate}% WR</span>
              <span className="font-mono text-xs font-bold text-[hsl(162,91%,32%)]">{strat.pnl}</span>
            </div>
          </div>
        ))}
      </div>
      
      <Button variant="outline" size="sm" className="w-full mt-4 border-[hsl(222,14%,22%)] hover:bg-[hsl(223,18%,15%)]">
        <Sparkles className="w-3 h-3 mr-2 text-[hsl(270,91%,65%)]" />
        Create New Strategy
      </Button>
    </Card>
  );
};

// Quantitative Analysis Dashboard
const QuantAnalytics = () => {
  const metrics = [
    { label: "Sharpe Ratio", value: "2.34", good: true },
    { label: "Sortino", value: "3.12", good: true },
    { label: "Max DD", value: "-8.2%", good: true },
    { label: "Win Rate", value: "67%", good: true },
  ];

  return (
    <Card className="p-6 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-[hsl(162,91%,32%)]" />
        <h3 className="font-bold text-foreground">Quant Analytics</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {metrics.map((m) => (
          <div key={m.label} className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
            <p className="font-mono text-[9px] text-muted-foreground uppercase">{m.label}</p>
            <p className={`font-mono text-lg font-bold ${m.good ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>{m.value}</p>
          </div>
        ))}
      </div>
      
      {/* Monte Carlo */}
      <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,15%)]">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] text-muted-foreground">Monte Carlo Simulation</span>
          <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[9px]">10K runs</Badge>
        </div>
        <div className="h-12 flex items-end gap-0.5">
          {Array.from({ length: 24 }, (_, i) => {
            const height = Math.random() * 100;
            const isHigh = height > 60;
            return (
              <div 
                key={i}
                className={`flex-1 rounded-t-sm ${isHigh ? 'bg-[hsl(162,91%,32%,0.6)]' : 'bg-[hsl(224,100%,58%,0.4)]'}`}
                style={{ height: `${20 + height * 0.8}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="font-mono text-[9px] text-muted-foreground">95% CI: +12% to +38%</span>
          <span className="font-mono text-[9px] text-[hsl(162,91%,32%)]">Median: +24.5%</span>
        </div>
      </div>
    </Card>
  );
};

// Ecosystem highlights - AIQTP™ proprietary ecosystems
const ECOSYSTEMS = [
  { 
    icon: Atom, 
    name: "QAQI™ Ecosystem", 
    description: "Quantum AI agents", 
    color: "purple" 
  },
  { 
    icon: Coins, 
    name: "$QTC™ Token", 
    description: "Native blockchain currency", 
    color: "gold" 
  },
  { 
    icon: Database, 
    name: "Data Economy™", 
    description: "Tokenized data marketplace", 
    color: "blue" 
  },
  { 
    icon: Network, 
    name: "QuWallet®", 
    description: "Quantum-secured wallet", 
    color: "accent" 
  },
];

// Competitive scores - auto-calculated monthly based on feature parity
const COMPETITIVE_SCORES = [
  { name: "AIQTP (Us)", score: 96, color: "bg-primary" },
  { name: "Bloomberg Terminal", score: 78, color: "bg-muted-foreground/50" },
  { name: "TrendSpider", score: 72, color: "bg-muted-foreground/50" },
  { name: "TD Thinkorswim", score: 65, color: "bg-muted-foreground/50" },
  { name: "TradingView", score: 58, color: "bg-muted-foreground/50" },
];

const features = [
  {
    icon: ScanSearch,
    title: "Auto Pattern Recognition™",
    description: "AI-powered chart pattern detection with 94%+ accuracy. Head & shoulders, wedges, flags auto-detected in real-time.",
    benefits: ["50+ patterns", "Real-time alerts", "Multi-timeframe"],
    color: "purple",
    link: "/advanced-trading",
    badge: "AI"
  },
  {
    icon: Bot,
    title: "AI Robo-Advisor™",
    description: "Personalized portfolio recommendations powered by QAQI™ quantum intelligence and ML risk profiling.",
    benefits: ["Risk-adjusted", "Auto-rebalance", "Tax-loss harvest"],
    color: "gold",
    link: "/ml-predictions",
    badge: "NEW"
  },
  {
    icon: Workflow,
    title: "No-Code Strategy Builder",
    description: "Visual drag-and-drop strategy creation with Pine Script export. Backtest instantly across 10+ years.",
    benefits: ["Visual builder", "Pine export", "Walk-forward"],
    color: "blue",
    link: "/strategy-studio"
  },
  {
    icon: Atom,
    title: "QAQI™ Quantum AI Agent",
    description: "Autonomous quantum-enhanced AI for $QTC development, QuWallet® operations, and self-learning capabilities.",
    benefits: ["Quantum computing", "$QTC™ blockchain", "Self-enhancement"],
    color: "purple",
    link: "/qaqi"
  },
  {
    icon: Zap,
    title: "Lightning Vault Wallet®",
    description: "Revolutionary wallet with BOLT11 invoices for instant, secure transactions. Coinbase-compatible.",
    benefits: ["Instant settlements", "USD invoices", "Zero gas fees"],
    color: "gold",
    link: "/vault"
  },
  {
    icon: LineChart,
    title: "TrendSpider-Class Charts",
    description: "Professional-grade charts with automated trendlines, Fibonacci, and multi-timeframe analysis.",
    benefits: ["Auto trendlines", "Raindrop® charts", "Multi-TF sync"],
    color: "accent",
    link: "/advanced-trading"
  },
  {
    icon: Shield,
    title: "Post-Quantum Security",
    description: "ML-KEM-768 encryption with FIPS 204-206 standards. Military-grade protection for all assets.",
    benefits: ["Quantum-resistant", "Multi-sig support", "Insurance coverage"],
    color: "primary",
    link: "/titan-codex"
  },
  {
    icon: BarChart3,
    title: "ML Price Predictions",
    description: "Deep learning ensemble with LSTM, Transformer, and XGBoost models for price forecasting.",
    benefits: ["78% accuracy", "Multi-model", "Confidence scores"],
    color: "accent",
    link: "/ml-predictions"
  },
  {
    icon: Globe,
    title: "Multi-Exchange Arbitrage",
    description: "Connect to 50+ exchanges with unified order book, cross-exchange arbitrage, and smart routing.",
    benefits: ["50+ exchanges", "Arb scanner", "Best execution"],
    color: "accent",
    link: "/exchange"
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-[hsl(225,20%,6%)]">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* AI Trading Tools Showcase - TrendSpider/Tickeron Inspired */}
        <div className="mb-20">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4 bg-[hsl(270,91%,65%,0.1)] text-[hsl(270,91%,65%)] border-[hsl(270,91%,65%,0.3)]">
              <Brain className="w-3 h-3 mr-1" />
              AI-Powered Trading Suite
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Institutional AI, <span className="text-[hsl(162,91%,32%)]">Retail Access</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Pattern recognition, robo-advisors, and quantitative tools that rival Bloomberg and TrendSpider — at a fraction of the cost.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AIPatternRecognition />
            <RoboAdvisor />
            <AutoStrategyBuilder />
            <QuantAnalytics />
          </div>
        </div>

        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 bg-[hsl(43,96%,56%,0.1)] text-[hsl(43,96%,56%)] border-[hsl(43,96%,56%,0.3)]">
            <Trophy className="w-3 h-3 mr-1" />
            Industry-Leading Technology
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Beating the Competition
          </h2>
          
          {/* Competitive Score Chart */}
          <Card className="p-6 max-w-2xl mx-auto mb-8 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Trophy className="h-5 w-5 text-[hsl(43,96%,56%)]" />
              <span className="font-semibold text-foreground">Platform Feature Score</span>
            </div>
            <div className="space-y-4">
              {COMPETITIVE_SCORES.map((platform, idx) => (
                <div key={platform.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={idx === 0 ? "font-bold text-[hsl(162,91%,32%)]" : "text-muted-foreground"}>
                      {platform.name}
                    </span>
                    <span className={idx === 0 ? "font-bold text-[hsl(162,91%,32%)]" : "text-muted-foreground"}>
                      {platform.score}%
                    </span>
                  </div>
                  <Progress 
                    value={platform.score} 
                    className={`h-2 ${idx === 0 ? "[&>div]:bg-gradient-to-r [&>div]:from-[hsl(162,91%,32%)] [&>div]:to-[hsl(43,96%,56%)]" : "[&>div]:bg-[hsl(222,14%,25%)]"}`} 
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Score based on feature parity analysis • Updated monthly
            </p>
          </Card>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-10">
            Every feature institutional traders demand — AI-powered analytics, quantum-grade security, 
            and multi-exchange integration that surpasses Bloomberg, TrendSpider, and traditional platforms.
          </p>
          
          {/* Ecosystems Highlight Squares */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {ECOSYSTEMS.map((eco) => {
              const Icon = eco.icon;
              const borderColor = eco.color === 'gold' ? 'border-[hsl(43,96%,56%,0.3)]' : 
                                 eco.color === 'accent' ? 'border-[hsl(162,91%,32%,0.3)]' : 
                                 eco.color === 'purple' ? 'border-[hsl(270,91%,65%,0.3)]' :
                                 eco.color === 'blue' ? 'border-[hsl(224,100%,58%,0.3)]' : 'border-primary/30';
              const bgColor = eco.color === 'gold' ? 'bg-[hsl(43,96%,56%,0.1)]' : 
                             eco.color === 'accent' ? 'bg-[hsl(162,91%,32%,0.1)]' : 
                             eco.color === 'purple' ? 'bg-[hsl(270,91%,65%,0.1)]' :
                             eco.color === 'blue' ? 'bg-[hsl(224,100%,58%,0.1)]' : 'bg-primary/10';
              const textColor = eco.color === 'gold' ? 'text-[hsl(43,96%,56%)]' : 
                               eco.color === 'accent' ? 'text-[hsl(162,91%,32%)]' : 
                               eco.color === 'purple' ? 'text-[hsl(270,91%,65%)]' :
                               eco.color === 'blue' ? 'text-[hsl(224,100%,58%)]' : 'text-primary';
              
              return (
                <div 
                  key={eco.name}
                  className={`relative p-6 rounded-xl border-2 ${borderColor} ${bgColor} hover:scale-105 transition-all duration-300 group`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className={`p-3 rounded-lg ${bgColor} group-hover:shadow-lg transition-smooth`}>
                      <Icon className={`w-8 h-8 ${textColor}`} />
                    </div>
                    <div>
                      <h4 className={`font-bold ${textColor}`}>{eco.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{eco.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClass = feature.color === 'gold' ? 'text-[hsl(43,96%,56%)]' : 
                             feature.color === 'accent' ? 'text-[hsl(162,91%,32%)]' : 
                             feature.color === 'purple' ? 'text-[hsl(270,91%,65%)]' :
                             feature.color === 'blue' ? 'text-[hsl(224,100%,58%)]' : 'text-primary';
            const bgClass = feature.color === 'gold' ? 'bg-[hsl(43,96%,56%,0.1)]' : 
                          feature.color === 'accent' ? 'bg-[hsl(162,91%,32%,0.1)]' : 
                          feature.color === 'purple' ? 'bg-[hsl(270,91%,65%,0.1)]' :
                          feature.color === 'blue' ? 'bg-[hsl(224,100%,58%,0.1)]' : 'bg-primary/10';
            
            return (
              <Card 
                key={feature.title}
                className="p-5 h-full bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)] hover:border-[hsl(222,14%,25%)] group hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex p-2.5 rounded-lg ${bgClass}`}>
                      <Icon className={`w-5 h-5 ${colorClass}`} />
                    </div>
                    {feature.badge && (
                      <Badge className={`text-[9px] ${feature.badge === 'AI' ? 'bg-[hsl(270,91%,65%,0.15)] text-[hsl(270,91%,65%)]' : 'bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]'}`}>
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-base font-bold mb-1.5 text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5">
                    {feature.benefits.map((benefit, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] bg-[hsl(223,18%,12%)] border-[hsl(222,14%,22%)]">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                  
                  <Link to={feature.link}>
                    <Button variant="ghost" size="sm" className="w-full mt-1 h-8 text-xs hover:bg-[hsl(223,18%,15%)]">
                      Explore →
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Why Choose Section */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-8 text-foreground">Why Choose AIQTP?</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Card className="p-5 text-center bg-[hsl(223,18%,9%)] border-[hsl(43,96%,56%,0.2)]">
              <div className="text-2xl font-bold text-[hsl(43,96%,56%)] mb-1">15+</div>
              <div className="text-xs text-muted-foreground">AI Tools & Agents</div>
            </Card>
            <Card className="p-5 text-center bg-[hsl(223,18%,9%)] border-[hsl(270,91%,65%,0.2)]">
              <div className="text-2xl font-bold text-[hsl(270,91%,65%)] mb-1">94%</div>
              <div className="text-xs text-muted-foreground">Pattern Accuracy</div>
            </Card>
            <Card className="p-5 text-center bg-[hsl(223,18%,9%)] border-[hsl(162,91%,32%,0.2)]">
              <div className="text-2xl font-bold text-[hsl(162,91%,32%)] mb-1">$0</div>
              <div className="text-xs text-muted-foreground">Lightning Fees</div>
            </Card>
            <Card className="p-5 text-center bg-[hsl(223,18%,9%)] border-[hsl(224,100%,58%,0.2)]">
              <div className="text-2xl font-bold text-[hsl(224,100%,58%)] mb-1">50+</div>
              <div className="text-xs text-muted-foreground">Exchanges</div>
            </Card>
          </div>
        </div>

        {/* Trademark Notice */}
        <div className="mt-16 text-center">
          <p className="text-[10px] text-muted-foreground max-w-2xl mx-auto">
            AIQTP™, QAQI™, Auto Pattern Recognition™, AI Robo-Advisor™, AI Strategy Trading Bots™, Lightning Vault Wallet®, QuWallet®, $QTC™, Data Economy™, 
            and all associated marks are registered trademarks of AIQTP. All intellectual property is secured 
            via decentralized NFT minting and stored in the platform treasury.
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="p-10 bg-gradient-to-br from-[hsl(223,18%,10%)] to-[hsl(225,20%,8%)] border-[hsl(222,14%,17%)] max-w-4xl mx-auto">
            <div className="space-y-5">
              <div className="flex justify-center gap-3">
                <Brain className="w-8 h-8 text-[hsl(270,91%,65%)]" />
                <Bot className="w-8 h-8 text-[hsl(224,100%,58%)]" />
                <Zap className="w-8 h-8 text-[hsl(43,96%,56%)]" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                Ready to trade with AI & Quantum power?
              </h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Join the most advanced trading platform with autonomous AI agents, quantum security, and institutional-grade infrastructure.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="bg-[hsl(162,91%,32%)] hover:bg-[hsl(162,91%,38%)] text-white">
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/qaqi">
                  <Button variant="outline" size="lg" className="border-[hsl(270,91%,65%,0.4)] hover:bg-[hsl(270,91%,65%,0.1)]">
                    Try QAQI Agent
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Features;