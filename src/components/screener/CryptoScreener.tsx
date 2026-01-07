import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpDown,
  Star,
  Zap,
  Volume2,
  Activity
} from "lucide-react";

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change7d: number;
  volume24h: number;
  marketCap: number;
  rsi: number;
  macdSignal: 'bullish' | 'bearish' | 'neutral';
  volumeChange: number;
  priceScore: number;
  isWatchlist?: boolean;
}

const mockAssets: CryptoAsset[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 103245, change24h: 2.4, change7d: 8.5, volume24h: 45000000000, marketCap: 2000000000000, rsi: 68, macdSignal: 'bullish', volumeChange: 15, priceScore: 85 },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3845, change24h: 1.8, change7d: 12.3, volume24h: 18000000000, marketCap: 460000000000, rsi: 72, macdSignal: 'bullish', volumeChange: 22, priceScore: 78 },
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 185, change24h: -1.2, change7d: 5.8, volume24h: 3200000000, marketCap: 85000000000, rsi: 55, macdSignal: 'neutral', volumeChange: -5, priceScore: 65 },
  { id: 'bnb', symbol: 'BNB', name: 'BNB', price: 625, change24h: 0.8, change7d: 3.2, volume24h: 1500000000, marketCap: 95000000000, rsi: 48, macdSignal: 'neutral', volumeChange: 8, priceScore: 58 },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', price: 2.15, change24h: 5.2, change7d: 15.8, volume24h: 5000000000, marketCap: 120000000000, rsi: 78, macdSignal: 'bullish', volumeChange: 45, priceScore: 82 },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', price: 0.95, change24h: -2.5, change7d: -5.2, volume24h: 800000000, marketCap: 34000000000, rsi: 35, macdSignal: 'bearish', volumeChange: -12, priceScore: 42 },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', price: 42, change24h: 3.8, change7d: 8.2, volume24h: 650000000, marketCap: 17000000000, rsi: 62, macdSignal: 'bullish', volumeChange: 28, priceScore: 71 },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', price: 0.38, change24h: 8.5, change7d: 25.3, volume24h: 2800000000, marketCap: 55000000000, rsi: 82, macdSignal: 'bullish', volumeChange: 85, priceScore: 88 },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', price: 8.25, change24h: -0.5, change7d: 2.1, volume24h: 420000000, marketCap: 12000000000, rsi: 45, macdSignal: 'neutral', volumeChange: 3, priceScore: 52 },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', price: 18.50, change24h: 4.2, change7d: 10.5, volume24h: 780000000, marketCap: 11000000000, rsi: 65, macdSignal: 'bullish', volumeChange: 32, priceScore: 75 },
];

const CryptoScreener = () => {
  const [assets, setAssets] = useState<CryptoAsset[]>(mockAssets);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<string>('all');
  const [watchlist, setWatchlist] = useState<string[]>(['btc', 'eth']);

  const filteredAssets = assets
    .filter(a => {
      const matchesSearch = a.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            a.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filter === 'bullish') matchesFilter = a.macdSignal === 'bullish';
      if (filter === 'bearish') matchesFilter = a.macdSignal === 'bearish';
      if (filter === 'overbought') matchesFilter = a.rsi > 70;
      if (filter === 'oversold') matchesFilter = a.rsi < 30;
      if (filter === 'highVolume') matchesFilter = a.volumeChange > 20;
      if (filter === 'watchlist') matchesFilter = watchlist.includes(a.id);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aVal = a[sortBy as keyof CryptoAsset] as number;
      const bVal = b[sortBy as keyof CryptoAsset] as number;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => 
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return 'text-red-500';
    if (rsi <= 30) return 'text-green-500';
    return 'text-muted-foreground';
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Crypto Screener
          </CardTitle>
          <Badge variant="outline">
            {filteredAssets.length} Assets
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Assets</SelectItem>
              <SelectItem value="bullish">Bullish MACD</SelectItem>
              <SelectItem value="bearish">Bearish MACD</SelectItem>
              <SelectItem value="overbought">Overbought (RSI &gt; 70)</SelectItem>
              <SelectItem value="oversold">Oversold (RSI &lt; 30)</SelectItem>
              <SelectItem value="highVolume">High Volume</SelectItem>
              <SelectItem value="watchlist">Watchlist</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marketCap">Market Cap</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="change24h">24h Change</SelectItem>
              <SelectItem value="change7d">7d Change</SelectItem>
              <SelectItem value="volume24h">Volume</SelectItem>
              <SelectItem value="rsi">RSI</SelectItem>
              <SelectItem value="priceScore">Score</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-9 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
          <span>Asset</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h</span>
          <span className="text-right">7d</span>
          <span className="text-right">Volume</span>
          <span className="text-right">Market Cap</span>
          <span className="text-center">RSI</span>
          <span className="text-center">Signal</span>
          <span className="text-center">Score</span>
        </div>

        <ScrollArea className="h-[500px]">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="grid grid-cols-9 gap-2 items-center px-4 py-3 border-b hover:bg-muted/50 transition-colors"
            >
              {/* Asset */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleWatchlist(asset.id)}
                >
                  <Star className={`h-4 w-4 ${watchlist.includes(asset.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                </Button>
                <div>
                  <span className="font-bold">{asset.symbol}</span>
                  <p className="text-xs text-muted-foreground">{asset.name}</p>
                </div>
              </div>

              {/* Price */}
              <div className="text-right font-mono">
                ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>

              {/* 24h Change */}
              <div className={`text-right font-medium ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
              </div>

              {/* 7d Change */}
              <div className={`text-right font-medium ${asset.change7d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {asset.change7d >= 0 ? '+' : ''}{asset.change7d.toFixed(2)}%
              </div>

              {/* Volume */}
              <div className="text-right">
                <span className="font-mono">{formatNumber(asset.volume24h)}</span>
                <p className={`text-xs ${asset.volumeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.volumeChange >= 0 ? '↑' : '↓'}{Math.abs(asset.volumeChange)}%
                </p>
              </div>

              {/* Market Cap */}
              <div className="text-right font-mono">
                {formatNumber(asset.marketCap)}
              </div>

              {/* RSI */}
              <div className={`text-center font-bold ${getRSIColor(asset.rsi)}`}>
                {asset.rsi}
              </div>

              {/* MACD Signal */}
              <div className="flex justify-center">
                {asset.macdSignal === 'bullish' && (
                  <Badge className="bg-green-500/10 text-green-500 border-green-500/30">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Buy
                  </Badge>
                )}
                {asset.macdSignal === 'bearish' && (
                  <Badge className="bg-red-500/10 text-red-500 border-red-500/30">
                    <TrendingDown className="h-3 w-3 mr-1" />
                    Sell
                  </Badge>
                )}
                {asset.macdSignal === 'neutral' && (
                  <Badge variant="outline">Hold</Badge>
                )}
              </div>

              {/* Score */}
              <div className="flex justify-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(asset.priceScore)}`}>
                  {asset.priceScore}
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CryptoScreener;
