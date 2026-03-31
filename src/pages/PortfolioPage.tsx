import { lazy, Suspense, useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, BarChart3, Wallet, TrendingUp, Coins, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAssetValuation } from "@/hooks/useAssetValuation";

const PortfolioAnalyticsDashboard = lazy(() => import("@/components/portfolio/PortfolioAnalyticsDashboard"));
const MarketHeatmap = lazy(() => import("@/components/analytics/MarketHeatmap"));
const FundamentalAnalysis = lazy(() => import("@/components/analytics/FundamentalAnalysis"));
const CompoundAnalytics = lazy(() => import("@/components/faucet/CompoundAnalytics"));

const FAUCET_CHAIN_TO_SYMBOL: Record<string, string> = {
  "usdc-test": "tUSDC",
  "usdt-test": "tUSDT",
  "dai-test": "tDAI",
  "busd-test": "tBUSD",
  qtc: "QTC",
  aiq: "AIQ",
  nxs: "NXS",
  "eth-test": "tETH",
  "btc-test": "tBTC",
  "sol-test": "tSOL",
  "matic-test": "tMATIC",
  "avax-test": "tAVAX",
  "uni-test": "tUNI",
  "aave-test": "tAAVE",
  "link-test": "tLINK",
};

const TabLoader = () => (
  <div className="flex items-center justify-center h-[400px]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const PortfolioPage = () => {
  const { user } = useAuth();
  const { getValuation } = useAssetValuation();
  const [netWorth, setNetWorth] = useState({ portfolio: 0, faucet: 0, compound: 0, strategies: 0 });
  const [engineId, setEngineId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [holdingsRes, engineRes, claimsRes] = await Promise.all([
        supabase.from("portfolio_holdings").select("symbol, quantity").eq("user_id", user.id) as any,
        supabase.from("auto_invest_engine").select("id, total_deployed, total_profit").limit(1) as any,
        supabase.from("faucet_claims").select("amount, chain").eq("user_id", user.id) as any,
      ]);

      const portfolioVal = (holdingsRes.data || []).reduce(
        (sum: number, holding: { symbol: string; quantity: number | string }) =>
          sum + getValuation(holding.symbol, Number(holding.quantity) || 0).valueUsd,
        0,
      );

      const faucetVal = (claimsRes.data || []).reduce(
        (sum: number, claim: { amount: number | string; chain: string }) => {
          const symbol = FAUCET_CHAIN_TO_SYMBOL[claim.chain] ?? claim.chain.toUpperCase();
          return sum + getValuation(symbol, Number(claim.amount) || 0).valueUsd;
        },
        0,
      );

      const engine = engineRes.data?.[0];
      if (engine) setEngineId(engine.id);

      setNetWorth({
        portfolio: portfolioVal,
        faucet: faucetVal,
        compound: engine ? Number(engine.total_deployed || 0) + Number(engine.total_profit || 0) : 0,
        strategies: 0,
      });
    };
    load();
  }, [user, getValuation]);

  const total = netWorth.portfolio;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Portfolio Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Unified view • Faucet earnings • Compound growth • Strategy P&L
          </p>
        </div>

        {/* Net Worth Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Net Worth", value: total, icon: <Wallet className="h-4 w-4" />, color: "text-primary" },
            { label: "Portfolio", value: netWorth.portfolio, icon: <TrendingUp className="h-4 w-4" />, color: "text-green-500" },
            { label: "Faucet Earned", value: netWorth.faucet, icon: <Coins className="h-4 w-4" />, color: "text-amber-500" },
            { label: "Compounding", value: netWorth.compound, icon: <Target className="h-4 w-4" />, color: "text-cyan-500" },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-lg font-bold">${item.value.toFixed(2)}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="portfolio" className="gap-1.5 text-xs">
              <Wallet className="h-3.5 w-3.5" /> Portfolio
            </TabsTrigger>
            <TabsTrigger value="compound" className="gap-1.5 text-xs">
              <Target className="h-3.5 w-3.5" /> Compound
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="gap-1.5 text-xs">
              <LayoutGrid className="h-3.5 w-3.5" /> Heatmaps
            </TabsTrigger>
            <TabsTrigger value="fundamentals" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" /> Fundamentals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio">
            <Suspense fallback={<TabLoader />}>
              <PortfolioAnalyticsDashboard />
            </Suspense>
          </TabsContent>

          <TabsContent value="compound">
            <Suspense fallback={<TabLoader />}>
              <CompoundAnalytics userId={user?.id || null} engineId={engineId} />
            </Suspense>
          </TabsContent>

          <TabsContent value="heatmap">
            <Suspense fallback={<TabLoader />}>
              <MarketHeatmap />
            </Suspense>
          </TabsContent>

          <TabsContent value="fundamentals">
            <Suspense fallback={<TabLoader />}>
              <FundamentalAnalysis />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default PortfolioPage;
