import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Rocket, 
  TrendingUp, 
  AlertTriangle, 
  ExternalLink, 
  Search,
  Loader2,
  Star,
  Clock,
  DollarSign,
  Activity,
  Zap
} from 'lucide-react';

interface TokenLaunch {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange: number;
  volume: number;
  liquidity: number;
  marketCap: number;
  launchedAt: number;
  ageMinutes: number;
  dex: string;
  referralUrl: string;
  riskScore: string;
}

const MoonshotIntegration = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('launches');
  const [searchAddress, setSearchAddress] = useState('');
  const [tokenInfo, setTokenInfo] = useState<any>(null);
  const [launches, setLaunches] = useState<TokenLaunch[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [referralStats, setReferralStats] = useState<any>(null);

  useEffect(() => {
    loadLaunches();
    loadReferralStats();
  }, []);

  const loadLaunches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('moonshot-integration', {
        body: { action: 'get_launch_data' },
      });
      
      if (error) throw error;
      setLaunches(data?.data?.launches || []);
    } catch (error: any) {
      console.error('Failed to load launches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTrending = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('moonshot-integration', {
        body: { action: 'get_trending' },
      });
      
      if (error) throw error;
      setTrending(data?.data || []);
    } catch (error: any) {
      console.error('Failed to load trending:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadReferralStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('moonshot-integration', {
        body: { action: 'get_referral_stats' },
      });
      
      if (error) throw error;
      setReferralStats(data?.data);
    } catch (error: any) {
      console.error('Failed to load referral stats:', error);
    }
  };

  const searchToken = async () => {
    if (!searchAddress) {
      toast({ title: 'Error', description: 'Please enter a token address', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('moonshot-integration', {
        body: { action: 'get_token_info', tokenAddress: searchAddress },
      });
      
      if (error) throw error;
      setTokenInfo(data?.data);
    } catch (error: any) {
      toast({
        title: 'Token Not Found',
        description: error.message || 'Failed to find token',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trackReferralClick = async (tokenAddress: string, referralUrl: string) => {
    // Track the referral click
    await supabase.functions.invoke('moonshot-integration', {
      body: { action: 'track_referral', tokenAddress },
    });
    
    // Open referral link
    window.open(referralUrl, '_blank');
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Rocket className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-xl">Moonshot Token Launchpad</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track new Solana token launches with referral revenue
              </p>
            </div>
          </div>
          {referralStats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Referrals</p>
                <p className="font-bold text-primary">{referralStats.totalReferrals}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Pending</p>
                <p className="font-bold text-yellow-400">{referralStats.pendingCommissions}</p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Earned</p>
                <p className="font-bold text-green-400">${referralStats.paidCommissions.toFixed(2)}</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'trending') loadTrending(); }}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="launches" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              New Launches
            </TabsTrigger>
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="launches">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  {launches.map((token) => (
                    <div
                      key={token.address}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {token.symbol?.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{token.symbol}</p>
                            <Badge variant="outline" className={`text-[10px] ${getRiskColor(token.riskScore)}`}>
                              {token.riskScore.toUpperCase()}
                            </Badge>
                            {token.ageMinutes < 60 && (
                              <Badge className="bg-green-500/20 text-green-400 text-[10px]">
                                NEW
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {token.ageMinutes < 60 ? `${token.ageMinutes}m ago` : `${Math.floor(token.ageMinutes / 60)}h ago`}
                            <span>•</span>
                            <DollarSign className="h-3 w-3" />
                            {token.liquidity > 1000 ? `$${(token.liquidity / 1000).toFixed(1)}K` : `$${token.liquidity.toFixed(0)}`} liq
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium">${token.price < 0.001 ? token.price.toExponential(2) : token.price.toFixed(6)}</p>
                          <p className={`text-xs ${token.priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {token.priceChange >= 0 ? '+' : ''}{token.priceChange.toFixed(1)}%
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => trackReferralClick(token.address, token.referralUrl)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Trade
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <Button variant="outline" className="w-full mt-4" onClick={loadLaunches} disabled={isLoading}>
              <Activity className="h-4 w-4 mr-2" />
              Refresh Launches
            </Button>
          </TabsContent>

          <TabsContent value="trending">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2">
                  {trending.map((token, i) => (
                    <div
                      key={token.address || i}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-6 text-center text-muted-foreground font-mono text-sm">
                          #{i + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{token.symbol}</p>
                            {token.isHot && (
                              <Badge className="bg-red-500/20 text-red-400 text-[10px]">
                                🔥 HOT
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Vol: ${token.volume24h > 1000000 ? `${(token.volume24h / 1000000).toFixed(1)}M` : `${(token.volume24h / 1000).toFixed(0)}K`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="font-medium">${token.price < 0.001 ? token.price.toExponential(2) : token.price.toFixed(6)}</p>
                          <p className={`text-xs ${token.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => trackReferralClick(token.address, token.referralUrl)}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter Solana token address..."
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                className="flex-1"
              />
              <Button onClick={searchToken} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {tokenInfo && (
              <div className="p-4 rounded-lg border border-border/50 bg-background/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold">
                      {tokenInfo.symbol?.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{tokenInfo.symbol}</h3>
                      <p className="text-sm text-muted-foreground">{tokenInfo.name}</p>
                    </div>
                  </div>
                  <Button onClick={() => trackReferralClick(tokenInfo.address, tokenInfo.referralUrl)}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Trade on Moonshot
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-bold">${tokenInfo.price < 0.001 ? tokenInfo.price.toExponential(2) : tokenInfo.price.toFixed(6)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">24h Change</p>
                    <p className={`font-bold ${tokenInfo.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {tokenInfo.priceChange24h >= 0 ? '+' : ''}{tokenInfo.priceChange24h?.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Liquidity</p>
                    <p className="font-bold">${(tokenInfo.liquidity / 1000).toFixed(1)}K</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Market Cap</p>
                    <p className="font-bold">${tokenInfo.marketCap > 1000000 ? `${(tokenInfo.marketCap / 1000000).toFixed(1)}M` : `${(tokenInfo.marketCap / 1000).toFixed(0)}K`}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-500/80">
                    <strong>Risk Warning:</strong> New tokens carry extreme risk. Never invest more than you can afford to lose. DYOR.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MoonshotIntegration;
