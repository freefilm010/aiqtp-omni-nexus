import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Clock,
  Target,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";

interface OrderEntryProps {
  symbol?: string;
  currentPrice?: number;
  onOrderSubmit?: (order: any) => void;
}

const AdvancedOrderEntry = ({ symbol = "BTC/USDT", currentPrice = 67500, onOrderSubmit }: OrderEntryProps) => {
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stop-limit' | 'trailing' | 'iceberg' | 'twap'>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState(currentPrice.toString());
  const [stopPrice, setStopPrice] = useState("");
  const [leverage, setLeverage] = useState([1]);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [postOnly, setPostOnly] = useState(false);
  const [timeInForce, setTimeInForce] = useState("GTC");
  
  // Advanced order params
  const [trailingPercent, setTrailingPercent] = useState("1");
  const [icebergVisible, setIcebergVisible] = useState("10");
  const [twapDuration, setTwapDuration] = useState("60");
  const [twapSlices, setTwapSlices] = useState("12");

  const [availableBalance] = useState(50000);
  const [position] = useState({ size: 0.5, entryPrice: 65000, pnl: 1250, pnlPercent: 3.85 });

  const handleSubmit = () => {
    const order = {
      symbol,
      type: orderType,
      side,
      amount: parseFloat(amount),
      price: orderType !== 'market' ? parseFloat(price) : currentPrice,
      stopPrice: stopPrice ? parseFloat(stopPrice) : undefined,
      leverage: leverage[0],
      reduceOnly,
      postOnly,
      timeInForce,
      trailingPercent: orderType === 'trailing' ? parseFloat(trailingPercent) : undefined,
      icebergVisible: orderType === 'iceberg' ? parseFloat(icebergVisible) : undefined,
      twapDuration: orderType === 'twap' ? parseInt(twapDuration) : undefined,
      twapSlices: orderType === 'twap' ? parseInt(twapSlices) : undefined,
    };
    
    onOrderSubmit?.(order);
    toast.success(`${side.toUpperCase()} order submitted`, {
      description: `${orderType} order for ${amount} ${symbol.split('/')[0]}`
    });
  };

  const total = parseFloat(amount || "0") * parseFloat(price || currentPrice.toString());
  const maxBuy = availableBalance / currentPrice;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Order Entry</CardTitle>
          <Badge variant="outline">
            <Zap className="h-3 w-3 mr-1" />
            Pro Mode
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={side === 'buy' ? 'default' : 'outline'}
            className={side === 'buy' ? 'bg-green-500 hover:bg-green-600' : ''}
            onClick={() => setSide('buy')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Buy / Long
          </Button>
          <Button
            variant={side === 'sell' ? 'default' : 'outline'}
            className={side === 'sell' ? 'bg-red-500 hover:bg-red-600' : ''}
            onClick={() => setSide('sell')}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Sell / Short
          </Button>
        </div>

        {/* Order Type */}
        <div className="space-y-2">
          <Label>Order Type</Label>
          <Select value={orderType} onValueChange={(v: any) => setOrderType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="market">Market</SelectItem>
              <SelectItem value="limit">Limit</SelectItem>
              <SelectItem value="stop">Stop Market</SelectItem>
              <SelectItem value="stop-limit">Stop Limit</SelectItem>
              <SelectItem value="trailing">Trailing Stop</SelectItem>
              <SelectItem value="iceberg">Iceberg</SelectItem>
              <SelectItem value="twap">TWAP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price inputs based on order type */}
        {orderType !== 'market' && orderType !== 'trailing' && (
          <div className="space-y-2">
            <Label>Price</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}

        {(orderType === 'stop' || orderType === 'stop-limit') && (
          <div className="space-y-2">
            <Label>Stop Price</Label>
            <Input
              type="number"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              placeholder="Trigger price"
            />
          </div>
        )}

        {orderType === 'trailing' && (
          <div className="space-y-2">
            <Label>Trailing Percent (%)</Label>
            <Input
              type="number"
              value={trailingPercent}
              onChange={(e) => setTrailingPercent(e.target.value)}
              placeholder="1.0"
            />
          </div>
        )}

        {orderType === 'iceberg' && (
          <div className="space-y-2">
            <Label>Visible Amount (%)</Label>
            <Input
              type="number"
              value={icebergVisible}
              onChange={(e) => setIcebergVisible(e.target.value)}
              placeholder="10"
            />
          </div>
        )}

        {orderType === 'twap' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                value={twapDuration}
                onChange={(e) => setTwapDuration(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slices</Label>
              <Input
                type="number"
                value={twapSlices}
                onChange={(e) => setTwapSlices(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Amount */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount ({symbol.split('/')[0]})</Label>
            <span className="text-xs text-muted-foreground">
              Max: {maxBuy.toFixed(4)}
            </span>
          </div>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <div className="grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((pct) => (
              <Button
                key={pct}
                variant="outline"
                size="sm"
                onClick={() => setAmount((maxBuy * pct / 100).toFixed(4))}
              >
                {pct}%
              </Button>
            ))}
          </div>
        </div>

        {/* Leverage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Leverage</Label>
            <span className="font-bold">{leverage[0]}x</span>
          </div>
          <Slider
            value={leverage}
            onValueChange={setLeverage}
            min={1}
            max={100}
            step={1}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1x</span>
            <span>25x</span>
            <span>50x</span>
            <span>100x</span>
          </div>
        </div>

        {/* Time in Force */}
        <div className="space-y-2">
          <Label>Time in Force</Label>
          <Select value={timeInForce} onValueChange={setTimeInForce}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GTC">Good Till Cancel</SelectItem>
              <SelectItem value="IOC">Immediate or Cancel</SelectItem>
              <SelectItem value="FOK">Fill or Kill</SelectItem>
              <SelectItem value="GTD">Good Till Date</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch checked={reduceOnly} onCheckedChange={setReduceOnly} />
            <Label className="text-sm">Reduce Only</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={postOnly} onCheckedChange={setPostOnly} />
            <Label className="text-sm">Post Only</Label>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total</span>
            <span className="font-medium">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Est. Fee</span>
            <span className="font-medium">${(total * 0.001).toFixed(2)}</span>
          </div>
          {leverage[0] > 1 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Liquidation Price</span>
              <span className="text-amber-500 font-medium">
                ${(side === 'buy' 
                  ? currentPrice * (1 - 1/leverage[0] + 0.01)
                  : currentPrice * (1 + 1/leverage[0] - 0.01)
                ).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Current Position */}
        {position.size > 0 && (
          <div className="p-3 rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Position</span>
              <Badge variant={position.pnl > 0 ? "default" : "destructive"}>
                {position.pnl > 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Size:</span>
                <span className="ml-1">{position.size} BTC</span>
              </div>
              <div>
                <span className="text-muted-foreground">Entry:</span>
                <span className="ml-1">${position.entryPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">PnL:</span>
                <span className={`ml-1 ${position.pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${position.pnl.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <Button
          className={`w-full ${side === 'buy' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
          size="lg"
          onClick={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          {side === 'buy' ? (
            <TrendingUp className="h-4 w-4 mr-2" />
          ) : (
            <TrendingDown className="h-4 w-4 mr-2" />
          )}
          {side === 'buy' ? 'Buy' : 'Sell'} {symbol.split('/')[0]}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdvancedOrderEntry;
