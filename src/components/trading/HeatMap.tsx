import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { LayoutGrid, TrendingUp, TrendingDown } from "lucide-react";

interface HeatMapCell {
  symbol: string;
  name: string;
  price: number;
  change: number;
  marketCap: number;
  sector: string;
}

const CRYPTO_DATA = [
  { symbol: 'BTC', name: 'Bitcoin', marketCap: 1900000000000, sector: 'Crypto', basePrice: 96500 },
  { symbol: 'ETH', name: 'Ethereum', marketCap: 440000000000, sector: 'Layer1', basePrice: 3650 },
  { symbol: 'BNB', name: 'BNB', marketCap: 98000000000, sector: 'Crypto', basePrice: 680 },
  { symbol: 'SOL', name: 'Solana', marketCap: 85000000000, sector: 'Layer1', basePrice: 195 },
  { symbol: 'XRP', name: 'XRP', marketCap: 135000000000, sector: 'Crypto', basePrice: 2.35 },
  { symbol: 'ADA', name: 'Cardano', marketCap: 37000000000, sector: 'Layer1', basePrice: 1.05 },
  { symbol: 'AVAX', name: 'Avalanche', marketCap: 17000000000, sector: 'Layer1', basePrice: 42 },
  { symbol: 'DOGE', name: 'Dogecoin', marketCap: 55000000000, sector: 'Meme', basePrice: 0.38 },
  { symbol: 'DOT', name: 'Polkadot', marketCap: 11000000000, sector: 'Layer1', basePrice: 7.8 },
  { symbol: 'MATIC', name: 'Polygon', marketCap: 5400000000, sector: 'Layer2', basePrice: 0.58 },
  { symbol: 'UNI', name: 'Uniswap', marketCap: 7900000000, sector: 'DeFi', basePrice: 13.2 },
  { symbol: 'LINK', name: 'Chainlink', marketCap: 8700000000, sector: 'DeFi', basePrice: 14.5 },
  { symbol: 'SHIB', name: 'Shiba Inu', marketCap: 6000000000, sector: 'Meme', basePrice: 0.000025 },
  { symbol: 'LTC', name: 'Litecoin', marketCap: 5500000000, sector: 'Crypto', basePrice: 105 },
  { symbol: 'AAVE', name: 'Aave', marketCap: 2150000000, sector: 'DeFi', basePrice: 285 },
  { symbol: 'ARB', name: 'Arbitrum', marketCap: 2850000000, sector: 'Layer2', basePrice: 1.15 },
  { symbol: 'OP', name: 'Optimism', marketCap: 2200000000, sector: 'Layer2', basePrice: 2.35 },
  { symbol: 'PEPE', name: 'Pepe', marketCap: 5200000000, sector: 'Meme', basePrice: 0.000018 },
  { symbol: 'WIF', name: 'dogwifhat', marketCap: 2450000000, sector: 'Meme', basePrice: 2.85 },
  { symbol: 'BONK', name: 'Bonk', marketCap: 1950000000, sector: 'Meme', basePrice: 0.000032 },
];

const HeatMap = () => {
  const { prices, isLive, getPrice } = useMarketPrices();
  const [data, setData] = useState<HeatMapCell[]>([]);
  const [view, setView] = useState<'all' | 'sector'>('all');
  const [timeframe, setTimeframe] = useState('24h');

  // Initialize with real prices when available
  useEffect(() => {
    const initialData = CRYPTO_DATA.map(c => {
      const livePrice = getPrice(c.symbol);
      return {
        symbol: c.symbol,
        name: c.name,
        price: livePrice?.priceNumeric || c.basePrice,
        change: livePrice?.changePercent || (Math.random() - 0.45) * 10,
        marketCap: c.marketCap,
        sector: c.sector,
      };
    });
    setData(initialData);
  }, [prices]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(cell => ({
        ...cell,
        price: cell.price * (1 + (Math.random() - 0.5) * 0.002),
        change: cell.change + (Math.random() - 0.5) * 0.3
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getColor = (change: number) => {
    if (change > 8) return 'bg-emerald-600';
    if (change > 4) return 'bg-emerald-500';
    if (change > 1) return 'bg-emerald-400';
    if (change > 0) return 'bg-emerald-300';
    if (change > -1) return 'bg-red-300';
    if (change > -4) return 'bg-red-400';
    if (change > -8) return 'bg-red-500';
    return 'bg-red-600';
  };

  const getCellSize = (marketCap: number) => {
    const maxCap = Math.max(...data.map(d => d.marketCap));
    const ratio = marketCap / maxCap;
    if (ratio > 0.4) return 'col-span-2 row-span-2';
    if (ratio > 0.15) return 'col-span-2 row-span-1';
    if (ratio > 0.05) return 'col-span-1 row-span-2';
    return 'col-span-1 row-span-1';
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.0001) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    return `$${(cap / 1e6).toFixed(0)}M`;
  };

  const sortedData = [...data].sort((a, b) => b.marketCap - a.marketCap);
  const gainers = [...data].sort((a, b) => b.change - a.change).slice(0, 5);
  const losers = [...data].sort((a, b) => a.change - b.change).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={view} onValueChange={(v: any) => setView(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  <SelectItem value="sector">By Sector</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="30d">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant={isLive ? 'default' : 'secondary'} className={isLive ? 'bg-emerald-500 animate-pulse' : ''}>
              {isLive ? '● LIVE' : 'PAUSED'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Heat Map */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Market Heat Map
            </CardTitle>
            <CardDescription>Size = Market Cap • Color = {timeframe} Change • Prices live</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 md:grid-cols-8 gap-1.5 auto-rows-[70px]">
              {sortedData.map((cell) => (
                <div
                  key={cell.symbol}
                  className={`${getColor(cell.change)} ${getCellSize(cell.marketCap)} rounded-lg p-2 flex flex-col justify-between cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] shadow-md`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-bold text-white text-sm">{cell.symbol}</span>
                      <p className="text-white/70 text-[10px] truncate">{cell.name}</p>
                    </div>
                    <span className="text-white/60 text-[9px]">{formatMarketCap(cell.marketCap)}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-white font-semibold text-xs">{formatPrice(cell.price)}</span>
                    <span className="text-white font-bold text-xs flex items-center gap-0.5">
                      {cell.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {cell.change >= 0 ? '+' : ''}{cell.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Movers */}
        <div className="space-y-4">
          <Card className="border-emerald-500/30">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
                Top Gainers
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              {gainers.map((g, i) => (
                <div key={g.symbol} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs w-4">{i + 1}</span>
                    <div>
                      <span className="font-medium">{g.symbol}</span>
                      <p className="text-[10px] text-muted-foreground">{formatPrice(g.price)}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                    +{g.change.toFixed(2)}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-red-500/30">
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                <TrendingDown className="h-4 w-4" />
                Top Losers
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              {losers.map((l, i) => (
                <div key={l.symbol} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs w-4">{i + 1}</span>
                    <div>
                      <span className="font-medium">{l.symbol}</span>
                      <p className="text-[10px] text-muted-foreground">{formatPrice(l.price)}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                    {l.change.toFixed(2)}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground mb-2">24h Change Scale</p>
              <div className="flex gap-0.5 rounded overflow-hidden">
                <div className="flex-1 h-3 bg-red-600" />
                <div className="flex-1 h-3 bg-red-400" />
                <div className="flex-1 h-3 bg-red-300" />
                <div className="flex-1 h-3 bg-emerald-300" />
                <div className="flex-1 h-3 bg-emerald-400" />
                <div className="flex-1 h-3 bg-emerald-600" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>-8%</span>
                <span>0%</span>
                <span>+8%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
