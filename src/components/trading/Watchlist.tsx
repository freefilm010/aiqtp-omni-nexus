import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Star, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Bell,
  BellOff,
  RefreshCw,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMarketPrices } from "@/hooks/useMarketPrices";

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  alertEnabled: boolean;
  alertPrice?: number;
}

const AVAILABLE_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin' },
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'SOL', name: 'Solana' },
  { symbol: 'BNB', name: 'BNB' },
  { symbol: 'XRP', name: 'XRP' },
  { symbol: 'ADA', name: 'Cardano' },
  { symbol: 'DOGE', name: 'Dogecoin' },
  { symbol: 'AVAX', name: 'Avalanche' },
  { symbol: 'DOT', name: 'Polkadot' },
  { symbol: 'MATIC', name: 'Polygon' },
  { symbol: 'LINK', name: 'Chainlink' },
  { symbol: 'UNI', name: 'Uniswap' },
  { symbol: 'AAVE', name: 'Aave' },
  { symbol: 'LTC', name: 'Litecoin' },
  { symbol: 'AAPL', name: 'Apple Inc' },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'GOOGL', name: 'Alphabet' },
  { symbol: 'AMZN', name: 'Amazon' },
  { symbol: 'NVDA', name: 'Nvidia' },
  { symbol: 'TSLA', name: 'Tesla' },
];

const Watchlist = () => {
  const { user } = useAuth();
  const { getPrice, isLive } = useMarketPrices();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWatchlist();
    } else {
      // Demo data for non-logged-in users
      setWatchlist([
        { id: '1', symbol: 'BTC', name: 'Bitcoin', price: 96500, change: 2450, changePercent: 2.6, alertEnabled: true },
        { id: '2', symbol: 'ETH', name: 'Ethereum', price: 3650, change: -85, changePercent: -2.3, alertEnabled: false },
        { id: '3', symbol: 'SOL', name: 'Solana', price: 195, change: 12, changePercent: 6.5, alertEnabled: true },
        { id: '4', symbol: 'AAPL', name: 'Apple Inc', price: 178, change: 3.2, changePercent: 1.8, alertEnabled: false },
      ]);
      setLoading(false);
    }
  }, [user]);

  // Update prices periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlist(prev => prev.map(item => {
        const livePrice = getPrice(item.symbol);
        if (livePrice) {
          return {
            ...item,
            price: livePrice.priceNumeric,
            changePercent: livePrice.changePercent,
            change: livePrice.priceNumeric * (livePrice.changePercent / 100)
          };
        }
        // Simulate movement
        const movement = (Math.random() - 0.5) * 0.005;
        const newPrice = item.price * (1 + movement);
        return {
          ...item,
          price: newPrice,
          change: item.change + (newPrice - item.price),
        };
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, [getPrice]);

  const fetchWatchlist = async () => {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: WatchlistItem[] = (data || []).map(item => {
        const livePrice = getPrice(item.symbol);
        return {
          id: item.id,
          symbol: item.symbol,
          name: item.name,
          price: livePrice?.priceNumeric || 0,
          change: 0,
          changePercent: livePrice?.changePercent || 0,
          alertEnabled: false,
        };
      });

      setWatchlist(items);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string, name: string) => {
    if (watchlist.find(w => w.symbol === symbol)) {
      toast.error(`${symbol} is already in your watchlist`);
      return;
    }

    const livePrice = getPrice(symbol);
    const newItem: WatchlistItem = {
      id: `temp_${Date.now()}`,
      symbol,
      name,
      price: livePrice?.priceNumeric || 0,
      change: 0,
      changePercent: livePrice?.changePercent || 0,
      alertEnabled: false,
    };

    // Add optimistically
    setWatchlist(prev => [newItem, ...prev]);
    setSearchQuery("");
    setShowAddModal(false);

    if (user) {
      try {
        const { data, error } = await supabase
          .from('watchlist')
          .insert({
            user_id: user.id,
            symbol,
            name,
          })
          .select()
          .single();

        if (error) throw error;

        // Update with real ID
        setWatchlist(prev => prev.map(item => 
          item.id === newItem.id ? { ...item, id: data.id } : item
        ));
        
        toast.success(`Added ${symbol} to watchlist`);
      } catch (error) {
        console.error('Error adding to watchlist:', error);
        setWatchlist(prev => prev.filter(item => item.id !== newItem.id));
        toast.error('Failed to add to watchlist');
      }
    } else {
      toast.success(`Added ${symbol} to watchlist`);
    }
  };

  const removeFromWatchlist = async (id: string, symbol: string) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
    
    if (user) {
      try {
        const { error } = await supabase
          .from('watchlist')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success(`Removed ${symbol} from watchlist`);
      } catch (error) {
        console.error('Error removing from watchlist:', error);
        fetchWatchlist(); // Refresh on error
      }
    } else {
      toast.success(`Removed ${symbol} from watchlist`);
    }
  };

  const toggleAlert = (id: string) => {
    setWatchlist(prev => prev.map(item => 
      item.id === id ? { ...item, alertEnabled: !item.alertEnabled } : item
    ));
    toast.success('Alert toggled');
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const filteredAssets = AVAILABLE_ASSETS.filter(a => 
    (a.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.name.toLowerCase().includes(searchQuery.toLowerCase())) &&
    !watchlist.find(w => w.symbol === a.symbol)
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground">Loading watchlist...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Watchlist
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isLive ? 'default' : 'secondary'} className={isLive ? 'bg-emerald-500 text-[10px]' : 'text-[10px]'}>
              {isLive ? '● LIVE' : 'PAUSED'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-2">
                  <div className="relative mb-2">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search assets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 h-9"
                    />
                  </div>
                  <ScrollArea className="h-48">
                    {filteredAssets.slice(0, 10).map(asset => (
                      <DropdownMenuItem
                        key={asset.symbol}
                        onClick={() => addToWatchlist(asset.symbol, asset.name)}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <span className="font-medium">{asset.symbol}</span>
                            <span className="text-xs text-muted-foreground ml-2">{asset.name}</span>
                          </div>
                          <Plus className="h-3 w-3" />
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {watchlist.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>Your watchlist is empty</p>
            <p className="text-sm">Add assets to track their prices</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="divide-y">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold">{item.symbol.charAt(0)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.symbol}</span>
                        {item.alertEnabled && (
                          <Bell className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{item.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold">{formatPrice(item.price)}</div>
                      <div className={`text-xs flex items-center justify-end gap-1 ${item.changePercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {item.changePercent >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => toggleAlert(item.id)}>
                          {item.alertEnabled ? (
                            <><BellOff className="h-4 w-4 mr-2" /> Disable Alert</>
                          ) : (
                            <><Bell className="h-4 w-4 mr-2" /> Enable Alert</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => removeFromWatchlist(item.id, item.symbol)}
                          className="text-red-500"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default Watchlist;
