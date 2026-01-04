import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useMarketPrices } from "@/hooks/useMarketPrices";
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
  WifiOff
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

const mockTokens: Token[] = [
  { id: '1', name: 'PepeCoin 2.0', symbol: 'PEPE2', address: '0x1234...5678', chain: 'Solana', price: 0.00000125, priceChange1h: 45.2, priceChange24h: 234.5, marketCap: 5200000, volume24h: 890000, liquidity: 450000, holders: 12500, launchTime: new Date(Date.now() - 3600000), isVerified: false, isHoneypot: false, buyTax: 5, sellTax: 5, score: 78, trending: true },
  { id: '2', name: 'MoonDog', symbol: 'MDOG', address: '0x2345...6789', chain: 'Solana', price: 0.0000089, priceChange1h: 23.1, priceChange24h: 156.8, marketCap: 3400000, volume24h: 520000, liquidity: 280000, holders: 8900, launchTime: new Date(Date.now() - 7200000), isVerified: true, isHoneypot: false, buyTax: 3, sellTax: 3, score: 85, trending: true },
  { id: '3', name: 'AI Agent Coin', symbol: 'AIAG', address: '0x3456...7890', chain: 'Base', price: 0.0045, priceChange1h: -5.2, priceChange24h: 89.3, marketCap: 8900000, volume24h: 1200000, liquidity: 680000, holders: 15600, launchTime: new Date(Date.now() - 14400000), isVerified: true, isHoneypot: false, buyTax: 2, sellTax: 2, score: 92, trending: true },
  { id: '4', name: 'Degen Token', symbol: 'DGEN', address: '0x4567...8901', chain: 'Solana', price: 0.00000045, priceChange1h: 12.8, priceChange24h: 67.4, marketCap: 1200000, volume24h: 340000, liquidity: 120000, holders: 4500, launchTime: new Date(Date.now() - 21600000), isVerified: false, isHoneypot: false, buyTax: 8, sellTax: 8, score: 62, trending: false },
  { id: '5', name: 'Rocket Finance', symbol: 'RCKT', address: '0x5678...9012', chain: 'Ethereum', price: 0.0234, priceChange1h: -8.5, priceChange24h: -15.2, marketCap: 12500000, volume24h: 2100000, liquidity: 890000, holders: 22000, launchTime: new Date(Date.now() - 86400000), isVerified: true, isHoneypot: false, buyTax: 1, sellTax: 1, score: 88, trending: false },
  { id: '6', name: 'CatWifBat', symbol: 'CWB', address: '0x6789...0123', chain: 'Solana', price: 0.00000234, priceChange1h: 78.9, priceChange24h: 456.7, marketCap: 890000, volume24h: 450000, liquidity: 89000, holders: 2300, launchTime: new Date(Date.now() - 1800000), isVerified: false, isHoneypot: false, buyTax: 10, sellTax: 10, score: 55, trending: true },
];

const chainColors: Record<string, string> = {
  Solana: 'bg-gradient-to-r from-purple-500 to-green-500',
  Ethereum: 'bg-blue-500',
  Base: 'bg-blue-600',
  BSC: 'bg-yellow-500',
};

