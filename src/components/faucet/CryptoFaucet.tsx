import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Droplets, Clock, Coins, Gift, Timer, Wallet,
  TrendingUp, Shield, Zap, Star, CheckCircle, RefreshCw,
  ArrowDownToLine, Flame, Gem, CircleDollarSign, Bot
} from "lucide-react";

interface FaucetToken {
  id: string;
  symbol: string;
  name: string;
  icon: React.ReactNode;
  claimAmount: number;
  claimInterval: number; // hours
  available: boolean;
  category: 'stablecoin' | 'platform' | 'testnet' | 'defi';
  description: string;
  chain: string;
  bonus?: string;
}

interface ClaimRecord {
  id: string;
  amount: number;
  chain: string;
  status: string;
  created_at: string;
}

const FAUCET_TOKENS: FaucetToken[] = [
  // Stablecoins
  { id: 'usdc-test', symbol: 'USDC', name: 'USD Coin (Test)', icon: <CircleDollarSign className="h-6 w-6 text-blue-500" />, claimAmount: 100, claimInterval: 24, available: true, category: 'stablecoin', description: 'Testnet USDC for practicing trades and DeFi', chain: 'ethereum' },
  { id: 'usdt-test', symbol: 'USDT', name: 'Tether (Test)', icon: <CircleDollarSign className="h-6 w-6 text-green-500" />, claimAmount: 100, claimInterval: 24, available: true, category: 'stablecoin', description: 'Testnet USDT for stablecoin pair trading', chain: 'ethereum' },
  { id: 'dai-test', symbol: 'DAI', name: 'DAI (Test)', icon: <CircleDollarSign className="h-6 w-6 text-amber-500" />, claimAmount: 100, claimInterval: 24, available: true, category: 'stablecoin', description: 'Decentralized stablecoin for DeFi testing', chain: 'ethereum' },
  { id: 'busd-test', symbol: 'BUSD', name: 'Binance USD (Test)', icon: <CircleDollarSign className="h-6 w-6 text-yellow-500" />, claimAmount: 100, claimInterval: 24, available: true, category: 'stablecoin', description: 'BSC ecosystem stablecoin', chain: 'bsc' },

  // Platform tokens
  { id: 'qtc', symbol: 'QTC', name: 'Quantum Time Crystal', icon: <Gem className="h-6 w-6 text-purple-500" />, claimAmount: 5, claimInterval: 8, available: true, category: 'platform', description: 'Native platform token — staking, governance, fee discounts', chain: 'platform', bonus: '2x weekends' },
  { id: 'aiq', symbol: 'AIQ', name: 'AI Quant Token', icon: <Zap className="h-6 w-6 text-cyan-500" />, claimAmount: 25, claimInterval: 6, available: true, category: 'platform', description: 'Governance & AI strategy access token', chain: 'platform', bonus: 'Streak bonus' },
  { id: 'nxs', symbol: 'NXS', name: 'Nexus Points', icon: <Star className="h-6 w-6 text-amber-400" />, claimAmount: 50, claimInterval: 4, available: true, category: 'platform', description: 'Loyalty points — redeem for premium features & NFTs', chain: 'platform' },

  // Testnet
  { id: 'eth-test', symbol: 'ETH', name: 'Ethereum (Sepolia)', icon: <Flame className="h-6 w-6 text-indigo-400" />, claimAmount: 0.5, claimInterval: 24, available: true, category: 'testnet', description: 'Sepolia testnet ETH for gas & contract deployment', chain: 'ethereum-sepolia' },
  { id: 'btc-test', symbol: 'BTC', name: 'Bitcoin (Testnet)', icon: <Coins className="h-6 w-6 text-orange-500" />, claimAmount: 0.01, claimInterval: 48, available: true, category: 'testnet', description: 'Bitcoin testnet for Lightning & on-chain practice', chain: 'bitcoin-testnet' },
  { id: 'sol-test', symbol: 'SOL', name: 'Solana (Devnet)', icon: <Zap className="h-6 w-6 text-emerald-400" />, claimAmount: 5, claimInterval: 12, available: true, category: 'testnet', description: 'Solana devnet for SPL tokens & DeFi', chain: 'solana-devnet' },
  { id: 'matic-test', symbol: 'MATIC', name: 'Polygon (Mumbai)', icon: <Shield className="h-6 w-6 text-violet-500" />, claimAmount: 10, claimInterval: 12, available: true, category: 'testnet', description: 'Polygon testnet for low-cost L2 practice', chain: 'polygon-mumbai' },
  { id: 'avax-test', symbol: 'AVAX', name: 'Avalanche (Fuji)', icon: <TrendingUp className="h-6 w-6 text-red-500" />, claimAmount: 2, claimInterval: 24, available: true, category: 'testnet', description: 'Avalanche C-Chain testnet tokens', chain: 'avalanche-fuji' },

  // DeFi
  { id: 'uni-test', symbol: 'UNI', name: 'Uniswap (Test)', icon: <RefreshCw className="h-6 w-6 text-pink-500" />, claimAmount: 10, claimInterval: 24, available: true, category: 'defi', description: 'Test UNI for governance & LP simulations', chain: 'ethereum' },
  { id: 'aave-test', symbol: 'AAVE', name: 'Aave (Test)', icon: <Shield className="h-6 w-6 text-sky-400" />, claimAmount: 2, claimInterval: 24, available: true, category: 'defi', description: 'Test AAVE for lending/borrowing practice', chain: 'ethereum' },
  { id: 'link-test', symbol: 'LINK', name: 'Chainlink (Test)', icon: <Zap className="h-6 w-6 text-blue-400" />, claimAmount: 15, claimInterval: 24, available: true, category: 'defi', description: 'Test LINK for oracle integration practice', chain: 'ethereum' },
];

