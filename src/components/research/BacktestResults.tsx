import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BacktestResult } from "@/lib/backtesting/engine";
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BacktestResultsProps {
  result: BacktestResult;
}

export default function BacktestResults({ result }: BacktestResultsProps) {
  const isPositive = result.totalReturn >= 0;
  
  // Prepare equity curve data
  const equityData = result.equity.map((equity, index) => ({
    index,
    date: result.timestamps[index]?.toLocaleDateString() || `Day ${index}`,
    equity,
    drawdown: index === 0 ? 0 : Math.max(0, (Math.max(...result.equity.slice(0, index + 1)) - equity) / Math.max(...result.equity.slice(0, index + 1)) * 100)
  }));

  // Prepare trade data for chart
  const tradeData = result.trades.map((trade, index) => ({
    index: index + 1,
    pnl: trade.pnl || 0,
    type: trade.type
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              {isPositive ? (
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
              )}
              Return
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className={`text-lg sm:text-2xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{(result.totalReturn * 100).toFixed(2)}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              ${result.finalCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              Sharpe
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg sm:text-2xl font-bold">
              {result.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Risk-adjusted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
              Max DD
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg sm:text-2xl font-bold text-orange-500">
              {(result.maxDrawdown * 100).toFixed(2)}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Peak to trough</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-lg sm:text-2xl font-bold">
              {(result.winRate * 100).toFixed(1)}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {result.winningTrades}W / {result.totalTrades}T
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm sm:text-base">Backtest Analysis</CardTitle>
          <CardDescription className="text-[10px] sm:text-sm">Performance metrics and visualizations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="equity" className="space-y-3 sm:space-y-4">
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger value="equity" className="text-[9px] sm:text-sm px-1 py-1.5">Equity</TabsTrigger>
              <TabsTrigger value="drawdown" className="text-[9px] sm:text-sm px-1 py-1.5">DD</TabsTrigger>
              <TabsTrigger value="trades" className="text-[9px] sm:text-sm px-1 py-1.5">Trades</TabsTrigger>
              <TabsTrigger value="metrics" className="text-[9px] sm:text-sm px-1 py-1.5">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="equity" className="space-y-4">
              <div className="h-48 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity']}
                    />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="hsl(var(--primary))"
                      fill="url(#equityGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="drawdown" className="space-y-4">
              <div className="h-48 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={equityData}>
                    <defs>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      tickFormatter={(value) => `${value.toFixed(1)}%`}
                      reversed
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="hsl(var(--destructive))"
                      fill="url(#drawdownGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="trades" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tradeData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="index" 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      label={{ value: 'Trade #', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      tickLine={false}
                      tickFormatter={(value) => `$${value.toFixed(0)}`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'pnl') return [`$${value.toFixed(2)}`, 'P&L'];
                        return [value, name];
                      }}
                    />
                    <Bar 
                      dataKey="pnl" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Trade Summary */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">{result.totalTrades}</div>
                  <div className="text-xs text-muted-foreground">Total Trades</div>
                </div>
                <div className="text-center p-3 bg-green-500/10 rounded-lg">
                  <div className="text-lg font-bold text-green-500">{result.winningTrades}</div>
                  <div className="text-xs text-muted-foreground">Winning</div>
                </div>
                <div className="text-center p-3 bg-red-500/10 rounded-lg">
                  <div className="text-lg font-bold text-red-500">{result.losingTrades}</div>
                  <div className="text-xs text-muted-foreground">Losing</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard 
                  label="Annualized Return" 
                  value={`${(result.annualizedReturn * 100).toFixed(2)}%`}
                  highlight={result.annualizedReturn > 0}
                />
                <MetricCard 
                  label="Final Capital" 
                  value={`$${result.finalCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  highlight={isPositive}
                />
                <MetricCard 
                  label="Sortino Ratio" 
                  value={result.sortinoRatio.toFixed(2)}
                />
                <MetricCard 
                  label="Profit Factor" 
                  value={result.profitFactor.toFixed(2)}
                />
                <MetricCard 
                  label="Avg Win" 
                  value={`$${result.avgWin.toFixed(2)}`}
                  highlight
                />
                <MetricCard 
                  label="Avg Loss" 
                  value={`$${Math.abs(result.avgLoss).toFixed(2)}`}
                  negative
                />
                <MetricCard 
                  label="Largest Win" 
                  value={`$${result.largestWin.toFixed(2)}`}
                  highlight
                />
                <MetricCard 
                  label="Largest Loss" 
                  value={`$${Math.abs(result.largestLoss).toFixed(2)}`}
                  negative
                />
                <MetricCard 
                  label="Avg Holding Period" 
                  value={`${result.avgHoldingPeriod.toFixed(1)} days`}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  label, 
  value, 
  highlight = false,
  negative = false 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="p-2.5 sm:p-4 bg-muted/50 rounded-lg">
      <div className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">{label}</div>
      <div className={`text-sm sm:text-lg font-semibold ${highlight ? 'text-green-500' : negative ? 'text-red-500' : ''}`}>
        {value}
      </div>
    </div>
  );
}
