import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealMarketData } from "@/hooks/useRealMarketData";
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
  const { data, loading, error } = useRealMarketData({ 
    limit: 50,
    autoRefresh: true,
    refreshInterval: 15000
  });
  const [filter, setFilter] = useState<'all' | 'spot' | 'futures' | 'defi' | 'meme'>('all');
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(['BTC/USDT', 'ETH/USDT']);
  const isLive = !loading && data.length > 0;

  // Convert real market data to component format
  const markets: MarketData[] = data.map(coin => {
    // Determine category based on symbol/name
    let category: MarketData['category'] = 'spot';
    const lowerName = coin.name?.toLowerCase() || '';
    const lowerSymbol = coin.symbol?.toLowerCase() || '';
    
    if (['doge', 'shib', 'pepe', 'wif', 'bonk', 'floki'].some(m => lowerSymbol.includes(m))) {
      category = 'meme';
    } else if (['uni', 'aave', 'crv', 'mkr', 'comp', 'sushi'].some(d => lowerSymbol.includes(d))) {
      category = 'defi';
    }

    return {
      symbol: `${coin.symbol}/USDT`,
      name: coin.name || coin.symbol,
      price: Number(coin.price_usd) || 0,
      change24h: Number(coin.price_change_percentage_24h) || 0,
      volume24h: Number(coin.total_volume) || 0,
      high24h: Number(coin.high_24h) || Number(coin.price_usd) * 1.02,
      low24h: Number(coin.low_24h) || Number(coin.price_usd) * 0.98,
      marketCap: Number(coin.market_cap) || 0,
      category,
      exchange: 'CoinGecko'
    };
  });

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
            >
              {isLive ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {isLive ? 'LIVE' : loading ? 'Loading' : 'Offline'}
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
          {(['all', 'spot', 'defi', 'meme'] as const).map((cat) => (
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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No market data available</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 text-xs text-muted-foreground px-4 py-2 border-b bg-muted/30">
              <span></span>
              <span>Symbol</span>
              <span className="text-right">Price</span>
              <span className="text-right">24h Change</span>
              <span className="text-right">24h Volume</span>
              <span className="text-right">24h High/Low</span>
              <span className="text-right">Source</span>
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketOverview;