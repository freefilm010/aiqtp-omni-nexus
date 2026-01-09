import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealMarketData } from "@/hooks/useRealMarketData";
import { LayoutGrid, ExternalLink, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface HeatMapAsset {
  symbol: string;
  name: string;
  price: number;
  change: number;
  marketCap: number;
}

const LiveHeatMapWidget = () => {
  const navigate = useNavigate();
  const { data, loading, lastSync, refresh, syncFromCoinGecko, getTopGainers, getTopLosers } = useRealMarketData({ 
    limit: 50,
    autoRefresh: true,
    refreshInterval: 30000
  });
  const [syncing, setSyncing] = useState(false);

  // Transform real data to heat map format
  const assets: HeatMapAsset[] = data.slice(0, 12).map(coin => ({
    symbol: coin.symbol,
    name: coin.name,
    price: Number(coin.price_usd) || 0,
    change: Number(coin.price_change_percentage_24h) || 0,
    marketCap: Number(coin.market_cap) || 0
  }));

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncFromCoinGecko(10);
      toast.success('Market data synced from CoinGecko');
    } catch (e) {
      toast.error('Sync failed - using cached data');
    } finally {
      setSyncing(false);
    }
  };

  const isLive = !loading && data.length > 0;

  const getColor = (change: number) => {
    if (change > 5) return 'bg-emerald-600';
    if (change > 2) return 'bg-emerald-500';
    if (change > 0) return 'bg-emerald-400/80';
    if (change > -2) return 'bg-red-400/80';
    if (change > -5) return 'bg-red-500';
    return 'bg-red-600';
  };

  const getCellSize = (marketCap: number) => {
    const maxCap = Math.max(...assets.map(a => a.marketCap), 1);
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
  const topGainers = [...assets].filter(a => a.change > 0).sort((a, b) => b.change - a.change).slice(0, 3);
  const topLosers = [...assets].filter(a => a.change < 0).sort((a, b) => a.change - b.change).slice(0, 3);

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <LayoutGrid className="h-8 w-8 text-primary" />
              Live Market Heat Map
            </h2>
            <p className="text-muted-foreground">Real CoinGecko data • Size = Market Cap • Color = 24h Change</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Badge variant={isLive ? 'default' : 'secondary'} className={isLive ? 'bg-emerald-500 animate-pulse' : ''}>
              {isLive ? '● LIVE' : 'LOADING'}
            </Badge>
            <Button variant="outline" onClick={() => navigate('/advanced-trading')}>
              Full Trading Terminal <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
    </section>
  );
};

export default LiveHeatMapWidget;
