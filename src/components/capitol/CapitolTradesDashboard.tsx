import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Landmark,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Building2,
  RefreshCw,
  BarChart3,
  FileText,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const CapitolCommunity = lazy(() => import("./CapitolCommunity"));

interface Trade {
  asset_type?: string;
  id: string;
  politician_name: string;
  party: string;
  chamber: string;
  state: string;
  trade_type: string;
  ticker: string;
  issuer_name: string;
  amount_range: string;
  trade_date: string;
}

interface Politician {
  id: string;
  full_name: string;
  party: string;
  chamber: string;
  state: string;
  total_trades: number;
  total_filings: number;
  total_issuers: number;
  total_volume: string;
  is_featured: boolean;
}

interface Issuer {
  id: string;
  ticker: string;
  issuer_name: string;
  total_trades: number;
  price_change_pct: number;
  current_price: number;
}

const partyColor = (party: string) =>
  party === "Republican"
    ? "text-red-400"
    : party === "Democrat"
    ? "text-blue-400"
    : "text-muted-foreground";

const partyBg = (party: string) =>
  party === "Republican"
    ? "bg-red-500/10 border-red-500/20"
    : party === "Democrat"
    ? "bg-blue-500/10 border-blue-500/20"
    : "bg-muted";

const CapitolTradesDashboard = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [politicians, setPoliticians] = useState<Politician[]>([]);
  const [issuers, setIssuers] = useState<Issuer[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetFilter, setAssetFilter] = useState<"stocks" | "all">("stocks");

  const fetchData = async () => {
    setLoading(true);
    const [tradesRes, politiciansRes, issuersRes] = await Promise.all([
      supabase
        .from("congress_trades")
        .select("*")
        .order("trade_date", { ascending: false })
        .limit(50),
      supabase
        .from("congress_politicians")
        .select("*")
        .eq("is_featured", true)
        .order("total_trades", { ascending: false }),
      supabase
        .from("congress_featured_issuers")
        .select("*")
        .order("total_trades", { ascending: false }),
    ]);

    setTrades((tradesRes.data as Trade[]) || []);
    setPoliticians((politiciansRes.data as Politician[]) || []);
    setIssuers((issuersRes.data as Issuer[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("capitol-trades-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "congress_trades" }, () =>
        fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredTrades =
    assetFilter === "stocks"
      ? trades.filter((t) => t.asset_type === "stock" || !t.asset_type)
      : trades;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Landmark className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Capitol Trades
            </h1>
            <p className="text-sm text-muted-foreground">
              Track stock trades by US Congress members in real time
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main grid – matches Capitol Trades 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN – Latest Trades */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Latest Trades
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={assetFilter === "stocks" ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => setAssetFilter("stocks")}
                  >
                    Stocks
                  </Button>
                  <Button
                    variant={assetFilter === "all" ? "default" : "ghost"}
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => setAssetFilter("all")}
                  >
                    All Assets
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                <div className="divide-y divide-border/40">
                  {filteredTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className="px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] uppercase font-bold px-1.5 py-0 ${
                                trade.trade_type === "buy"
                                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                                  : "text-red-400 border-red-500/30 bg-red-500/10"
                              }`}
                            >
                              {trade.trade_type}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatDistanceToNow(new Date(trade.trade_date), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate">
                            {trade.issuer_name}{" "}
                            <span className="text-muted-foreground font-normal">
                              {trade.ticker}
                            </span>
                          </p>
                          <p className="text-xs mt-0.5">
                            <span className={`font-medium ${partyColor(trade.party || "")}`}>
                              {trade.politician_name}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              · {trade.party} · {trade.chamber} · {trade.state}
                            </span>
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap mt-1">
                          {trade.amount_range}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filteredTrades.length === 0 && !loading && (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      No trades found
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* CENTER COLUMN – Featured Politicians & Issuers */}
        <div className="lg:col-span-5 space-y-6">
          {/* Featured Politicians */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Featured Politicians
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {politicians.map((pol) => (
                  <div
                    key={pol.id}
                    className="px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border ${partyBg(
                            pol.party
                          )}`}
                        >
                          {pol.full_name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {pol.full_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            <span className={partyColor(pol.party)}>{pol.party}</span> ·{" "}
                            {pol.chamber} · {pol.state}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right shrink-0">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {pol.total_trades.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Trades</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {pol.total_filings}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Filings</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {pol.total_issuers}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Issuers</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">
                            {pol.total_volume}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Volume</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Issuers */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Featured Issuers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {issuers.map((iss) => (
                  <div
                    key={iss.id}
                    className="px-4 py-3 hover:bg-accent/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-accent/50 flex items-center justify-center text-xs font-bold text-foreground border border-border/50">
                          {iss.ticker.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{iss.issuer_name}</p>
                          <p className="text-[11px] text-muted-foreground">{iss.ticker}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 text-right">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{iss.total_trades}</p>
                          <p className="text-[10px] text-muted-foreground">Trades</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            ${Number(iss.current_price).toFixed(2)}
                          </p>
                          <div className="flex items-center gap-0.5 justify-end">
                            {Number(iss.price_change_pct) >= 0 ? (
                              <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3 text-red-400" />
                            )}
                            <span
                              className={`text-[11px] font-medium ${
                                Number(iss.price_change_pct) >= 0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {Number(iss.price_change_pct).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN – Stats & Info */}
        <div className="lg:col-span-3 space-y-6">
          {/* Quick Stats */}
          <Card className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Trade Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 text-center">
                  <TrendingUp className="h-5 w-5 text-emerald-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-emerald-400">
                    {trades.filter((t) => t.trade_type === "buy").length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Buys</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-center">
                  <TrendingDown className="h-5 w-5 text-red-400 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-400">
                    {trades.filter((t) => t.trade_type === "sell").length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Sells</p>
                </div>
              </div>
              <div className="bg-accent/30 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{trades.length}</p>
                <p className="text-xs text-muted-foreground">Total Recent Trades</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-accent/30 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{politicians.length}</p>
                  <p className="text-[10px] text-muted-foreground">Politicians</p>
                </div>
                <div className="bg-accent/30 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{issuers.length}</p>
                  <p className="text-[10px] text-muted-foreground">Issuers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Track */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">
                  Why Track Congress Trades?
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Members of Congress are required to disclose stock trades within 45 days under the
                STOCK Act. Tracking these trades can reveal unique insights — politicians sit on
                committees with access to non-public policy information that may affect stock
                valuations.
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Studies show congressional portfolios have historically outperformed the S&P 500,
                making this data valuable for informed investors.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CapitolTradesDashboard;
