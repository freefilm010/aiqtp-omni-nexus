import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  X,
  Edit,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

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

const mockOrders: Order[] = [
  { id: '1', symbol: 'BTC/USDT', side: 'buy', type: 'limit', price: 65000, amount: 0.5, filled: 0, status: 'open', createdAt: new Date() },
  { id: '2', symbol: 'ETH/USDT', side: 'sell', type: 'stop-limit', price: 3200, amount: 5, filled: 2.5, status: 'partial', createdAt: new Date(Date.now() - 3600000) },
  { id: '3', symbol: 'SOL/USDT', side: 'buy', type: 'limit', price: 140, amount: 50, filled: 50, status: 'filled', createdAt: new Date(Date.now() - 7200000) },
];

const mockPositions: Position[] = [
  { id: '1', symbol: 'BTC/USDT', side: 'long', size: 0.5, entryPrice: 65000, markPrice: 67500, liquidationPrice: 52000, margin: 3250, leverage: 10, pnl: 1250, pnlPercent: 3.85, roe: 38.5 },
  { id: '2', symbol: 'ETH/USDT', side: 'short', size: 5, entryPrice: 3500, markPrice: 3450, liquidationPrice: 4200, margin: 1750, leverage: 10, pnl: 250, pnlPercent: 1.43, roe: 14.3 },
];

const PositionsOrders = () => {
  const [orders, setOrders] = useState(mockOrders);
  const [positions, setPositions] = useState(mockPositions);
  const [showAllSymbols, setShowAllSymbols] = useState(true);

  const cancelOrder = (id: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' as const } : o));
    toast.success("Order cancelled");
  };

  const closePosition = (id: string) => {
    setPositions(prev => prev.filter(p => p.id !== id));
    toast.success("Position closed");
  };

  const totalPnl = positions.reduce((acc, p) => acc + p.pnl, 0);
  const totalMargin = positions.reduce((acc, p) => acc + p.margin, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Positions & Orders</CardTitle>
          <div className="flex items-center gap-2">
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
            {/* Summary */}
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Mark</TableHead>
                    <TableHead>PnL (ROE)</TableHead>
                    <TableHead>Liq. Price</TableHead>
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
                      <TableCell className="text-amber-500">
                        ${position.liquidationPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => closePosition(position.id)}>
                            Close
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="open" className="m-0">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="text-sm text-muted-foreground">
                {orders.filter(o => o.status === 'open' || o.status === 'partial').length} open orders
              </span>
              <Button variant="outline" size="sm" onClick={() => {
                setOrders(prev => prev.map(o => ({ ...o, status: 'cancelled' as const })));
                toast.success("All orders cancelled");
              }}>
                Cancel All
              </Button>
            </div>

            <ScrollArea className="h-[250px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Side</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Filled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.filter(o => o.status !== 'filled' && o.status !== 'cancelled').map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.symbol}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{order.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={order.side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                          {order.side.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>${order.price.toLocaleString()}</TableCell>
                      <TableCell>{order.amount}</TableCell>
                      <TableCell>{order.filled}/{order.amount}</TableCell>
                      <TableCell>
                        <Badge variant={order.status === 'partial' ? 'secondary' : 'outline'}>
                          {order.status === 'partial' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
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
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="m-0">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Type</TableHead>
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
                        <Badge variant="outline">{order.type}</Badge>
                      </TableCell>
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
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default PositionsOrders;
