import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ExchangeAffiliateLinks } from "@/components/affiliate/ExchangeAffiliateLinks";
import { PlatformStaking } from "@/components/staking/PlatformStaking";
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
  Headphones,
  DollarSign,
  Percent,
  Gift,
  ArrowRight,
  Sparkles,
  Users,
  AlertTriangle
} from "lucide-react";
import { Explain } from "@/components/ui/explainer-tooltip";
import { 
  FEE_SUMMARY, 
  PROFIT_TIERS, 
  NFT_FEES, 
  REAL_ESTATE_FEES, 
  COLLECTIBLES_FEES, 
  LUXURY_FEES, 
  PRECIOUS_METALS_FEES, 
  VIRTUAL_ASSETS_FEES, 
  MIN_INVESTMENT,
  AFFILIATE_FEES,
  calculateAffiliateEarnings
} from "@/lib/fees/platformFees";
import { QuickPayment } from "@/components/payments/QuickPayment";

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-success/20 text-success border-success/30">100% Free Access</Badge>
          <h1 className="text-xl sm:text-4xl font-bold mb-4">{FEE_SUMMARY.headline}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {FEE_SUMMARY.subheadline}
          </p>
        </div>

        {/* Tiered Fee Structure - Main Revenue Model */}
        <Card className="mb-12 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Percent className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Profit-Based Tiered Fees</CardTitle>
            <CardDescription className="text-base">
              The more you profit, the less you pay. No profits = No fees.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              {FEE_SUMMARY.tiers.map((tier, i) => (
                <div 
                  key={tier.range}
                  className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                    i === 3 ? 'border-primary bg-primary/10' : 'border-border'
                  }`}
                >
                  <div className={`text-xl sm:text-3xl font-bold mb-1 ${i === 3 ? 'text-primary' : ''}`}>
                    {PROFIT_TIERS[i].label}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">of profit</div>
                  <div className="text-xs font-medium bg-muted px-2 py-1 rounded">
                    {tier.range}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                <span><strong>${MIN_INVESTMENT}</strong> minimum investment</span>
              </div>
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-success" />
                <span><strong>$0</strong> if bot doesn't profit</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-success" />
                <span>Gas & transfer fees at cost</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Checkout */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Badge className="mb-2 bg-primary/20 text-primary border-primary/30">
              <DollarSign className="h-3 w-3 mr-1" />
              Deposit Checkout
            </Badge>
            <h2 className="text-2xl font-bold">Fund Your Trading Balance</h2>
            <p className="text-muted-foreground mt-2">No subscriptions. Use checkout only to add USD funds.</p>
          </div>
          
          <QuickPayment />
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
                  <div className="text-xl sm:text-4xl font-bold text-success">FREE</div>
                  <div className="text-sm text-muted-foreground">No subscription required</div>
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
                  Start Free
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Marketplace Fee Comparisons */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-2">Beat the Competition</Badge>
            <h2 className="text-2xl font-bold">Marketplace Fees vs Industry</h2>
            <p className="text-muted-foreground mt-2">We match or beat every competitor across all asset classes</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* NFT Marketplace */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  NFT Marketplace
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-success">{NFT_FEES.saleFee * 100}% sale fee</div>
                <div className="text-sm text-muted-foreground mb-3">$0 listing fee</div>
                {NFT_FEES.comparison.map(c => (
                  <div key={c.platform} className={`flex justify-between text-sm py-1 ${'highlight' in c && c.highlight ? 'text-primary font-bold' : ''}`}>
                    <span>{c.platform}</span>
                    <span>{c.fee}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Real Estate */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-500" />
                  Real Estate
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-success">{REAL_ESTATE_FEES.transactionFee * 100}% finder's fee</div>
                <div className="text-sm text-muted-foreground mb-3">$0 listing fee</div>
                {REAL_ESTATE_FEES.comparison.map(c => (
                  <div key={c.platform} className={`flex justify-between text-sm py-1 ${'highlight' in c && c.highlight ? 'text-primary font-bold' : ''}`}>
                    <span>{c.platform}</span>
                    <span>{c.fee}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Collectibles */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Collectibles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-success">1-9% tiered</div>
                <div className="text-sm text-muted-foreground mb-3">$0 listing, free auth</div>
                {COLLECTIBLES_FEES.comparison.map(c => (
                  <div key={c.platform} className={`flex justify-between text-sm py-1 ${'highlight' in c && c.highlight ? 'text-primary font-bold' : ''}`}>
                    <span>{c.platform}</span>
                    <span>{c.fee}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Luxury Goods */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-gold" />
                  Luxury Goods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-success">1-9% tiered</div>
                <div className="text-sm text-muted-foreground mb-3">Insurance included</div>
                {LUXURY_FEES.comparison.map(c => (
                  <div key={c.platform} className={`flex justify-between text-sm py-1 ${'highlight' in c && c.highlight ? 'text-primary font-bold' : ''}`}>
                    <span>{c.platform}</span>
                    <span>{c.fee}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Precious Metals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-yellow-500" />
                  Precious Metals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-success">{PRECIOUS_METALS_FEES.spreadFee * 100}% spread</div>
                <div className="text-sm text-muted-foreground mb-3">Free storage 1st year</div>
                {PRECIOUS_METALS_FEES.comparison.map(c => (
                  <div key={c.platform} className={`flex justify-between text-sm py-1 ${'highlight' in c && c.highlight ? 'text-primary font-bold' : ''}`}>
                    <span>{c.platform}</span>
                    <span>{c.fee}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Virtual Assets */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-cyan-500" />
                  Virtual Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-2xl font-bold text-success">{VIRTUAL_ASSETS_FEES.saleFee * 100}% sale fee</div>
                <div className="text-sm text-muted-foreground mb-3">$0 listing fee</div>
                {VIRTUAL_ASSETS_FEES.comparison.map(c => (
                  <div key={c.platform} className={`flex justify-between text-sm py-1 ${'highlight' in c && c.highlight ? 'text-primary font-bold' : ''}`}>
                    <span>{c.platform}</span>
                    <span>{c.fee}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Affiliate Program */}
        <Card className="mb-16 border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <CardTitle className="text-2xl">Earn with Referrals</CardTitle>
            <CardDescription className="text-base">
              Invite others and earn a percentage of the platform's earnings from their trades. Lifetime rewards!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl border-2 border-border text-center">
                <div className="text-xl sm:text-3xl font-bold mb-1">{AFFILIATE_FEES.baseTier.label}</div>
                <div className="text-sm text-muted-foreground mb-2">of platform's cut</div>
                <div className="text-xs font-medium bg-muted px-2 py-1 rounded">Base Tier</div>
              </div>
              {AFFILIATE_FEES.tierBonuses.map((tier, i) => (
                <div 
                  key={tier.minReferrals}
                  className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                    i === 2 ? 'border-blue-500 bg-blue-500/10' : 'border-border'
                  }`}
                >
                  <div className={`text-xl sm:text-3xl font-bold mb-1 ${i === 2 ? 'text-blue-400' : ''}`}>
                    {tier.label}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">of platform's cut</div>
                  <div className="text-xs font-medium bg-muted px-2 py-1 rounded">
                    {tier.minReferrals}+ referrals
                  </div>
                </div>
              ))}
            </div>
            
            {/* Example Calculation */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-2 text-sm">Example Earnings:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Your referral profits <strong>$5,000</strong> → Platform takes <strong>$450</strong> (9%)</p>
                <p>• At 0-9 referrals: You earn <strong>${AFFILIATE_FEES.example.referrerEarnings.base}</strong> ({AFFILIATE_FEES.baseTier.label} of $450)</p>
                <p>• At 10-49 referrals: You earn <strong>${AFFILIATE_FEES.example.referrerEarnings.tier10}</strong> (15% of $450)</p>
                <p>• At 50-99 referrals: You earn <strong>${AFFILIATE_FEES.example.referrerEarnings.tier50}</strong> (20% of $450)</p>
                <p>• At 100+ referrals: You earn <strong>${AFFILIATE_FEES.example.referrerEarnings.tier100}</strong> (25% of $450)</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground border-t pt-4">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-blue-400" />
                <span>Lifetime earnings from all referrals</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span>No cap on referral count</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What's Free */}
        <Card className="mb-16 bg-success/5 border-success/30">
          <CardContent className="py-8">
            <div className="text-center mb-6">
              <Gift className="h-12 w-12 mx-auto text-success mb-2" />
              <h2 className="text-2xl font-bold">Everything Free Includes</h2>
            </div>
            <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4">
              {FEE_SUMMARY.freeIncludes.map(item => (
                <div key={item} className="flex items-center gap-2 justify-center">
                  <Check className="h-4 w-4 text-success" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risk Warning */}
        <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-yellow-400 mb-1">Risk Warning</p>
              <p>
                Trading involves substantial risk of loss. Past performance is not indicative of future results. 
                Not financial advice. All fees subject to actual network costs. 
                <Link to="/legal" className="text-primary ml-1 hover:underline">Read full disclaimers →</Link>
              </p>
            </div>
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
            Full platform access is free. You only pay when your investments profit.
          </p>
          <Button variant="link">View Full FAQ →</Button>
        </div>

        {/* Exchange Affiliate Links */}
        <div className="mb-16">
          <ExchangeAffiliateLinks />
        </div>

        {/* Platform Staking */}
        <div className="mb-16">
          <PlatformStaking />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
