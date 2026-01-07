import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Maximize2,
  Filter
} from "lucide-react";

interface HeatmapCell {
  symbol: string;
  name: string;
  change: number;
  marketCap: number;
  volume: number;
  sector?: string;
}

const SP500_SECTORS = [
  { name: 'Technology', stocks: ['AAPL', 'MSFT', 'NVDA', 'AVGO', 'ADBE', 'CRM', 'AMD', 'INTC', 'CSCO', 'ORCL'] },
  { name: 'Healthcare', stocks: ['UNH', 'JNJ', 'LLY', 'PFE', 'MRK', 'ABBV', 'TMO', 'DHR', 'ABT', 'BMY'] },
  { name: 'Financials', stocks: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'C', 'AXP', 'SCHW', 'CB'] },
  { name: 'Consumer', stocks: ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX', 'LOW', 'TGT', 'COST', 'WMT'] },
  { name: 'Communication', stocks: ['GOOGL', 'META', 'NFLX', 'DIS', 'CMCSA', 'VZ', 'T', 'TMUS', 'CHTR', 'EA'] },
  { name: 'Energy', stocks: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL'] },
  { name: 'Industrials', stocks: ['CAT', 'RTX', 'HON', 'UNP', 'BA', 'DE', 'LMT', 'GE', 'MMM', 'UPS'] },
  { name: 'Materials', stocks: ['LIN', 'APD', 'SHW', 'ECL', 'DD', 'NEM', 'FCX', 'NUE', 'VMC', 'MLM'] },
];

const CRYPTO_LIST = [
  { symbol: 'BTC', name: 'Bitcoin', marketCap: 1300 },
  { symbol: 'ETH', name: 'Ethereum', marketCap: 400 },
  { symbol: 'BNB', name: 'BNB', marketCap: 90 },
  { symbol: 'SOL', name: 'Solana', marketCap: 65 },
  { symbol: 'XRP', name: 'XRP', marketCap: 55 },
  { symbol: 'DOGE', name: 'Dogecoin', marketCap: 25 },
  { symbol: 'ADA', name: 'Cardano', marketCap: 20 },
  { symbol: 'AVAX', name: 'Avalanche', marketCap: 15 },
  { symbol: 'DOT', name: 'Polkadot', marketCap: 12 },
  { symbol: 'MATIC', name: 'Polygon', marketCap: 10 },
  { symbol: 'LINK', name: 'Chainlink', marketCap: 10 },
  { symbol: 'UNI', name: 'Uniswap', marketCap: 8 },
  { symbol: 'ATOM', name: 'Cosmos', marketCap: 5 },
  { symbol: 'LTC', name: 'Litecoin', marketCap: 6 },
  { symbol: 'BCH', name: 'Bitcoin Cash', marketCap: 5 },
  { symbol: 'APT', name: 'Aptos', marketCap: 4 },
  { symbol: 'ARB', name: 'Arbitrum', marketCap: 4 },
  { symbol: 'OP', name: 'Optimism', marketCap: 3 },
  { symbol: 'SUI', name: 'Sui', marketCap: 3 },
  { symbol: 'INJ', name: 'Injective', marketCap: 3 },
  { symbol: 'PEPE', name: 'Pepe', marketCap: 5 },
  { symbol: 'WIF', name: 'dogwifhat', marketCap: 3 },
  { symbol: 'BONK', name: 'Bonk', marketCap: 2 },
  { symbol: 'SHIB', name: 'Shiba Inu', marketCap: 15 },
];

const generateStockData = (): HeatmapCell[] => {
  const data: HeatmapCell[] = [];
  SP500_SECTORS.forEach(sector => {
    sector.stocks.forEach(symbol => {
      data.push({
        symbol,
        name: symbol,
        change: (Math.random() - 0.5) * 10,
        marketCap: 50 + Math.random() * 500,
        volume: Math.random() * 100,
        sector: sector.name
      });
    });
  });
  return data;
};

const generateCryptoData = (): HeatmapCell[] => {
  return CRYPTO_LIST.map(c => ({
    symbol: c.symbol,
    name: c.name,
    change: (Math.random() - 0.5) * 20,
    marketCap: c.marketCap,
    volume: Math.random() * 10
  }));
};

const getColorByChange = (change: number): string => {
  if (change > 5) return 'bg-green-500';
  if (change > 3) return 'bg-green-400';
  if (change > 1) return 'bg-green-300';
  if (change > 0) return 'bg-green-200';
  if (change > -1) return 'bg-red-200';
  if (change > -3) return 'bg-red-300';
  if (change > -5) return 'bg-red-400';
  return 'bg-red-500';
};

const getTextColorByChange = (change: number): string => {
  if (Math.abs(change) > 3) return 'text-white';
  return 'text-foreground';
};

const MarketHeatmap = () => {
  const [stockData, setStockData] = useState<HeatmapCell[]>([]);
  const [cryptoData, setCryptoData] = useState<HeatmapCell[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'change' | 'marketCap' | 'volume'>('marketCap');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setStockData(generateStockData());
    setCryptoData(generateCryptoData());
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setStockData(generateStockData());
      setCryptoData(generateCryptoData());
      setIsLoading(false);
    }, 500);
  };

  const filteredStocks = stockData
    .filter(s => selectedSector === 'all' || s.sector === selectedSector)
    .sort((a, b) => sortBy === 'change' ? b.change - a.change : sortBy === 'marketCap' ? b.marketCap - a.marketCap : b.volume - a.volume);

  const sortedCrypto = [...cryptoData].sort((a, b) => 
    sortBy === 'change' ? b.change - a.change : sortBy === 'marketCap' ? b.marketCap - a.marketCap : b.volume - a.volume
  );

  const renderHeatmapGrid = (data: HeatmapCell[], isCrypto: boolean) => {
    // Calculate relative sizes based on market cap
    const maxMarketCap = Math.max(...data.map(d => d.marketCap));
    
    return (
      <div className="flex flex-wrap gap-1">
        <TooltipProvider>
          {data.map(cell => {
            const size = isCrypto 
              ? Math.max(60, Math.min(150, (cell.marketCap / maxMarketCap) * 150))
              : Math.max(50, Math.min(100, (cell.marketCap / maxMarketCap) * 100));
            
            return (
              <Tooltip key={cell.symbol}>
                <TooltipTrigger asChild>
                  <div
                    className={`${getColorByChange(cell.change)} ${getTextColorByChange(cell.change)} rounded cursor-pointer transition-all hover:scale-105 hover:z-10 flex flex-col items-center justify-center p-1`}
                    style={{ width: size, height: size * 0.8 }}
                  >
                    <span className="font-bold text-xs truncate">{cell.symbol}</span>
                    <span className="text-[10px]">
                      {cell.change > 0 ? '+' : ''}{cell.change.toFixed(1)}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    <p className="font-bold">{cell.name} ({cell.symbol})</p>
                    <p className={cell.change > 0 ? 'text-green-500' : 'text-red-500'}>
                      {cell.change > 0 ? '+' : ''}{cell.change.toFixed(2)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MCap: ${cell.marketCap.toFixed(1)}B
                    </p>
                    {cell.sector && <p className="text-xs">{cell.sector}</p>}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
    );
  };

  // Sector summary
  const sectorSummary = SP500_SECTORS.map(sector => {
    const sectorStocks = stockData.filter(s => s.sector === sector.name);
    const avgChange = sectorStocks.reduce((sum, s) => sum + s.change, 0) / sectorStocks.length;
    return { name: sector.name, avgChange };
  }).sort((a, b) => b.avgChange - a.avgChange);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="marketCap">Market Cap</SelectItem>
              <SelectItem value="change">% Change</SelectItem>
              <SelectItem value="volume">Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="stocks">
        <TabsList>
          <TabsTrigger value="stocks" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            S&P 500
          </TabsTrigger>
          <TabsTrigger value="crypto" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Crypto
          </TabsTrigger>
          <TabsTrigger value="sectors" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Sectors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stocks" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>S&P 500 Heatmap</CardTitle>
                  <CardDescription>Size = Market Cap • Color = % Change</CardDescription>
                </div>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sectors</SelectItem>
                    {SP500_SECTORS.map(s => (
                      <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {renderHeatmapGrid(filteredStocks, false)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crypto" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Crypto Market Heatmap</CardTitle>
              <CardDescription>Top cryptocurrencies by market cap</CardDescription>
            </CardHeader>
            <CardContent>
              {renderHeatmapGrid(sortedCrypto, true)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sectors" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Sector Performance</CardTitle>
              <CardDescription>Average performance by sector</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sectorSummary.map(sector => (
                  <div
                    key={sector.name}
                    className={`${getColorByChange(sector.avgChange)} ${getTextColorByChange(sector.avgChange)} rounded-lg p-4 text-center`}
                  >
                    <p className="font-bold text-sm">{sector.name}</p>
                    <p className="text-2xl font-bold mt-2">
                      {sector.avgChange > 0 ? '+' : ''}{sector.avgChange.toFixed(2)}%
                    </p>
                    <div className="mt-2">
                      {sector.avgChange > 0 ? <TrendingUp className="h-4 w-4 mx-auto" /> : <TrendingDown className="h-4 w-4 mx-auto" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Change:</span>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-red-500 rounded" />
              <span className="text-xs">-5%+</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-red-300 rounded" />
              <span className="text-xs">-3%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-red-200 rounded" />
              <span className="text-xs">-1%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-gray-300 rounded" />
              <span className="text-xs">0%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-green-200 rounded" />
              <span className="text-xs">+1%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-green-300 rounded" />
              <span className="text-xs">+3%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-6 h-4 bg-green-500 rounded" />
              <span className="text-xs">+5%+</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketHeatmap;
