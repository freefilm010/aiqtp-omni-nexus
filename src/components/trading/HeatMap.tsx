import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { LayoutGrid, TrendingUp, TrendingDown, Globe, Coins } from "lucide-react";

interface HeatMapCell {
  symbol: string;
  name: string;
  change: number;
  marketCap: number;
  sector: string;
}

const generateHeatMapData = (): HeatMapCell[] => {
  const sectors = ['Crypto', 'DeFi', 'Layer1', 'Layer2', 'Meme', 'NFT', 'Gaming'];
  const cryptos = [
    { symbol: 'BTC', name: 'Bitcoin', marketCap: 1320000000000, sector: 'Crypto' },
    { symbol: 'ETH', name: 'Ethereum', marketCap: 415000000000, sector: 'Layer1' },
    { symbol: 'BNB', name: 'BNB', marketCap: 89000000000, sector: 'Crypto' },
    { symbol: 'SOL', name: 'Solana', marketCap: 63000000000, sector: 'Layer1' },
    { symbol: 'XRP', name: 'XRP', marketCap: 45000000000, sector: 'Crypto' },
    { symbol: 'ADA', name: 'Cardano', marketCap: 23000000000, sector: 'Layer1' },
    { symbol: 'AVAX', name: 'Avalanche', marketCap: 15000000000, sector: 'Layer1' },
    { symbol: 'DOGE', name: 'Dogecoin', marketCap: 12000000000, sector: 'Meme' },
    { symbol: 'DOT', name: 'Polkadot', marketCap: 10000000000, sector: 'Layer1' },
    { symbol: 'MATIC', name: 'Polygon', marketCap: 9000000000, sector: 'Layer2' },
    { symbol: 'UNI', name: 'Uniswap', marketCap: 5900000000, sector: 'DeFi' },
    { symbol: 'LINK', name: 'Chainlink', marketCap: 8500000000, sector: 'DeFi' },
    { symbol: 'SHIB', name: 'Shiba Inu', marketCap: 6000000000, sector: 'Meme' },
    { symbol: 'LTC', name: 'Litecoin', marketCap: 5500000000, sector: 'Crypto' },
    { symbol: 'AAVE', name: 'Aave', marketCap: 2150000000, sector: 'DeFi' },
    { symbol: 'ARB', name: 'Arbitrum', marketCap: 2850000000, sector: 'Layer2' },
    { symbol: 'OP', name: 'Optimism', marketCap: 2200000000, sector: 'Layer2' },
    { symbol: 'IMX', name: 'Immutable', marketCap: 1800000000, sector: 'Gaming' },
    { symbol: 'SAND', name: 'Sandbox', marketCap: 1500000000, sector: 'Gaming' },
    { symbol: 'APE', name: 'ApeCoin', marketCap: 1200000000, sector: 'NFT' },
    { symbol: 'PEPE', name: 'Pepe', marketCap: 5200000000, sector: 'Meme' },
    { symbol: 'WIF', name: 'dogwifhat', marketCap: 2450000000, sector: 'Meme' },
    { symbol: 'BONK', name: 'Bonk', marketCap: 1950000000, sector: 'Meme' },
    { symbol: 'FET', name: 'Fetch.ai', marketCap: 1100000000, sector: 'DeFi' },
  ];

  return cryptos.map(c => ({
    ...c,
    change: (Math.random() - 0.45) * 20,
  }));
};

const HeatMap = () => {
  const { isLive } = useMarketPrices();
  const [data, setData] = useState<HeatMapCell[]>(() => generateHeatMapData());
  const [view, setView] = useState<'all' | 'sector'>('all');
  const [timeframe, setTimeframe] = useState('24h');

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(cell => ({
        ...cell,
        change: cell.change + (Math.random() - 0.5) * 0.5
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const getColor = (change: number) => {
    if (change > 10) return 'bg-green-600';
    if (change > 5) return 'bg-green-500';
    if (change > 2) return 'bg-green-400';
    if (change > 0) return 'bg-green-300';
    if (change > -2) return 'bg-red-300';
    if (change > -5) return 'bg-red-400';
    if (change > -10) return 'bg-red-500';
    return 'bg-red-600';
  };

  const getCellSize = (marketCap: number) => {
    const maxCap = Math.max(...data.map(d => d.marketCap));
    const ratio = marketCap / maxCap;
    if (ratio > 0.5) return 'col-span-2 row-span-2';
    if (ratio > 0.1) return 'col-span-1 row-span-2';
    return 'col-span-1 row-span-1';
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
            <Badge variant={isLive ? 'default' : 'secondary'} className="bg-green-500">
              {isLive ? 'LIVE' : 'PAUSED'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {/* Main Heat Map */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Market Heat Map
            </CardTitle>
            <CardDescription>Size = Market Cap • Color = {timeframe} Performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-1 auto-rows-[60px]">
              {sortedData.map((cell) => (
                <div
                  key={cell.symbol}
                  className={`${getColor(cell.change)} ${getCellSize(cell.marketCap)} rounded p-2 flex flex-col justify-between cursor-pointer hover:opacity-80 transition-opacity`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{cell.symbol}</span>
                    <span className="text-xs text-white/80">{cell.sector}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-white font-bold ${cell.change >= 0 ? '' : ''}`}>
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
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Top Gainers
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              {gainers.map((g, i) => (
                <div key={g.symbol} className="flex justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{i + 1}</span>
                    <span className="font-medium">{g.symbol}</span>
                  </div>
                  <span className="text-green-500 font-bold">+{g.change.toFixed(2)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Top Losers
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0 pb-4">
              {losers.map((l, i) => (
                <div key={l.symbol} className="flex justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">{i + 1}</span>
                    <span className="font-medium">{l.symbol}</span>
                  </div>
                  <span className="text-red-500 font-bold">{l.change.toFixed(2)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground mb-2">Color Scale</p>
              <div className="flex gap-1">
                <div className="flex-1 h-4 bg-red-600 rounded-l" />
                <div className="flex-1 h-4 bg-red-400" />
                <div className="flex-1 h-4 bg-red-300" />
                <div className="flex-1 h-4 bg-green-300" />
                <div className="flex-1 h-4 bg-green-400" />
                <div className="flex-1 h-4 bg-green-600 rounded-r" />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>-10%</span>
                <span>0%</span>
                <span>+10%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HeatMap;
