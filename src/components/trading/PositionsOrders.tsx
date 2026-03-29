import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  TrendingUp, TrendingDown, X, Edit, Clock, CheckCircle, XCircle, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  margin: number;
  leverage: number;
  pnl: number;
  pnlPercent: number;
  roe: number;
}

interface Order {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  price: number;
  amount: number;
  filled: number;
  status: 'open' | 'partial' | 'filled' | 'cancelled';
  createdAt: Date;
}

const PositionsOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [showAllSymbols, setShowAllSymbols] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // Load positions from paper_portfolio
    const { data: portfolio } = await supabase
      .from("paper_portfolio")
      .select("*")
      .eq("user_id", user.id) as any;

    if (portfolio) {
      setPositions(portfolio.map((p: any) => ({
        id: p.id,
        symbol: p.symbol + '/USDT',
        side: 'long' as const,
        size: Number(p.quantity),
        entryPrice: Number(p.avg_price),
        markPrice: Number(p.avg_price), // Will be updated by market data
        liquidationPrice: 0,
        margin: Number(p.quantity) * Number(p.avg_price),
        leverage: 1,
        pnl: 0,
        pnlPercent: 0,
        roe: 0,
      })));
    }

    // Load orders from trade_logs
    const { data: trades } = await supabase
      .from("trade_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50) as any;

    if (trades) {
      setOrders(trades.map((t: any) => ({
        id: t.id,
        symbol: t.symbol || 'BTC/USDT',
        side: t.side || 'buy',
        type: t.order_type || 'market',
        price: Number(t.price) || 0,
        amount: Number(t.quantity) || 0,
        filled: Number(t.quantity) || 0,
        status: (t.status === 'executed' ? 'filled' : t.status || 'filled') as Order['status'],
        createdAt: new Date(t.created_at),
      })));
    }

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const cancelOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as const } : o));
    toast.success("Order cancelled");
  };

  const closePosition = async (id: string) => {
    const pos = positions.find(p => p.id === id);
    if (!pos) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const symbol = pos.symbol.replace('/USDT', '');
    await supabase.rpc('update_paper_portfolio', {
      p_user_id: user.id,
      p_symbol: symbol,
      p_amount_change: -pos.size,
      p_price: pos.markPrice,
    });

    setPositions(prev => prev.filter(p => p.id !== id));
    toast.success("Position closed");
  };

  const totalPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
  const totalMargin = positions.reduce((acc, p) => acc + p.margin, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading positions & orders...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Positions & Orders</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Switch checked={showAllSymbols} onCheckedChange={setShowAllSymbols} />
            <span className="text-sm text-muted-foreground">All Symbols</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="positions">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="positions" className="flex-1">
              Positions ({positions.length})
            </TabsTrigger>
            <TabsTrigger value="open" className="flex-1">
              Open Orders ({orders.filter(o => o.status === 'open' || o.status === 'partial').length})
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="m-0">
            <div className="grid grid-cols-3 gap-4 p-4 border-b bg-muted/30">
              <div>
                <p className="text-xs text-muted-foreground">Total PnL</p>
                <p className={`font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Margin</p>
                <p className="font-bold">${totalMargin.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Positions</p>
                <p className="font-bold">{positions.length}</p>
              </div>
            </div>

            <ScrollArea className="h-[250px]">
              {positions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Entry</TableHead>
                      <TableHead>Mark</TableHead>
                      <TableHead>PnL (ROE)</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.map((position) => (
                      <TableRow key={position.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={position.side === 'long' ? 'default' : 'destructive'} className="text-xs">
                              {position.side === 'long' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                              {position.leverage}x
                            </Badge>
                            <span className="font-medium">{position.symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell>{position.size}</TableCell>
                        <TableCell>${position.entryPrice.toLocaleString()}</TableCell>
                        <TableCell>${position.markPrice.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className={position.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                            <div className="font-medium">
                              {position.pnl >= 0 ? '+' : ''}${position.pnl.toLocaleString()}
                            </div>
                            <div className="text-xs">
                              ({position.roe >= 0 ? '+' : ''}{position.roe.toFixed(2)}%)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => closePosition(position.id)}>
                            Close
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">No open positions</p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="open" className="m-0">
            <ScrollArea className="h-[250px]">
              {orders.filter(o => o.status === 'open' || o.status === 'partial').length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.filter(o => o.status === 'open' || o.status === 'partial').map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.symbol}</TableCell>
                        <TableCell><Badge variant="outline">{order.type}</Badge></TableCell>
                        <TableCell>
                          <span className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                            {order.side.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>${order.price.toLocaleString()}</TableCell>
                        <TableCell>{order.amount}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'partial' ? 'secondary' : 'outline'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => cancelOrder(order.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">No open orders</p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="m-0">
            <ScrollArea className="h-[300px]">
              {orders.filter(o => o.status === 'filled' || o.status === 'cancelled').length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Side</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.filter(o => o.status === 'filled' || o.status === 'cancelled').map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-muted-foreground">
                          {order.createdAt.toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium">{order.symbol}</TableCell>
                        <TableCell>
                          <span className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                            {order.side.toUpperCase()}
                          </span>
                        </TableCell>
                        <TableCell>${order.price.toLocaleString()}</TableCell>
                        <TableCell>{order.amount}</TableCell>
                        <TableCell>
                          <Badge variant={order.status === 'filled' ? 'default' : 'destructive'}>
                            {order.status === 'filled' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                            {order.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-muted-foreground py-8 text-sm">No trade history</p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PositionsOrders;
