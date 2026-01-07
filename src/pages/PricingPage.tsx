import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Zap, 
  Crown, 
  Rocket, 
  Building2, 
  Star,
  TrendingUp,
  Bot,
  Brain,
  Shield,
  Globe,
  Headphones
} from "lucide-react";
import { Explain } from "@/components/ui/explainer-tooltip";

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number | "Custom";
  annualPrice: number | "Custom";
  icon: React.ReactNode;
  popular?: boolean;
  features: string[];
  limits: {
    trades: string;
    strategies: string;
    bots: string;
    api: string;
  };
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: "Starter",
    description: "Everything you need to begin trading",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: <Star className="h-6 w-6" />,
    features: [
      "Full platform access",
      "Unlimited paper trading",
      "5 saved strategies",
      "Basic AI signals",
      "Community access",
      "3 exchange connections",
      "Mobile app access"
    ],
    limits: {
      trades: "100/month live",
      strategies: "5 max",
      bots: "1 rental slot",
      api: "1,000 calls/day"
    }
  },
  {
    name: "Trader",
    description: "For active traders scaling up",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: <TrendingUp className="h-6 w-6" />,
    features: [
      "Everything in Starter",
      "Unlimited live trading",
      "Unlimited strategies",
      "Advanced AI signals",
      "Strategy backtesting",
      "10 exchange connections",
      "Priority support"
    ],
    limits: {
      trades: "Unlimited",
      strategies: "Unlimited",
      bots: "5 rental slots",
      api: "10,000 calls/day"
    }
  },
  {
    name: "Professional",
    description: "Full power for serious traders",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: <Rocket className="h-6 w-6" />,
    popular: true,
    features: [
      "Everything in Trader",
      "Quantum AI predictions",
      "Multi-window cockpit",
      "QuantScript editor",
      "All exchange connections",
      "Strategy marketplace listing",
      "24/7 priority support",
      "Full API access"
    ],
    limits: {
      trades: "Unlimited",
      strategies: "Unlimited",
      bots: "Unlimited rentals",
      api: "100,000 calls/day"
    }
  },
  {
    name: "Institutional",
    description: "Enterprise-grade for funds & desks",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: <Building2 className="h-6 w-6" />,
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
      "Co-location services",
      "Custom AI model training",
      "SLA guarantees",
      "Compliance reporting"
    ],
    limits: {
      trades: "Unlimited",
      strategies: "Unlimited",
      bots: "Unlimited",
      api: "Unlimited"
    }
  }
];

// Bot Rental Fee Structure - This is how we make money
const BOT_RENTAL_FEES = [
  {
    name: "Basic Bot",
    description: "Proven strategies with 1.0+ Sharpe ratio",
    monthlyFee: "$29/mo",
    profitShare: "10% of profits",
    minDeposit: "$500",
    icon: <Bot className="h-5 w-5" />
  },
  {
    name: "Advanced Bot",
    description: "High-performance strategies, 1.5+ Sharpe",
    monthlyFee: "$79/mo",
    profitShare: "15% of profits",
    minDeposit: "$2,000",
    icon: <Zap className="h-5 w-5" />
  },
  {
    name: "Elite Bot",
    description: "Top 5% performers, 2.0+ Sharpe ratio",
    monthlyFee: "$149/mo",
    profitShare: "20% of profits",
    minDeposit: "$5,000",
    icon: <Crown className="h-5 w-5" />
  },
  {
    name: "Quantum Bot",
    description: "Quantum-enhanced AI with adaptive learning",
    monthlyFee: "$299/mo",
    profitShare: "25% of profits",
    minDeposit: "$10,000",
    icon: <Brain className="h-5 w-5" />
  }
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-success/20 text-success border-success/30">100% Free Access</Badge>
          <h1 className="text-4xl font-bold mb-4">
            Free Platform. Pay Only for Profits.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Full platform access at $0/month. We only make money when you rent our 
            <Explain term="aiTradingBots"> AI Trading Bots</Explain> and profit from them.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {PRICING_TIERS.map((tier) => (
            <Card 
              key={tier.name}
              className={`relative ${tier.popular ? 'border-primary ring-2 ring-primary/20' : ''}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Crown className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                  {tier.icon}
                </div>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-success">
                    FREE
                  </div>
                  <div className="text-sm text-muted-foreground">
                    No subscription required
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 mb-4">
                  <div className="text-xs text-muted-foreground mb-2 font-semibold">LIMITS</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>Trades: <span className="font-medium">{tier.limits.trades}</span></div>
                    <div>Strategies: <span className="font-medium">{tier.limits.strategies}</span></div>
                    <div>Bots: <span className="font-medium">{tier.limits.bots}</span></div>
                    <div>API: <span className="font-medium">{tier.limits.api}</span></div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  variant={tier.popular ? "default" : "outline"}
                >
                  {tier.monthlyPrice === 0 ? "Start Free" : 
                   tier.monthlyPrice === "Custom" ? "Contact Sales" : "Subscribe"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bot Rental Fees Section - Revenue Model */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">How We Make Money</Badge>
            <h2 className="text-2xl font-bold">AI Bot Rental Fees</h2>
            <p className="text-muted-foreground mt-2">Rent graduated strategies • Pay only when you profit</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BOT_RENTAL_FEES.map((bot) => (
              <Card key={bot.name} className="hover:shadow-lg transition-shadow border-2 hover:border-primary/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      {bot.icon}
                    </div>
                    <div>
                      <div className="font-bold">{bot.name}</div>
                      <div className="text-lg text-primary font-semibold">{bot.monthlyFee}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{bot.description}</p>
                  <div className="space-y-2 text-sm border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profit Share:</span>
                      <span className="font-medium text-success">{bot.profitShare}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Deposit:</span>
                      <span className="font-medium">{bot.minDeposit}</span>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline">
                    View Available Bots
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <Card className="bg-gradient-hero text-white">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Need Institutional Solutions?</h2>
            <p className="mb-6 opacity-90 max-w-xl mx-auto">
              Custom integrations, dedicated infrastructure, compliance tools, and enterprise SLAs. 
              Let's discuss your requirements.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="secondary" size="lg">
                <Headphones className="mr-2 h-4 w-4" />
                Schedule Demo
              </Button>
              <Button variant="outline" size="lg" className="bg-transparent border-white hover:bg-white/10">
                <Shield className="mr-2 h-4 w-4" />
                Security Whitepaper
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Preview */}
        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold mb-4">Questions?</h3>
          <p className="text-muted-foreground mb-4">
            All plans come with a 14-day free trial. No credit card required for Explorer tier.
          </p>
          <Button variant="link">View Full FAQ →</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
