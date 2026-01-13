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
  MoreHorizontal,
  LogIn
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
import { Link } from "react-router-dom";

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
      // Show empty state for non-logged-in users - NO FAKE DATA
      setWatchlist([]);
      setLoading(false);
    }
  }, [user]);

  // Update prices from live market data
  useEffect(() => {
    if (watchlist.length === 0) return;
    
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
        return item;
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, [getPrice, watchlist.length]);

  const fetchWatchlist = async () => {
    try {
      const { data, error } = await supabase
        .from('watchlist')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map database items to UI format with live prices
      const items: WatchlistItem[] = (data || []).map((item: Record<string, unknown>) => {
        const livePrice = getPrice(item.symbol as string);
        return {
          id: item.id as string,
          symbol: item.symbol as string,
          name: item.name as string,
          price: livePrice?.priceNumeric || 0,
          change: 0,
          changePercent: livePrice?.changePercent || 0,
          alertEnabled: (item.alert_enabled as boolean) || false,
          alertPrice: undefined
        };
      });

      setWatchlist(items);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      toast.error('Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  };

  const addToWatchlist = async (symbol: string, name: string) => {
    if (!user) {
      toast.error('Please sign in to add to watchlist');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('watchlist')
        .insert({
          user_id: user.id,
          symbol,
          name
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error(`${symbol} is already in your watchlist`);
        } else {
          throw error;
        }
        return;
      }

      const livePrice = getPrice(symbol);
      setWatchlist(prev => [{
        id: data.id,
        symbol,
        name,
        price: livePrice?.priceNumeric || 0,
        change: 0,
        changePercent: livePrice?.changePercent || 0,
        alertEnabled: false
      }, ...prev]);

      toast.success(`Added ${symbol} to watchlist`);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  const removeFromWatchlist = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('watchlist')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWatchlist(prev => prev.filter(item => item.id !== id));
      toast.success('Removed from watchlist');
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      toast.error('Failed to remove from watchlist');
    }
  };

  const toggleAlert = async (id: string) => {
    if (!user) return;

    const item = watchlist.find(w => w.id === id);
    if (!item) return;

    try {
      const { error } = await supabase
        .from('watchlist')
        .update({ alert_enabled: !item.alertEnabled } as Record<string, unknown>)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWatchlist(prev => prev.map(w => 
        w.id === id ? { ...w, alertEnabled: !w.alertEnabled } : w
      ));
      toast.success(item.alertEnabled ? 'Alert disabled' : 'Alert enabled');
    } catch (error) {
      console.error('Error toggling alert:', error);
      toast.error('Failed to update alert');
    }
  };

  const filteredAssets = AVAILABLE_ASSETS.filter(asset =>
    asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Watchlist
          {isLive && <Badge variant="outline" className="ml-2 text-xs">LIVE</Badge>}
        </CardTitle>
        {user && (
          <Button size="sm" onClick={() => setShowAddModal(!showAddModal)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!user ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Sign in to create your watchlist</p>
            <Button asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          </div>
        ) : watchlist.length === 0 ? (
          <div className="text-center py-8">
            <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assets
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {watchlist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold">{item.symbol.slice(0, 2)}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.symbol}</p>
                      <p className="text-xs text-muted-foreground">{item.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(item.price)}</p>
                      <p className={`text-xs flex items-center gap-1 ${
                        item.changePercent >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {item.changePercent >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </p>
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
                            <>
                              <BellOff className="h-4 w-4 mr-2" />
                              Disable Alert
                            </>
                          ) : (
                            <>
                              <Bell className="h-4 w-4 mr-2" />
                              Enable Alert
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => removeFromWatchlist(item.id)}
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

        {/* Add Asset Modal */}
        {showAddModal && user && (
          <div className="mt-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {filteredAssets.map((asset) => (
                  <Button
                    key={asset.symbol}
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => addToWatchlist(asset.symbol, asset.name)}
                    disabled={watchlist.some(w => w.symbol === asset.symbol)}
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <span className="text-xs font-bold">{asset.symbol.slice(0, 2)}</span>
                    </div>
                    <span>{asset.symbol}</span>
                    <span className="text-muted-foreground ml-2">{asset.name}</span>
                    {watchlist.some(w => w.symbol === asset.symbol) && (
                      <Badge variant="secondary" className="ml-auto">Added</Badge>
                    )}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Watchlist;
