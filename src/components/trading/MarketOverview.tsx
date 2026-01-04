import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Star,
  Search,
  Wifi,
  WifiOff
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap: number;
  category: 'spot' | 'futures' | 'defi' | 'meme';
  exchange: string;
}

interface MarketOverviewProps {
  onSelectSymbol?: (symbol: string) => void;
}

const MarketOverview = ({ onSelectSymbol }: MarketOverviewProps) => {
  const { prices, isLive, toggleLive, lastSyncError } = useMarketPrices(10000);
  const [filter, setFilter] = useState<'all' | 'spot' | 'futures' | 'defi' | 'meme'>('all');
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(['BTC/USDT', 'ETH/USDT']);

  // Build markets from real-time prices
  const markets: MarketData[] = [
    { 
      symbol: 'BTC/USDT', 
      name: 'Bitcoin', 
      price: prices['BTC']?.priceNumeric || 67500, 
      change24h: prices['BTC']?.changePercent || 2.34, 
      volume24h: 28500000000, 
      high24h: (prices['BTC']?.priceNumeric || 67500) * 1.02, 
      low24h: (prices['BTC']?.priceNumeric || 67500) * 0.98, 
      marketCap: 1320000000000, 
      category: 'spot', 
      exchange: 'Binance' 
    },
    { 
      symbol: 'ETH/USDT', 
      name: 'Ethereum', 
      price: prices['ETH']?.priceNumeric || 3450, 
      change24h: prices['ETH']?.changePercent || 1.82, 
      volume24h: 15200000000, 
      high24h: (prices['ETH']?.priceNumeric || 3450) * 1.02, 
      low24h: (prices['ETH']?.priceNumeric || 3450) * 0.98, 
      marketCap: 415000000000, 
      category: 'spot', 
      exchange: 'Binance' 
    },
    { symbol: 'SOL/USDT', name: 'Solana', price: 145, change24h: 5.67, volume24h: 3800000000, high24h: 152, low24h: 138, marketCap: 63000000000, category: 'spot', exchange: 'Binance' },
    { symbol: 'BTC-PERP', name: 'Bitcoin Perpetual', price: prices['BTC']?.priceNumeric || 67520, change24h: 2.41, volume24h: 45000000000, high24h: 68250, low24h: 65750, marketCap: 0, category: 'futures', exchange: 'Binance' },
    { symbol: 'PEPE/USDT', name: 'Pepe', price: 0.0000125, change24h: 15.34, volume24h: 890000000, high24h: 0.0000135, low24h: 0.0000108, marketCap: 5200000000, category: 'meme', exchange: 'Binance' },
    { symbol: 'WIF/USDT', name: 'dogwifhat', price: 2.45, change24h: 8.92, volume24h: 450000000, high24h: 2.68, low24h: 2.25, marketCap: 2450000000, category: 'meme', exchange: 'Raydium' },
    { symbol: 'UNI/USDT', name: 'Uniswap', price: 9.85, change24h: -1.23, volume24h: 180000000, high24h: 10.20, low24h: 9.65, marketCap: 5900000000, category: 'defi', exchange: 'Uniswap' },
    { symbol: 'AAVE/USDT', name: 'Aave', price: 145, change24h: 3.45, volume24h: 120000000, high24h: 150, low24h: 140, marketCap: 2150000000, category: 'defi', exchange: 'Aave' },
    { symbol: 'ARB/USDT', name: 'Arbitrum', price: 0.85, change24h: -2.15, volume24h: 320000000, high24h: 0.89, low24h: 0.82, marketCap: 2850000000, category: 'defi', exchange: 'Binance' },
    { symbol: 'BONK/USDT', name: 'Bonk', price: 0.0000285, change24h: 12.45, volume24h: 650000000, high24h: 0.0000305, low24h: 0.0000252, marketCap: 1950000000, category: 'meme', exchange: 'Raydium' },
  ];

  const filteredMarkets = markets.filter(m => {
    const matchesFilter = filter === 'all' || m.category === filter;
    const matchesSearch = m.symbol.toLowerCase().includes(search.toLowerCase()) ||
                         m.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    return `$${vol.toLocaleString()}`;
  };

  const formatPrice = (price: number) => {
    if (price < 0.0001) return price.toFixed(10);
    if (price < 1) return price.toFixed(6);
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Market Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`cursor-pointer ${isLive ? 'text-green-500 border-green-500' : 'text-muted-foreground'}`}
              onClick={toggleLive}
            >
              {isLive ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {isLive ? 'LIVE' : 'Paused'}
            </Badge>
            <Badge variant="outline" className="text-green-500 border-green-500">
              {filteredMarkets.length} Markets
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          {(['all', 'spot', 'futures', 'defi', 'meme'] as const).map((cat) => (
            <Button
              key={cat}
              variant={filter === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-7 text-xs text-muted-foreground px-4 py-2 border-b bg-muted/30">
          <span></span>
          <span>Symbol</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h Change</span>
          <span className="text-right">24h Volume</span>
          <span className="text-right">24h High/Low</span>
          <span className="text-right">Exchange</span>
        </div>
        <ScrollArea className="h-[400px]">
          {filteredMarkets.map((market) => (
            <div
              key={market.symbol}
              className="grid grid-cols-7 items-center px-4 py-3 border-b hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onSelectSymbol?.(market.symbol)}
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(market.symbol);
                }}
              >
                <Star className={`h-4 w-4 ${favorites.includes(market.symbol) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
              </Button>
              <div>
                <div className="font-medium">{market.symbol}</div>
                <div className="text-xs text-muted-foreground">{market.name}</div>
              </div>
              <div className="text-right font-mono">
                ${formatPrice(market.price)}
              </div>
              <div className={`text-right flex items-center justify-end gap-1 ${market.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {market.change24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {market.change24h >= 0 ? '+' : ''}{market.change24h.toFixed(2)}%
              </div>
              <div className="text-right text-muted-foreground">
                {formatVolume(market.volume24h)}
              </div>
              <div className="text-right text-xs">
                <div className="text-green-500">${formatPrice(market.high24h)}</div>
                <div className="text-red-500">${formatPrice(market.low24h)}</div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-xs">{market.exchange}</Badge>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MarketOverview;
