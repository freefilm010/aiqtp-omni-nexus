import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
  const [revenueStreams, setRevenueStreams] = useState<RevenueStream[]>([
    {
      id: "1",
      name: "Strategy Marketplace",
      type: "commission",
      status: "active",
      dailyRevenue: 127.50,
      monthlyRevenue: 3825,
      profitability: 94.2,
      lastActive: "2 minutes ago",
    },
    {
      id: "2",
      name: "Premium Subscriptions",
      type: "subscription",
      status: "active",
      dailyRevenue: 89.00,
      monthlyRevenue: 2670,
      profitability: 100,
      lastActive: "Just now",
    },
    {
      id: "3",
      name: "Arbitrage Bot Alpha",
      type: "trading",
      status: "active",
      dailyRevenue: 45.30,
      monthlyRevenue: 1359,
      profitability: 92.5,
      lastActive: "5 seconds ago",
    },
    {
      id: "4",
      name: "Data Marketplace",
      type: "data_sales",
      status: "active",
      dailyRevenue: 34.00,
      monthlyRevenue: 1020,
      profitability: 88.0,
      lastActive: "1 hour ago",
    },
    {
      id: "5",
      name: "Copy Trading Fees",
      type: "commission",
      status: "active",
      dailyRevenue: 67.20,
      monthlyRevenue: 2016,
      profitability: 95.0,
      lastActive: "10 minutes ago",
    },
  ]);
  const { toast } = useToast();

  const totalDailyRevenue = revenueStreams.reduce((sum, s) => sum + s.dailyRevenue, 0);
  const totalMonthlyRevenue = revenueStreams.reduce((sum, s) => sum + s.monthlyRevenue, 0);
  const avgProfitability = revenueStreams.reduce((sum, s) => sum + s.profitability, 0) / revenueStreams.length;

  const handleStripeCheckout = async (productType: "credits" | "subscription") => {
    setLoading(true);
    try {
      const config = productType === "subscription" 
        ? {
            mode: "subscription" as const,
            amount: 49,
            productName: "AIQTP Pro Subscription",
            productDescription: "Monthly access to all premium features",
            successUrl: `${window.location.origin}/payment-success?type=subscription`,
            cancelUrl: `${window.location.origin}/wallet-assets`,
          }
        : {
            mode: "payment" as const,
            amount: 100,
            productName: "Platform Credits",
            productDescription: "Add $100 trading credits to your account",
            successUrl: `${window.location.origin}/payment-success?type=credits`,
            cancelUrl: `${window.location.origin}/wallet-assets`,
          };

      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: config,
      });

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Hero Stats */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
              <DollarSign className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Wallet & Assets
              </h1>
              <p className="text-muted-foreground">
                Autonomous revenue generation • 24/7 profit engines
              </p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Revenue</p>
                  <p className="text-3xl font-bold text-emerald-400">
                    ${totalDailyRevenue.toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500/50" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                  +12.5%
                </Badge>
                <span className="text-xs text-muted-foreground">vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                  <p className="text-3xl font-bold text-cyan-400">
                    ${totalMonthlyRevenue.toLocaleString()}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-cyan-500/50" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400">
                  +24.3%
                </Badge>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Profitability</p>
                  <p className="text-3xl font-bold text-purple-400">
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
                  <p className="text-3xl font-bold text-amber-400">
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

        <Tabs defaultValue="streams" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
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
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-400" />
                    Add Trading Credits
                  </CardTitle>
                  <CardDescription>
                    Fund your account to start generating profits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[50, 100, 500].map((amount) => (
                      <Button
                        key={amount}
                        variant="outline"
                        className="h-16 text-lg"
                        onClick={() => handleStripeCheckout("credits")}
                        disabled={loading}
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input placeholder="Custom amount" type="number" />
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleStripeCheckout("credits")}
                      disabled={loading}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Add Funds
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    Secured by Stripe • Instant deposit
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-400" />
                    Pro Subscription
                  </CardTitle>
                  <CardDescription>
                    Unlock all premium features and higher limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-2xl font-bold">$49<span className="text-sm text-muted-foreground">/mo</span></p>
                        <p className="text-sm text-muted-foreground">Billed monthly</p>
                      </div>
                      <Badge className="bg-purple-500/20 text-purple-400">Most Popular</Badge>
                    </div>
                    <ul className="space-y-2 mb-4">
                      {[
                        "Unlimited trading strategies",
                        "Priority bot execution",
                        "Advanced analytics",
                        "24/7 support",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleStripeCheckout("subscription")}
                      disabled={loading}
                    >
                      Subscribe Now
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
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
                        <p className="font-medium">Aggressive Strategy</p>
                        <p className="text-sm text-muted-foreground">
                          70% growth / 30% stable allocation
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
