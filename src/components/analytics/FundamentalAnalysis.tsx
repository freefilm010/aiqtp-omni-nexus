import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";
import {
  Search,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Calculator,
  Award,
  Target,
  Building2,
  Users,
  Percent,
  Calendar,
  ExternalLink,
  Star
} from "lucide-react";

interface StockFundamentals {
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  pe: number;
  forwardPe: number;
  peg: number;
  ps: number;
  pb: number;
  evEbitda: number;
  revenue: number;
  revenueGrowth: number;
  eps: number;
  epsGrowth: number;
  profit: number;
  profitMargin: number;
  roe: number;
  roa: number;
  debtEquity: number;
  currentRatio: number;
  dividendYield: number;
  payoutRatio: number;
  beta: number;
  avgVolume: number;
  shortInterest: number;
  institutionalOwnership: number;
  insiderOwnership: number;
  analystRating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  targetPrice: number;
  earningsDate: string;
  sector: string;
  industry: string;
}

interface EarningsData {
  quarter: string;
  epsActual: number;
  epsEstimate: number;
  revenueActual: number;
  revenueEstimate: number;
  surprise: number;
}

const generateFundamentals = (symbol: string): StockFundamentals => {
  const baseData: Record<string, Partial<StockFundamentals>> = {
    'NVDA': { name: 'NVIDIA Corporation', price: 875, marketCap: 2150, pe: 65, sector: 'Technology', industry: 'Semiconductors' },
    'AAPL': { name: 'Apple Inc.', price: 195, marketCap: 3000, pe: 28, sector: 'Technology', industry: 'Consumer Electronics' },
    'MSFT': { name: 'Microsoft Corporation', price: 420, marketCap: 3100, pe: 35, sector: 'Technology', industry: 'Software' },
    'GOOGL': { name: 'Alphabet Inc.', price: 175, marketCap: 2200, pe: 25, sector: 'Communication', industry: 'Internet' },
    'AMZN': { name: 'Amazon.com Inc.', price: 185, marketCap: 1900, pe: 55, sector: 'Consumer', industry: 'E-Commerce' },
    'TSLA': { name: 'Tesla Inc.', price: 248, marketCap: 790, pe: 70, sector: 'Consumer', industry: 'Automotive' },
    'META': { name: 'Meta Platforms Inc.', price: 520, marketCap: 1350, pe: 27, sector: 'Communication', industry: 'Social Media' },
    'BRK.B': { name: 'Berkshire Hathaway', price: 410, marketCap: 880, pe: 12, sector: 'Financials', industry: 'Insurance' },
  };

  const base = baseData[symbol] || { name: symbol, price: 100, marketCap: 50, pe: 20, sector: 'Unknown', industry: 'Unknown' };

  // Deterministic seed from symbol name
  const symbolSeed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const s = (offset: number) => Math.abs(Math.sin(symbolSeed * 0.1 + offset * 1.618));

  return {
    symbol,
    name: base.name || symbol,
    price: base.price || 100,
    marketCap: base.marketCap || 50,
    pe: base.pe || 20,
    forwardPe: (base.pe || 20) * 0.85,
    peg: 1.2 + s(1) * 1.5,
    ps: 3 + s(2) * 10,
    pb: 2 + s(3) * 15,
    evEbitda: 10 + s(4) * 30,
    revenue: 50 + s(5) * 300,
    revenueGrowth: -10 + s(6) * 50,
    eps: 2 + s(7) * 15,
    epsGrowth: -20 + s(8) * 80,
    profit: 5 + s(9) * 50,
    profitMargin: 5 + s(10) * 35,
    roe: 10 + s(11) * 40,
    roa: 5 + s(12) * 20,
    debtEquity: 0.1 + s(13) * 2,
    currentRatio: 0.8 + s(14) * 2,
    dividendYield: s(15) * 4,
    payoutRatio: s(16) * 60,
    beta: 0.5 + s(17) * 1.5,
    avgVolume: 10 + s(18) * 100,
    shortInterest: 1 + s(19) * 15,
    institutionalOwnership: 50 + s(20) * 40,
    insiderOwnership: 1 + s(21) * 20,
    analystRating: (['Strong Buy', 'Buy', 'Hold', 'Sell'] as const)[Math.floor(s(22) * 4)],
    targetPrice: (base.price || 100) * (1 + (s(23) - 0.3) * 0.3),
    earningsDate: new Date(Date.now() + s(24) * 90 * 86400000).toLocaleDateString(),
    sector: base.sector || 'Unknown',
    industry: base.industry || 'Unknown',
  };
};

