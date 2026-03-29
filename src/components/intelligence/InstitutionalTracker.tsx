import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2, TrendingUp, TrendingDown, Search, ExternalLink,
  User, Briefcase, Calendar, DollarSign, ArrowUpRight, ArrowDownRight, Filter
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

interface Form13F {
  id: string;
  institution: string;
  aum: number;
  topHoldings: { symbol: string; value: number; change: number }[];
  newPositions: string[];
  exitedPositions: string[];
  filingDate: Date;
}

const InstitutionalTracker = () => {
  const [insiderTrades, setInsiderTrades] = useState<InsiderTrade[]>([]);
  const [filings, setFilings] = useState<Form13F[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'buys' | 'sells'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [tradesRes, filingsRes] = await Promise.all([
        supabase.from("insider_trades").select("*").order("trade_date", { ascending: false }).limit(50),
        supabase.from("institutional_filings").select("*").order("filing_date", { ascending: false }).limit(20),
      ]);

      if (tradesRes.data) {
        setInsiderTrades(tradesRes.data.map((t: any) => ({
          id: t.id,
          company: t.company,
          symbol: t.symbol,
          insider: t.insider_name,
          title: t.insider_title,
          type: t.trade_type as 'buy' | 'sell',
          shares: t.shares,
          price: Number(t.price),
          value: Number(t.value),
          date: new Date(t.trade_date),
          ownership: Number(t.ownership_percent),
        })));
      }

      if (filingsRes.data) {
        setFilings(filingsRes.data.map((f: any) => ({
          id: f.id,
          institution: f.institution,
          aum: Number(f.aum_billions),
          topHoldings: (f.top_holdings as any[]) || [],
          newPositions: f.new_positions || [],
          exitedPositions: f.exited_positions || [],
          filingDate: new Date(f.filing_date),
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const filteredTrades = insiderTrades.filter(t => {
    if (filter === 'buys' && t.type !== 'buy') return false;
    if (filter === 'sells' && t.type !== 'sell') return false;
    if (search && !t.symbol.includes(search.toUpperCase()) && !t.insider.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalBuys = insiderTrades.filter(t => t.type === 'buy').reduce((s, t) => s + t.value, 0);
  const totalSells = insiderTrades.filter(t => t.type === 'sell').reduce((s, t) => s + t.value, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <ArrowUpRight className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Insider Buys</p>
              <p className="text-xl font-bold text-green-500">${(totalBuys / 1e6).toFixed(1)}M</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <ArrowDownRight className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">Insider Sells</p>
              <p className="text-xl font-bold text-red-500">${(totalSells / 1e6).toFixed(1)}M</p>
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">13F Filings</p>
              <p className="text-xl font-bold">{filings.length}</p>
            </div>
          </div>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="insider" className="space-y-4">
        <TabsList>
          <TabsTrigger value="insider">Insider Trades</TabsTrigger>
          <TabsTrigger value="13f">13F Filings</TabsTrigger>
        </TabsList>

        <TabsContent value="insider" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by symbol or insider..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>
            <div className="flex gap-1">
              {(['all', 'buys', 'sells'] as const).map(f => (
                <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="capitalize text-xs">{f}</Button>
              ))}
            </div>
          </div>

          {loading ? (
            <p className="text-center text-muted-foreground py-8">Loading insider trades...</p>
          ) : filteredTrades.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No insider trades recorded</p>
              <p className="text-sm">SEC filing data will appear here as it is ingested.</p>
            </CardContent></Card>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filteredTrades.map(trade => (
                  <Card key={trade.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${trade.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                            {trade.type === 'buy' ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{trade.symbol}</Badge>
                              <span className="font-semibold text-sm">{trade.insider}</span>
                              <span className="text-xs text-muted-foreground">({trade.title})</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {trade.shares.toLocaleString()} shares @ ${trade.price.toFixed(2)} • {trade.company}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${trade.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                            ${(trade.value / 1e6).toFixed(2)}M
                          </p>
                          <p className="text-xs text-muted-foreground">{trade.date.toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="13f" className="space-y-4">
          {filings.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No 13F filings recorded</p>
              <p className="text-sm">Institutional filing data will appear here as it is ingested.</p>
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filings.map(filing => (
                <Card key={filing.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {filing.institution}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      AUM: ${filing.aum.toFixed(1)}B • Filed: {filing.filingDate.toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Top Holdings</p>
                      {filing.topHoldings.map((h: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <Badge variant="secondary" className="text-xs">{h.symbol}</Badge>
                          <span>${h.value?.toFixed(1)}B</span>
                          <span className={h.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                            {h.change >= 0 ? '+' : ''}{h.change?.toFixed(1)}%
                          </span>
                        </div>
                      ))}
                      {filing.newPositions.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-green-500">New: {filing.newPositions.join(', ')}</p>
                        </div>
                      )}
                      {filing.exitedPositions.length > 0 && (
                        <div>
                          <p className="text-xs text-red-500">Exited: {filing.exitedPositions.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstitutionalTracker;
