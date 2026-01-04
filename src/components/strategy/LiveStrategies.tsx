import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Settings,
  MoreVertical
} from "lucide-react";

interface LiveStrategy {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'stopped';
  pairs: string[];
  profit: number;
  profitPercent: number;
  trades: number;
  winRate: number;
  uptime: string;
  lastTrade: string;
  openPositions: number;
  drawdown: number;
}

const mockStrategies: LiveStrategy[] = [
  {
    id: '1',
    name: 'RSI Mean Reversion',
    status: 'running',
    pairs: ['BTC/USDT', 'ETH/USDT'],
    profit: 4520.50,
    profitPercent: 15.2,
    trades: 156,
    winRate: 68.4,
    uptime: '15d 4h 23m',
    lastTrade: '2 min ago',
    openPositions: 2,
    drawdown: 4.2,
  },
  {
    id: '2',
    name: 'MACD Trend Follower',
    status: 'running',
    pairs: ['SOL/USDT', 'XRP/USDT', 'DOGE/USDT'],
    profit: 2150.25,
    profitPercent: 8.7,
    trades: 89,
    winRate: 54.2,
    uptime: '8d 12h 45m',
    lastTrade: '15 min ago',
    openPositions: 1,
    drawdown: 6.8,
  },
  {
    id: '3',
    name: 'Bollinger Breakout',
    status: 'paused',
    pairs: ['BTC/USDT'],
    profit: -320.00,
    profitPercent: -2.1,
    trades: 23,
    winRate: 43.5,
    uptime: '3d 8h 12m',
    lastTrade: '2 hours ago',
    openPositions: 0,
    drawdown: 8.5,
  },
  {
    id: '4',
    name: 'AI Momentum Alpha',
    status: 'running',
    pairs: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'],
    profit: 8920.75,
    profitPercent: 24.6,
    trades: 312,
    winRate: 72.1,
    uptime: '30d 2h 15m',
    lastTrade: '5 min ago',
    openPositions: 3,
    drawdown: 3.1,
  },
];

const LiveStrategies = () => {
  const [strategies, setStrategies] = useState<LiveStrategy[]>(mockStrategies);

  const toggleStatus = (id: string) => {
    setStrategies(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'running' ? 'paused' : 'running' };
      }
      return s;
    }));
  };

  const totalProfit = strategies.reduce((sum, s) => sum + s.profit, 0);
  const totalTrades = strategies.reduce((sum, s) => sum + s.trades, 0);
  const runningCount = strategies.filter(s => s.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Profit</p>
                <p className={`text-3xl font-bold ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              {totalProfit >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Strategies</p>
                <p className="text-3xl font-bold">{runningCount}/{strategies.length}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-3xl font-bold">{totalTrades}</p>
              </div>
              <Zap className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open Positions</p>
                <p className="text-3xl font-bold">{strategies.reduce((sum, s) => sum + s.openPositions, 0)}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-2 gap-6">
        {strategies.map(strategy => (
          <Card key={strategy.id} className={strategy.status === 'paused' ? 'opacity-75' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${
                    strategy.status === 'running' ? 'bg-green-500 animate-pulse' :
                    strategy.status === 'paused' ? 'bg-amber-500' : 'bg-gray-500'
                  }`} />
                  <div>
                    <CardTitle className="text-lg">{strategy.name}</CardTitle>
                    <div className="flex gap-1 mt-1">
                      {strategy.pairs.map(pair => (
                        <Badge key={pair} variant="secondary" className="text-xs">{pair}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatus(strategy.id)}
                  >
                    {strategy.status === 'running' ? (
                      <><Pause className="h-4 w-4 mr-1" /> Pause</>
                    ) : (
                      <><Play className="h-4 w-4 mr-1" /> Resume</>
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Profit</p>
                  <p className={`text-lg font-bold ${strategy.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {strategy.profit >= 0 ? '+' : ''}{strategy.profitPercent.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ${Math.abs(strategy.profit).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className="text-lg font-bold">{strategy.winRate}%</p>
                  <p className="text-xs text-muted-foreground">{strategy.trades} trades</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Drawdown</p>
                  <p className="text-lg font-bold text-red-500">-{strategy.drawdown}%</p>
                  <p className="text-xs text-muted-foreground">Max</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Open</p>
                  <p className="text-lg font-bold">{strategy.openPositions}</p>
                  <p className="text-xs text-muted-foreground">positions</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    Uptime: <span className="font-medium text-foreground">{strategy.uptime}</span>
                  </span>
                  <span className="text-muted-foreground">
                    Last trade: <span className="font-medium text-foreground">{strategy.lastTrade}</span>
                  </span>
                </div>
                <Badge variant={strategy.status === 'running' ? 'default' : 'secondary'} className="capitalize">
                  {strategy.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LiveStrategies;
