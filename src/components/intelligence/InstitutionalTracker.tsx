import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Search,
  ExternalLink,
  User,
  Briefcase,
  Calendar,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";

interface InsiderTrade {
  id: string;
  company: string;
  symbol: string;
  insider: string;
  title: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  value: number;
  date: Date;
  ownership: number;
}

interface InstitutionalHolding {
  id: string;
  institution: string;
  aum: number;
  symbol: string;
  shares: number;
  value: number;
  change: number;
  changePercent: number;
  filingDate: Date;
  quarterEnd: string;
}

interface Form13F {
  id: string;
  institution: string;
  aum: number;
  topHoldings: { symbol: string; value: number; change: number }[];
  newPositions: string[];
  exitedPositions: string[];
  filingDate: Date;
}

const INSTITUTIONS = [
  'Berkshire Hathaway', 'Bridgewater Associates', 'Renaissance Technologies', 
  'Two Sigma', 'Citadel', 'DE Shaw', 'Millennium', 'Point72', 'Tiger Global',
  'Coatue Management', 'Viking Global', 'Third Point', 'Baupost Group'
];

const INSIDERS = [
  { name: 'Elon Musk', title: 'CEO', company: 'Tesla' },
  { name: 'Jensen Huang', title: 'CEO', company: 'NVIDIA' },
  { name: 'Tim Cook', title: 'CEO', company: 'Apple' },
  { name: 'Satya Nadella', title: 'CEO', company: 'Microsoft' },
  { name: 'Mark Zuckerberg', title: 'CEO', company: 'Meta' },
  { name: 'Andy Jassy', title: 'CEO', company: 'Amazon' },
  { name: 'Sundar Pichai', title: 'CEO', company: 'Alphabet' },
];

const generateInsiderTrades = (): InsiderTrade[] => {
  const trades: InsiderTrade[] = [];
  const symbols = ['TSLA', 'NVDA', 'AAPL', 'MSFT', 'META', 'AMZN', 'GOOGL', 'AMD', 'CRM', 'NFLX'];
  
  for (let i = 0; i < 20; i++) {
    const insider = INSIDERS[Math.floor(Math.random() * INSIDERS.length)];
    const isBuy = Math.random() > 0.6;
    const shares = Math.floor(1000 + Math.random() * 100000);
    const price = 50 + Math.random() * 400;
    
    trades.push({
      id: `insider-${i}`,
      company: insider.company,
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      insider: insider.name,
      title: insider.title,
      type: isBuy ? 'buy' : 'sell',
      shares,
      price,
      value: shares * price,
      date: new Date(Date.now() - Math.random() * 7 * 86400000),
      ownership: 0.1 + Math.random() * 5
    });
  }
  
  return trades.sort((a, b) => b.value - a.value);
};

const generate13Fs = (): Form13F[] => {
  return INSTITUTIONS.slice(0, 8).map((inst, i) => ({
    id: `13f-${i}`,
    institution: inst,
    aum: 10 + Math.random() * 200,
    topHoldings: [
      { symbol: 'AAPL', value: 5 + Math.random() * 20, change: (Math.random() - 0.5) * 30 },
      { symbol: 'MSFT', value: 4 + Math.random() * 15, change: (Math.random() - 0.5) * 30 },
      { symbol: 'NVDA', value: 3 + Math.random() * 12, change: (Math.random() - 0.5) * 50 },
      { symbol: 'GOOGL', value: 2 + Math.random() * 10, change: (Math.random() - 0.5) * 20 },
      { symbol: 'META', value: 2 + Math.random() * 8, change: (Math.random() - 0.5) * 25 },
    ],
    newPositions: ['SMCI', 'ARM', 'PLTR'].slice(0, Math.floor(Math.random() * 3) + 1),
    exitedPositions: ['BABA', 'NIO'].slice(0, Math.floor(Math.random() * 2)),
    filingDate: new Date(Date.now() - Math.random() * 30 * 86400000)
  }));
};

const InstitutionalTracker = () => {
  const [insiderTrades, setInsiderTrades] = useState<InsiderTrade[]>([]);
  const [filings, setFilings] = useState<Form13F[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'buys' | 'sells'>('all');

  useEffect(() => {
    setInsiderTrades(generateInsiderTrades());
    setFilings(generate13Fs());
  }, []);

  const filteredTrades = insiderTrades.filter(t => {
    if (filter === 'buys' && t.type !== 'buy') return false;
    if (filter === 'sells' && t.type !== 'sell') return false;
    if (search && !t.symbol.includes(search.toUpperCase()) && !t.insider.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalBuys = insiderTrades.filter(t => t.type === 'buy').reduce((s, t) => s + t.value, 0);
  const totalSells = insiderTrades.filter(t => t.type === 'sell').reduce((s, t) => s + t.value, 0);

  const formatValue = (v: number) => v >= 1000000000 ? `$${(v/1000000000).toFixed(1)}B` : v >= 1000000 ? `$${(v/1000000).toFixed(1)}M` : `$${(v/1000).toFixed(0)}K`;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Insider Buys (7d)</p>
                <p className="text-xl font-bold text-green-500">{formatValue(totalBuys)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xs text-muted-foreground">Insider Sells (7d)</p>
                <p className="text-xl font-bold text-red-500">{formatValue(totalSells)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">13F Filings</p>
                <p className="text-xl font-bold">{filings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total AUM Tracked</p>
                <p className="text-xl font-bold">{formatValue(filings.reduce((s, f) => s + f.aum * 1000000000, 0))}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="insiders">
        <TabsList>
          <TabsTrigger value="insiders">Form 4 (Insider Trades)</TabsTrigger>
          <TabsTrigger value="13f">13F Filings (Institutions)</TabsTrigger>
        </TabsList>

        <TabsContent value="insiders" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle>Insider Trading Activity</CardTitle>
                  <CardDescription>SEC Form 4 filings from executives and directors</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search symbol or name..."
                      className="pl-8 w-48"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1">
                    {(['all', 'buys', 'sells'] as const).map(f => (
                      <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[450px]">
                <div className="space-y-2">
                  {filteredTrades.map(trade => (
                    <div key={trade.id} className="p-4 border rounded-lg flex items-center justify-between hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <Badge className={trade.type === 'buy' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                          {trade.type === 'buy' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {trade.type.toUpperCase()}
                        </Badge>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{trade.symbol}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm">{trade.insider}</span>
                            <Badge variant="outline" className="text-xs">{trade.title}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {trade.shares.toLocaleString()} shares @ ${trade.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatValue(trade.value)}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Calendar className="h-3 w-3" />
                          {trade.date.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="13f" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filings.map(filing => (
              <Card key={filing.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{filing.institution}</CardTitle>
                      <CardDescription>AUM: ${filing.aum.toFixed(0)}B • Filed: {filing.filingDate.toLocaleDateString()}</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium mb-2">Top Holdings</p>
                      <div className="space-y-1">
                        {filing.topHoldings.map(h => (
                          <div key={h.symbol} className="flex items-center justify-between text-sm">
                            <span className="font-mono">{h.symbol}</span>
                            <div className="flex items-center gap-2">
                              <span>${h.value.toFixed(1)}B</span>
                              <Badge className={h.change > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                                {h.change > 0 ? '+' : ''}{h.change.toFixed(0)}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      {filing.newPositions.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">New: </span>
                          <span className="text-green-500">{filing.newPositions.join(', ')}</span>
                        </div>
                      )}
                      {filing.exitedPositions.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Exited: </span>
                          <span className="text-red-500">{filing.exitedPositions.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstitutionalTracker;
