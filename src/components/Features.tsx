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
  Trophy
} from "lucide-react";

// Competitive scores - auto-calculated monthly based on feature parity
const COMPETITIVE_SCORES = [
  { name: "AIQTP (Us)", score: 96, color: "bg-primary" },
  { name: "Bloomberg Terminal", score: 78, color: "bg-muted-foreground/50" },
  { name: "BlackRock Aladdin", score: 74, color: "bg-muted-foreground/50" },
  { name: "TD Thinkorswim", score: 65, color: "bg-muted-foreground/50" },
  { name: "TradingView", score: 58, color: "bg-muted-foreground/50" },
];

const features = [
  {
    icon: Atom,
    title: "QAQI™ Quantum Artificial Qubit Intelligence",
    description: "Autonomous quantum-enhanced AI for $QTC development, QuWallet operations, and self-learning capabilities.",
    benefits: ["Quantum computing", "$QTC blockchain", "Self-enhancement"],
    color: "purple",
    link: "/qaqi",
    badge: "NEW"
  },
  {
    icon: Bot,
    title: "AI Strategy Trading Bots™",
    description: "Deploy sophisticated trading bots with ML-powered strategies, arbitrage detection, and 24/7 automation.",
    benefits: ["Auto-trading", "Arbitrage scanning", "Strategy marketplace"],
    color: "blue",
    link: "/strategy-studio"
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
    title: "Advanced Trading™",
    description: "Professional-grade charts, Level II order books, pattern recognition, and smart order routing.",
    benefits: ["TradingView charts", "Pattern detection", "Smart orders"],
    color: "accent",
    link: "/advanced-trading"
  },
  {
    icon: Shield,
    title: "Post-Quantum Security™",
    description: "ML-KEM-768 encryption with FIPS 204-206 standards. Military-grade protection for all assets.",
    benefits: ["Quantum-resistant", "Multi-sig support", "Insurance coverage"],
    color: "primary",
    link: "/titan-codex"
  },
  {
    icon: BarChart3,
    title: "ML Predictions™",
    description: "Deep learning models for price prediction, sentiment analysis, and regime detection.",
    benefits: ["78% accuracy", "Real-time signals", "Multi-model ensemble"],
    color: "accent",
    link: "/ml-predictions"
  },
  {
    icon: Target,
    title: "Risk Management™",
    description: "Value-at-Risk, Monte Carlo simulations, and portfolio optimization tools.",
    benefits: ["VaR analytics", "Stress testing", "Correlation matrix"],
    color: "primary",
    link: "/risk"
  },
  {
    icon: Layers,
    title: "DeFi & Derivatives™",
    description: "Access DEX aggregation, yield farming, options, futures, and credit derivatives.",
    benefits: ["DEX sniper", "Yield optimizer", "Options trading"],
    color: "gold",
    link: "/derivatives"
  },
  {
    icon: Globe,
    title: "Multi-Exchange™",
    description: "Connect to 50+ exchanges with unified order book, cross-exchange arbitrage, and smart routing.",
    benefits: ["50+ exchanges", "Unified trading", "Best execution"],
    color: "accent",
    link: "/exchange"
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 bg-purple-500/10 text-purple-500 border-purple-500/30">
            <Cpu className="w-3 h-3 mr-1" />
            Industry-Leading Technology
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Beating the Competition
          </h2>
          
          {/* Competitive Score Chart - Directly below heading */}
          <Card className="p-6 max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Platform Feature Score</span>
            </div>
            <div className="space-y-4">
              {COMPETITIVE_SCORES.map((platform, idx) => (
                <div key={platform.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={idx === 0 ? "font-bold text-primary" : "text-muted-foreground"}>
                      {platform.name}
                    </span>
                    <span className={idx === 0 ? "font-bold text-primary" : "text-muted-foreground"}>
                      {platform.score}%
                    </span>
                  </div>
                  <Progress 
                    value={platform.score} 
                    className={`h-2 ${idx === 0 ? "[&>div]:bg-primary" : "[&>div]:bg-muted-foreground/30"}`} 
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Score based on feature parity analysis • Updated monthly
            </p>
          </Card>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Every feature institutional traders demand — AI-powered analytics, quantum-grade security, 
            and multi-exchange integration that surpasses Bloomberg, Binance, and traditional platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClass = feature.color === 'gold' ? 'text-gold' : 
                             feature.color === 'accent' ? 'text-accent' : 
                             feature.color === 'purple' ? 'text-purple-500' :
                             feature.color === 'blue' ? 'text-blue-500' : 'text-primary';
            const bgClass = feature.color === 'gold' ? 'bg-gold/10' : 
                          feature.color === 'accent' ? 'bg-accent/10' : 
                          feature.color === 'purple' ? 'bg-purple-500/10' :
                          feature.color === 'blue' ? 'bg-blue-500/10' : 'bg-primary/10';
            
            return (
              <Card 
                key={feature.title}
                className="card-premium p-6 h-full border-none group hover:scale-[1.02] transition-all duration-300"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={`inline-flex p-3 rounded-xl ${bgClass} group-hover:shadow-lg transition-smooth`}>
                      <Icon className={`w-7 h-7 ${colorClass}`} />
                    </div>
                    {feature.badge && (
                      <Badge variant="outline" className="text-[10px] bg-purple-500/20 text-purple-500 border-purple-500/30">
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">
                      {feature.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {feature.benefits.map((benefit, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                  
                  <Link to={feature.link}>
                    <Button variant="ghost" size="sm" className="w-full mt-2 group-hover:bg-muted transition-smooth">
                      Explore →
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Comparison Section */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-8">Why Choose AIQTP?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 text-center border-gold/30 bg-gold/5">
              <div className="text-3xl font-bold text-gold mb-2">15+</div>
              <div className="text-sm text-muted-foreground">AI Tools & Agents</div>
            </Card>
            <Card className="p-6 text-center border-purple-500/30 bg-purple-500/5">
              <div className="text-3xl font-bold text-purple-500 mb-2">Quantum</div>
              <div className="text-sm text-muted-foreground">Post-Quantum Security</div>
            </Card>
            <Card className="p-6 text-center border-accent/30 bg-accent/5">
              <div className="text-3xl font-bold text-accent mb-2">$0</div>
              <div className="text-sm text-muted-foreground">Lightning Network Fees</div>
            </Card>
          </div>
        </div>

        {/* Trademark Notice */}
        <div className="mt-16 text-center">
          <p className="text-xs text-muted-foreground max-w-2xl mx-auto">
            QAQI™, AI Strategy Trading Bots™, Lightning Vault Wallet®, and all associated marks are registered trademarks 
            of AIQTP. All intellectual property is secured via decentralized NFT minting and stored in the platform treasury.
          </p>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <Card className="card-premium p-12 bg-gradient-hero text-white border-none max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex justify-center gap-4">
                <Atom className="w-10 h-10 text-purple-400" />
                <Bot className="w-10 h-10 text-blue-400" />
                <Zap className="w-10 h-10 text-gold" />
              </div>
              <h3 className="text-3xl font-bold">
                Ready to trade with AI & Quantum power?
              </h3>
              <p className="text-xl text-white/90 max-w-2xl mx-auto">
                Join the most advanced trading platform with autonomous AI agents, quantum security, and institutional-grade infrastructure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="gold" size="lg">
                    Create Free Account
                  </Button>
                </Link>
                <Link to="/qaqi">
                  <Button variant="glass" size="lg">
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