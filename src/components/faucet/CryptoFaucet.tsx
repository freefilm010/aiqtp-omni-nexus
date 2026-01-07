import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Droplets,
  Clock,
  Coins,
  Gift,
  Timer,
  Wallet,
  TrendingUp,
  Shield,
  Zap,
  Star,
  CheckCircle
} from "lucide-react";

interface FaucetToken {
  id: string;
  symbol: string;
  name: string;
  icon: string;
  claimAmount: number;
  claimInterval: number; // hours
  totalClaimed: number;
  available: boolean;
  lastClaim?: Date;
  category: 'stablecoin' | 'platform' | 'testnet';
  description: string;
}

interface ClaimHistory {
  id: string;
  token: string;
  amount: number;
  timestamp: Date;
  status: 'completed' | 'pending';
}

const mockTokens: FaucetToken[] = [
  {
    id: 'usdc-test',
    symbol: 'USDC',
    name: 'USD Coin (Test)',
    icon: '💵',
    claimAmount: 10,
    claimInterval: 24,
    totalClaimed: 150,
    available: true,
    category: 'stablecoin',
    description: 'Testnet USDC for practicing trades'
  },
  {
    id: 'usdt-test',
    symbol: 'USDT',
    name: 'Tether (Test)',
    icon: '💲',
    claimAmount: 10,
    claimInterval: 24,
    totalClaimed: 120,
    available: true,
    category: 'stablecoin',
    description: 'Testnet USDT for stablecoin trading'
  },
  {
    id: 'dai-test',
    symbol: 'DAI',
    name: 'DAI Stablecoin (Test)',
    icon: '🔶',
    claimAmount: 10,
    claimInterval: 24,
    totalClaimed: 80,
    available: true,
    category: 'stablecoin',
    description: 'Decentralized stablecoin for DeFi testing'
  },
  {
    id: 'qtc',
    symbol: 'QTC',
    name: 'Quantum Time Crystal',
    icon: '💎',
    claimAmount: 1,
    claimInterval: 12,
    totalClaimed: 25,
    available: true,
    category: 'platform',
    description: 'Our native platform token with quantum-powered utilities'
  },
  {
    id: 'aiq',
    symbol: 'AIQ',
    name: 'AI Quant Token',
    icon: '🤖',
    claimAmount: 5,
    claimInterval: 6,
    totalClaimed: 500,
    available: true,
    category: 'platform',
    description: 'Governance token for AI trading strategies'
  },
  {
    id: 'eth-test',
    symbol: 'ETH',
    name: 'Ethereum (Testnet)',
    icon: '⟠',
    claimAmount: 0.1,
    claimInterval: 24,
    totalClaimed: 5.5,
    available: true,
    category: 'testnet',
    description: 'Sepolia/Goerli testnet ETH for gas'
  },
  {
    id: 'btc-test',
    symbol: 'BTC',
    name: 'Bitcoin (Testnet)',
    icon: '₿',
    claimAmount: 0.001,
    claimInterval: 48,
    totalClaimed: 0.05,
    available: true,
    category: 'testnet',
    description: 'Bitcoin testnet for practice'
  },
  {
    id: 'sol-test',
    symbol: 'SOL',
    name: 'Solana (Devnet)',
    icon: '◎',
    claimAmount: 2,
    claimInterval: 12,
    totalClaimed: 100,
    available: true,
    category: 'testnet',
    description: 'Solana devnet tokens'
  }
];

