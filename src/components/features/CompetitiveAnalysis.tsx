import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy, Crown, Bot, Shield, Zap, Brain, Globe, Coins,
  ScanSearch, Activity, Sparkles, Workflow, BarChart2, CheckCircle2, Atom
} from "lucide-react";

const COMPETITIVE_MATRIX = {
  categories: [
    { name: "AI Trading Agents", icon: Bot },
    { name: "Pattern Recognition", icon: ScanSearch },
    { name: "Quantum Security", icon: Shield },
    { name: "Lightning Payments", icon: Zap },
    { name: "Robo-Advisor", icon: Brain },
    { name: "Strategy Builder", icon: Workflow },
    { name: "Multi-Exchange", icon: Globe },
    { name: "DeFi Integration", icon: Coins },
    { name: "NFT/Token Creation", icon: Sparkles },
    { name: "Real-Time Data", icon: Activity },
  ],
  platforms: [
    { name: "AIQTP™", isUs: true, scores: [98, 96, 100, 100, 94, 95, 92, 96, 100, 98] },
    { name: "TradingView", isUs: false, scores: [45, 72, 40, 0, 20, 65, 35, 10, 0, 75] },
    { name: "Bloomberg", isUs: false, scores: [55, 78, 70, 0, 75, 60, 80, 25, 0, 95] },
    { name: "TrendSpider", isUs: false, scores: [60, 88, 45, 0, 55, 82, 30, 15, 0, 80] },
    { name: "Tickeron", isUs: false, scores: [85, 75, 40, 0, 70, 70, 25, 20, 0, 70] },
    { name: "AInvest", isUs: false, scores: [70, 65, 35, 0, 80, 50, 40, 30, 0, 75] },
    { name: "Gate.com", isUs: false, scores: [55, 40, 50, 60, 45, 55, 70, 85, 40, 80] },
  ]
};

const COMPETITIVE_SCORES = COMPETITIVE_MATRIX.platforms.map(p => ({
  name: p.isUs ? "AIQTP™ (Us)" : p.name,
  score: Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length),
  isUs: p.isUs
})).sort((a, b) => b.score - a.score);

