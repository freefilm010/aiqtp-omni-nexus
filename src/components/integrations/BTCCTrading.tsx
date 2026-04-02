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
  Percent,
  BarChart3
} from 'lucide-react';

interface Position {
  symbol: string;
  side: string;
  size: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  leverage: number;
  liquidationPrice: number;
}

interface Balance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

const BTCCTrading = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('spot');
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [ticker, setTicker] = useState<any>(null);
  
  // Order form
  const [orderForm, setOrderForm] = useState({
    symbol: 'BTCUSDT',
    side: 'buy' as 'buy' | 'sell',
    orderType: 'market' as 'market' | 'limit',
    amount: '',
    price: '',
    leverage: '10',
  });

  useEffect(() => {
    fetchTicker();
  }, [orderForm.symbol, activeTab]);

  const fetchTicker = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('btcc-trading', {
        body: {
          action: 'fetch_ticker',
          market: activeTab as 'spot' | 'futures',
          symbol: orderForm.symbol,
        },
      });
      
      if (error) throw error;
      setTicker(data?.data);
    } catch (error) {
      console.error('Failed to fetch ticker:', error);
    }
  };

  const fetchBalance = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('btcc-trading', {
        body: { action: 'fetch_balance', market: 'spot' },
      });
      
      if (error) throw error;
      setBalances(data?.data?.balances || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch balance',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPositions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('btcc-trading', {
        body: { action: 'fetch_positions', market: 'futures' },
      });
      
      if (error) throw error;
      setPositions(data?.data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch positions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitOrder = async () => {
    if (!orderForm.amount || parseFloat(orderForm.amount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('btcc-trading', {
        body: {
          action: 'create_order',
          market: activeTab as 'spot' | 'futures',
          symbol: orderForm.symbol,
          side: orderForm.side,
          orderType: orderForm.orderType,
          amount: parseFloat(orderForm.amount),
          price: orderForm.orderType === 'limit' ? parseFloat(orderForm.price) : undefined,
          leverage: activeTab === 'futures' ? parseInt(orderForm.leverage) : undefined,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Order Submitted',
        description: `${orderForm.side.toUpperCase()} ${orderForm.amount} ${orderForm.symbol} on BTCC ${activeTab}`,
      });
      
      setOrderForm({ ...orderForm, amount: '', price: '' });
      if (activeTab === 'spot') fetchBalance();
      else fetchPositions();
    } catch (error: any) {
      toast({
        title: 'Order Failed',
        description: error.message || 'Failed to submit order',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <BarChart3 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl">BTCC Exchange</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Spot & Futures Pro Trading
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
              <Activity className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="spot" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Spot Trading
            </TabsTrigger>
            <TabsTrigger value="futures" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Futures Pro
            </TabsTrigger>
          </TabsList>

          {/* Ticker Display */}
          {ticker && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Last Price</p>
                  <p className="font-bold text-lg">${ticker.last?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">24h Change</p>
                  <p className={`font-medium ${ticker.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {ticker.changePercent >= 0 ? '+' : ''}{ticker.changePercent?.toFixed(2)}%
                  </p>
                </div>
                {activeTab === 'futures' && ticker.fundingRate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Funding Rate</p>
                    <p className="font-medium">{(ticker.fundingRate * 100).toFixed(4)}%</p>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={fetchTicker}>
                <Activity className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Form */}
            <div className="space-y-4 p-4 rounded-lg border border-border/50">
              <h3 className="font-medium">Place Order</h3>
              
              <div className="space-y-2">
                <Label>Symbol</Label>
                <Select
                  value={orderForm.symbol}
                  onValueChange={(v) => setOrderForm({ ...orderForm, symbol: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BTCUSDT">BTC/USDT</SelectItem>
                    <SelectItem value="ETHUSDT">ETH/USDT</SelectItem>
                    <SelectItem value="SOLUSDT">SOL/USDT</SelectItem>
                    <SelectItem value="XRPUSDT">XRP/USDT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={orderForm.side === 'buy' ? 'default' : 'outline'}
                  className={orderForm.side === 'buy' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setOrderForm({ ...orderForm, side: 'buy' })}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Buy
                </Button>
                <Button
                  variant={orderForm.side === 'sell' ? 'default' : 'outline'}
                  className={orderForm.side === 'sell' ? 'bg-red-600 hover:bg-red-700' : ''}
                  onClick={() => setOrderForm({ ...orderForm, side: 'sell' })}
                >
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Sell
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Order Type</Label>
                <Select
                  value={orderForm.orderType}
                  onValueChange={(v) => setOrderForm({ ...orderForm, orderType: v as 'market' | 'limit' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeTab === 'futures' && (
                <div className="space-y-2">
                  <Label>Leverage</Label>
                  <Select
                    value={orderForm.leverage}
                    onValueChange={(v) => setOrderForm({ ...orderForm, leverage: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 5, 10, 20, 50, 100, 125, 250, 500].map((lev) => (
                        <SelectItem key={lev} value={lev.toString()}>{lev}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={orderForm.amount}
                  onChange={(e) => setOrderForm({ ...orderForm, amount: e.target.value })}
                />
              </div>

              {orderForm.orderType === 'limit' && (
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
                className={`w-full ${orderForm.side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    {orderForm.side === 'buy' ? 'Buy' : 'Sell'} {orderForm.symbol}
                  </>
                )}
              </Button>
            </div>

            {/* Balance/Positions Display */}
            <div className="space-y-4 p-4 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {activeTab === 'spot' ? 'Wallet Balances' : 'Open Positions'}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={activeTab === 'spot' ? fetchBalance : fetchPositions}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                </Button>
              </div>

              {activeTab === 'spot' ? (
                <div className="space-y-2">
                  {balances.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Click refresh to load balances
                    </p>
                  ) : (
                    balances.map((balance) => (
                      <div
                        key={balance.asset}
                        className="flex items-center justify-between p-2 rounded bg-muted/30"
                      >
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{balance.asset}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{balance.free.toFixed(8)}</p>
                          {balance.locked > 0 && (
                            <p className="text-xs text-muted-foreground">Locked: {balance.locked.toFixed(8)}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {positions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No open positions
                    </p>
                  ) : (
                    positions.map((position, i) => (
                      <div
                        key={i}
                        className="p-3 rounded bg-muted/30 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={position.side === 'long' ? 'default' : 'destructive'}>
                              {position.side.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{position.symbol}</span>
                            <span className="text-xs text-muted-foreground">{position.leverage}x</span>
                          </div>
                          <p className={`font-bold ${position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {position.unrealizedPnl >= 0 ? '+' : ''}${position.unrealizedPnl.toFixed(2)}
                          </p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Size</p>
                            <p>{position.size}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Entry</p>
                            <p>${position.entryPrice.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Liq. Price</p>
                            <p className="text-red-400">${position.liquidationPrice.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default BTCCTrading;