const CryptoFaucet = () => {
  const [tokens, setTokens] = useState<FaucetToken[]>(mockTokens);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [claiming, setClaiming] = useState<string | null>(null);
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([]);
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // Initialize balances
  useEffect(() => {
    const savedBalances = localStorage.getItem('faucet-balances');
    if (savedBalances) {
      setBalances(JSON.parse(savedBalances));
    }
    
    const savedHistory = localStorage.getItem('faucet-history');
    if (savedHistory) {
      setClaimHistory(JSON.parse(savedHistory).map((h: any) => ({
        ...h,
        timestamp: new Date(h.timestamp)
      })));
    }

    // Check cooldowns
    const savedCooldowns = localStorage.getItem('faucet-cooldowns');
    if (savedCooldowns) {
      setCooldowns(JSON.parse(savedCooldowns));
    }
  }, []);

  // Update cooldowns every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const updated: Record<string, number> = {};
      
      Object.entries(cooldowns).forEach(([tokenId, endTime]) => {
        if (endTime > now) {
          updated[tokenId] = endTime;
        }
      });
      
      setCooldowns(updated);
      localStorage.setItem('faucet-cooldowns', JSON.stringify(updated));
    }, 60000);

    return () => clearInterval(interval);
  }, [cooldowns]);

  const handleClaim = async (token: FaucetToken) => {
    if (cooldowns[token.id] && cooldowns[token.id] > Date.now()) {
      toast.error('Please wait for the cooldown to end');
      return;
    }

    setClaiming(token.id);

    // Simulate claim process
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newBalance = (balances[token.symbol] || 0) + token.claimAmount;
    const newBalances = { ...balances, [token.symbol]: newBalance };
    setBalances(newBalances);
    localStorage.setItem('faucet-balances', JSON.stringify(newBalances));

    const newCooldown = Date.now() + (token.claimInterval * 60 * 60 * 1000);
    const newCooldowns = { ...cooldowns, [token.id]: newCooldown };
    setCooldowns(newCooldowns);
    localStorage.setItem('faucet-cooldowns', JSON.stringify(newCooldowns));

    const historyEntry: ClaimHistory = {
      id: `claim-${Date.now()}`,
      token: token.symbol,
      amount: token.claimAmount,
      timestamp: new Date(),
      status: 'completed'
    };
    const newHistory = [historyEntry, ...claimHistory.slice(0, 49)];
    setClaimHistory(newHistory);
    localStorage.setItem('faucet-history', JSON.stringify(newHistory));

    setClaiming(null);
    toast.success(`Successfully claimed ${token.claimAmount} ${token.symbol}!`);
  };

  const formatCooldown = (endTime: number) => {
    const remaining = endTime - Date.now();
    if (remaining <= 0) return 'Ready!';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const totalBalance = Object.values(balances).reduce((sum, val) => sum + val, 0);
  const totalClaims = claimHistory.length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'stablecoin': return <Shield className="h-4 w-4 text-green-500" />;
      case 'platform': return <Star className="h-4 w-4 text-purple-500" />;
      case 'testnet': return <Zap className="h-4 w-4 text-amber-500" />;
      default: return <Coins className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Available Tokens</p>
                <p className="text-3xl font-bold">{tokens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Your Balance</p>
                <p className="text-3xl font-bold">{Object.keys(balances).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Gift className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-3xl font-bold">{totalClaims}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Platform Tokens</p>
                <p className="text-3xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Faucet List */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-primary" />
              Crypto Faucet
            </CardTitle>
            <CardDescription>
              Claim free testnet tokens and platform tokens for practicing trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="stablecoin">Stablecoins</TabsTrigger>
                <TabsTrigger value="platform">Platform</TabsTrigger>
                <TabsTrigger value="testnet">Testnet</TabsTrigger>
              </TabsList>

              {['all', 'stablecoin', 'platform', 'testnet'].map(category => (
                <TabsContent key={category} value={category}>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {tokens
                        .filter(t => category === 'all' || t.category === category)
                        .map(token => {
                          const onCooldown = cooldowns[token.id] && cooldowns[token.id] > Date.now();
                          
                          return (
                            <div
                              key={token.id}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex items-center gap-4">
                                <div className="text-3xl">{token.icon}</div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold">{token.symbol}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {getCategoryIcon(token.category)}
                                      <span className="ml-1">{token.category}</span>
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">{token.name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{token.description}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="font-bold text-lg">+{token.claimAmount}</p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Timer className="h-3 w-3" />
                                    Every {token.claimInterval}h
                                  </div>
                                </div>

                                <Button
                                  onClick={() => handleClaim(token)}
                                  disabled={!token.available || claiming === token.id || onCooldown}
                                  className="w-32"
                                >
                                  {claiming === token.id ? (
                                    <>
                                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                                      Claiming...
                                    </>
                                  ) : onCooldown ? (
                                    formatCooldown(cooldowns[token.id])
                                  ) : (
                                    <>
                                      <Gift className="h-4 w-4 mr-2" />
                                      Claim
                                    </>
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

        {/* Balances & History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Your Balances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                {Object.keys(balances).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(balances).map(([symbol, amount]) => (
                      <div key={symbol} className="flex justify-between items-center">
                        <span className="font-medium">{symbol}</span>
                        <span className="font-mono">{amount.toFixed(4)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No tokens claimed yet
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Claim History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                {claimHistory.length > 0 ? (
                  <div className="space-y-2">
                    {claimHistory.slice(0, 10).map(claim => (
                      <div key={claim.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{claim.token}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono">+{claim.amount}</span>
                          <p className="text-xs text-muted-foreground">
                            {new Date(claim.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No claims yet
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CryptoFaucet;
