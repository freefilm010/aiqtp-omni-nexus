import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Shield,
  Globe,
  AlertTriangle,
  Layers,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAssetValuation, formatUsdValue } from "@/hooks/useAssetValuation";

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

const COLORS = ['hsl(162,91%,32%)', 'hsl(224,100%,58%)', 'hsl(43,96%,56%)', 'hsl(355,88%,58%)', 'hsl(270,91%,65%)', 'hsl(330,80%,60%)', 'hsl(190,90%,50%)', 'hsl(90,60%,50%)'];

const ASSET_META: Record<string, { sector: string; assetClass: Position['assetClass']; region: string }> = {
  BTC: { sector: 'Cryptocurrency', assetClass: 'crypto', region: 'Global' },
  ETH: { sector: 'Cryptocurrency', assetClass: 'crypto', region: 'Global' },
  SOL: { sector: 'Cryptocurrency', assetClass: 'crypto', region: 'Global' },
  MATIC: { sector: 'Cryptocurrency', assetClass: 'crypto', region: 'Global' },
  AVAX: { sector: 'Cryptocurrency', assetClass: 'crypto', region: 'Global' },
  LINK: { sector: 'DeFi', assetClass: 'crypto', region: 'Global' },
  UNI: { sector: 'DeFi', assetClass: 'crypto', region: 'Global' },
  AAVE: { sector: 'DeFi', assetClass: 'crypto', region: 'Global' },
  USDC: { sector: 'Stablecoin', assetClass: 'crypto', region: 'Global' },
  USDT: { sector: 'Stablecoin', assetClass: 'crypto', region: 'Global' },
  DAI: { sector: 'Stablecoin', assetClass: 'crypto', region: 'Global' },
  BUSD: { sector: 'Stablecoin', assetClass: 'crypto', region: 'Global' },
  QTC: { sector: 'Platform', assetClass: 'crypto', region: 'Platform' },
  AIQ: { sector: 'Platform', assetClass: 'crypto', region: 'Platform' },
  NXS: { sector: 'Platform', assetClass: 'crypto', region: 'Platform' },
};

const PortfolioAnalyticsDashboard = () => {
  const [portfolio, setPortfolio] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const { getValuation } = useAssetValuation();
  const getValuationRef = useRef(getValuation);
  getValuationRef.current = getValuation;

  useEffect(() => {
    const fetchPortfolio = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: holdings } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .eq('user_id', user.id)
        .order('quantity', { ascending: false });

      if (holdings && holdings.length > 0) {
        const positions: Position[] = holdings.map(h => {
          const val = getValuationRef.current(h.symbol, Number(h.quantity));
          const meta = ASSET_META[h.symbol] || { sector: 'Other', assetClass: 'crypto' as const, region: 'Global' };
          const storedValuePerUnit = Number(h.quantity) > 0 && Number(h.value_usd) > 0
            ? Number(h.value_usd) / Number(h.quantity)
            : val.priceUsd;
          return {
            symbol: h.symbol,
            name: h.name || h.symbol,
            quantity: Number(h.quantity),
            avgCost: storedValuePerUnit,
            currentPrice: val.priceUsd,
            sector: meta.sector,
            assetClass: meta.assetClass,
            region: meta.region,
          };
        });
        setPortfolio(positions);
      }
      setLoading(false);
    };
    fetchPortfolio();
  }, []); // Only fetch once on mount — prices update via live feeds

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (portfolio.length === 0) {
    return (
      <Card className="p-12 text-center">
        <PieChartIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No Holdings Yet</h3>
        <p className="text-muted-foreground">Claim tokens from the Faucet or deposit funds to see your portfolio here.</p>
      </Card>
    );
  }

  const totalValue = portfolio.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);
  const totalCost = portfolio.reduce((sum, p) => sum + p.quantity * p.avgCost, 0);
  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

  const sectorData = portfolio.reduce((acc, p) => {
    const value = p.quantity * p.currentPrice;
    const existing = acc.find(s => s.name === p.sector);
    if (existing) existing.value += value;
    else acc.push({ name: p.sector, value });
    return acc;
  }, [] as { name: string; value: number }[]);

  const assetClassData = portfolio.reduce((acc, p) => {
    const value = p.quantity * p.currentPrice;
    const existing = acc.find(s => s.name === p.assetClass);
    if (existing) existing.value += value;
    else acc.push({ name: p.assetClass, value });
    return acc;
  }, [] as { name: string; value: number }[]);

  const regionData = portfolio.reduce((acc, p) => {
    const value = p.quantity * p.currentPrice;
    const existing = acc.find(s => s.name === p.region);
    if (existing) existing.value += value;
    else acc.push({ name: p.region, value });
    return acc;
  }, [] as { name: string; value: number }[]);

  const pnlByPosition = portfolio
    .map(p => ({
      symbol: p.symbol,
      pnl: (p.currentPrice - p.avgCost) * p.quantity,
      pnlPercent: p.avgCost > 0 ? ((p.currentPrice - p.avgCost) / p.avgCost) * 100 : 0,
    }))
    .sort((a, b) => b.pnl - a.pnl);

  const formatCurrency = (v: number) => formatUsdValue(v);
  const formatPercent = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Portfolio Value</p>
            <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Total P&L</p>
            <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
              {formatCurrency(Math.abs(totalPnL))}
            </p>
            <p className={`text-xs ${totalPnL >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
              {formatPercent(totalPnLPercent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Positions</p>
            <p className="text-2xl font-bold">{portfolio.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Sectors</p>
            <p className="text-2xl font-bold">{sectorData.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

      {/* P&L Attribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            P&L by Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pnlByPosition} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} />
              <YAxis dataKey="symbol" type="category" width={50} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="pnl" name="P&L">
                {pnlByPosition.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? 'hsl(162,91%,32%)' : 'hsl(355,88%,58%)'} />
                ))}
              </Bar>
            </BarChart>
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
                  <th className="text-left py-2">Asset</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">USD Value</th>
                  <th className="text-right">USDT Value</th>
                  <th className="text-right">P&L</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map(p => {
                  const value = p.quantity * p.currentPrice;
                  const pnl = (p.currentPrice - p.avgCost) * p.quantity;
                  const pnlPct = p.avgCost > 0 ? ((p.currentPrice - p.avgCost) / p.avgCost) * 100 : 0;
                  return (
                    <tr key={p.symbol} className="border-b hover:bg-secondary/30">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{p.symbol}</span>
                          <span className="text-xs text-muted-foreground">{p.name}</span>
                        </div>
                      </td>
                      <td className="text-right font-mono">{p.quantity.toFixed(p.quantity < 1 ? 4 : 2)}</td>
                      <td className="text-right font-mono">{formatCurrency(p.currentPrice)}</td>
                      <td className="text-right font-mono">{formatCurrency(value)}</td>
                      <td className="text-right font-mono">{formatCurrency(value)}</td>
                      <td className={`text-right font-mono ${pnl >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
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
