import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, Search, BarChart3,
  Activity, Globe, RefreshCw, Star, ArrowUpDown
} from "lucide-react";

interface StockQuote {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  exchange?: string;
  currency?: string;
  quoteType?: string;
  // Fallback fields
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  source?: string;
}

interface SearchResult {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchange?: string;
  quoteType?: string;
}

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM'];

const StockMarketHub = () => {
  const [watchlistQuotes, setWatchlistQuotes] = useState<StockQuote[]>([]);
  const [indices, setIndices] = useState<StockQuote[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(DEFAULT_WATCHLIST);

  const callStockAPI = async (action: string, params: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('stock-market-data', {
      body: { action, ...params },
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Unknown error');
    return data.data;
  };

  const loadMarketData = async () => {
    setLoading(true);
    try {
      const [movers, quotes] = await Promise.all([
        callStockAPI('market_movers'),
        callStockAPI('bulk_quotes', { symbols: watchlist }),
      ]);
      setIndices(movers?.indices || []);
      setWatchlistQuotes(Array.isArray(quotes) ? quotes : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const searchStocks = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await callStockAPI('search', { query: searchQuery });
      setSearchResults(Array.isArray(results) ? results : []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const addToWatchlist = (symbol: string) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist(prev => [...prev, symbol]);
      toast.success(`${symbol} added to watchlist`);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(s => s !== symbol));
  };

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 60000);
    return () => clearInterval(interval);
  }, [watchlist]);

  const getPrice = (q: StockQuote) => q.regularMarketPrice ?? q.currentPrice ?? 0;
  const getChange = (q: StockQuote) => q.regularMarketChange ?? q.change ?? 0;
  const getChangePct = (q: StockQuote) => q.regularMarketChangePercent ?? q.changePercent ?? 0;
  const getName = (q: StockQuote) => q.shortName ?? q.symbol;

  const formatPrice = (p: number) => p >= 1 ? p.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toFixed(4);
  const formatMktCap = (mc?: number) => {
    if (!mc) return '—';
    if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
    if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
    if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
    return `$${mc.toLocaleString()}`;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Stock & ETF Markets</CardTitle>
            <Badge variant="secondary" className="text-xs">Live</Badge>
          </div>
          <Button size="sm" variant="outline" onClick={loadMarketData} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Major Indices */}
        {indices.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {indices.slice(0, 8).map((idx) => (
              <div key={idx.symbol} className="bg-muted/50 rounded-lg p-2">
                <p className="text-xs text-muted-foreground truncate">{getName(idx)}</p>
                <p className="text-sm font-bold">{formatPrice(getPrice(idx))}</p>
                <p className={`text-xs flex items-center gap-0.5 ${getChange(idx) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {getChange(idx) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {getChangePct(idx).toFixed(2)}%
                </p>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="watchlist" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="watchlist" className="text-xs">
              <Star className="h-3 w-3 mr-1" /> Watchlist ({watchlist.length})
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs">
              <Search className="h-3 w-3 mr-1" /> Search
            </TabsTrigger>
          </TabsList>

          <TabsContent value="watchlist">
            <ScrollArea className="h-64">
              {watchlistQuotes.length === 0 && !loading ? (
                <p className="text-center text-sm text-muted-foreground py-4">Click Refresh to load data</p>
              ) : (
                <div className="space-y-1">
                  {watchlistQuotes.map((q) => (
                    <div key={q.symbol} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-sm">{q.symbol}</span>
                          {q.quoteType && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0">{q.quoteType}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{getName(q)}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-medium">${formatPrice(getPrice(q))}</p>
                        <p className={`text-xs ${getChange(q) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {getChange(q) >= 0 ? '+' : ''}{getChange(q).toFixed(2)} ({getChangePct(q).toFixed(2)}%)
                        </p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-1" onClick={() => removeFromWatchlist(q.symbol)}>
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="search" className="space-y-2 pt-1">
            <div className="flex gap-2">
              <Input
                placeholder="Search stocks, ETFs, indices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchStocks()}
                className="text-sm"
              />
              <Button size="sm" onClick={searchStocks} disabled={searching}>
                <Search className="h-3 w-3" />
              </Button>
            </div>
            <ScrollArea className="h-52">
              {searchResults.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">
                  Search for any stock, ETF, index, or forex pair
                </p>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((r) => (
                    <div key={r.symbol} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{r.symbol}</span>
                        <p className="text-xs text-muted-foreground truncate">
                          {r.longname || r.shortname} · {r.exchange}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">{r.quoteType}</Badge>
                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => addToWatchlist(r.symbol)}>
                          + Watch
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Sources: Yahoo Finance · Finnhub · Alpha Vantage
          </span>
          <span>Auto-refresh 60s</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockMarketHub;
