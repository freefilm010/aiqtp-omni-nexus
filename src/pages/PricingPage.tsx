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
    name: "Explorer",
    description: "Perfect for learning and paper trading",
    monthlyPrice: 0,
    annualPrice: 0,
    icon: <Star className="h-6 w-6" />,
    features: [
      "Paper trading unlimited",
      "3 saved strategies",
      "Basic AI signals",
      "Community access",
      "Educational content",
      "1 exchange connection"
    ],
    limits: {
      trades: "Paper only",
      strategies: "3 max",
      bots: "Demo bots",
      api: "100 calls/day"
    }
  },
  {
    name: "Trader",
    description: "For active traders ready to profit",
    monthlyPrice: 49,
    annualPrice: 470,
    icon: <TrendingUp className="h-6 w-6" />,
    features: [
      "Live trading enabled",
      "10 saved strategies",
      "Advanced AI signals",
      "Strategy backtesting",
      "5 exchange connections",
      "Priority email support",
      "Mobile app access"
    ],
    limits: {
      trades: "500/month",
      strategies: "10 max",
      bots: "3 rental slots",
      api: "5,000 calls/day"
    }
  },
  {
    name: "Professional",
    description: "Full power for serious traders",
    monthlyPrice: 149,
    annualPrice: 1430,
    icon: <Rocket className="h-6 w-6" />,
    popular: true,
    features: [
      "Unlimited live trading",
      "Unlimited strategies",
      "Quantum AI predictions",
      "Multi-window cockpit",
      "QuantScript editor",
      "All exchange connections",
      "Strategy marketplace access",
      "24/7 priority support",
      "API access full"
    ],
    limits: {
      trades: "Unlimited",
      strategies: "Unlimited",
      bots: "10 rental slots",
      api: "50,000 calls/day"
    }
  },
  {
    name: "Institutional",
    description: "Enterprise-grade for funds & desks",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    icon: <Building2 className="h-6 w-6" />,
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "White-label options",
      "Co-location services",
      "Custom AI model training",
      "SLA guarantees",
      "Compliance reporting",
      "Multi-seat licensing"
    ],
    limits: {
      trades: "Unlimited",
      strategies: "Unlimited",
      bots: "Unlimited",
      api: "Unlimited"
    }
  }
];

const ADD_ONS = [
  {
    name: "AI Bot Rental",
    description: "Rent top-performing graduated strategies",
    price: "From $29/mo",
    icon: <Bot className="h-5 w-5" />
  },
  {
    name: "Quantum Computing",
    description: "Access to quantum optimization algorithms",
    price: "$99/mo",
    icon: <Brain className="h-5 w-5" />
  },
  {
    name: "DeFi Sniper Pro",
    description: "Advanced mempool monitoring & frontrun protection",
    price: "$79/mo",
    icon: <Zap className="h-5 w-5" />
  },
  {
    name: "Institutional Data",
    description: "Level 3 order book, dark pool data, options flow",
    price: "$199/mo",
    icon: <Globe className="h-5 w-5" />
  }
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Transparent Pricing</Badge>
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Trading Power
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From beginners to institutions, we have a plan that fits your trading style.
            All plans include our core <Explain term="ai trading bots">AI-powered</Explain> features.
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
                  {typeof tier.monthlyPrice === "number" ? (
                    <>
                      <div className="text-4xl font-bold">
                        ${tier.monthlyPrice}
                        <span className="text-base font-normal text-muted-foreground">/mo</span>
                      </div>
                      {typeof tier.annualPrice === "number" && tier.annualPrice > 0 && (
                        <div className="text-sm text-muted-foreground">
                          ${tier.annualPrice}/year (save 20%)
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-3xl font-bold">Contact Sales</div>
                  )}
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

        {/* Add-ons Section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold mb-6 text-center">Power Add-ons</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {ADD_ONS.map((addon) => (
              <Card key={addon.name} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                      {addon.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{addon.name}</div>
                      <div className="text-sm text-primary font-medium">{addon.price}</div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{addon.description}</p>
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
