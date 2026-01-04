import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Calendar, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const StrategyBacktest = () => {
  return (
    <div className="grid grid-cols-3 gap-6">
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Backtest Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Strategy</Label>
              <Select defaultValue="rsi">
                <SelectTrigger>
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rsi">RSI Mean Reversion</SelectItem>
                  <SelectItem value="macd">MACD Trend Follower</SelectItem>
                  <SelectItem value="bb">Bollinger Breakout</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select defaultValue="1h">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" defaultValue="2024-01-01" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" defaultValue="2024-12-31" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Initial Capital</Label>
              <Input type="number" defaultValue="10000" />
            </div>
            <div className="space-y-2">
              <Label>Trading Fees (%)</Label>
              <Input type="number" step="0.01" defaultValue="0.1" />
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={() => toast.success("Backtest started!")}>
            <Play className="h-4 w-4 mr-2" />
            Run Backtest
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">Select a strategy and run backtest</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategyBacktest;
