import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { LayoutGrid, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeatMapAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  marketCap: number;
}

const LiveHeatMapWidget = () => {
  const navigate = useNavigate();
  const { prices, isLive } = useMarketPrices();
  const [assets, setAssets] = useState<HeatMapAsset[]>([]);

  const getNumericPrice = (symbol: string, fallback: number): number => {
    const p = prices[symbol];
    return p?.priceNumeric ?? fallback;
  };

  const getChangePercent = (symbol: string, fallback: number): number => {
    const p = prices[symbol];
    return p?.changePercent ?? fallback;
  };

  useEffect(() => {
    // Build assets from live prices
    const assetData: HeatMapAsset[] = [
      { symbol: 'BTC', name: 'Bitcoin', price: getNumericPrice('BTC', 96500), change: getChangePercent('BTC', 2.4), marketCap: 1900000000000 },
      { symbol: 'ETH', name: 'Ethereum', price: getNumericPrice('ETH', 3650), change: getChangePercent('ETH', -0.8), marketCap: 440000000000 },
      { symbol: 'SOL', name: 'Solana', price: getNumericPrice('SOL', 195), change: 5.2, marketCap: 85000000000 },
      { symbol: 'BNB', name: 'BNB', price: 680, change: 1.1, marketCap: 98000000000 },
      { symbol: 'XRP', name: 'XRP', price: 2.35, change: -1.5, marketCap: 135000000000 },
      { symbol: 'ADA', name: 'Cardano', price: 1.05, change: 3.8, marketCap: 37000000000 },
      { symbol: 'DOGE', name: 'Dogecoin', price: 0.38, change: 8.2, marketCap: 55000000000 },
      { symbol: 'AVAX', name: 'Avalanche', price: 42, change: -2.1, marketCap: 17000000000 },
      { symbol: 'DOT', name: 'Polkadot', price: 7.8, change: 1.9, marketCap: 11000000000 },
      { symbol: 'MATIC', name: 'Polygon', price: 0.58, change: -0.5, marketCap: 5400000000 },
      { symbol: 'LINK', name: 'Chainlink', price: 14.5, change: 4.1, marketCap: 8700000000 },
      { symbol: 'UNI', name: 'Uniswap', price: getNumericPrice('UNI', 13.2), change: getChangePercent('UNI', 2.7), marketCap: 7900000000 },
    ];
    
    setAssets(assetData);
  }, [prices]);

  // Simulate live price movements
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => prev.map(asset => ({
        ...asset,
        change: asset.change + (Math.random() - 0.5) * 0.3,
        price: asset.price * (1 + (Math.random() - 0.5) * 0.001)
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getColor = (change: number) => {
    if (change > 5) return 'bg-emerald-600';
    if (change > 2) return 'bg-emerald-500';
    if (change > 0) return 'bg-emerald-400/80';
    if (change > -2) return 'bg-red-400/80';
    if (change > -5) return 'bg-red-500';
    return 'bg-red-600';
  };

  const getCellSize = (marketCap: number) => {
    const maxCap = Math.max(...assets.map(a => a.marketCap));
    const ratio = marketCap / maxCap;
    if (ratio > 0.4) return 'col-span-2 row-span-2';
    if (ratio > 0.15) return 'col-span-2 row-span-1';
    return 'col-span-1 row-span-1';
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(0)}B`;
    return `$${(cap / 1e6).toFixed(0)}M`;
  };

  const sortedAssets = [...assets].sort((a, b) => b.marketCap - a.marketCap);
  const gainers = [...assets].filter(a => a.change > 0).sort((a, b) => b.change - a.change).slice(0, 3);
  const losers = [...assets].filter(a => a.change < 0).sort((a, b) => a.change - b.change).slice(0, 3);

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <LayoutGrid className="h-8 w-8 text-primary" />
              Live Market Heat Map
            </h2>
            <p className="text-muted-foreground">Real-time prices • Size = Market Cap • Color = 24h Change</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isLive ? 'default' : 'secondary'} className={isLive ? 'bg-emerald-500 animate-pulse' : ''}>
              {isLive ? '● LIVE' : 'PAUSED'}
            </Badge>
            <Button variant="outline" onClick={() => navigate('/advanced-trading')}>
              Full Trading Terminal <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Heat Map */}
          <Card className="lg:col-span-3 border-2">
            <CardContent className="p-4">
              <div className="grid grid-cols-6 gap-2 auto-rows-[80px]">
                {sortedAssets.map((asset) => (
                  <div
                    key={asset.symbol}
                    className={`${getColor(asset.change)} ${getCellSize(asset.marketCap)} rounded-lg p-3 flex flex-col justify-between cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] shadow-lg`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-white text-lg">{asset.symbol}</span>
                        <p className="text-white/70 text-xs">{asset.name}</p>
                      </div>
                      <span className="text-white/60 text-xs">{formatMarketCap(asset.marketCap)}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <span className="text-white font-semibold text-sm">{formatPrice(asset.price)}</span>
                      <span className={`text-white font-bold flex items-center gap-1`}>
                        {asset.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Side Panel - Top Movers */}
          <div className="space-y-4">
            <Card className="border-emerald-500/30">
              <CardHeader className="py-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-emerald-500">
                  <TrendingUp className="h-4 w-4" />
                  Top Gainers
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                {gainers.map((g) => (
                  <div key={g.symbol} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <div>
                      <span className="font-semibold">{g.symbol}</span>
                      <p className="text-xs text-muted-foreground">{formatPrice(g.price)}</p>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                      +{g.change.toFixed(2)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-red-500/30">
              <CardHeader className="py-3 pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                  <TrendingDown className="h-4 w-4" />
                  Top Losers
                </CardTitle>
              </CardHeader>
              <CardContent className="py-0 pb-3">
                {losers.map((l) => (
                  <div key={l.symbol} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                    <div>
                      <span className="font-semibold">{l.symbol}</span>
                      <p className="text-xs text-muted-foreground">{formatPrice(l.price)}</p>
                    </div>
                    <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                      {l.change.toFixed(2)}%
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Color Legend */}
            <Card>
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground mb-2">24h Change Scale</p>
                <div className="flex gap-0.5 rounded overflow-hidden">
                  <div className="flex-1 h-3 bg-red-600" />
                  <div className="flex-1 h-3 bg-red-500" />
                  <div className="flex-1 h-3 bg-red-400" />
                  <div className="flex-1 h-3 bg-emerald-400" />
                  <div className="flex-1 h-3 bg-emerald-500" />
                  <div className="flex-1 h-3 bg-emerald-600" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>-5%</span>
                  <span>0%</span>
                  <span>+5%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiveHeatMapWidget;
