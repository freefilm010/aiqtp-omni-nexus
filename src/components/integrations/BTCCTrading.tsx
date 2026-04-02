import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpDown, 
  Activity, 
  Loader2,
  DollarSign,
  BarChart3,
  XCircle,
  Zap
} from 'lucide-react';

interface AccountBalance {
  currency: string;
  balance: number;
  available: number;
  frozen: number;
}

interface OpenOrder {
  orderId: string;
  symbol: string;
  side: string;
  price: number;
  quantity: number;
  filledQty: number;
  status: string;
}

const SYMBOLS = [
  { value: 'BTC_USD', label: 'BTC/USD' },
  { value: 'ETH_USD', label: 'ETH/USD' },
  { value: 'XRP_USD', label: 'XRP/USD' },
  { value: 'SOL_USD', label: 'SOL/USD' },
];

const BTCCTrading = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [accountData, setAccountData] = useState<any>(null);
  const [openOrders, setOpenOrders] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any>(null);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);

  const [orderForm, setOrderForm] = useState({
    symbol: 'XRP_USD',
    side: 'BUY' as 'BUY' | 'SELL',
    order_type: 'MARKET' as 'MARKET' | 'LIMIT',
    quantity: '',
    price: '',
  });

  const callBTCC = async (action: string, extra: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('btcc-trading', {
      body: { action, ...extra },
    });
    if (error) throw new Error(error.message || 'BTCC request failed');
    if (data && !data.success) throw new Error(data.error || 'BTCC returned error');
    return data?.data;
  };

  // Connect & login
  const connectExchange = async () => {
    setIsLoading(true);
    try {
      const loginResult = await callBTCC('login');
      console.log('BTCC Login:', loginResult);
      setConnectionStatus('connected');
      toast({ title: 'BTCC Connected', description: 'Authenticated with BTCC exchange' });

      // Fetch account + contracts in parallel
      const [account, contractsData] = await Promise.all([
        callBTCC('get_account'),
        callBTCC('get_contracts'),
      ]);
      setAccountData(account);
      setContracts(contractsData);
    } catch (error: any) {
      setConnectionStatus('error');
      toast({ title: 'Connection Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAccount = async () => {
    setIsLoading(true);
    try {
      const account = await callBTCC('get_account');
      setAccountData(account);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOpenOrders = async () => {
    setIsLoading(true);
    try {
      const orders = await callBTCC('get_open_orders', { symbol: orderForm.symbol });
      setOpenOrders(orders?.data || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      const trades = await callBTCC('get_trades', { symbol: orderForm.symbol, count: 20 });
      setRecentTrades(trades?.data || []);
    } catch (error: any) {
      console.error('Failed to fetch trades:', error);
    }
  };

  const submitOrder = async () => {
    if (!orderForm.quantity || parseFloat(orderForm.quantity) <= 0) {
      toast({ title: 'Error', description: 'Enter a valid quantity', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const result = await callBTCC('place_order', {
        symbol: orderForm.symbol,
        side: orderForm.side,
        order_type: orderForm.order_type,
        quantity: parseFloat(orderForm.quantity),
        price: orderForm.order_type === 'LIMIT' ? parseFloat(orderForm.price) : 0,
      });

      toast({
        title: 'Order Placed',
        description: `${orderForm.side} ${orderForm.quantity} ${orderForm.symbol} — ${orderForm.order_type}`,
      });

      setOrderForm({ ...orderForm, quantity: '', price: '' });
      refreshAccount();
      fetchOpenOrders();
    } catch (error: any) {
      toast({ title: 'Order Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (symbol: string, orderId: string) => {
    try {
      await callBTCC('cancel_order', { symbol, order_id: orderId });
      toast({ title: 'Order Cancelled' });
      fetchOpenOrders();
    } catch (error: any) {
      toast({ title: 'Cancel Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleCancelAll = async () => {
    try {
      await callBTCC('cancel_all');
      toast({ title: 'All Orders Cancelled' });
      setOpenOrders([]);
      refreshAccount();
    } catch (error: any) {
      toast({ title: 'Cancel All Failed', description: error.message, variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchTrades();
    }
  }, [orderForm.symbol, connectionStatus]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">BTCC Exchange</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Live Futures Trading — WebSocket API
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            ) : connectionStatus === 'error' ? (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                Error
              </Badge>
            ) : (
              <Button size="sm" onClick={connectExchange} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-1" />}
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionStatus !== 'connected' && (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Click Connect to authenticate with BTCC</p>
            <p className="text-xs mt-1">Uses your stored API keys via secure WebSocket</p>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <>
            {/* Account Info */}
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4" /> Account
                </h3>
                <Button variant="ghost" size="sm" onClick={refreshAccount} disabled={isLoading}>
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
              {accountData ? (
                <pre className="text-xs overflow-auto max-h-32 bg-background/50 p-2 rounded">
                  {JSON.stringify(accountData, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">Loading account data...</p>
              )}
            </div>

            {/* Order Form */}
            <div className="space-y-3 p-4 rounded-lg border border-border/50">
              <h3 className="font-medium">Place Order</h3>

              <div className="space-y-2">
                <Label>Symbol</Label>
                <Select
                  value={orderForm.symbol}
                  onValueChange={(v) => setOrderForm({ ...orderForm, symbol: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SYMBOLS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={orderForm.side === 'BUY' ? 'default' : 'outline'}
                  className={orderForm.side === 'BUY' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setOrderForm({ ...orderForm, side: 'BUY' })}
                >
                  <TrendingUp className="h-4 w-4 mr-1" /> Buy Long
                </Button>
                <Button
                  variant={orderForm.side === 'SELL' ? 'default' : 'outline'}
                  className={orderForm.side === 'SELL' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setOrderForm({ ...orderForm, side: 'SELL' })}
                >
                  <TrendingDown className="h-4 w-4 mr-1" /> Sell Short
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select
                  value={orderForm.order_type}
                  onValueChange={(v) => setOrderForm({ ...orderForm, order_type: v as 'MARKET' | 'LIMIT' })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKET">Market</SelectItem>
                    <SelectItem value="LIMIT">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={orderForm.quantity}
                  onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })}
                />
              </div>

              {orderForm.order_type === 'LIMIT' && (
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={orderForm.price}
                    onChange={(e) => setOrderForm({ ...orderForm, price: e.target.value })}
                  />
                </div>
              )}

              <Button
                onClick={submitOrder}
                disabled={isLoading}
                className={`w-full ${orderForm.side === 'BUY' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {orderForm.side === 'BUY' ? 'Buy Long' : 'Sell Short'} {orderForm.symbol.replace('_', '/')}
                  </>
                )}
              </Button>
            </div>

            {/* Open Orders */}
            <div className="p-4 rounded-lg border border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">Open Orders</h3>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={fetchOpenOrders} disabled={isLoading}>
                    <Activity className="h-4 w-4" />
                  </Button>
                  {openOrders.length > 0 && (
                    <Button variant="destructive" size="sm" onClick={handleCancelAll}>
                      <XCircle className="h-4 w-4 mr-1" /> Cancel All
                    </Button>
                  )}
                </div>
              </div>
              {openOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-3">
                  No open orders — click refresh to check
                </p>
              ) : (
                <div className="space-y-2">
                  {openOrders.map((order: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                      <div>
                        <Badge variant={order.Side === 'BUY' ? 'default' : 'destructive'} className="mr-2">
                          {order.Side}
                        </Badge>
                        <span>{order.Symbol}</span>
                        <span className="ml-2 text-muted-foreground">
                          {order.Quantity} @ ${order.Price}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelOrder(order.Symbol, order.OID)}
                      >
                        <XCircle className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Market Trades */}
            {recentTrades.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2 text-sm">Recent Trades — {orderForm.symbol.replace('_', '/')}</h3>
                <div className="space-y-1 max-h-40 overflow-auto">
                  {recentTrades.slice(0, 10).map((t: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className={t.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                        {t.side || 'TRADE'}
                      </span>
                      <span>${t.Price || t.price}</span>
                      <span className="text-muted-foreground">{t.Quantity || t.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BTCCTrading;
