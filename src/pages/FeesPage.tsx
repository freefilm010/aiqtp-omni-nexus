import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Shield,
  Gift,
  Percent,
  Users,
  Zap,
  Building2,
  Palette,
  Coins,
  Check,
  Info,
} from "lucide-react";
import { PROFIT_TIERS, calculatePlatformFee } from "@/lib/fees/platformFees";

const FeesPage = () => {
  const [profitAmount, setProfitAmount] = useState<number>(10000);
  const calculatedFee = calculatePlatformFee(profitAmount);

  const feeCategories = [
    {
      title: "Trading Profits",
      icon: TrendingUp,
      description: "Platform fee on realized trading gains only",
      details: [
        { label: "No Profits = No Fees", value: "Free" },
        { label: "$0 - $10,000 profits", value: "9%" },
        { label: "$10,001 - $100,000", value: "6%" },
        { label: "$100,001 - $1,000,000", value: "3%" },
        { label: "$1,000,000+", value: "1%" },
      ],
    },
    {
      title: "NFT & Digital Assets",
      icon: Palette,
      description: "Fees for NFT creation, trading, and royalties",
      details: [
        { label: "Minting Fee", value: "2%" },
        { label: "Secondary Sales", value: "2.5%" },
        { label: "Creator Royalties", value: "Up to 10%" },
        { label: "Auction Fees", value: "2%" },
      ],
    },
    {
      title: "Strategy Marketplace",
      icon: Users,
      description: "Revenue sharing for AI trading strategies",
      details: [
        { label: "Creator Share", value: "25% lifetime" },
        { label: "Renter Share", value: "40% of profits" },
        { label: "Platform Share", value: "20% (tiered)" },
        { label: "Listing Fee", value: "Free" },
      ],
    },
    {
      title: "Real Estate",
      icon: Building2,
      description: "Tokenized real estate investment fees",
      details: [
        { label: "Transaction Fee", value: "1%" },
        { label: "Management Fee", value: "0.5%/year" },
        { label: "Exit Fee", value: "0.5%" },
      ],
    },
    {
      title: "Lightning & Crypto",
      icon: Zap,
      description: "Lightning Network and crypto transaction fees",
      details: [
        { label: "Lightning Sends", value: "0.1%" },
        { label: "Lightning Receives", value: "Free" },
        { label: "On-chain Deposits", value: "Network fee only" },
        { label: "Swaps", value: "0.5%" },
      ],
    },
    {
      title: "Collectibles & Rare Items",
      icon: Coins,
      description: "Physical and virtual collectible fees",
      details: [
        { label: "$0 - $1,000", value: "5%" },
        { label: "$1,001 - $10,000", value: "4%" },
        { label: "$10,001 - $100,000", value: "3%" },
        { label: "$100,000+", value: "2%" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <DollarSign className="h-10 w-10 text-primary" />
            <h1 className="text-xl sm:text-4xl font-bold">Transparent Fee Schedule</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No hidden fees. No profits = No fees. We only earn when you earn.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-8 sm:mb-12">
          <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <CardContent className="pt-6 text-center">
              <Gift className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="font-bold text-lg">$0 to Start</p>
              <p className="text-sm text-muted-foreground">No account fees</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <Percent className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="font-bold text-lg">$20 Minimum</p>
              <p className="text-sm text-muted-foreground">Start investing</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-amber-500 mb-2" />
              <p className="font-bold text-lg">Tiered Fees</p>
              <p className="text-sm text-muted-foreground">9% → 1% as you grow</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="pt-6 text-center">
              <Shield className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <p className="font-bold text-lg">No Lock-up</p>
              <p className="text-sm text-muted-foreground">Withdraw anytime</p>
            </CardContent>
          </Card>
        </div>

        {/* Fee Calculator */}
        <Card className="mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Fee Calculator
            </CardTitle>
            <CardDescription>
              Enter your profit amount to see your estimated platform fee
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:gap-6">
              <div className="w-full">
                <label className="text-sm font-medium mb-2 block">Your Profit Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="number"
                    value={profitAmount}
                    onChange={(e) => setProfitAmount(Number(e.target.value))}
                    className="pl-10 text-lg"
                    placeholder="Enter profit amount"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">Platform Fee</p>
                  <p className="text-lg sm:text-4xl font-bold text-primary">
                    ${calculatedFee.fee.toFixed(2)}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px] sm:text-xs">
                    {calculatedFee.rate}% rate
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">You Keep</p>
                  <p className="text-lg sm:text-4xl font-bold text-success">
                    ${(profitAmount - calculatedFee.fee).toFixed(2)}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[10px] sm:text-xs">
                    {(((profitAmount - calculatedFee.fee) / profitAmount) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8 sm:mb-12">
          {feeCategories.map((category) => (
            <Card key={category.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <category.icon className="h-5 w-5 text-primary" />
                  {category.title}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">{detail.label}</span>
                      <Badge variant="outline">{detail.value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Profit Tier Breakdown */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Profit Tier Breakdown</CardTitle>
            <CardDescription>
              The more you earn, the lower your fee rate becomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Tier</th>
                    <th className="text-left py-3 px-4">Profit Range</th>
                    <th className="text-left py-3 px-4">Fee Rate</th>
                    <th className="text-left py-3 px-4">You Keep</th>
                    <th className="text-left py-3 px-4">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {PROFIT_TIERS.map((tier, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{tier.label}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        ${tier.min.toLocaleString()} - {tier.max === Infinity ? "∞" : `$${tier.max.toLocaleString()}`}
                      </td>
                      <td className="py-3 px-4 font-bold text-primary">{(tier.rate * 100).toFixed(0)}%</td>
                      <td className="py-3 px-4 text-success">{(100 - tier.rate * 100).toFixed(0)}%</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">
                        $10K profit → ${(10000 * tier.rate).toFixed(0)} fee
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* What's Free */}
        <Card className="mb-12 bg-success/5 border-success/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-success">
              <Check className="h-5 w-5" />
              Always Free
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                "Account creation",
                "Market data access",
                "AI predictions (basic)",
                "Portfolio tracking",
                "Price alerts",
                "Education content",
                "Community access",
                "Mobile app",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-success shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-amber-500" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Fees are calculated on realized profits only - unrealized gains are not charged</li>
              <li>• Gas fees and network costs are passed through at cost with no markup</li>
              <li>• Fee rates are subject to change with 30 days notice</li>
              <li>• Affiliate partners receive 20% of referral fees for 12 months</li>
              <li>• Elite Club members receive additional fee discounts</li>
              <li>• All fees displayed exclude applicable taxes which vary by jurisdiction</li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FeesPage;
