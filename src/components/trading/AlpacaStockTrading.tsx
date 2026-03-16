import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3,
  ShieldCheck, Activity, ArrowUpDown, Briefcase, AlertCircle
} from "lucide-react";

interface AlpacaPosition {
  symbol: string;
  qty: string;
  avg_entry_price: string;
  current_price: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  market_value: string;
  side: string;
}

interface AlpacaOrder {
  id: string;
  symbol: string;
  qty: string;
  side: string;
  type: string;
  status: string;
  filled_avg_price: string | null;
  created_at: string;
}

const AlpacaStockTrading = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'paper' | 'live'>('paper');
  const [positions, setPositions] = useState<AlpacaPosition[]>([]);
  const [orders, setOrders] = useState<AlpacaOrder[]>([]);
  const [account, setAccount] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderSymbol, setOrderSymbol] = useState('AAPL');
  const [orderQty, setOrderQty] = useState('1');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('');

  const callAlpaca = async (action: string, params: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('alpaca-trading', {
      body: { action, mode, params },
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Unknown error');
    return data.data;
  };

  const loadAccount = async () => {
    setLoading(true);
    try {
      const [acct, pos, ord] = await Promise.all([
        callAlpaca('get_account'),
        callAlpaca('get_positions'),
        callAlpaca('get_orders'),
      ]);
      setAccount(acct);
      setPositions(pos || []);
      setOrders(ord || []);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load Alpaca data');
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    try {
      const params: Record<string, unknown> = {
        symbol: orderSymbol.toUpperCase(),
        quantity: Number(orderQty),
        side: orderSide,
        type: orderType,
        timeInForce: 'day',
      };
      if (orderType === 'limit' && limitPrice) {
        params.limitPrice = Number(limitPrice);
      }
      await callAlpaca('place_order', params);
      toast.success(`${orderSide.toUpperCase()} order placed for ${orderQty} ${orderSymbol}`);
      loadAccount();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Order failed');
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      await callAlpaca('cancel_order', { orderId });
      toast.success('Order cancelled');
      loadAccount();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Cancel failed');
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Alpaca Stock Trading</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={mode === 'paper' ? 'secondary' : 'destructive'} className="text-xs">
              {mode === 'paper' ? '📋 Paper' : '🔴 Live'}
            </Badge>
            <Select value={mode} onValueChange={(v) => setMode(v as 'paper' | 'live')}>
              <SelectTrigger className="w-24 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paper">Paper</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={loadAccount} disabled={loading}>
              <Activity className="h-3 w-3 mr-1" />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Summary */}
        {account && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Equity</p>
              <p className="text-sm font-bold">${Number(account.equity).toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Cash</p>
              <p className="text-sm font-bold">${Number(account.cash).toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Buying Power</p>
              <p className="text-sm font-bold">${Number(account.buying_power).toLocaleString()}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Day P&L</p>
              <p className={`text-sm font-bold ${Number(account.equity) - Number(account.last_equity) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${(Number(account.equity) - Number(account.last_equity)).toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {!account && (
          <div className="text-center py-6 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click Refresh to connect to Alpaca {mode} trading</p>
          </div>
        )}

        <Tabs defaultValue="order" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="order" className="text-xs">Order Entry</TabsTrigger>
            <TabsTrigger value="positions" className="text-xs">Positions ({positions.length})</TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">Orders ({orders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="order" className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Symbol (e.g. AAPL)"
                value={orderSymbol}
                onChange={(e) => setOrderSymbol(e.target.value)}
                className="text-sm"
              />
              <Input
                type="number"
                placeholder="Qty"
                value={orderQty}
                onChange={(e) => setOrderQty(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={orderSide} onValueChange={(v) => setOrderSide(v as 'buy' | 'sell')}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Buy</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
              <Select value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit')}>
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="limit">Limit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {orderType === 'limit' && (
              <Input
                type="number"
                placeholder="Limit Price"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="text-sm"
              />
            )}
            <Button
              className="w-full"
              variant={orderSide === 'buy' ? 'default' : 'destructive'}
              onClick={placeOrder}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {orderSide.toUpperCase()} {orderQty} {orderSymbol}
            </Button>
          </TabsContent>

          <TabsContent value="positions">
            <ScrollArea className="h-48">
              {positions.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">No open positions</p>
              ) : (
                <div className="space-y-2">
                  {positions.map((p) => (
                    <div key={p.symbol} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div>
                        <span className="font-medium text-sm">{p.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-2">{p.qty} shares @ ${Number(p.avg_entry_price).toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${Number(p.market_value).toFixed(2)}</p>
                        <p className={`text-xs ${Number(p.unrealized_pl) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {Number(p.unrealized_pl) >= 0 ? '+' : ''}${Number(p.unrealized_pl).toFixed(2)} ({(Number(p.unrealized_plpc) * 100).toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="orders">
            <ScrollArea className="h-48">
              {orders.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">No open orders</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div>
                        <Badge variant={o.side === 'buy' ? 'default' : 'destructive'} className="text-xs mr-1">
                          {o.side}
                        </Badge>
                        <span className="text-sm font-medium">{o.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-1">x{o.qty} {o.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{o.status}</Badge>
                        {o.status === 'new' && (
                          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => cancelOrder(o.id)}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AlpacaStockTrading;
