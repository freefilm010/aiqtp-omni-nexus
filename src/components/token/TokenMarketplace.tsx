import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, Search, TrendingUp, TrendingDown, Flame, Clock, Users, Crown, Zap } from "lucide-react";

interface TokenListing {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  bondingProgress: number;
  holders: number;
  volume24h: number;
  createdAt: Date;
  creator: string;
  isGraduated: boolean;
  description: string;
}

const TokenMarketplace = () => {
  const [tokens, setTokens] = useState<TokenListing[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'new' | 'graduating' | 'graduated'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTokens();
    const channel = supabase
      .channel(`token-listings-rt-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'token_listings' }, () => fetchTokens())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTokens = async () => {
    const { data } = await supabase.from('token_listings').select('*').order('volume_24h', { ascending: false }).limit(50);
    if (data) {
      setTokens(data.map((t: any) => ({
        id: t.id,
        name: t.name,
        symbol: t.symbol,
        chain: t.chain,
        price: Number(t.price),
        priceChange24h: Number(t.price_change_24h),
        marketCap: Number(t.market_cap),
        bondingProgress: Number(t.bonding_progress),
        holders: t.holders,
        volume24h: Number(t.volume_24h),
        createdAt: new Date(t.created_at),
        creator: t.creator_address || '',
        isGraduated: t.is_graduated,
        description: t.description || '',
      })));
    }
    setLoading(false);
  };

  const filteredTokens = tokens.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.symbol.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' ||
      (filter === 'new' && Date.now() - t.createdAt.getTime() < 86400000) ||
      (filter === 'graduating' && t.bondingProgress >= 80 && t.bondingProgress < 100) ||
      (filter === 'graduated' && t.isGraduated);
    return matchesSearch && matchesFilter;
  }).sort((a, b) => b.volume24h - a.volume24h);

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

  const getTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3"><Rocket className="h-8 w-8 text-purple-500" /><div><p className="text-sm text-muted-foreground">Active Tokens</p><p className="text-3xl font-bold">{tokens.length}</p></div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3"><Crown className="h-8 w-8 text-green-500" /><div><p className="text-sm text-muted-foreground">Graduated</p><p className="text-3xl font-bold text-green-500">{tokens.filter(t => t.isGraduated).length}</p></div></div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3"><Flame className="h-8 w-8 text-amber-500" /><div><p className="text-sm text-muted-foreground">24h Volume</p><p className="text-3xl font-bold text-amber-500">{formatNumber(tokens.reduce((sum, t) => sum + t.volume24h, 0))}</p></div></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">Total Holders</p><p className="text-3xl font-bold">{tokens.reduce((sum, t) => sum + t.holders, 0).toLocaleString()}</p></div></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search tokens..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            {(['all', 'new', 'graduating', 'graduated'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                {f === 'new' && <Clock className="h-3 w-3 mr-1" />}
                {f === 'graduating' && <Zap className="h-3 w-3 mr-1" />}
                {f === 'graduated' && <Crown className="h-3 w-3 mr-1" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 text-xs text-muted-foreground px-4 py-3 border-b bg-muted/30">
            <span>Token</span><span className="text-right">Price</span><span className="text-right">24h %</span>
            <span className="text-right">MCap</span><span className="text-center">Progress</span>
            <span className="text-right">Volume</span><span className="text-right">Holders</span><span className="text-right">Action</span>
          </div>
          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">Loading tokens...</div>
            ) : filteredTokens.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Rocket className="h-12 w-12 mb-4 opacity-50" />
                <p>No token listings found</p>
              </div>
            ) : filteredTokens.map((token) => (
              <div key={token.id} className="grid grid-cols-8 items-center px-4 py-4 border-b hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">{token.symbol.slice(0, 2)}</div>
                  <div>
                    <div className="flex items-center gap-2"><span className="font-medium">{token.name}</span>{token.isGraduated && <Crown className="h-4 w-4 text-amber-500" />}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>${token.symbol}</span><Badge variant="secondary" className="text-xs h-4">{token.chain}</Badge><span>{getTimeAgo(token.createdAt)}</span></div>
                  </div>
                </div>
                <div className="text-right font-mono">${formatPrice(token.price)}</div>
                <div className={`text-right font-bold ${token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {token.priceChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">{formatNumber(token.marketCap)}</div>
                <div className="px-2">
                  <div className="flex items-center gap-2">
                    <Progress value={token.bondingProgress} className={`h-2 ${token.bondingProgress >= 100 ? 'bg-green-200' : ''}`} />
                    <span className={`text-xs ${token.bondingProgress >= 100 ? 'text-green-500' : ''}`}>{token.bondingProgress.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-right">{formatNumber(token.volume24h)}</div>
                <div className="text-right flex items-center justify-end gap-1"><Users className="h-3 w-3" />{token.holders.toLocaleString()}</div>
                <div className="text-right"><Button size="sm" className="bg-green-500 hover:bg-green-600">Buy</Button></div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenMarketplace;