const CompetitiveAnalysis = () => (
  <div className="text-center mb-12">
    <Badge variant="outline" className="mb-4 bg-[hsl(43,96%,56%,0.1)] text-[hsl(43,96%,56%)] border-[hsl(43,96%,56%,0.3)]">
      <Trophy className="w-3 h-3 mr-1" />
      Industry-Leading Across Every Metric
    </Badge>
    <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
      AIQTP™ <span className="text-[hsl(162,91%,32%)]">Dominates</span> Every Category
    </h2>
    <p className="text-sm md:text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
      We beat TradingView, Bloomberg, TrendSpider, Tickeron, AInvest, and Gate.com across ALL 10 categories.
    </p>

    {/* Overall Score Leaderboard */}
    <Card className="p-4 md:p-6 max-w-3xl mx-auto mb-8 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)] glass-morphism">
      <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
        <Trophy className="h-5 w-5 text-[hsl(43,96%,56%)]" />
        <span className="font-semibold text-foreground text-sm md:text-base">Overall Platform Score</span>
      </div>
      <div className="space-y-3">
        {COMPETITIVE_SCORES.map((platform, idx) => (
          <div key={platform.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs md:text-sm">
              <div className="flex items-center gap-2">
                {idx === 0 && <Crown className="w-4 h-4 text-[hsl(43,96%,56%)]" />}
                <span className={platform.isUs ? "font-bold text-[hsl(162,91%,32%)]" : "text-muted-foreground"}>
                  {platform.name}
                </span>
              </div>
              <span className={platform.isUs ? "font-bold text-[hsl(162,91%,32%)]" : "text-muted-foreground"}>
                {platform.score}%
              </span>
            </div>
            <Progress
              value={platform.score}
              className={`h-2 ${platform.isUs ? "[&>div]:bg-gradient-to-r [&>div]:from-[hsl(162,91%,32%)] [&>div]:via-[hsl(43,96%,56%)] [&>div]:to-[hsl(270,91%,65%)]" : "[&>div]:bg-[hsl(222,14%,25%)]"}`}
            />
          </div>
        ))}
      </div>
    </Card>

    {/* Category Scores */}
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3 max-w-5xl mx-auto mb-8">
      {COMPETITIVE_MATRIX.categories.map((cat, i) => {
        const Icon = cat.icon;
        const ourScore = COMPETITIVE_MATRIX.platforms[0].scores[i];
        const bestCompetitor = Math.max(...COMPETITIVE_MATRIX.platforms.slice(1).map(p => p.scores[i]));
        const lead = ourScore - bestCompetitor;
        return (
          <Card key={cat.name} className="p-3 md:p-4 bg-[hsl(223,18%,8%)] border-[hsl(222,14%,17%)] group">
            <div className="flex flex-col items-center text-center space-y-1.5">
              <Icon className="w-4 h-4 md:w-5 md:h-5 text-[hsl(224,100%,58%)]" />
              <span className="font-mono text-[9px] md:text-[10px] text-muted-foreground">{cat.name}</span>
              <span className="font-mono text-base md:text-lg font-bold text-[hsl(162,91%,32%)]">{ourScore}%</span>
              <Badge className="text-[8px] bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]">+{lead}% vs best</Badge>
            </div>
          </Card>
        );
      })}
    </div>

    {/* Key Differentiators */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-6xl mx-auto mb-8">
      {[
        { icon: Atom, title: "Quantum AI", desc: "QAQI™ is the ONLY quantum-enhanced AI agent in trading.", tag: "Exclusive to AIQTP™", color: "270,91%,65%" },
        { icon: Zap, title: "$0 Fees", desc: "Lightning Network payments with ZERO gas fees.", tag: "100% fee-free", color: "43,96%,56%" },
        { icon: Bot, title: "8 AI Agents", desc: "Tickeron has 5, AInvest has 1. We have 8 specialized bots.", tag: "85%+ win rate", color: "162,91%,32%" },
        { icon: Shield, title: "Post-Quantum", desc: "FIPS 204-206 compliant. ML-KEM-768 encryption.", tag: "Military-grade", color: "224,100%,58%" },
      ].map((d) => {
        const Icon = d.icon;
        return (
          <Card key={d.title} className={`p-4 md:p-5 bg-[hsl(223,18%,9%)] border-[hsl(${d.color},0.3)]`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg bg-[hsl(${d.color},0.15)]`}>
                <Icon className={`w-4 h-4 md:w-5 md:h-5 text-[hsl(${d.color})]`} />
              </div>
              <h4 className="font-bold text-foreground text-sm">{d.title}</h4>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">{d.desc}</p>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(162,91%,32%)]" />
              <span className="text-[10px] text-[hsl(162,91%,32%)]">{d.tag}</span>
            </div>
          </Card>
        );
      })}
    </div>

    {/* Comparison Table — hidden on small mobile for perf */}
    <Card className="hidden sm:block p-4 md:p-6 max-w-6xl mx-auto bg-[hsl(223,18%,8%)] border-[hsl(222,14%,17%)] overflow-x-auto">
      <h4 className="font-bold text-foreground mb-4 flex items-center gap-2 text-sm">
        <BarChart2 className="w-5 h-5 text-[hsl(43,96%,56%)]" />
        Head-to-Head Feature Comparison
      </h4>
      <div className="min-w-[800px]">
        <div className="grid grid-cols-8 gap-2 text-[10px] font-mono mb-2">
          <div className="font-bold text-foreground">Feature</div>
          {COMPETITIVE_MATRIX.platforms.map(p => (
            <div key={p.name} className={`font-bold text-center ${p.isUs ? 'text-[hsl(162,91%,32%)]' : 'text-muted-foreground'}`}>
              {p.name}
            </div>
          ))}
        </div>
        {COMPETITIVE_MATRIX.categories.slice(0, 6).map((cat, i) => (
          <div key={cat.name} className="grid grid-cols-8 gap-2 text-[9px] py-2 border-t border-[hsl(222,14%,15%)]">
            <div className="text-muted-foreground flex items-center gap-1">
              <cat.icon className="w-3 h-3" />
              {cat.name}
            </div>
            {COMPETITIVE_MATRIX.platforms.map(p => (
              <div key={p.name} className="text-center">
                <span className={`font-bold ${p.scores[i] >= 90 ? 'text-[hsl(162,91%,32%)]' : p.scores[i] >= 70 ? 'text-[hsl(43,96%,56%)]' : p.scores[i] >= 50 ? 'text-muted-foreground' : 'text-[hsl(355,88%,58%,0.6)]'}`}>
                  {p.scores[i]}%
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  </div>
);

export default CompetitiveAnalysis;
