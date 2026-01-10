import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpDown,
  Star,
  Activity,
  AlertCircle
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

const CryptoScreener = () => {
  const [assets, setAssets] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('marketCap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<string>('all');
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('market_screener_assets')
        .select('*')
        .order('market_cap', { ascending: false });

      if (fetchError) throw fetchError;

      const mapped: CryptoAsset[] = (data || []).map(a => ({
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        price: Number(a.price) || 0,
        change24h: Number(a.change_24h) || 0,
        change7d: Number(a.change_7d) || 0,
        volume24h: Number(a.volume_24h) || 0,
        marketCap: Number(a.market_cap) || 0,
        rsi: Number(a.rsi) || 50,
        macdSignal: (a.macd_signal as CryptoAsset['macdSignal']) || 'neutral',
        volumeChange: Number(a.volume_change) || 0,
        priceScore: a.price_score || 50
      }));

      setAssets(mapped);
    } catch (err: any) {
      console.error('Error fetching screener assets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive py-8 justify-center">
            <AlertCircle className="h-5 w-5" />
            <span>Error loading assets</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No Assets Found</p>
            <p className="text-sm">Market data will appear here when available.</p>
          </div>
        ) : (
          <>
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

                  <div className="text-right font-mono">
                    ${asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  <div className={`text-right font-medium ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </div>

                  <div className={`text-right font-medium ${asset.change7d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {asset.change7d >= 0 ? '+' : ''}{asset.change7d.toFixed(2)}%
                  </div>

                  <div className="text-right">
                    <span className="font-mono">{formatNumber(asset.volume24h)}</span>
                    <p className={`text-xs ${asset.volumeChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {asset.volumeChange >= 0 ? '↑' : '↓'}{Math.abs(asset.volumeChange)}%
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    {formatNumber(asset.marketCap)}
                  </div>

                  <div className={`text-center font-bold ${getRSIColor(asset.rsi)}`}>
                    {asset.rsi}
                  </div>

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

                  <div className="flex justify-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getScoreColor(asset.priceScore)}`}>
                      {asset.priceScore}
                    </div>
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

export default CryptoScreener;