import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Wallet,
  ArrowRightLeft,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Copy,
  AlertTriangle,
  Flame,
  Eye,
  Clock,
  Layers,
  Zap,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface WhaleWallet {
  id: string;
  address: string;
  label: string;
  balance: number;
  token: string;
  change24h: number;
  lastActivity: Date;
  tags: string[];
}

interface TokenUnlock {
  id: string;
  token: string;
  symbol: string;
  amount: number;
  valueUsd: number;
  unlockDate: Date;
  vestingType: 'team' | 'investor' | 'foundation' | 'ecosystem';
  percentOfSupply: number;
}

interface BridgeFlow {
  id: string;
  token: string;
  amount: number;
  valueUsd: number;
  fromChain: string;
  toChain: string;
  timestamp: Date;
  direction: 'inflow' | 'outflow';
}

interface SmartMoneyMove {
  id: string;
  wallet: string;
  label: string;
  action: 'buy' | 'sell' | 'transfer';
  token: string;
  amount: number;
  valueUsd: number;
  timestamp: Date;
  destination?: string;
}

const OnChainIntelligence = () => {
  const [whales] = useState<WhaleWallet[]>([]);
  const [unlocks] = useState<TokenUnlock[]>([]);
  const [smartMoney] = useState<SmartMoneyMove[]>([]);
  const [bridgeFlows] = useState<BridgeFlow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setIsLoading(false);
    toast.error('Verified on-chain provider is not connected');
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success('Address copied');
  };

  const formatValue = (v: number) => v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : `$${(v/1000).toFixed(0)}K`;
  const formatAmount = (a: number) => a >= 1000000 ? `${(a/1000000).toFixed(1)}M` : a >= 1000 ? `${(a/1000).toFixed(1)}K` : a.toFixed(0);

  const upcomingUnlocks = unlocks.filter(u => u.unlockDate > new Date());
  const totalUnlockValue = upcomingUnlocks.reduce((s, u) => s + u.valueUsd, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Whales Tracked</p>
                <p className="text-xl font-bold">{whales.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Unlock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Upcoming Unlocks</p>
                <p className="text-xl font-bold">{formatValue(totalUnlockValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-cyan-500" />
              <div>
                <p className="text-xs text-muted-foreground">Bridge Volume (24h)</p>
                <p className="text-xl font-bold">{formatValue(bridgeFlows.reduce((s, f) => s + f.valueUsd, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Smart Money Moves</p>
                <p className="text-xl font-bold">{smartMoney.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="smart-money">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="smart-money">Smart Money</TabsTrigger>
          <TabsTrigger value="unlocks">Token Unlocks</TabsTrigger>
          <TabsTrigger value="bridges">Bridge Flows</TabsTrigger>
          <TabsTrigger value="whales">Whale Wallets</TabsTrigger>
        </TabsList>

        <TabsContent value="smart-money" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Smart Money Activity</CardTitle>
              <CardDescription>Track what top wallets are buying and selling</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {smartMoney.map(move => (
                    <div key={move.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={
                          move.action === 'buy' ? 'bg-green-500/20 text-green-500' :
                          move.action === 'sell' ? 'bg-red-500/20 text-red-500' :
                          'bg-blue-500/20 text-blue-500'
                        }>
                          {move.action.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{move.token}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm">{move.label}</span>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="font-mono">{move.wallet}</span>
                            {move.destination && <span>→ {move.destination}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatValue(move.valueUsd)}</p>
                        <p className="text-xs text-muted-foreground">{formatAmount(move.amount)} {move.token}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unlocks" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Unlock className="h-5 w-5 text-amber-500" />
                Token Unlock Schedule
              </CardTitle>
              <CardDescription>Upcoming vesting unlocks that may impact price</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {unlocks.map(unlock => {
                    const daysUntil = Math.ceil((unlock.unlockDate.getTime() - Date.now()) / 86400000);
                    const isPast = daysUntil < 0;
                    const isImminent = daysUntil >= 0 && daysUntil <= 7;
                    
                    return (
                      <div key={unlock.id} className={`p-4 border rounded-lg ${isImminent ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{unlock.symbol}</span>
                            <Badge variant="outline">{unlock.vestingType}</Badge>
                            {isImminent && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                          </div>
                          <Badge className={isPast ? 'bg-gray-500/20' : isImminent ? 'bg-amber-500/20 text-amber-500' : ''}>
                            {isPast ? 'Unlocked' : daysUntil === 0 ? 'Today' : `${daysUntil}d`}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{unlock.token}</span>
                          <span className="font-mono">{formatValue(unlock.valueUsd)}</span>
                        </div>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{unlock.percentOfSupply.toFixed(1)}% of supply</span>
                            <span>{formatAmount(unlock.amount)} tokens</span>
                          </div>
                          <Progress value={unlock.percentOfSupply * 10} className="h-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bridges" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-cyan-500" />
                Cross-Chain Bridge Activity
              </CardTitle>
              <CardDescription>Large bridge transactions across L1s and L2s</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {bridgeFlows.map(flow => (
                    <div key={flow.id} className="p-3 border rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={flow.direction === 'inflow' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                          {flow.direction === 'inflow' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {flow.direction.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{flow.token}</span>
                            <span className="text-muted-foreground text-sm">{flow.fromChain} → {flow.toChain}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {flow.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatValue(flow.valueUsd)}</p>
                        <p className="text-xs text-muted-foreground">{formatAmount(flow.amount)} {flow.token}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whales" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-purple-500" />
                Whale Wallet Tracker
              </CardTitle>
              <CardDescription>Monitor large wallets and their movements</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {whales.map(whale => (
                    <div key={whale.id} className="p-3 border rounded-lg flex items-center justify-between hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{whale.label}</span>
                            {whale.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{whale.address}</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyAddress(whale.address)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatAmount(whale.balance)} {whale.token}</p>
                        <p className={`text-xs ${whale.change24h > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {whale.change24h > 0 ? '+' : ''}{whale.change24h.toFixed(1)}% (24h)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OnChainIntelligence;
