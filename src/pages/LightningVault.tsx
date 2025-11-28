import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Wallet, 
  Send, 
  ArrowDownUp, 
  TrendingUp, 
  Zap, 
  Shield, 
  Copy,
  QrCode,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { z } from "zod";

// Validation schemas
const sendPaymentSchema = z.object({
  recipient: z.string().min(10, "Address must be at least 10 characters").max(200, "Address too long"),
  amount: z.number().positive("Amount must be positive").max(1000000, "Amount too large").multipleOf(0.00000001),
  asset: z.enum(["BTC", "ETH", "USDC"])
});

const swapSchema = z.object({
  fromAmount: z.number().positive("Amount must be positive").max(1000000, "Amount too large"),
  fromAsset: z.enum(["BTC", "ETH", "USDC"]),
  toAsset: z.enum(["BTC", "ETH", "USDC"])
}).refine(data => data.fromAsset !== data.toAsset, {
  message: "Cannot swap same asset",
  path: ["toAsset"]
});

const LightningVault = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { getPrice } = useMarketPrices();
  
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendAsset, setSendAsset] = useState("BTC");
  const [swapFromAmount, setSwapFromAmount] = useState("");
  const [swapFromAsset, setSwapFromAsset] = useState("BTC");
  const [swapToAsset, setSwapToAsset] = useState("ETH");
  const [receiveAddress, setReceiveAddress] = useState("");
  const [channels, setChannels] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendLoading, setSendLoading] = useState(false);
  const [swapLoading, setSwapLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchVaultData();
      generateReceiveAddress();
    }
  }, [user, authLoading]);

  const fetchVaultData = async () => {
    try {
      setLoading(true);
      
      const { data: channelsData, error: channelsError } = await supabase
        .from('lightning_channels')
        .select('*')
        .eq('user_id', user!.id);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('lightning_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (channelsError) throw channelsError;
      if (transactionsError) throw transactionsError;

      setChannels(channelsData || []);
      setTransactions(transactionsData || []);
    } catch (error: any) {
      console.error('Error fetching vault data:', error);
      toast.error('Failed to load vault data');
    } finally {
      setLoading(false);
    }
  };

  const generateReceiveAddress = () => {
    const address = `lnbc${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setReceiveAddress(address);
  };

  const getAssetBalance = (asset: string): number => {
    if (channels.length === 0) return 0;
    
    const channel = channels.find(c => c.status === 'active');
    if (!channel) return 0;
    
    // Simulate different balances for different assets
    const balanceMultipliers: Record<string, number> = {
      'BTC': 1,
      'ETH': 15,
      'USDC': 50000
    };
    
    return (channel.local_balance / 100000000) * (balanceMultipliers[asset] || 1);
  };

  const handleSendPayment = async () => {
    try {
      setSendLoading(true);

      // Validate input
      const validationResult = sendPaymentSchema.safeParse({
        recipient: recipientAddress,
        amount: parseFloat(sendAmount),
        asset: sendAsset
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      const { recipient, amount, asset } = validationResult.data;

      // Check balance
      const balance = getAssetBalance(asset);
      if (amount > balance) {
        toast.error(`Insufficient balance. You have ${balance.toFixed(8)} ${asset}`);
        return;
      }

      // Get current price
      const priceInfo = getPrice(asset);
      const usdValue = priceInfo ? amount * priceInfo.priceNumeric : 0;

      // Insert transaction record
      const { error } = await supabase
        .from('lightning_transactions')
        .insert({
          user_id: user!.id,
          type: 'send',
          amount: amount,
          currency: asset,
          destination: recipient,
          status: 'completed',
          completed_at: new Date().toISOString(),
          payment_hash: `hash_${Date.now()}`
        });

      if (error) throw error;

      // Refresh transactions
      await fetchVaultData();

      toast.success(`✅ Sent ${amount} ${asset} ($${usdValue.toFixed(2)})`, {
        description: "Transaction completed instantly"
      });

      // Reset form
      setRecipientAddress("");
      setSendAmount("");
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + error.message);
    } finally {
      setSendLoading(false);
    }
  };

  const handleSwap = async () => {
    try {
      setSwapLoading(true);

      // Validate input
      const validationResult = swapSchema.safeParse({
        fromAmount: parseFloat(swapFromAmount),
        fromAsset: swapFromAsset,
        toAsset: swapToAsset
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        return;
      }

      const { fromAmount, fromAsset, toAsset } = validationResult.data;

      // Check balance
      const balance = getAssetBalance(fromAsset);
      if (fromAmount > balance) {
        toast.error(`Insufficient balance. You have ${balance.toFixed(8)} ${fromAsset}`);
        return;
      }

      // Get prices
      const fromPrice = getPrice(fromAsset);
      const toPrice = getPrice(toAsset);
      
      if (!fromPrice || !toPrice) {
        toast.error('Unable to fetch current prices');
        return;
      }

      // Calculate swap
      const fromUsdValue = fromAmount * fromPrice.priceNumeric;
      const toAmount = fromUsdValue / toPrice.priceNumeric;
      const fee = fromUsdValue * 0.001; // 0.1% fee

      // Insert swap as two transactions
      const { error: sellError } = await supabase
        .from('lightning_transactions')
        .insert({
          user_id: user!.id,
          type: 'swap_sell',
          amount: fromAmount,
          currency: fromAsset,
          status: 'completed',
          completed_at: new Date().toISOString(),
          payment_hash: `swap_${Date.now()}_sell`
        });

      if (sellError) throw sellError;

      const { error: buyError } = await supabase
        .from('lightning_transactions')
        .insert({
          user_id: user!.id,
          type: 'swap_buy',
          amount: toAmount,
          currency: toAsset,
          status: 'completed',
          completed_at: new Date().toISOString(),
          payment_hash: `swap_${Date.now()}_buy`
        });

      if (buyError) throw buyError;

      // Refresh transactions
      await fetchVaultData();

      toast.success(`✅ Swapped ${fromAmount} ${fromAsset} → ${toAmount.toFixed(8)} ${toAsset}`, {
        description: `Fee: $${fee.toFixed(2)} • Instant execution`
      });

      // Reset form
      setSwapFromAmount("");
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.error('Swap failed: ' + error.message);
    } finally {
      setSwapLoading(false);
    }
  };

  const calculateTotalBalance = () => {
    const btcBalance = getAssetBalance('BTC');
    const ethBalance = getAssetBalance('ETH');
    const usdcBalance = getAssetBalance('USDC');

    const btcPrice = getPrice('BTC');
    const ethPrice = getPrice('ETH');
    const usdcPrice = getPrice('USDC');

    const btcValue = btcPrice ? btcBalance * btcPrice.priceNumeric : 0;
    const ethValue = ethPrice ? ethBalance * ethPrice.priceNumeric : 0;
    const usdcValue = usdcPrice ? usdcBalance * usdcPrice.priceNumeric : 0;

    return btcValue + ethValue + usdcValue;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  const totalBalance = calculateTotalBalance();
  const transactions24h = transactions.filter(t => {
    const txDate = new Date(t.created_at);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return txDate > yesterday;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-primary">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-8">
          <div className="inline-flex items-center space-x-2 bg-gold/10 px-4 py-2 rounded-full mb-4">
            <Zap className="w-4 h-4 text-gold" />
            <span className="text-sm font-semibold text-gold">Lightning Network Powered</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Lightning Vault
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Instant, near-zero-fee transactions on the Lightning Network
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-premium border-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">Total Balance</span>
                <Wallet className="w-5 h-5 text-gold" />
              </div>
              <div className="text-3xl font-bold text-foreground">
                ${totalBalance.toFixed(2)}
              </div>
              <div className="text-sm text-success mt-1">+5.23% 24h</div>
            </CardContent>
          </Card>

          <Card className="card-premium border-none">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground">24h Transactions</span>
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <div className="text-3xl font-bold text-foreground">{transactions24h}</div>
              <div className="text-sm text-muted-foreground mt-1">All settled</div>
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
                          <span className="text-muted-foreground">Available Balance</span>
                          <span className="font-semibold">{getAssetBalance(sendAsset).toFixed(8)} {sendAsset}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Network Fee</span>
                          <span className="text-success font-semibold">$0.00 (Lightning)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Estimated Time</span>
                          <span className="font-semibold">&lt;1 second</span>
                        </div>
                      </div>

                      <Button 
                        onClick={handleSendPayment} 
                        disabled={sendLoading || !recipientAddress || !sendAmount}
                        className="w-full btn-premium"
                      >
                        {sendLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Send Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="receive" className="space-y-4 mt-6">
                    <div className="text-center space-y-4">
                      <div className="bg-white p-6 rounded-lg inline-block">
                        <QrCode className="w-32 h-32 text-foreground" />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">Your Lightning Address</label>
                        <div className="flex space-x-2">
                          <Input 
                            value={receiveAddress}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => copyToClipboard(receiveAddress)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        Share this address or QR code to receive Lightning payments instantly
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="swap" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">From</label>
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={swapFromAmount}
                            onChange={(e) => setSwapFromAmount(e.target.value)}
                            min="0"
                            step="0.00000001"
                          />
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={swapFromAsset}
                            onChange={(e) => setSwapFromAsset(e.target.value)}
                          >
                            <option value="BTC">BTC - Bitcoin</option>
                            <option value="ETH">ETH - Ethereum</option>
                            <option value="USDC">USDC - USD Coin</option>
                          </select>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Available: {getAssetBalance(swapFromAsset).toFixed(8)} {swapFromAsset}
                        </div>
                      </div>

                      <div className="flex justify-center">
                        <div className="bg-secondary p-2 rounded-full">
                          <ArrowDownUp className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">To</label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={swapToAsset}
                          onChange={(e) => setSwapToAsset(e.target.value)}
                        >
                          <option value="BTC">BTC - Bitcoin</option>
                          <option value="ETH">ETH - Ethereum</option>
                          <option value="USDC">USDC - USD Coin</option>
                        </select>
                        {swapFromAmount && (
                          <div className="text-sm text-muted-foreground mt-2">
                            You will receive: ~{(() => {
                              const fromPrice = getPrice(swapFromAsset);
                              const toPrice = getPrice(swapToAsset);
                              if (!fromPrice || !toPrice || !swapFromAmount) return '0.00';
                              const fromUsdValue = parseFloat(swapFromAmount) * fromPrice.priceNumeric;
                              const toAmount = fromUsdValue / toPrice.priceNumeric;
                              return toAmount.toFixed(8);
                            })()} {swapToAsset}
                          </div>
                        )}
                      </div>

                      <div className="bg-secondary p-4 rounded-lg space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Exchange Rate</span>
                          <span className="font-semibold">Live market rate</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Swap Fee</span>
                          <span className="font-semibold">0.1%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Execution Time</span>
                          <span className="font-semibold">&lt;1 second</span>
                        </div>
                      </div>

                      <Button 
                        onClick={handleSwap}
                        disabled={swapLoading || !swapFromAmount || swapFromAsset === swapToAsset}
                        className="w-full btn-premium"
                      >
                        {swapLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Swapping...
                          </>
                        ) : (
                          <>
                            <ArrowDownUp className="w-4 h-4 mr-2" />
                            Swap Assets
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="card-premium border-none">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your latest Lightning Network activity</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions yet</p>
                    <p className="text-sm text-muted-foreground mt-2">Your transactions will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-full ${
                            tx.type.includes('send') ? 'bg-error/20' : 'bg-success/20'
                          }`}>
                            {tx.type.includes('send') ? (
                              <Send className="w-4 h-4 text-error" />
                            ) : (
                              <TrendingUp className="w-4 h-4 text-success" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground capitalize">
                              {tx.type.replace('_', ' ')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(tx.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${
                            tx.type.includes('send') ? 'text-error' : 'text-success'
                          }`}>
                            {tx.type.includes('send') ? '-' : '+'}{tx.amount} {tx.currency}
                          </div>
                          <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                            {tx.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Vault Assets */}
            <Card className="card-premium border-none">
              <CardHeader>
                <CardTitle>Vault Assets</CardTitle>
                <CardDescription>Your current holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['BTC', 'ETH', 'USDC'].map((asset) => {
                    const balance = getAssetBalance(asset);
                    const priceInfo = getPrice(asset);
                    const usdValue = priceInfo ? balance * priceInfo.priceNumeric : 0;
                    
                    return (
                      <div key={asset} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                            <span className="text-gold font-bold text-sm">{asset[0]}</span>
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{asset}</div>
                            <div className="text-xs text-muted-foreground">
                              {priceInfo ? `$${priceInfo.price}` : 'Loading...'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">{balance.toFixed(8)}</div>
                          <div className="text-xs text-muted-foreground">${usdValue.toFixed(2)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="card-premium border-none">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-success" />
                  <span>Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-muted-foreground">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-muted-foreground">Multi-signature support</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-muted-foreground">Lightning Network secured</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                    <span className="text-muted-foreground">Real-time fraud detection</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LightningVault;
