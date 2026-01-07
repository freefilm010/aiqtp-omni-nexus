import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Target,
  Shield,
  Zap,
  Globe,
  DollarSign,
  Percent,
  AlertTriangle,
  Award,
  Layers
} from "lucide-react";

// Portfolio position
interface Position {
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  sector: string;
  assetClass: 'stock' | 'crypto' | 'etf' | 'bond' | 'commodity';
  region: string;
}

// Performance metrics
interface PerformanceMetrics {
  totalReturn: number;
  todayReturn: number;
  weekReturn: number;
  monthReturn: number;
  yearReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  beta: number;
  alpha: number;
  volatility: number;
  winRate: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const generatePortfolio = (): Position[] => [
  { symbol: 'BTC', name: 'Bitcoin', quantity: 1.5, avgCost: 45000, currentPrice: 67500, sector: 'Cryptocurrency', assetClass: 'crypto', region: 'Global' },
  { symbol: 'ETH', name: 'Ethereum', quantity: 15, avgCost: 2800, currentPrice: 3400, sector: 'Cryptocurrency', assetClass: 'crypto', region: 'Global' },
  { symbol: 'SOL', name: 'Solana', quantity: 100, avgCost: 80, currentPrice: 145, sector: 'Cryptocurrency', assetClass: 'crypto', region: 'Global' },
  { symbol: 'NVDA', name: 'NVIDIA', quantity: 50, avgCost: 450, currentPrice: 875, sector: 'Technology', assetClass: 'stock', region: 'US' },
  { symbol: 'AAPL', name: 'Apple', quantity: 100, avgCost: 150, currentPrice: 195, sector: 'Technology', assetClass: 'stock', region: 'US' },
  { symbol: 'MSFT', name: 'Microsoft', quantity: 40, avgCost: 300, currentPrice: 420, sector: 'Technology', assetClass: 'stock', region: 'US' },
  { symbol: 'GOOGL', name: 'Alphabet', quantity: 30, avgCost: 120, currentPrice: 175, sector: 'Technology', assetClass: 'stock', region: 'US' },
  { symbol: 'TSLA', name: 'Tesla', quantity: 25, avgCost: 200, currentPrice: 248, sector: 'Consumer', assetClass: 'stock', region: 'US' },
  { symbol: 'SPY', name: 'S&P 500 ETF', quantity: 20, avgCost: 450, currentPrice: 582, sector: 'Index', assetClass: 'etf', region: 'US' },
  { symbol: 'QQQ', name: 'Nasdaq ETF', quantity: 15, avgCost: 380, currentPrice: 502, sector: 'Index', assetClass: 'etf', region: 'US' },
  { symbol: 'GLD', name: 'Gold ETF', quantity: 50, avgCost: 180, currentPrice: 215, sector: 'Commodity', assetClass: 'commodity', region: 'Global' },
  { symbol: 'TLT', name: 'Treasury Bond ETF', quantity: 30, avgCost: 100, currentPrice: 92, sector: 'Fixed Income', assetClass: 'bond', region: 'US' },
];

const generateMetrics = (): PerformanceMetrics => ({
  totalReturn: 42.5,
  todayReturn: 1.2,
  weekReturn: 3.8,
  monthReturn: 8.2,
  yearReturn: 42.5,
  sharpeRatio: 1.85,
  sortinoRatio: 2.1,
  maxDrawdown: -15.3,
  beta: 1.15,
  alpha: 8.5,
  volatility: 22.4,
  winRate: 68
});

const generateEquityCurve = () => {
  const data = [];
  let value = 100000;
  for (let i = 0; i < 365; i++) {
    value = value * (1 + (Math.random() - 0.48) * 0.02);
    data.push({
      date: new Date(Date.now() - (365 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(value),
      benchmark: Math.round(100000 * (1 + i * 0.0003))
    });
  }
  return data;
};

const generateDrawdownData = () => {
  const data = [];
  for (let i = 0; i < 52; i++) {
    data.push({
      week: `W${i + 1}`,
      drawdown: -(Math.random() * 20)
    });
  }
  return data;
};

const PortfolioAnalyticsDashboard = () => {
  const [portfolio, setPortfolio] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [equityCurve, setEquityCurve] = useState<any[]>([]);
  const [drawdownData, setDrawdownData] = useState<any[]>([]);

  useEffect(() => {
    setPortfolio(generatePortfolio());
    setMetrics(generateMetrics());
    setEquityCurve(generateEquityCurve());
    setDrawdownData(generateDrawdownData());
  }, []);

  if (!metrics) return null;

  // Calculate portfolio value and P&L
  const totalValue = portfolio.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);
  const totalCost = portfolio.reduce((sum, p) => sum + p.quantity * p.avgCost, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = ((totalValue - totalCost) / totalCost) * 100;

  // Sector allocation
  const sectorData = portfolio.reduce((acc, p) => {
    const value = p.quantity * p.currentPrice;
    const existing = acc.find(s => s.name === p.sector);
    if (existing) existing.value += value;
    else acc.push({ name: p.sector, value });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Asset class allocation
  const assetClassData = portfolio.reduce((acc, p) => {
    const value = p.quantity * p.currentPrice;
    const existing = acc.find(s => s.name === p.assetClass);
    if (existing) existing.value += value;
    else acc.push({ name: p.assetClass, value });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Region allocation
  const regionData = portfolio.reduce((acc, p) => {
    const value = p.quantity * p.currentPrice;
    const existing = acc.find(s => s.name === p.region);
    if (existing) existing.value += value;
    else acc.push({ name: p.region, value });
    return acc;
  }, [] as { name: string; value: number }[]);

  // P&L by position
  const pnlByPosition = portfolio.map(p => ({
    symbol: p.symbol,
    pnl: (p.currentPrice - p.avgCost) * p.quantity,
    pnlPercent: ((p.currentPrice - p.avgCost) / p.avgCost) * 100
  })).sort((a, b) => b.pnl - a.pnl);

  // Risk metrics for radar
  const riskRadarData = [
    { metric: 'Sharpe', value: Math.min(metrics.sharpeRatio / 3, 1) * 100, fullMark: 100 },
    { metric: 'Win Rate', value: metrics.winRate, fullMark: 100 },
    { metric: 'Alpha', value: Math.min(metrics.alpha / 20, 1) * 100, fullMark: 100 },
    { metric: 'Volatility', value: 100 - metrics.volatility, fullMark: 100 },
    { metric: 'Drawdown', value: 100 + metrics.maxDrawdown, fullMark: 100 },
    { metric: 'Beta Adj', value: Math.abs(1 - metrics.beta) < 0.3 ? 80 : 50, fullMark: 100 },
  ];

  const formatCurrency = (v: number) => `$${v.toLocaleString()}`;
  const formatPercent = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Portfolio Value</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card className={`bg-gradient-to-br ${totalPnL > 0 ? 'from-green-500/10 to-green-500/5' : 'from-red-500/10 to-red-500/5'}`}>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnL > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(totalPnL)}
            </p>
            <p className={`text-xs ${totalPnL > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercent(totalPnLPercent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Today</p>
            <p className={`text-2xl font-bold ${metrics.todayReturn > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatPercent(metrics.todayReturn)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Sharpe Ratio</p>
            <p className="text-2xl font-bold">{metrics.sharpeRatio.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Max Drawdown</p>
            <p className="text-2xl font-bold text-red-500">{metrics.maxDrawdown.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Win Rate</p>
            <p className="text-2xl font-bold text-green-500">{metrics.winRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Equity Curve */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Equity Curve vs Benchmark
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equityCurve}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={30} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#10b981" fill="url(#portfolioGradient)" name="Portfolio" />
              <Line type="monotone" dataKey="benchmark" stroke="#6b7280" strokeDasharray="5 5" name="Benchmark" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Allocation Charts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="h-4 w-4" />
              Sector Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sectorData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {sectorData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              Asset Class
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={assetClassData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {assetClassData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              Geographic Exposure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={regionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {regionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Attribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              P&L Attribution by Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pnlByPosition} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `$${(v/1000).toFixed(0)}K`} />
                <YAxis dataKey="symbol" type="category" width={50} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="pnl" name="P&L">
                  {pnlByPosition.map((entry, i) => (
                    <Cell key={i} fill={entry.pnl > 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Radar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              Risk Profile Radar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={riskRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar name="Portfolio" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Drawdown Analysis */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Drawdown Analysis (52 Weeks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={drawdownData}>
              <defs>
                <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={[-25, 0]} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="url(#drawdownGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Holdings Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Holdings Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b">
                  <th className="text-left py-2">Symbol</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Avg Cost</th>
                  <th className="text-right">Current</th>
                  <th className="text-right">Value</th>
                  <th className="text-right">P&L</th>
                  <th className="text-right">%</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map(p => {
                  const value = p.quantity * p.currentPrice;
                  const pnl = (p.currentPrice - p.avgCost) * p.quantity;
                  const pnlPct = ((p.currentPrice - p.avgCost) / p.avgCost) * 100;
                  return (
                    <tr key={p.symbol} className="border-b hover:bg-secondary/30">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{p.symbol}</span>
                          <Badge variant="outline" className="text-xs">{p.assetClass}</Badge>
                        </div>
                      </td>
                      <td className="text-right font-mono">{p.quantity}</td>
                      <td className="text-right font-mono">${p.avgCost.toLocaleString()}</td>
                      <td className="text-right font-mono">${p.currentPrice.toLocaleString()}</td>
                      <td className="text-right font-mono">{formatCurrency(value)}</td>
                      <td className={`text-right font-mono ${pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(pnl)}
                      </td>
                      <td className={`text-right font-mono ${pnl > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatPercent(pnlPct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioAnalyticsDashboard;
