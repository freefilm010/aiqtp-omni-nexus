import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SmartTransferRouter from "@/components/payments/SmartTransferRouter";
import SavedPaymentMethods from "@/components/payments/SavedPaymentMethods";
import GuidedTour, { TourStep } from "@/components/onboarding/GuidedTour";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign,
  TrendingUp,
  Zap,
  Bot,
  CreditCard,
  ArrowUpRight,
  Activity,
  Shield,
  Wallet,
  RefreshCw,
  Play,
  Pause,
  Settings,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface RevenueStream {
  id: string;
  name: string;
  type: string;
  status: "active" | "paused" | "pending";
  dailyRevenue: number;
  monthlyRevenue: number;
  profitability: number;
  lastActive: string;
}

interface StripeStats {
  totalRevenue: number;
  pendingPayouts: number;
  subscriptions: number;
  oneTimePayments: number;
}

const WalletAssets = () => {
  const [loading, setLoading] = useState(false);
  const [stripeStats, setStripeStats] = useState<StripeStats>({
    totalRevenue: 0,
    pendingPayouts: 0,
    subscriptions: 0,
    oneTimePayments: 0,
  });
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([]);
  const { toast } = useToast();

  // Fetch real revenue data from platform_revenue table
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const { data } = await supabase
          .from("platform_revenue")
          .select("source_type, source_category, amount, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50);

        if (data && data.length > 0) {
          // Group by source_category to create streams
          const grouped: Record<string, { total: number; count: number; lastDate: string }> = {};
          data.forEach(row => {
            const key = row.source_category || row.source_type || "other";
            if (!grouped[key]) grouped[key] = { total: 0, count: 0, lastDate: row.created_at };
            grouped[key].total += Number(row.amount || 0);
            grouped[key].count += 1;
          });

          const streams: RevenueStream[] = Object.entries(grouped).map(([key, val], i) => ({
            id: String(i + 1),
            name: key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            type: key.includes("subscription") ? "subscription" : key.includes("trading") ? "trading" : "commission",
            status: "active" as const,
            dailyRevenue: val.total / Math.max(1, Math.ceil((Date.now() - new Date(val.lastDate).getTime()) / 86400000)),
            monthlyRevenue: val.total,
            profitability: 100,
            lastActive: new Date(val.lastDate).toLocaleString(),
          }));
          setRevenueStreams(streams);
        }
      } catch (err) {
        console.error("Error fetching revenue streams:", err);
      }
    };
    fetchStreams();
  }, []);

  const totalDailyRevenue = revenueStreams.reduce((sum, s) => sum + s.dailyRevenue, 0);
  const totalMonthlyRevenue = revenueStreams.reduce((sum, s) => sum + s.monthlyRevenue, 0);
  const avgProfitability = revenueStreams.reduce((sum, s) => sum + s.profitability, 0) / revenueStreams.length;

  const [customAmount, setCustomAmount] = useState("");

  const handleStripeDeposit = async (amount: number) => {
    setLoading(true);
    try {
      const isPreset = [20, 50, 100, 500].includes(amount);
      const body = isPreset
        ? {
            planId: `deposit-${amount}`,
            successUrl: `${window.location.origin}/payment-success?type=deposit&amount=${amount}`,
            cancelUrl: `${window.location.origin}/wallet-assets`,
          }
        : {
            planId: "custom-deposit",
            amount,
            successUrl: `${window.location.origin}/payment-success?type=deposit&amount=${amount}`,
            cancelUrl: `${window.location.origin}/wallet-assets`,
          };

      const { data, error } = await supabase.functions.invoke("stripe-checkout", { body });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscription = async (planId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          planId,
          successUrl: `${window.location.origin}/payment-success?type=subscription`,
          cancelUrl: `${window.location.origin}/wallet-assets`,
        },
      });
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initiate checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleStream = (id: string) => {
    setRevenueStreams(streams =>
      streams.map(s =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "paused" : "active" }
          : s
      )
    );
    toast({
      title: "Stream Updated",
      description: "Revenue stream status changed",
    });
  };

  const fundingTourSteps: TourStep[] = [
    { target: "[data-tour='tabs-nav']", title: "Navigation Tabs", description: "Switch between Revenue Streams, Funding, Subscription, and Compounding sections to manage all your money flows.", position: "bottom" },
    { target: "[data-tour='smart-router']", title: "Smart Transfer Router", description: "Automatically finds the cheapest way to move your money. We split the savings 50/50 — you always pay less.", position: "bottom" },
    { target: "[data-tour='stripe-card']", title: "Card & Bank Payments", description: "Add funds instantly with credit/debit cards or bank transfers via Stripe. Pick a preset amount or enter a custom one.", position: "bottom" },
    { target: "[data-tour='crypto-onramp']", title: "Crypto On-Ramp", description: "Buy crypto directly with fiat using MoonPay or Onramper — no exchange account needed.", position: "bottom" },
    { target: "[data-tour='subscription']", title: "Pro Subscription", description: "Unlock premium features, AI signals, and priority execution with a monthly subscription.", position: "bottom" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-24">
        {/* Hero Stats */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                <DollarSign className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Assets & Wallets
                </h1>
                <p className="text-muted-foreground">
                  Autonomous revenue generation • 24/7 profit engines
                </p>
              </div>
            </div>
            <GuidedTour steps={fundingTourSteps} tourKey="wallet-funding" autoStart />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Revenue</p>
                  <p className="text-xl sm:text-3xl font-bold text-emerald-400">
                    ${totalDailyRevenue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500/50" />
              </div>
              {revenueStreams.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {revenueStreams.filter(s => s.status === "active").length} active streams
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-xl sm:text-3xl font-bold text-cyan-400">
                    ${totalMonthlyRevenue.toLocaleString()}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-cyan-500/50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                From verified transactions
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Profitability</p>
                  <p className="text-xl sm:text-3xl font-bold text-purple-400">
                    {avgProfitability.toFixed(1)}%
                  </p>
                </div>
                <Zap className="h-8 w-8 text-purple-500/50" />
              </div>
              <Progress value={avgProfitability} className="mt-3 h-2" />
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Streams</p>
                  <p className="text-xl sm:text-3xl font-bold text-amber-400">
                    {revenueStreams.filter(s => s.status === "active").length}
                  </p>
                </div>
                <Bot className="h-8 w-8 text-amber-500/50" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {revenueStreams.length} total configured
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="funding" className="space-y-6">
          <TabsList data-tour="tabs-nav" className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="streams" className="gap-2">
              <Activity className="h-4 w-4" />
              Revenue Streams
            </TabsTrigger>
            <TabsTrigger value="funding" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Add Funds
            </TabsTrigger>
            <TabsTrigger value="exchange" className="gap-2">
              <Wallet className="h-4 w-4" />
              Exchange Connect
            </TabsTrigger>
            <TabsTrigger value="automation" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Auto-Compound
            </TabsTrigger>
          </TabsList>

          <TabsContent value="streams" className="space-y-4">
            <div className="grid gap-4">
              {revenueStreams.map((stream) => (
                <Card key={stream.id} className="border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${
                          stream.status === "active" 
                            ? "bg-emerald-500/20" 
                            : "bg-muted"
                        }`}>
                          {stream.type === "trading" ? (
                            <Bot className={`h-5 w-5 ${stream.status === "active" ? "text-emerald-400" : "text-muted-foreground"}`} />
                          ) : stream.type === "subscription" ? (
                            <CreditCard className={`h-5 w-5 ${stream.status === "active" ? "text-emerald-400" : "text-muted-foreground"}`} />
                          ) : (
                            <DollarSign className={`h-5 w-5 ${stream.status === "active" ? "text-emerald-400" : "text-muted-foreground"}`} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{stream.name}</h3>
                            <Badge variant={stream.status === "active" ? "default" : "secondary"}>
                              {stream.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Last active: {stream.lastActive}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Daily</p>
                          <p className="font-semibold text-emerald-400">
                            ${stream.dailyRevenue.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Monthly</p>
                          <p className="font-semibold">
                            ${stream.monthlyRevenue.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Profitability</p>
                          <p className={`font-semibold ${
                            stream.profitability >= 90 ? "text-emerald-400" : 
                            stream.profitability >= 80 ? "text-amber-400" : "text-red-400"
                          }`}>
                            {stream.profitability.toFixed(1)}%
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleStream(stream.id)}
                        >
                          {stream.status === "active" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="funding" className="space-y-6">
            {/* Deposit Hero Banner */}
            <Card className="border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 via-cyan-500/10 to-purple-500/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Deposit & Fund Your Account</h2>
                    <p className="text-muted-foreground text-sm">
                      Choose how you want to add money — card, bank, crypto, or wire. Funds appear instantly for card payments.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <Badge variant="outline" className="gap-1">
                        <Shield className="h-3 w-3" />
                        256-bit Encryption
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        Instant Deposits
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <DollarSign className="h-3 w-3" />
                        No Hidden Fees
                      </Badge>
                    </div>
                  </div>
                  <div className="hidden md:block p-3 rounded-xl bg-emerald-500/20">
                    <CreditCard className="h-10 w-10 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Smart Transfer Router */}
            <div data-tour="smart-router">
              <SmartTransferRouter />
            </div>

            {/* Saved Payment Methods */}
            <SavedPaymentMethods />

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Stripe Card Payments */}
              <Card data-tour="stripe-card" className="border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-400" />
                    Card / Bank
                  </CardTitle>
                  <CardDescription>
                    Pay with credit/debit card or bank transfer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[20, 50, 100, 500].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        className="h-14 text-lg font-semibold"
                        onClick={() => handleStripeDeposit(amount)}
                        disabled={loading}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Custom $" 
                      type="number" 
                      min={5}
                      max={10000}
                      className="flex-1" 
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                    />
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        const amt = Number(customAmount);
                        if (amt >= 5 && amt <= 10000) {
                          handleStripeDeposit(amt);
                        } else {
                          toast({ title: "Invalid amount", description: "Enter between $5 and $10,000", variant: "destructive" });
                        }
                      }}
                      disabled={loading || !customAmount}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Pay
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <img src="https://js.stripe.com/v3/fingerprinted/img/visa-729c05c240c4bdb47b03ac81d9945bfe.svg" alt="Visa" className="h-5" />
                    <img src="https://js.stripe.com/v3/fingerprinted/img/mastercard-4d8844094130711885b5e41b28c9848f.svg" alt="Mastercard" className="h-5" />
                    <img src="https://js.stripe.com/v3/fingerprinted/img/amex-a49b82f46c5cd6a96a6e418a6ca1717c.svg" alt="Amex" className="h-5" />
                    <span className="ml-auto">Powered by Stripe</span>
                  </div>
                </CardContent>
              </Card>

              {/* Crypto Onramp - MoonPay/Onramper */}
              <Card data-tour="crypto-onramp" className="border-orange-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-orange-400" />
                    Buy Crypto
                  </CardTitle>
                  <CardDescription>
                    Purchase crypto with card via MoonPay
                  </CardDescription>
                </CardHeader>
               <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {["BTC", "ETH", "SOL", "USDT"].map((coin) => (
                      <Button
                        key={coin}
                        variant="outline"
                        className="h-12 gap-2"
                        onClick={async () => {
                          // Fetch user's wallet address for this currency
                          let walletParam = "";
                          const networkMap: Record<string, string> = {
                            BTC: "bitcoin", ETH: "ethereum", SOL: "solana", USDT: "ethereum"
                          };
                          try {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (user) {
                              const network = networkMap[coin] || coin.toLowerCase();
                              const { data: quAddrs } = await supabase
                                .from("quwallet_addresses")
                                .select("address, network")
                                .limit(20) as { data: any[] | null };
                              
                              const matched = quAddrs?.find((a: any) => a.network === network);
                              if (matched?.address) {
                                walletParam = `&walletAddress=${encodeURIComponent(matched.address)}`;
                              } else {
                                const { data: platWallets } = await supabase
                                  .from("platform_wallets")
                                  .select("wallet_address, currency, is_active")
                                  .limit(20) as { data: any[] | null };
                                
                                const matchedPlat = platWallets?.find((w: any) => w.currency === coin && w.is_active);
                                if (matchedPlat?.wallet_address) {
                                  walletParam = `&walletAddress=${encodeURIComponent(matchedPlat.wallet_address)}`;
                                }
                              }
                            }
                          } catch (e) {
                            console.warn("Could not fetch wallet address for MoonPay:", e);
                          }
                          
                          window.open(
                            `https://www.moonpay.com/buy?apiKey=pk_live_demo&currencyCode=${coin.toLowerCase()}&baseCurrencyAmount=100${walletParam}`,
                            "_blank"
                          );
                        }}
                      >
                        <span className="font-bold">{coin}</span>
                      </Button>
                    ))}
                  </div>
                  <Button 
                    variant="outline"
                    className="w-full border-orange-500/50 text-orange-400 hover:bg-orange-500/10"
                    onClick={() => {
                      window.open("https://widget.onramper.com", "_blank");
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Onramper Widget
                  </Button>
                  <div className="text-xs text-muted-foreground text-center">
                    Supports 100+ cryptos • 40+ fiat currencies
                  </div>
                </CardContent>
              </Card>

              {/* Pro Subscription */}
              <Card data-tour="subscription" className="border-purple-500/30 lg:row-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-400" />
                    Pro Subscription
                  </CardTitle>
                  <CardDescription>
                    Unlock all premium features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/10 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xl sm:text-3xl font-bold">$49<span className="text-sm text-muted-foreground">/mo</span></p>
                        <p className="text-xs text-muted-foreground">Cancel anytime</p>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400">Popular</Badge>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {[
                        "Unlimited trading strategies",
                        "Priority bot execution",
                        "Real-time ML signals",
                        "Advanced analytics suite",
                        "Quantum computing access",
                        "24/7 priority support",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
                      onClick={() => handleSubscription("pro-monthly")}
                      disabled={loading}
                    >
                      Start Pro Trial
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                  
                  {/* Annual option */}
                  <div className="p-3 rounded-lg border border-dashed border-emerald-500/50 bg-emerald-500/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">Annual Plan</p>
                        <p className="text-xs text-muted-foreground">$399/yr (save 32%)</p>
                      </div>
                      <Button size="sm" variant="outline" className="border-emerald-500/50">
                        Upgrade
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Wire Transfer */}
              <Card className="border-cyan-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-400" />
                    Wire Transfer
                  </CardTitle>
                  <CardDescription>
                    For large deposits ($10k+)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm">
                    <p className="font-medium mb-2">Bank Details</p>
                    <div className="space-y-1 text-muted-foreground text-xs">
                      <p>Account: AIQTP Holdings LLC</p>
                      <p>Routing: Available on request</p>
                      <p>Reference: Your user ID</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Request Wire Instructions
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    1-3 business days • No fees on deposits over $25k
                  </p>
                </CardContent>
              </Card>

              {/* Plaid Bank Link */}
              <Card className="border-blue-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    Link Bank (Plaid)
                  </CardTitle>
                  <CardDescription>
                    Connect your bank for instant ACH
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Secure Connection</p>
                      <p className="text-xs text-muted-foreground">Bank-level encryption</p>
                    </div>
                  </div>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Connect with Plaid
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Supports 12,000+ banks • Free ACH transfers
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="exchange" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connect Exchange API</CardTitle>
                <CardDescription>
                  Connect your exchange accounts for live trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <span className="font-bold text-amber-400">B</span>
                        </div>
                        <div>
                          <p className="font-semibold">Binance</p>
                          <p className="text-sm text-muted-foreground">Full trading support</p>
                        </div>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400">Ready</Badge>
                    </div>

                    {["Coinbase", "Kraken", "Bybit", "KuCoin", "OKX"].map((exchange) => (
                      <div key={exchange} className="flex items-center justify-between p-4 rounded-lg border opacity-60">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <span className="font-bold text-muted-foreground">{exchange[0]}</span>
                          </div>
                          <div>
                            <p className="font-semibold">{exchange}</p>
                            <p className="text-sm text-muted-foreground">Coming soon</p>
                          </div>
                        </div>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          Soon
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        Binance API Setup
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <Label>API Key</Label>
                          <Input placeholder="Enter your Binance API key" type="password" />
                        </div>
                        <div>
                          <Label>API Secret</Label>
                          <Input placeholder="Enter your Binance API secret" type="password" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="spot-trading" />
                          <Label htmlFor="spot-trading">Enable Spot Trading</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch id="futures-trading" />
                          <Label htmlFor="futures-trading">Enable Futures Trading</Label>
                        </div>
                        <Button className="w-full">
                          <Shield className="h-4 w-4 mr-2" />
                          Connect Binance
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your API keys are encrypted and stored securely. We never store your withdrawal permissions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-cyan-400" />
                  Auto-Compounding Settings
                </CardTitle>
                <CardDescription>
                  Configure how profits are automatically reinvested
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Auto-Compound Profits</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically reinvest trading profits
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Ultra-Aggressive Strategy</p>
                        <p className="text-sm text-muted-foreground">
                          95% growth / 5% stable allocation
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Daily Rebalancing</p>
                        <p className="text-sm text-muted-foreground">
                          Automatically rebalance portfolio daily
                        </p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Profit Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Get notified when profits are compounded
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-4">Compounding Allocation</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Trading Bots</span>
                          <span className="text-emerald-400">40%</span>
                        </div>
                        <Progress value={40} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Yield Farming</span>
                          <span className="text-cyan-400">30%</span>
                        </div>
                        <Progress value={30} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Stablecoins</span>
                          <span className="text-amber-400">20%</span>
                        </div>
                        <Progress value={20} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Reserve</span>
                          <span className="text-purple-400">10%</span>
                        </div>
                        <Progress value={10} className="h-2" />
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Customize Allocation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default WalletAssets;
