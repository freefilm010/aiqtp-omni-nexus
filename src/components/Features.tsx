import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { lazy, Suspense } from "react";
import {
  Zap, Shield, Brain, Globe, Bot, Atom, LineChart, Wallet, BarChart3,
  ScanSearch, Workflow, Sparkles, Trophy, Coins, Database, Network
} from "lucide-react";
import { AIPatternRecognition, RoboAdvisor, AutoStrategyBuilder, QuantAnalytics } from "./features/FeatureShowcaseWidgets";

const CompetitiveAnalysis = lazy(() => import("./features/CompetitiveAnalysis"));

const ECOSYSTEMS = [
  { icon: Atom, name: "QAQI™ Ecosystem", description: "Quantum AI agents", color: "purple" },
  { icon: Coins, name: "$QTC™ Token", description: "Native blockchain currency", color: "gold" },
  { icon: Database, name: "Data Economy™", description: "Tokenized data marketplace", color: "blue" },
  { icon: Network, name: "QuWallet®", description: "Quantum-secured wallet", color: "accent" },
];

const features = [
  { icon: ScanSearch, title: "Auto Pattern Recognition™", description: "AI-powered chart pattern detection with 94%+ accuracy.", benefits: ["50+ patterns", "Real-time alerts", "Multi-TF"], color: "purple", link: "/advanced-trading", badge: "AI" },
  { icon: Bot, title: "AI Robo-Advisor™", description: "Personalized portfolio recommendations powered by QAQI™.", benefits: ["Risk-adjusted", "Auto-rebalance", "Tax-loss harvest"], color: "gold", link: "/ml-predictions", badge: "NEW" },
  { icon: Workflow, title: "No-Code Strategy Builder", description: "Visual drag-and-drop strategy creation with Pine Script export.", benefits: ["Visual builder", "Pine export", "Walk-forward"], color: "blue", link: "/strategy-studio" },
  { icon: Atom, title: "QAQI™ Quantum AI Agent", description: "Autonomous quantum-enhanced AI for trading and self-learning.", benefits: ["Quantum computing", "$QTC™", "Self-enhancement"], color: "purple", link: "/qaqi" },
  { icon: Zap, title: "Lightning Vault Wallet®", description: "Revolutionary wallet with BOLT11 invoices for instant transactions.", benefits: ["Instant settlements", "USD invoices", "Zero gas"], color: "gold", link: "/vault" },
  { icon: LineChart, title: "TrendSpider-Class Charts", description: "Professional-grade charts with automated trendlines.", benefits: ["Auto trendlines", "Raindrop® charts", "Multi-TF sync"], color: "accent", link: "/advanced-trading" },
  { icon: Shield, title: "Post-Quantum Security", description: "ML-KEM-768 encryption with FIPS 204-206 standards.", benefits: ["Quantum-resistant", "Multi-sig", "Insurance"], color: "primary", link: "/titan-codex" },
  { icon: BarChart3, title: "ML Price Predictions", description: "Deep learning ensemble with LSTM, Transformer, and XGBoost.", benefits: ["78% accuracy", "Multi-model", "Confidence scores"], color: "accent", link: "/ml-predictions" },
  { icon: Globe, title: "Multi-Exchange Arbitrage", description: "Connect to 50+ exchanges with unified order book.", benefits: ["50+ exchanges", "Arb scanner", "Best execution"], color: "accent", link: "/exchange" },
];

const colorMap: Record<string, { text: string; bg: string }> = {
  gold: { text: "text-[hsl(43,96%,56%)]", bg: "bg-[hsl(43,96%,56%,0.1)]" },
  accent: { text: "text-[hsl(162,91%,32%)]", bg: "bg-[hsl(162,91%,32%,0.1)]" },
  purple: { text: "text-[hsl(270,91%,65%)]", bg: "bg-[hsl(270,91%,65%,0.1)]" },
  blue: { text: "text-[hsl(224,100%,58%)]", bg: "bg-[hsl(224,100%,58%,0.1)]" },
  primary: { text: "text-primary", bg: "bg-primary/10" },
};

