import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { supabase } from "@/integrations/supabase/client";
import {
  Rocket,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  Bell,
  Zap,
  Clock,
  Users,
  Flame,
  Shield,
  ExternalLink,
  Copy,
  Wifi,
  WifiOff,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface Token {
  id: string;
  name: string;
  symbol: string;
  address: string;
  chain: string;
  price: number;
  priceChange1h: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  liquidity: number;
  holders: number;
  launchTime: Date;
  isVerified: boolean;
  isHoneypot: boolean;
  buyTax: number;
  sellTax: number;
  score: number;
  trending: boolean;
}

const chainColors: Record<string, string> = {
  Solana: 'bg-gradient-to-r from-purple-500 to-green-500',
  Ethereum: 'bg-blue-500',
  Base: 'bg-blue-600',
  BSC: 'bg-yellow-500',
};

const TokenScanner = () => {
  const { isLive, toggleLive } = useMarketPrices(10000);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'trending' | 'new' | 'verified'>('all');
  const [chainFilter, setChainFilter] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Fetch tokens from database
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const { data, error } = await supabase
          .from('dex_tokens')
          .select('*')
          .order('score', { ascending: false })
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          setTokens(data.map(t => ({
            id: t.id,
            name: t.name,
            symbol: t.symbol,
            address: t.address,
            chain: t.chain,
            price: Number(t.price) || 0,
            priceChange1h: Number(t.price_change_1h) || 0,
            priceChange24h: Number(t.price_change_24h) || 0,
            marketCap: Number(t.market_cap) || 0,
            volume24h: Number(t.volume_24h) || 0,
            liquidity: Number(t.liquidity) || 0,
            holders: t.holders || 0,
            launchTime: new Date(t.launch_time || Date.now()),
            isVerified: t.is_verified || false,
            isHoneypot: t.is_honeypot || false,
            buyTax: Number(t.buy_tax) || 0,
            sellTax: Number(t.sell_tax) || 0,
            score: t.score || 50,
            trending: t.trending || false
          })));
        }
      } catch (err) {
        console.error('Error fetching tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, []);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`dex_tokens_changes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dex_tokens' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newToken = payload.new as any;
          setTokens(prev => [{
            id: newToken.id,
            name: newToken.name,
            symbol: newToken.symbol,
            address: newToken.address,
            chain: newToken.chain,
            price: Number(newToken.price) || 0,
            priceChange1h: Number(newToken.price_change_1h) || 0,
            priceChange24h: Number(newToken.price_change_24h) || 0,
            marketCap: Number(newToken.market_cap) || 0,
            volume24h: Number(newToken.volume_24h) || 0,
            liquidity: Number(newToken.liquidity) || 0,
            holders: newToken.holders || 0,
            launchTime: new Date(newToken.launch_time || Date.now()),
            isVerified: newToken.is_verified || false,
            isHoneypot: newToken.is_honeypot || false,
            buyTax: Number(newToken.buy_tax) || 0,
            sellTax: Number(newToken.sell_tax) || 0,
            score: newToken.score || 50,
            trending: newToken.trending || false
          }, ...prev]);
          toast.info(`New token detected: ${newToken.symbol}`);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredTokens = tokens.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                         t.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ||
                         (filter === 'trending' && t.trending) ||
                         (filter === 'new' && Date.now() - t.launchTime.getTime() < 3600000) ||
                         (filter === 'verified' && t.isVerified);
    const matchesChain = chainFilter.length === 0 || chainFilter.includes(t.chain);
    return matchesSearch && matchesFilter && matchesChain;
  });

  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(8);
    return price.toFixed(4);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied!");
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
    toast.success(alerts.includes(id) ? "Alert removed" : "Alert set!");
  };

  const getAge = (launchTime: Date) => {
    const diff = Date.now() - launchTime.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Token Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Token Scanner
              {isLive && <Badge variant="outline" className="ml-2">LIVE</Badge>}
            </CardTitle>
            <Button variant="outline" size="sm" onClick={toggleLive}>
              {isLive ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
              {isLive ? 'Live' : 'Paused'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'trending', 'new', 'verified'].map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f as any)}
                >
                  {f === 'trending' && <Flame className="h-4 w-4 mr-1" />}
                  {f === 'new' && <Zap className="h-4 w-4 mr-1" />}
                  {f === 'verified' && <Shield className="h-4 w-4 mr-1" />}
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Chain filters */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {['Solana', 'Ethereum', 'Base', 'BSC'].map((chain) => (
              <Button
                key={chain}
                variant={chainFilter.includes(chain) ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChainFilter(prev => 
                  prev.includes(chain) ? prev.filter(c => c !== chain) : [...prev, chain]
                )}
                className={chainFilter.includes(chain) ? chainColors[chain] : ''}
              >
                {chain}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token List */}
      <Card>
        <CardContent className="p-0">
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12">
              <Rocket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tokens found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Tokens will appear when data is available
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {filteredTokens.map((token) => (
                  <div key={token.id} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-full ${chainColors[token.chain] || 'bg-muted'} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{token.name}</p>
                            {token.isVerified && <Shield className="h-4 w-4 text-green-500 shrink-0" />}
                            {token.trending && <Flame className="h-4 w-4 text-orange-500 shrink-0" />}
                            {token.isHoneypot && <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{token.symbol}</span>
                            <Badge variant="outline" className="text-xs">{token.chain}</Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {getAge(token.launchTime)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        <div className="text-right">
                          <p className="font-mono">${formatPrice(token.price)}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={token.priceChange1h >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {token.priceChange1h >= 0 ? '+' : ''}{token.priceChange1h.toFixed(1)}%
                            </span>
                            <span className={token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}>
                              ({token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%)
                            </span>
                          </div>
                        </div>

                        <div className="hidden md:block text-right">
                          <p className="text-sm text-muted-foreground">MCap</p>
                          <p className="font-medium">{formatNumber(token.marketCap)}</p>
                        </div>

                        <div className="hidden lg:block text-right">
                          <p className="text-sm text-muted-foreground">Liquidity</p>
                          <p className="font-medium">{formatNumber(token.liquidity)}</p>
                        </div>

                        <div className="hidden lg:flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{token.holders.toLocaleString()}</span>
                        </div>

                        <div className="text-center">
                          <p className={`text-lg font-bold ${getScoreColor(token.score)}`}>
                            {token.score}
                          </p>
                          <Progress value={token.score} className="w-12 h-1" />
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleFavorite(token.id)}
                          >
                            <Star className={`h-4 w-4 ${favorites.includes(token.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleAlert(token.id)}
                          >
                            <Bell className={`h-4 w-4 ${alerts.includes(token.id) ? 'fill-primary text-primary' : ''}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyAddress(token.address)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`https://dexscreener.com/${token.chain.toLowerCase()}/${token.address}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Tax info */}
                    {(token.buyTax > 0 || token.sellTax > 0) && (
                      <div className="mt-2 flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Buy Tax: <span className={token.buyTax > 10 ? 'text-red-500' : ''}>{token.buyTax}%</span>
                        </span>
                        <span className="text-muted-foreground">
                          Sell Tax: <span className={token.sellTax > 10 ? 'text-red-500' : ''}>{token.sellTax}%</span>
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenScanner;
