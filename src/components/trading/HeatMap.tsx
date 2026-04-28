import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { supabase } from "@/integrations/supabase/client";
import { LayoutGrid, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

interface HeatMapCell {
  symbol: string;
  name: string;
  price: number;
  change: number;
  marketCap: number;
  sector: string;
}

const HeatMap = () => {
  const { prices, isLive, getPrice } = useMarketPrices();
  const [data, setData] = useState<HeatMapCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'all' | 'sector'>('all');
  const [timeframe, setTimeframe] = useState('24h');

  // Fetch from database or use live API data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        // Try to get from database first
        const { data: dbData, error } = await supabase
          .from('heatmap_data')
          .select('*')
          .order('market_cap', { ascending: false });

        if (!error && dbData && dbData.length > 0) {
          setData(dbData.map(item => ({
            symbol: item.symbol,
            name: item.name,
            price: Number(item.price) || 0,
            change: Number(item.change_24h) || 0,
            marketCap: Number(item.market_cap) || 0,
            sector: item.sector || 'Crypto'
          })));
        } else {
          // Use live API prices if no DB data
          const cryptoList = [
            { symbol: 'BTC', name: 'Bitcoin', sector: 'Crypto' },
            { symbol: 'ETH', name: 'Ethereum', sector: 'Layer1' },
            { symbol: 'SOL', name: 'Solana', sector: 'Layer1' },
          ];
          
          const liveData = cryptoList.map(c => {
            const livePrice = getPrice(c.symbol);
            return {
              symbol: c.symbol,
              name: c.name,
              price: livePrice?.priceNumeric || 0,
              change: livePrice?.changePercent || 0,
              marketCap: 0,
              sector: c.sector
            };
          }).filter(item => item.price > 0);

          setData(liveData);
        }
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [prices]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`heatmap_changes-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'heatmap_data' }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          const updated = payload.new as Record<string, unknown>;
          setData(prev => prev.map(cell => 
            cell.symbol === (updated.symbol as string) 
              ? {
                  ...cell,
                  price: Number(updated.price) || cell.price,
                  change: Number(updated.change_24h) || cell.change
                }
              : cell
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
    if (data.length === 0) return 'col-span-1 row-span-1';
    const maxCap = Math.max(...data.map(d => d.marketCap));
    if (maxCap === 0) return 'col-span-1 row-span-1';
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

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5" />
              Market Heat Map
            </CardTitle>
            <CardDescription>Real-time market performance visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <LayoutGrid className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No market data available</p>
              <p className="text-sm text-muted-foreground mt-2">
                Heatmap data will appear when market feeds are connected
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <Select value={view} onValueChange={(v: any) => setView(v)}>
                <SelectTrigger className="w-[100px] sm:w-[150px] h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  <SelectItem value="sector">By Sector</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[80px] sm:w-[120px] h-8 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="24h">24 Hours</SelectItem>
                  <SelectItem value="7d">7 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5">
              {isLive && <Badge variant="outline" className="text-[10px] px-1.5">LIVE</Badge>}
              <Badge className="text-[10px] px-1.5">{data.length}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Heat Map Grid */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <LayoutGrid className="h-4 w-4 sm:h-5 sm:w-5" />
            Market Heat Map
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-sm">Size = market cap, color = {timeframe} change</CardDescription>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 auto-rows-fr" style={{ minHeight: '250px' }}>
            {sortedData.map((cell) => (
              <div
                key={cell.symbol}
                className={`${getCellSize(cell.marketCap)} ${getColor(cell.change)} rounded-lg p-1.5 sm:p-2 flex flex-col justify-between cursor-pointer hover:opacity-90 transition-opacity text-white`}
              >
                <div>
                  <p className="font-bold text-[10px] sm:text-sm">{cell.symbol}</p>
                  <p className="text-[9px] sm:text-xs opacity-80 truncate hidden sm:block">{cell.name}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] sm:text-sm">{formatPrice(cell.price)}</p>
                  <p className="text-[9px] sm:text-xs font-medium">
                    {cell.change >= 0 ? '+' : ''}{cell.change.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Movers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-500">
              <TrendingUp className="h-5 w-5" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gainers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No data</p>
              ) : (
                gainers.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-green-500">{asset.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{asset.symbol}</p>
                        <p className="text-xs text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(asset.price)}</p>
                      <p className="text-sm text-green-500">+{asset.change.toFixed(2)}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <TrendingDown className="h-5 w-5" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {losers.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No data</p>
              ) : (
                losers.map((asset) => (
                  <div key={asset.symbol} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-red-500">{asset.symbol.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium">{asset.symbol}</p>
                        <p className="text-xs text-muted-foreground">{asset.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(asset.price)}</p>
                      <p className="text-sm text-red-500">{asset.change.toFixed(2)}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HeatMap;