const Features = () => {
  return (
    <section className="py-16 md:py-24 bg-[hsl(225,20%,6%)]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Competitive Analysis */}
        <Suspense fallback={null}>
          <CompetitiveAnalysis />
        </Suspense>

        {/* Live Demo Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-16">
          <AIPatternRecognition />
          <RoboAdvisor />
          <AutoStrategyBuilder />
          <QuantAnalytics />
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            const colors = colorMap[feature.color] ?? colorMap.primary;
            return (
              <Card
                key={feature.title}
                className="p-4 md:p-5 h-full bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)] hover:border-[hsl(222,14%,25%)] group hover:scale-[1.02] transition-all duration-300"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-4 h-4 md:w-5 md:h-5 ${colors.text}`} />
                    </div>
                    {feature.badge && (
                      <Badge className={`text-[9px] ${feature.badge === 'AI' ? 'bg-[hsl(270,91%,65%,0.15)] text-[hsl(270,91%,65%)]' : 'bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]'}`}>
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold mb-1 text-foreground">{feature.title}</h3>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {feature.benefits.map((b, i) => (
                      <Badge key={i} variant="outline" className="text-[9px] bg-[hsl(223,18%,12%)] border-[hsl(222,14%,22%)]">{b}</Badge>
                    ))}
                  </div>
                  <Link to={feature.link}>
                    <Button variant="ghost" size="sm" className="w-full mt-1 h-7 text-xs hover:bg-[hsl(223,18%,15%)]">Explore →</Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Ecosystems */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto mb-12">
          {ECOSYSTEMS.map((eco) => {
            const Icon = eco.icon;
            const colors = colorMap[eco.color] ?? colorMap.primary;
            return (
              <div key={eco.name} className={`relative p-4 md:p-6 rounded-xl border-2 ${colors.bg} hover:scale-105 transition-all duration-300 group`}
                style={{ borderColor: `hsl(var(--${eco.color === 'gold' ? 'gold' : eco.color === 'accent' ? 'accent' : eco.color === 'purple' ? 'purple' : 'blue'}))` }}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className={`p-2 md:p-3 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-6 h-6 md:w-8 md:h-8 ${colors.text}`} />
                  </div>
                  <h4 className={`font-bold text-xs md:text-sm ${colors.text}`}>{eco.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{eco.description}</p>
                  <Badge className="text-[8px] bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]">EXCLUSIVE</Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Why Choose + Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12">
          <Card className="p-4 text-center bg-[hsl(223,18%,9%)] border-[hsl(43,96%,56%,0.2)]">
            <div className="text-xl font-bold text-[hsl(43,96%,56%)] mb-1">15+</div>
            <div className="text-[9px] text-muted-foreground">AI Tools & Agents</div>
          </Card>
          <Card className="p-4 text-center bg-[hsl(223,18%,9%)] border-[hsl(270,91%,65%,0.2)]">
            <div className="text-xl font-bold text-[hsl(270,91%,65%)] mb-1">94%</div>
            <div className="text-[9px] text-muted-foreground">Pattern Accuracy</div>
          </Card>
          <Card className="p-4 text-center bg-[hsl(223,18%,9%)] border-[hsl(162,91%,32%,0.2)]">
            <div className="text-xl font-bold text-[hsl(162,91%,32%)] mb-1">$0</div>
            <div className="text-[9px] text-muted-foreground">Lightning Fees</div>
          </Card>
          <Card className="p-4 text-center bg-[hsl(223,18%,9%)] border-[hsl(224,100%,58%,0.2)]">
            <div className="text-xl font-bold text-[hsl(224,100%,58%)] mb-1">50+</div>
            <div className="text-[9px] text-muted-foreground">Exchanges</div>
          </Card>
        </div>

        {/* Trademark */}
        <p className="text-[10px] text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          AIQTP™, QAQI™, Auto Pattern Recognition™, AI Robo-Advisor™, AI Strategy Trading Bots™, Lightning Vault Wallet®, QuWallet®, $QTC™, Data Economy™,
          and all associated marks are registered trademarks of AIQTP.
        </p>

        {/* CTA */}
        <Card className="p-6 md:p-10 bg-gradient-to-br from-[hsl(223,18%,10%)] to-[hsl(225,20%,8%)] border-[hsl(222,14%,17%)] max-w-4xl mx-auto text-center">
          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              <Brain className="w-7 h-7 text-[hsl(270,91%,65%)]" />
              <Bot className="w-7 h-7 text-[hsl(224,100%,58%)]" />
              <Zap className="w-7 h-7 text-[hsl(43,96%,56%)]" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground">Ready to trade with AI & Quantum power?</h3>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Join the most advanced trading platform with autonomous AI agents, quantum security, and institutional-grade infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/auth">
                <Button size="lg" className="bg-[hsl(162,91%,32%)] hover:bg-[hsl(162,91%,38%)] text-white">Create Free Account</Button>
              </Link>
              <Link to="/qaqi">
                <Button variant="outline" size="lg" className="border-[hsl(270,91%,65%,0.4)] hover:bg-[hsl(270,91%,65%,0.1)]">Try QAQI Agent</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default Features;
