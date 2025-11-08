import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Shield,
  ArrowRight,
  Copy,
  QrCode,
  Send,
  ArrowDownToLine,
  Clock,
  CheckCircle,
  TrendingUp,
  Lock,
  Globe,
  Wallet
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// Validation schemas
const sendPaymentSchema = z.object({
  recipientAddress: z.string()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters")
    .trim(),
  amount: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0")
    .refine((val) => Number(val) <= 1000000, "Amount must be less than 1,000,000")
    .refine((val) => {
      const decimals = val.split('.')[1];
      return !decimals || decimals.length <= 8;
    }, "Maximum 8 decimal places allowed"),
  asset: z.string().min(1, "Please select an asset"),
});

const swapSchema = z.object({
  fromAmount: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0")
    .refine((val) => Number(val) <= 1000000, "Amount must be less than 1,000,000")
    .refine((val) => {
      const decimals = val.split('.')[1];
      return !decimals || decimals.length <= 8;
    }, "Maximum 8 decimal places allowed"),
  fromAsset: z.string().min(1, "Please select source asset"),
  toAsset: z.string().min(1, "Please select destination asset"),
}).refine((data) => data.fromAsset !== data.toAsset, {
  message: "Source and destination assets must be different",
  path: ["toAsset"],
});

const LightningVault = () => {
  // Send form state
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendAsset, setSendAsset] = useState("BTC");
  
  // Swap form state
  const [fromAmount, setFromAmount] = useState("");
  const [fromAsset, setFromAsset] = useState("BTC");
  const [toAsset, setToAsset] = useState("ETH");

  const handleSendPayment = () => {
    try {
      const validated = sendPaymentSchema.parse({
        recipientAddress,
        amount: sendAmount,
        asset: sendAsset,
      });
      
      toast.success("Payment validated successfully!");
      // Backend integration would happen here
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const handleSwap = () => {
    try {
      const validated = swapSchema.parse({
        fromAmount,
        fromAsset,
        toAsset,
      });
      
      toast.success("Swap validated successfully!");
      // Backend integration would happen here
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    }
  };

  const recentTransactions = [
    { id: "1", type: "Received", amount: "+0.0234 BTC", usd: "+$1,567", time: "2 mins ago", status: "completed" },
    { id: "2", type: "Sent", amount: "-0.0123 BTC", usd: "-$823", time: "1 hour ago", status: "completed" },
    { id: "3", type: "Received", amount: "+1.234 ETH", usd: "+$4,267", time: "3 hours ago", status: "completed" },
    { id: "4", type: "Swap", amount: "BTC → ETH", usd: "$2,345", time: "5 hours ago", status: "completed" },
  ];

  const vaultAssets = [
    { name: "Bitcoin", symbol: "BTC", amount: "2.4567", value: "$165,234", change: "+8.1%" },
    { name: "Ethereum", symbol: "ETH", amount: "34.567", value: "$119,456", change: "+4.0%" },
    { name: "USDC", symbol: "USDC", amount: "50,000", value: "$50,000", change: "0.0%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Zap className="w-4 h-4 mr-2 text-gold" />
              Lightning Network Powered
            </Badge>
            <h1 className="text-5xl font-bold text-foreground mb-4">
              Lightning <span className="text-gradient-gold">Vault</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Instant, secure, and fee-free transactions across all asset classes. 
              Revolutionary wallet technology powered by Lightning Network.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            <Card className="card-premium border-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Total Balance</span>
                  <Wallet className="w-5 h-5 text-gold" />
                </div>
                <div className="text-3xl font-bold text-foreground">$334,690</div>
                <div className="text-sm text-success mt-1">+$16,234 (5.1%)</div>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">24h Transactions</span>
                  <TrendingUp className="w-5 h-5 text-accent" />
                </div>
                <div className="text-3xl font-bold text-foreground">47</div>
                <div className="text-sm text-muted-foreground mt-1">$12,456 volume</div>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Avg. Speed</span>
                  <Zap className="w-5 h-5 text-gold" />
                </div>
                <div className="text-3xl font-bold text-foreground">&lt;1s</div>
                <div className="text-sm text-muted-foreground mt-1">Lightning fast</div>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Security</span>
                  <Shield className="w-5 h-5 text-success" />
                </div>
                <div className="text-3xl font-bold text-success">Active</div>
                <div className="text-sm text-muted-foreground mt-1">SHA-3 2048-bit</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Actions */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="card-premium border-none">
                <CardHeader>
                  <CardTitle className="text-2xl">Quick Actions</CardTitle>
                  <CardDescription>Send, receive, or swap assets instantly</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="send" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="send">Send</TabsTrigger>
                      <TabsTrigger value="receive">Receive</TabsTrigger>
                      <TabsTrigger value="swap">Swap</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="send" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Recipient Address</label>
                          <Input 
                            placeholder="Enter wallet address or Lightning invoice"
                            value={recipientAddress}
                            onChange={(e) => setRecipientAddress(e.target.value)}
                            maxLength={200}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">Amount</label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={sendAmount}
                              onChange={(e) => setSendAmount(e.target.value)}
                              min="0"
                              max="1000000"
                              step="0.00000001"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">Asset</label>
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={sendAsset}
                              onChange={(e) => setSendAsset(e.target.value)}
                            >
                              <option value="BTC">BTC - Bitcoin</option>
                              <option value="ETH">ETH - Ethereum</option>
                              <option value="USDC">USDC - USD Coin</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-secondary p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Network Fee</span>
                            <span className="text-success font-semibold">$0.00 (Lightning)</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Estimated Time</span>
                            <span className="font-semibold">&lt;1 second</span>
                          </div>
                        </div>

                        <Button variant="gold" className="w-full" size="lg" onClick={handleSendPayment}>
                          <Send className="w-5 h-5 mr-2" />
                          Send Payment
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="receive" className="space-y-4 mt-6">
                      <div className="space-y-6">
                        <div className="flex justify-center">
                          <div className="bg-white p-8 rounded-lg">
                            <div className="w-48 h-48 bg-secondary flex items-center justify-center rounded-lg">
                              <QrCode className="w-24 h-24 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Your Lightning Address</label>
                          <div className="flex gap-2">
                            <Input value="user@aiqtp.lightning" readOnly />
                            <Button variant="outline" size="icon">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                          <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-accent mt-0.5" />
                            <div className="text-sm">
                              <p className="font-semibold text-foreground mb-1">Lightning Network</p>
                              <p className="text-muted-foreground">Share this address to receive instant payments with zero fees from anywhere in the world.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="swap" className="space-y-4 mt-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">From</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input 
                              type="number" 
                              placeholder="0.00"
                              value={fromAmount}
                              onChange={(e) => setFromAmount(e.target.value)}
                              min="0"
                              max="1000000"
                              step="0.00000001"
                            />
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={fromAsset}
                              onChange={(e) => setFromAsset(e.target.value)}
                            >
                              <option value="BTC">BTC</option>
                              <option value="ETH">ETH</option>
                              <option value="USDC">USDC</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <Button variant="outline" size="icon" className="rounded-full">
                            <ArrowDownToLine className="w-4 h-4" />
                          </Button>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">To</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Input 
                              type="number" 
                              placeholder="0.00" 
                              readOnly
                              className="bg-muted"
                            />
                            <select 
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={toAsset}
                              onChange={(e) => setToAsset(e.target.value)}
                            >
                              <option value="ETH">ETH</option>
                              <option value="BTC">BTC</option>
                              <option value="USDC">USDC</option>
                            </select>
                          </div>
                        </div>

                        <div className="bg-secondary p-4 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Exchange Rate</span>
                            <span className="font-semibold">1 BTC = 27.3 ETH</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Slippage</span>
                            <span className="font-semibold">0.1%</span>
                          </div>
                        </div>

                        <Button variant="premium" className="w-full" size="lg" onClick={handleSwap}>
                          <Zap className="w-5 h-5 mr-2" />
                          Instant Swap
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="card-premium border-none">
                <CardHeader>
                  <CardTitle className="text-2xl">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary hover:bg-secondary-hover transition-smooth">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-full ${tx.type === 'Received' ? 'bg-success/10' : tx.type === 'Sent' ? 'bg-destructive/10' : 'bg-accent/10'}`}>
                            {tx.type === 'Received' ? (
                              <ArrowDownToLine className="w-4 h-4 text-success" />
                            ) : tx.type === 'Sent' ? (
                              <Send className="w-4 h-4 text-destructive" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-accent" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{tx.type}</div>
                            <div className="text-sm text-muted-foreground">{tx.time}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{tx.amount}</div>
                          <div className="text-sm text-muted-foreground">{tx.usd}</div>
                        </div>
                        
                        <Badge variant="outline" className="text-success border-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {tx.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="card-premium border-none">
                <CardHeader>
                  <CardTitle className="text-lg">Vault Assets</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vaultAssets.map((asset) => (
                    <div key={asset.symbol} className="p-4 rounded-lg bg-secondary">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-semibold text-foreground">{asset.name}</div>
                          <div className="text-sm text-muted-foreground">{asset.amount} {asset.symbol}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{asset.value}</div>
                          <div className="text-sm text-success">{asset.change}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Link to="/trading">
                    <Button variant="outline" className="w-full">
                      View All Assets
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="card-premium border-none bg-gradient-hero text-white">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-white/10">
                      <Shield className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <div className="font-semibold">Protected by</div>
                      <div className="text-sm text-white/80">SHA-3 2048-bit</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-gold" />
                      <span>Quantum-resistant encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gold" />
                      <span>Lightning Network speed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gold" />
                      <span>Cross-chain compatible</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-premium border-none">
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    View Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Contact Support
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Security Guide
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LightningVault;