const generateEarningsHistory = (symbol: string): EarningsData[] => {
  const symbolSeed = symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const s = (qi: number, offset: number) => Math.abs(Math.sin(symbolSeed * 0.1 + qi * 2.718 + offset));

  const quarters = ['Q1 2024', 'Q4 2023', 'Q3 2023', 'Q2 2023', 'Q1 2023', 'Q4 2022', 'Q3 2022', 'Q2 2022'];
  return quarters.map((quarter, qi) => {
    const epsEstimate = 2 + s(qi, 1) * 3;
    const revenueEstimate = 20 + s(qi, 2) * 50;
    const beatEps = s(qi, 3) > 0.3;
    const beatRev = s(qi, 4) > 0.35;
    return {
      quarter,
      epsEstimate,
      epsActual: epsEstimate * (beatEps ? 1 + s(qi, 5) * 0.15 : 1 - s(qi, 6) * 0.1),
      revenueEstimate,
      revenueActual: revenueEstimate * (beatRev ? 1 + s(qi, 7) * 0.08 : 1 - s(qi, 8) * 0.05),
      surprise: beatEps ? s(qi, 9) * 15 : -s(qi, 10) * 10
    };
  });
};

const WATCHLIST = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'BRK.B'];

const FundamentalAnalysis = () => {
  const [searchSymbol, setSearchSymbol] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('NVDA');
  const [fundamentals, setFundamentals] = useState<StockFundamentals | null>(null);
  const [earningsHistory, setEarningsHistory] = useState<EarningsData[]>([]);
  const [revenueHistory, setRevenueHistory] = useState<any[]>([]);

  useEffect(() => {
    setFundamentals(generateFundamentals(selectedSymbol));
    setEarningsHistory(generateEarningsHistory(selectedSymbol));
    setRevenueHistory([
      { year: '2019', revenue: 100, profit: 20 },
      { year: '2020', revenue: 120, profit: 25 },
      { year: '2021', revenue: 150, profit: 35 },
      { year: '2022', revenue: 180, profit: 42 },
      { year: '2023', revenue: 220, profit: 55 },
      { year: '2024E', revenue: 280, profit: 75 },
    ]);
  }, [selectedSymbol]);

  const handleSearch = () => {
    if (searchSymbol) setSelectedSymbol(searchSymbol.toUpperCase());
  };

  if (!fundamentals) return null;

  const getRatingColor = (rating: string) => {
    if (rating.includes('Strong Buy') || rating.includes('Buy')) return 'text-green-500';
    if (rating.includes('Hold')) return 'text-amber-500';
    return 'text-red-500';
  };

  const formatValue = (v: number, suffix = '') => {
    if (v >= 1000) return `$${(v / 1000).toFixed(1)}T${suffix}`;
    if (v >= 1) return `$${v.toFixed(1)}B${suffix}`;
    return `$${(v * 1000).toFixed(0)}M${suffix}`;
  };

  const upside = ((fundamentals.targetPrice - fundamentals.price) / fundamentals.price * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Search & Quick Select */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter symbol..."
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-32"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {WATCHLIST.map(sym => (
                <Button
                  key={sym}
                  variant={selectedSymbol === sym ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSymbol(sym)}
                >
                  {sym}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{fundamentals.symbol}</h2>
                <Badge variant="outline">{fundamentals.sector}</Badge>
                <Badge variant="secondary">{fundamentals.industry}</Badge>
              </div>
              <p className="text-muted-foreground">{fundamentals.name}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">${fundamentals.price.toFixed(2)}</p>
              <div className="flex items-center gap-2 justify-end mt-1">
                <Badge className={getRatingColor(fundamentals.analystRating)}>
                  {fundamentals.analystRating}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <span className="font-bold">${fundamentals.targetPrice.toFixed(0)}</span>
                <Badge className={parseFloat(upside) > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                  {parseFloat(upside) > 0 ? '+' : ''}{upside}%
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Market Cap</p>
            <p className="text-xl font-bold">{formatValue(fundamentals.marketCap)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">P/E Ratio</p>
            <p className="text-xl font-bold">{fundamentals.pe.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Forward P/E</p>
            <p className="text-xl font-bold">{fundamentals.forwardPe.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">PEG Ratio</p>
            <p className="text-xl font-bold">{fundamentals.peg.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">EV/EBITDA</p>
            <p className="text-xl font-bold">{fundamentals.evEbitda.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-xs text-muted-foreground">Beta</p>
            <p className="text-xl font-bold">{fundamentals.beta.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="financials">
        <TabsList>
          <TabsTrigger value="financials">Financials</TabsTrigger>
          <TabsTrigger value="valuation">Valuation</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="ownership">Ownership</TabsTrigger>
        </TabsList>

        <TabsContent value="financials" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Revenue & Profit Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueHistory}>
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}B`} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
                    <Bar dataKey="profit" fill="#10b981" name="Net Income" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Key Financials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Revenue (TTM)</span>
                    <span className="font-bold">{formatValue(fundamentals.revenue)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Revenue Growth</span>
                    <Badge className={fundamentals.revenueGrowth > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                      {fundamentals.revenueGrowth > 0 ? '+' : ''}{fundamentals.revenueGrowth.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">EPS (TTM)</span>
                    <span className="font-bold">${fundamentals.eps.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">EPS Growth</span>
                    <Badge className={fundamentals.epsGrowth > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                      {fundamentals.epsGrowth > 0 ? '+' : ''}{fundamentals.epsGrowth.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Profit Margin</span>
                    <span className="font-bold">{fundamentals.profitMargin.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">ROE</span>
                    <span className="font-bold">{fundamentals.roe.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Debt/Equity</span>
                    <span className="font-bold">{fundamentals.debtEquity.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="valuation" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Valuation Multiples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">P/E Ratio</p>
                  <p className="text-2xl font-bold">{fundamentals.pe.toFixed(1)}</p>
                  <Progress value={Math.min(fundamentals.pe / 50 * 100, 100)} />
                  <p className="text-xs text-muted-foreground">Sector Avg: 25</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">P/S Ratio</p>
                  <p className="text-2xl font-bold">{fundamentals.ps.toFixed(1)}</p>
                  <Progress value={Math.min(fundamentals.ps / 15 * 100, 100)} />
                  <p className="text-xs text-muted-foreground">Sector Avg: 5</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">P/B Ratio</p>
                  <p className="text-2xl font-bold">{fundamentals.pb.toFixed(1)}</p>
                  <Progress value={Math.min(fundamentals.pb / 20 * 100, 100)} />
                  <p className="text-xs text-muted-foreground">Sector Avg: 4</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">EV/EBITDA</p>
                  <p className="text-2xl font-bold">{fundamentals.evEbitda.toFixed(1)}</p>
                  <Progress value={Math.min(fundamentals.evEbitda / 40 * 100, 100)} />
                  <p className="text-xs text-muted-foreground">Sector Avg: 15</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Earnings History
                </CardTitle>
                <Badge variant="outline">
                  Next: {fundamentals.earningsDate}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={earningsHistory}>
                  <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="epsEstimate" fill="#6b7280" name="EPS Est" />
                  <Bar dataKey="epsActual" fill="#10b981" name="EPS Act" />
                </BarChart>
              </ResponsiveContainer>
              <ScrollArea className="h-[200px] mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Quarter</th>
                      <th className="text-right">EPS Est</th>
                      <th className="text-right">EPS Act</th>
                      <th className="text-right">Surprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earningsHistory.map(e => (
                      <tr key={e.quarter} className="border-b">
                        <td className="py-2">{e.quarter}</td>
                        <td className="text-right font-mono">${e.epsEstimate.toFixed(2)}</td>
                        <td className="text-right font-mono">${e.epsActual.toFixed(2)}</td>
                        <td className={`text-right ${e.surprise > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {e.surprise > 0 ? '+' : ''}{e.surprise.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ownership" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Institutional Ownership
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Institutional</span>
                      <span className="font-bold">{fundamentals.institutionalOwnership.toFixed(1)}%</span>
                    </div>
                    <Progress value={fundamentals.institutionalOwnership} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Insider</span>
                      <span className="font-bold">{fundamentals.insiderOwnership.toFixed(1)}%</span>
                    </div>
                    <Progress value={fundamentals.insiderOwnership} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Short Interest</span>
                      <span className="font-bold">{fundamentals.shortInterest.toFixed(1)}%</span>
                    </div>
                    <Progress value={fundamentals.shortInterest} className="[&>div]:bg-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Dividend Info
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Dividend Yield</span>
                    <span className="font-bold text-lg">{fundamentals.dividendYield.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Payout Ratio</span>
                    <span className="font-bold">{fundamentals.payoutRatio.toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Annual Dividend</span>
                    <span className="font-bold">${(fundamentals.price * fundamentals.dividendYield / 100).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FundamentalAnalysis;