const CryptoFaucet = () => {
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [lastClaimTimes, setLastClaimTimes] = useState<Record<string, Date>>({});
  const [streakCount, setStreakCount] = useState(0);
  const [autoClaim, setAutoClaim] = useState(false);
  const [autoClaimRunning, setAutoClaimRunning] = useState(false);
  const autoClaimRef = useRef(false);
  const lastClaimTimesRef = useRef<Record<string, Date>>({});

  const loadClaims = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    setUserId(user.id);

    const { data } = await supabase
      .from("faucet_claims")
      .select("id, amount, chain, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200) as { data: ClaimRecord[] | null };

    const records = data || [];
    setClaims(records);

    // Compute balances and last claim times from DB records
    const bal: Record<string, number> = {};
    const lastTimes: Record<string, Date> = {};
    
    for (const claim of records) {
      // Extract symbol from chain field or match by amount
      const token = FAUCET_TOKENS.find(t => t.chain === claim.chain || t.id === claim.chain);
      const symbol = token?.symbol || claim.chain;
      bal[symbol] = (bal[symbol] || 0) + Number(claim.amount);

      const tokenId = token?.id || claim.chain;
      if (!lastTimes[tokenId]) {
        lastTimes[tokenId] = new Date(claim.created_at);
      }
    }
    
    setBalances(bal);
    setLastClaimTimes(lastTimes);

    // Calculate streak (consecutive days with at least one claim)
    const claimDays = new Set(records.map(c => new Date(c.created_at).toDateString()));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (claimDays.has(d.toDateString())) streak++;
      else break;
    }
    setStreakCount(streak);
    setLoading(false);
  }, []);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  const isOnCooldown = (token: FaucetToken): boolean => {
    const last = lastClaimTimes[token.id];
    if (!last) return false;
    const cooldownMs = token.claimInterval * 60 * 60 * 1000;
    return (Date.now() - last.getTime()) < cooldownMs;
  };

  const getCooldownRemaining = (token: FaucetToken): string => {
    const last = lastClaimTimes[token.id];
    if (!last) return 'Ready!';
    const cooldownMs = token.claimInterval * 60 * 60 * 1000;
    const remaining = cooldownMs - (Date.now() - last.getTime());
    if (remaining <= 0) return 'Ready!';
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleClaim = async (token: FaucetToken) => {
    if (!userId) {
      toast.error("Please sign in to claim tokens");
      return;
    }
    if (isOnCooldown(token)) {
      toast.error(`Please wait ${getCooldownRemaining(token)} before claiming again`);
      return;
    }

    setClaiming(token.id);

    const { error } = await supabase.from("faucet_claims").insert({
      user_id: userId,
      amount: token.claimAmount,
      chain: token.id,
      wallet_address: '',
      status: 'completed',
    } as any);

    if (error) {
      toast.error("Failed to claim: " + error.message);
      setClaiming(null);
      return;
    }

    toast.success(`Claimed ${token.claimAmount} ${token.symbol}!`, {
      description: streakCount > 0 ? `🔥 ${streakCount + 1}-day streak!` : undefined,
    });

    await loadClaims();
    setClaiming(null);
  };

  const totalTokenTypes = Object.keys(balances).length;
  const totalClaims = claims.length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        {[
          { icon: <Droplets className="h-5 w-5 md:h-8 md:w-8 text-primary" />, label: 'Available', value: FAUCET_TOKENS.length },
          { icon: <Wallet className="h-5 w-5 md:h-8 md:w-8 text-green-500" />, label: 'Your Tokens', value: totalTokenTypes },
          { icon: <Gift className="h-5 w-5 md:h-8 md:w-8 text-purple-500" />, label: 'Total Claims', value: totalClaims },
          { icon: <Flame className="h-5 w-5 md:h-8 md:w-8 text-orange-500" />, label: 'Day Streak', value: `${streakCount}🔥` },
        ].map((stat) => (
          <Card key={stat.label} className="bg-gradient-to-br from-muted/50 to-background">
            <CardContent className="pt-4 md:pt-6 pb-3 md:pb-4">
              <div className="flex items-center gap-2 md:gap-3">
                {stat.icon}
                <div>
                  <p className="text-[10px] md:text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-lg md:text-3xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Faucet List */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <Droplets className="h-5 w-5 text-primary" />
              Crypto Faucet
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Claim testnet, platform & DeFi tokens for practice trading
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-3 flex-wrap h-auto gap-1">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="platform" className="text-xs">Platform</TabsTrigger>
                <TabsTrigger value="stablecoin" className="text-xs">Stables</TabsTrigger>
                <TabsTrigger value="testnet" className="text-xs">Testnet</TabsTrigger>
                <TabsTrigger value="defi" className="text-xs">DeFi</TabsTrigger>
              </TabsList>

              {['all', 'platform', 'stablecoin', 'testnet', 'defi'].map(category => (
                <TabsContent key={category} value={category}>
                  <ScrollArea className="h-[400px] md:h-[500px]">
                    <div className="space-y-2">
                      {FAUCET_TOKENS
                        .filter(t => category === 'all' || t.category === category)
                        .map(token => {
                          const onCooldown = isOnCooldown(token);
                          const balance = balances[token.symbol] || 0;

                          return (
                            <div
                              key={token.id}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors gap-2"
                            >
                              <div className="flex items-center gap-3">
                                <div className="shrink-0 p-2 rounded-lg bg-muted/50">{token.icon}</div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-sm">{token.symbol}</span>
                                    {token.bonus && (
                                      <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                                        {token.bonus}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">{token.name}</p>
                                  <p className="text-[10px] text-muted-foreground/70 hidden md:block">{token.description}</p>
                                  {balance > 0 && (
                                    <p className="text-[10px] text-primary font-medium">
                                      Balance: {balance.toFixed(balance < 1 ? 4 : 2)}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 justify-between sm:justify-end">
                                <div className="text-right">
                                  <p className="font-bold text-sm md:text-base text-green-500">+{token.claimAmount}</p>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground justify-end">
                                    <Timer className="h-2.5 w-2.5" />
                                    Every {token.claimInterval}h
                                  </div>
                                </div>

                                <Button
                                  size="sm"
                                  onClick={() => handleClaim(token)}
                                  disabled={!token.available || claiming === token.id || onCooldown || loading}
                                  className="min-w-[90px] md:min-w-[120px] text-xs"
                                >
                                  {claiming === token.id ? (
                                    <><Clock className="h-3 w-3 mr-1 animate-spin" /> Claiming...</>
                                  ) : onCooldown ? (
                                    <><Timer className="h-3 w-3 mr-1" /> {getCooldownRemaining(token)}</>
                                  ) : (
                                    <><ArrowDownToLine className="h-3 w-3 mr-1" /> Claim</>
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Sidebar: Balances & History */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-primary" />
                Your Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                {totalTokenTypes > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(balances)
                      .sort(([, a], [, b]) => b - a)
                      .map(([symbol, amount]) => {
                        const token = FAUCET_TOKENS.find(t => t.symbol === symbol);
                        return (
                          <div key={symbol} className="flex justify-between items-center p-2 rounded-md bg-muted/30">
                            <div className="flex items-center gap-2">
                              {token?.icon || <Coins className="h-4 w-4" />}
                              <span className="font-medium text-sm">{symbol}</span>
                            </div>
                            <span className="font-mono text-sm">{amount < 1 ? amount.toFixed(4) : amount.toFixed(2)}</span>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    {loading ? "Loading..." : "No tokens claimed yet"}
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                Recent Claims
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {claims.length > 0 ? (
                  <div className="space-y-1.5">
                    {claims.slice(0, 20).map(claim => {
                      const token = FAUCET_TOKENS.find(t => t.id === claim.chain);
                      return (
                        <div key={claim.id} className="flex justify-between items-center text-xs p-2 rounded-md bg-muted/20">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                            <span className="font-medium">{token?.symbol || claim.chain}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-green-500">+{Number(claim.amount)}</span>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(claim.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8 text-sm">
                    {loading ? "Loading..." : "No claims yet — start claiming!"}
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {streakCount > 0 && (
            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <Flame className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="font-bold text-lg">{streakCount}-Day Streak!</p>
                    <p className="text-xs text-muted-foreground">Claim daily to keep your streak alive</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CryptoFaucet;
