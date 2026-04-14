import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { toast } from "sonner";
import {
  Zap,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Layers,
  BarChart3,
  Shield,
  DollarSign,
  Percent
} from "lucide-react";

const SmartOrders = () => {
  const { prices } = useMarketPrices();
  const [symbol, setSymbol] = useState('BTC');
  const [orderType, setOrderType] = useState('iceberg');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('1.0');
  const [price, setPrice] = useState('');
  const [sliceSize, setSliceSize] = useState([10]);
  const [twapDuration, setTwapDuration] = useState('60');
  const [stopPrice, setStopPrice] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [trailingPercent, setTrailingPercent] = useState([2]);
  const [useOCO, setUseOCO] = useState(false);

  const currentPrice = prices[symbol]?.priceNumeric || 67500;

  const placeOrder = () => {
    toast.success(`${orderType.toUpperCase()} order placed`, {
      description: `${side.toUpperCase()} ${amount} ${symbol} - Smart execution enabled`
    });
  };

  return (
    <div className="space-y-3 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
        {/* Order Types */}
        <Card className="sm:col-span-2">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
              Smart Order Types
            </CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">
              Institutional-grade execution algorithms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={orderType} onValueChange={setOrderType}>
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
                <TabsTrigger value="iceberg" className="text-[9px] sm:text-sm px-1 py-1.5">Iceberg</TabsTrigger>
                <TabsTrigger value="twap" className="text-[9px] sm:text-sm px-1 py-1.5">TWAP</TabsTrigger>
                <TabsTrigger value="vwap" className="text-[9px] sm:text-sm px-1 py-1.5">VWAP</TabsTrigger>
                <TabsTrigger value="trailing" className="text-[9px] sm:text-sm px-1 py-1.5">Trail</TabsTrigger>
                <TabsTrigger value="oco" className="text-[9px] sm:text-sm px-1 py-1.5">OCO</TabsTrigger>
                <TabsTrigger value="bracket" className="text-[9px] sm:text-sm px-1 py-1.5">Bracket</TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-6">
                {/* Common Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <Label>Symbol</Label>
                    <Select value={symbol} onValueChange={setSymbol}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BTC">BTC/USD</SelectItem>
                        <SelectItem value="ETH">ETH/USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Side</Label>
                    <div className="flex gap-2 mt-2">
                      <Button
                        className={`flex-1 ${side === 'buy' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                        variant={side === 'buy' ? 'default' : 'outline'}
                        onClick={() => setSide('buy')}
                      >
                        Buy
                      </Button>
                      <Button
                        className={`flex-1 ${side === 'sell' ? 'bg-red-500 hover:bg-red-600' : ''}`}
                        variant={side === 'sell' ? 'default' : 'outline'}
                        onClick={() => setSide('sell')}
                      >
                        Sell
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Amount ({symbol})</Label>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Order-Specific Fields */}
                <TabsContent value="iceberg" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="h-5 w-5 text-primary" />
                      <span className="font-medium">Iceberg Order</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Executes large orders in smaller visible slices to minimize market impact
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label>Limit Price</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder={currentPrice.toString()}
                        />
                      </div>
                      <div>
                        <Label>Visible Slice Size: {sliceSize}%</Label>
                        <Slider
                          value={sliceSize}
                          onValueChange={setSliceSize}
                          min={5}
                          max={50}
                          step={5}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Shows {((parseFloat(amount) * sliceSize[0]) / 100).toFixed(4)} {symbol} per slice
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="twap" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-medium">Time-Weighted Average Price</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Spreads order execution evenly over a specified time period
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Select value={twapDuration} onValueChange={setTwapDuration}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                            <SelectItem value="240">4 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded bg-background">
                          <p className="text-xs text-muted-foreground">Orders/Period</p>
                          <p className="text-lg font-bold">{Math.ceil(parseInt(twapDuration) / 5)}</p>
                        </div>
                        <div className="p-3 rounded bg-background">
                          <p className="text-xs text-muted-foreground">Size/Order</p>
                          <p className="text-lg font-bold">
                            {(parseFloat(amount) / Math.ceil(parseInt(twapDuration) / 5)).toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="vwap" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      <span className="font-medium">Volume-Weighted Average Price</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Executes based on historical volume patterns to achieve VWAP
                    </p>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Aggressive Mode</Label>
                        <Switch />
                      </div>
                      <div>
                        <Label>Target Completion</Label>
                        <Select defaultValue="100">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="50">50% by mid-session</SelectItem>
                            <SelectItem value="75">75% by mid-session</SelectItem>
                            <SelectItem value="100">Even distribution</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="trailing" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <span className="font-medium">Trailing Stop</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Stop price follows market movement to lock in profits
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label>Trailing Distance: {trailingPercent}%</Label>
                        <Slider
                          value={trailingPercent}
                          onValueChange={setTrailingPercent}
                          min={0.5}
                          max={10}
                          step={0.5}
                          className="mt-2"
                        />
                      </div>
                      <div className="p-3 rounded bg-background">
                        <p className="text-xs text-muted-foreground">Current Trail Level</p>
                        <p className="text-lg font-bold text-amber-500">
                          ${(currentPrice * (1 - trailingPercent[0] / 100)).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="oco" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-medium">One-Cancels-Other</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Two linked orders - when one executes, the other is automatically cancelled
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-green-500">Take Profit Price</Label>
                        <Input
                          type="number"
                          value={takeProfitPrice}
                          onChange={(e) => setTakeProfitPrice(e.target.value)}
                          placeholder={(currentPrice * 1.05).toFixed(2)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-red-500">Stop Loss Price</Label>
                        <Input
                          type="number"
                          value={stopPrice}
                          onChange={(e) => setStopPrice(e.target.value)}
                          placeholder={(currentPrice * 0.95).toFixed(2)}
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bracket" className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="font-medium">Bracket Order</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Entry order with attached take-profit and stop-loss
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label>Entry Price</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          placeholder={currentPrice.toString()}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-green-500">Take Profit</Label>
                          <Input
                            type="number"
                            value={takeProfitPrice}
                            onChange={(e) => setTakeProfitPrice(e.target.value)}
                            placeholder="+5%"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-red-500">Stop Loss</Label>
                          <Input
                            type="number"
                            value={stopPrice}
                            onChange={(e) => setStopPrice(e.target.value)}
                            placeholder="-3%"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <Button 
                  className={`w-full ${side === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
                  size="lg"
                  onClick={placeOrder}
                >
                  Place {orderType.toUpperCase()} {side.toUpperCase()} Order
                </Button>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <div className="space-y-3 sm:space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Symbol</span>
                <span className="font-bold">{symbol}/USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <Badge>{orderType.toUpperCase()}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Side</span>
                <span className={side === 'buy' ? 'text-green-500 font-bold' : 'text-red-500 font-bold'}>
                  {side.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">{amount} {symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Value</span>
                <span className="font-bold">
                  ${(parseFloat(amount) * currentPrice).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current Market</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-xl sm:text-3xl font-bold">${currentPrice.toLocaleString()}</p>
                <Badge variant="outline" className="mt-2 text-green-500 border-green-500">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +2.34%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SmartOrders;
