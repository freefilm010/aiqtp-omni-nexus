import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, TrendingUp, DollarSign, Shield, Zap, Globe, Flame, Bot, Copy } from "lucide-react";
import { Twitter } from "@/lib/icons/brand-icons";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const ViralLanding = () => {
  const navigate = useNavigate();

  const { data: liveStats, isLoading } = useQuery({
    queryKey: ["viral-landing-live-stats"],
    queryFn: async () => {
      const [strategiesRes, rentalsRes, usersRes, tokensRes, pricesRes, txRes, blocksRes, agentsRes] = await Promise.all([
        supabase
          .from("ai_strategies")
          .select("profitability_score, consistency_score", { count: "exact" })
          .eq("is_graduated", true)
          .eq("is_available_for_rent", true)
          .eq("admin_approved", true),
        supabase.from("strategy_rentals").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("platform_tokens").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("market_prices").select("last_updated").order("last_updated", { ascending: false }).limit(1),
        supabase.from("qtc_transactions").select("id", { count: "exact", head: true }),
        supabase.from("qtc_blocks").select("block_height, created_at").order("block_height", { ascending: false }).limit(1),
        supabase.from("agent_heartbeats").select("id", { count: "exact", head: true }).eq("status", "active"),
      ]);

      const strategies = strategiesRes.data ?? [];
      const avgProfitability = strategies.length
        ? strategies.reduce((sum, row) => sum + Number(row.profitability_score ?? 0), 0) / strategies.length
        : 0;
      const avgConsistency = strategies.length
        ? strategies.reduce((sum, row) => sum + Number(row.consistency_score ?? 0), 0) / strategies.length
        : 0;
      const latestPriceSync = pricesRes.data?.[0]?.last_updated ?? null;
      const latestBlock = blocksRes.data?.[0] ?? null;

      return {
        strategyCount: strategiesRes.count ?? strategies.length,
        activeRentals: rentalsRes.count ?? 0,
        registeredProfiles: usersRes.count ?? 0,
        activeTokens: tokensRes.count ?? 0,
        qtcTransactions: txRes.count ?? 0,
        activeAgents: agentsRes.count ?? 0,
        avgProfitability,
        avgConsistency,
        latestPriceSync,
        latestBlockHeight: Number(latestBlock?.block_height ?? 0),
        latestBlockAt: latestBlock?.created_at ?? null,
      };
    },
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

  const statCards = useMemo(() => [
    { key: "validated strategies", val: formatNumber(liveStats?.strategyCount ?? 0) },
    { key: "active rentals", val: formatNumber(liveStats?.activeRentals ?? 0) },
    { key: "profiles", val: formatNumber(liveStats?.registeredProfiles ?? 0) },
    { key: "active tokens", val: formatNumber(liveStats?.activeTokens ?? 0) },
    { key: "QTC tx", val: formatNumber(liveStats?.qtcTransactions ?? 0) },
    { key: "QTC height", val: formatNumber(liveStats?.latestBlockHeight ?? 0) },
  ], [liveStats]);

  const shareText = `AIQTP live platform snapshot\n\nValidated strategies: ${liveStats?.strategyCount ?? 0}\nActive rentals: ${liveStats?.activeRentals ?? 0}\nQTC transactions: ${liveStats?.qtcTransactions ?? 0}\n\nhttps://www.aiqtp.com`;

  const share = (platform: string) => {
    const urls: Record<string, string> = {
      twitter: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      copy: "",
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied live platform snapshot.");
      return;
    }
    window.open(urls[platform], "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-primary/10 border-b border-primary/20 py-2 px-4 text-center">
        <p className="text-sm text-foreground">
          <Flame className="h-4 w-4 inline mr-1 text-primary" />
          <span className="font-bold">Live database</span> {isLoading ? "syncing" : "synced"}
          <Button variant="link" className="text-primary ml-2 p-0 h-auto" onClick={() => navigate("/auth")}>Access Platform →</Button>
        </p>
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/10" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <TrendingUp className="h-3 w-3 mr-1" /> Avg validation {formatPercent(liveStats?.avgProfitability ?? 0)}
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4">
            AIQTP <span className="text-primary">Live Platform</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Strategy marketplace, QTC ledger, platform tokens, and agent telemetry shown from live backend records only.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
              <Rocket className="h-5 w-5 mr-2" /> Access Account
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate("/marketplace")}>
              <DollarSign className="h-5 w-5 mr-2" /> View Marketplace
            </Button>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {statCards.map(({ key, val }) => (
              <Card key={key}>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-primary">{val}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{key}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-2">Live Validation Snapshot</h2>
        <p className="text-center text-muted-foreground mb-6 text-sm">Values refresh from backend records every 5 seconds.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: "Strategy Quality", metric: formatPercent(liveStats?.avgConsistency ?? 0), detail: "Average consistency score" },
            { title: "Market Data", metric: liveStats?.latestPriceSync ? new Date(liveStats.latestPriceSync).toLocaleTimeString() : "No feed", detail: "Latest price-feed timestamp" },
            { title: "Agent Telemetry", metric: formatNumber(liveStats?.activeAgents ?? 0), detail: "Active agent heartbeats" },
          ].map((item) => (
            <Card key={item.title} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <p className="text-lg font-bold text-primary">{item.metric}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-6">System Truth Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: Bot, title: "AI Agents", desc: `${formatNumber(liveStats?.activeAgents ?? 0)} active heartbeat records` },
            { icon: Shield, title: "QTC Ledger", desc: `${formatNumber(liveStats?.qtcTransactions ?? 0)} recorded transactions` },
            { icon: Globe, title: "Token Registry", desc: `${formatNumber(liveStats?.activeTokens ?? 0)} active platform tokens` },
            { icon: Zap, title: "Latest Block", desc: `Height ${formatNumber(liveStats?.latestBlockHeight ?? 0)}` },
          ].map((f) => (
            <Card key={f.title}>
              <CardContent className="p-4 flex items-center gap-3">
                <f.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-bold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="p-8">
            <h3 className="text-3xl font-black text-foreground mb-2">Review Live Data</h3>
            <p className="text-muted-foreground mb-6">No fabricated ROI, testimonials, or user counters are displayed on this page.</p>
            <Button size="lg" className="text-lg px-12 py-6 mb-4" onClick={() => navigate("/portfolio")}>
              <Rocket className="h-5 w-5 mr-2" /> Open Portfolio
            </Button>
            <div className="flex justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => share("twitter")}>
                <Twitter className="h-4 w-4 mr-1" /> Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => share("copy")}>
                <Copy className="h-4 w-4 mr-1" /> Copy Snapshot
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViralLanding;
