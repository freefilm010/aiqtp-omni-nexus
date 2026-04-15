import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Zap, Target, Shield, Clock, TrendingUp, AlertTriangle } from "lucide-react";

const DeFiSniper = () => {
  const [autoSnipe, setAutoSnipe] = useState(false);
  const [slippage, setSlippage] = useState([5]);
  const [maxBuy, setMaxBuy] = useState("1");

  const recentSnipes = [
    { token: 'BONK2', address: '0x...abc', profit: 245, time: '2m ago', status: 'success' },
    { token: 'PEPE3', address: '0x...def', profit: -15, time: '5m ago', status: 'failed' },
    { token: 'DOGE5', address: '0x...ghi', profit: 89, time: '12m ago', status: 'success' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Snipe
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Token Address / Pool ID</Label>
            <Input placeholder="Enter Solana token address or Raydium pool ID..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm">Buy Amount (SOL)</Label>
              <Input type="number" value={maxBuy} onChange={(e) => setMaxBuy(e.target.value)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Slippage</Label>
                <span>{slippage[0]}%</span>
              </div>
              <Slider value={slippage} onValueChange={setSlippage} max={50} step={0.5} />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Anti-Rug Protection</span>
            </div>
            <Switch defaultChecked />
          </div>

          <Button className="w-full" size="lg" onClick={() => toast.success("Snipe executed!")}>
            <Zap className="h-4 w-4 mr-2" />
            Execute Snipe
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Auto-Sniper
              <Switch checked={autoSnipe} onCheckedChange={setAutoSnipe} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {autoSnipe ? "Watching for new token launches..." : "Enable to auto-snipe new tokens"}
            </p>
            {autoSnipe && (
              <Badge className="mt-2 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                Active
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Snipes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSnipes.map((snipe, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <span className="font-medium">{snipe.token}</span>
                  <p className="text-xs text-muted-foreground">{snipe.time}</p>
                </div>
                <span className={snipe.profit >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {snipe.profit >= 0 ? '+' : ''}{snipe.profit}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeFiSniper;
