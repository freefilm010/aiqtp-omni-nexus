import { lazy, Suspense, useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { LayoutGrid, BarChart3, Wallet, TrendingUp, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAssetValuation } from "@/hooks/useAssetValuation";

const PortfolioAnalyticsDashboard = lazy(() => import("@/components/portfolio/PortfolioAnalyticsDashboard"));
const MarketHeatmap = lazy(() => import("@/components/analytics/MarketHeatmap"));
const FundamentalAnalysis = lazy(() => import("@/components/analytics/FundamentalAnalysis"));


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
  const [netWorth, setNetWorth] = useState({ portfolio: 0, faucetLifetime: 0, assetCount: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Portfolio holdings = the single source of truth for current balances
      const { data: holdings } = await supabase
        .from("portfolio_holdings")
        .select("symbol, quantity")
        .eq("user_id", user.id) as any;

      const activeHoldings = (holdings || []).filter(
        (holding: { quantity: number | string }) => (Number(holding.quantity) || 0) > 0,
      );

      const portfolioVal = activeHoldings.reduce(
        (sum: number, h: { symbol: string; quantity: number | string }) =>
          sum + getValuation(h.symbol, Number(h.quantity) || 0).valueUsd,
        0,
      );

      // Faucet lifetime: informational only (already included in portfolio_holdings)
      const { data: claims } = await supabase
        .from("faucet_claims")
        .select("amount, chain")
        .eq("user_id", user.id) as any;

      const faucetLifetime = (claims || []).reduce(
        (sum: number, c: { amount: number | string; chain: string }) => {
          const symbol = FAUCET_CHAIN_TO_SYMBOL[c.chain] ?? c.chain.toUpperCase();
          return sum + getValuation(symbol, Number(c.amount) || 0).valueUsd;
        },
        0,
      );

      setNetWorth({ portfolio: portfolioVal, faucetLifetime, assetCount: activeHoldings.length });
    };
    load();
  }, [user, getValuation]);

  // Net Worth = portfolio holdings only (no double-counting)
  const total = netWorth.portfolio;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Portfolio Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Current holdings • claim history • live market valuation
          </p>
        </div>

        {/* Net Worth Summary */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {[
            { label: "Current Net Worth", value: total, icon: <Wallet className="h-4 w-4" />, color: "text-primary", format: "currency" },
            { label: "Held Assets", value: netWorth.assetCount, icon: <LayoutGrid className="h-4 w-4" />, color: "text-muted-foreground", format: "count" },
            { label: "Claim History Value", value: netWorth.faucetLifetime, icon: <Coins className="h-4 w-4" />, color: "text-primary", subtitle: "historical claim valuation • not cash", format: "currency" },
          ].map(item => (
            <Card key={item.label}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={item.color}>{item.icon}</span>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className="text-lg font-bold">
                  {item.format === "count" ? String(item.value) : `$${Number(item.value).toFixed(2)}`}
                </p>
                {"subtitle" in item && item.subtitle && (
                  <p className="text-[10px] text-muted-foreground">{item.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="portfolio" className="gap-1.5 text-xs">
              <Wallet className="h-3.5 w-3.5" /> Portfolio
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