const TokenScanner = () => {
  const { prices, isLive, toggleLive } = useMarketPrices(10000);
  const [tokens, setTokens] = useState(mockTokens);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<'all' | 'trending' | 'new' | 'verified'>('all');
  const [chainFilter, setChainFilter] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => prev.map(t => ({
        ...t,
        price: t.price * (1 + (Math.random() - 0.5) * 0.05),
        priceChange1h: t.priceChange1h + (Math.random() - 0.5) * 2
      })));
    }, 3000);
    return () => clearInterval(interval);
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

  const getAgeString = (launchTime: Date) => {
    const diff = Date.now() - launchTime.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 24) return `${Math.floor(hours / 24)}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Token Scanner
          </CardTitle>
          <Badge 
            variant="outline" 
            className={`cursor-pointer ${isLive ? 'text-green-500 border-green-500' : 'text-muted-foreground'}`}
            onClick={toggleLive}
          >
            {isLive ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            {isLive ? 'LIVE' : 'Paused'}
          </Badge>
          <Badge variant="outline" className="text-green-500 border-green-500">
            <Flame className="h-3 w-3 mr-1" />
            {tokens.filter(t => t.trending).length} Trending
          </Badge>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-2 mt-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {(['all', 'trending', 'new', 'verified'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'trending' && <Flame className="h-3 w-3 mr-1" />}
                {f === 'new' && <Clock className="h-3 w-3 mr-1" />}
                {f === 'verified' && <Shield className="h-3 w-3 mr-1" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
            <div className="ml-auto flex gap-1">
              {['Solana', 'Ethereum', 'Base'].map((chain) => (
                <Button
                  key={chain}
                  variant={chainFilter.includes(chain) ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setChainFilter(prev =>
                    prev.includes(chain) ? prev.filter(c => c !== chain) : [...prev, chain]
                  )}
                >
                  {chain}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[450px]">
          {filteredTokens.map((token) => (
            <div
              key={token.id}
              className="p-4 border-b hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className={`h-10 w-10 rounded-full ${chainColors[token.chain]} flex items-center justify-center text-white font-bold`}>
                      {token.symbol.slice(0, 2)}
                    </div>
                    {token.trending && (
                      <Flame className="absolute -top-1 -right-1 h-4 w-4 text-orange-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{token.name}</span>
                      <span className="text-muted-foreground">${token.symbol}</span>
                      {token.isVerified && (
                        <Shield className="h-4 w-4 text-green-500" />
                      )}
                      <Badge variant="outline" className="text-xs">{token.chain}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => copyAddress(token.address)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {token.address}
                        <Copy className="h-3 w-3" />
                      </button>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getAgeString(token.launchTime)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold">${formatPrice(token.price)}</div>
                  <div className={`text-sm flex items-center justify-end gap-1 ${
                    token.priceChange1h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {token.priceChange1h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {token.priceChange1h.toFixed(1)}% (1h)
                  </div>
                </div>
              </div>

              {/* Token Metrics */}
              <div className="grid grid-cols-6 gap-3 mt-3 text-xs">
                <div>
                  <p className="text-muted-foreground">MCap</p>
                  <p className="font-medium">{formatNumber(token.marketCap)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Volume</p>
                  <p className="font-medium">{formatNumber(token.volume24h)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Liquidity</p>
                  <p className="font-medium">{formatNumber(token.liquidity)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Holders</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {token.holders.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Tax (B/S)</p>
                  <p className={`font-medium ${token.buyTax > 5 ? 'text-amber-500' : ''}`}>
                    {token.buyTax}% / {token.sellTax}%
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Score</p>
                  <p className={`font-bold ${getScoreColor(token.score)}`}>
                    {token.score}/100
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button size="sm" className="flex-1 bg-green-500 hover:bg-green-600">
                  <Zap className="h-3 w-3 mr-1" />
                  Quick Buy
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFavorites(prev =>
                    prev.includes(token.id) ? prev.filter(f => f !== token.id) : [...prev, token.id]
                  )}
                >
                  <Star className={`h-4 w-4 ${favorites.includes(token.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setAlerts(prev =>
                    prev.includes(token.id) ? prev.filter(a => a !== token.id) : [...prev, token.id]
                  )}
                >
                  <Bell className={`h-4 w-4 ${alerts.includes(token.id) ? 'fill-primary text-primary' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              {/* Warnings */}
              {(token.buyTax > 5 || !token.isVerified || token.liquidity < 100000) && (
                <div className="flex items-center gap-2 mt-2 p-2 rounded bg-amber-500/10 text-amber-500 text-xs">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    {!token.isVerified && 'Unverified • '}
                    {token.buyTax > 5 && `High tax (${token.buyTax}%) • `}
                    {token.liquidity < 100000 && 'Low liquidity'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TokenScanner;
