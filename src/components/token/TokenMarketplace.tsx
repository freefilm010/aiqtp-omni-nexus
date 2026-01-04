import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import {
  Rocket,
  Search,
  TrendingUp,
  TrendingDown,
  Flame,
  Clock,
  Users,
  Coins,
  Crown,
  Zap
} from "lucide-react";

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

const generateTokens = (): TokenListing[] => {
  const names = [
    'Moon Rocket', 'Degen Coin', 'AI Agent', 'Based Chad', 'Wojak Finance',
    'Pepe 2.0', 'Sigma Male', 'Diamond Hands', 'Laser Eyes', 'To The Moon'
  ];
  
  return names.map((name, i) => {
    const bondingProgress = Math.random() * 100;
    return {
      id: `token-${i}`,
      name,
      symbol: name.split(' ').map(w => w[0]).join('').toUpperCase(),
      chain: ['Solana', 'Base', 'Ethereum'][Math.floor(Math.random() * 3)],
      price: Math.random() * 0.001,
      priceChange24h: (Math.random() - 0.4) * 200,
      marketCap: Math.random() * 500000,
      bondingProgress,
      holders: Math.floor(Math.random() * 5000),
      volume24h: Math.random() * 100000,
      createdAt: new Date(Date.now() - Math.random() * 86400000 * 7),
      creator: '0x' + Math.random().toString(16).slice(2, 10),
      isGraduated: bondingProgress >= 100,
      description: `The next 1000x gem on ${['Solana', 'Base', 'Ethereum'][Math.floor(Math.random() * 3)]}`
    };
  });
};

const TokenMarketplace = () => {
  const [tokens, setTokens] = useState<TokenListing[]>(() => generateTokens());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'new' | 'graduating' | 'graduated'>('all');

  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => prev.map(t => ({
        ...t,
        price: t.price * (1 + (Math.random() - 0.48) * 0.1),
        priceChange24h: t.priceChange24h + (Math.random() - 0.5) * 5,
        bondingProgress: Math.min(100, t.bondingProgress + Math.random() * 0.5),
        volume24h: t.volume24h * (1 + (Math.random() - 0.5) * 0.1)
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredTokens = tokens.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                         t.symbol.toLowerCase().includes(search.toLowerCase());
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
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Rocket className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Tokens</p>
                <p className="text-3xl font-bold">{tokens.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Graduated</p>
                <p className="text-3xl font-bold text-green-500">
                  {tokens.filter(t => t.isGraduated).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-3xl font-bold text-amber-500">
                  {formatNumber(tokens.reduce((sum, t) => sum + t.volume24h, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Holders</p>
                <p className="text-3xl font-bold">
                  {tokens.reduce((sum, t) => sum + t.holders, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {(['all', 'new', 'graduating', 'graduated'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'new' && <Clock className="h-3 w-3 mr-1" />}
                {f === 'graduating' && <Zap className="h-3 w-3 mr-1" />}
                {f === 'graduated' && <Crown className="h-3 w-3 mr-1" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token List */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-8 text-xs text-muted-foreground px-4 py-3 border-b bg-muted/30">
            <span>Token</span>
            <span className="text-right">Price</span>
            <span className="text-right">24h %</span>
            <span className="text-right">MCap</span>
            <span className="text-center">Progress</span>
            <span className="text-right">Volume</span>
            <span className="text-right">Holders</span>
            <span className="text-right">Action</span>
          </div>
          <ScrollArea className="h-[500px]">
            {filteredTokens.map((token) => (
              <div
                key={token.id}
                className="grid grid-cols-8 items-center px-4 py-4 border-b hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                    {token.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{token.name}</span>
                      {token.isGraduated && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>${token.symbol}</span>
                      <Badge variant="secondary" className="text-xs h-4">{token.chain}</Badge>
                      <span>{getTimeAgo(token.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  ${formatPrice(token.price)}
                </div>
                <div className={`text-right font-bold ${
                  token.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  <div className="flex items-center justify-end gap-1">
                    {token.priceChange24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
                  </div>
                </div>
                <div className="text-right">
                  {formatNumber(token.marketCap)}
                </div>
                <div className="px-2">
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={token.bondingProgress} 
                      className={`h-2 ${token.bondingProgress >= 100 ? 'bg-green-200' : ''}`}
                    />
                    <span className={`text-xs ${token.bondingProgress >= 100 ? 'text-green-500' : ''}`}>
                      {token.bondingProgress.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  {formatNumber(token.volume24h)}
                </div>
                <div className="text-right flex items-center justify-end gap-1">
                  <Users className="h-3 w-3" />
                  {token.holders.toLocaleString()}
                </div>
                <div className="text-right">
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    Buy
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TokenMarketplace;
