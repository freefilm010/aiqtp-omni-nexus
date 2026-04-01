import { lazy, Suspense, useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutGrid, BarChart3, Wallet, Coins, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { portfolioService } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { useAssetValuation, type AssetValuation } from "@/hooks/useAssetValuation";

const PortfolioAnalyticsDashboard = lazy(() => import("@/components/portfolio/PortfolioAnalyticsDashboard"));
const MarketHeatmap = lazy(() => import("@/components/analytics/MarketHeatmap"));
const FundamentalAnalysis = lazy(() => import("@/components/analytics/FundamentalAnalysis"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-[400px]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

/** Data quality badge for an asset valuation */
const PriceBadge = ({ val }: { val: AssetValuation }) => {
  if (val.isTestnet) return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Test</Badge>;
  if (val.priceUnavailable) return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-0.5"><XCircle className="h-2.5 w-2.5" /> No Price</Badge>;
  if (val.isStale) return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5 text-accent-foreground"><AlertTriangle className="h-2.5 w-2.5" /> Stale</Badge>;
  if (val.isLive) return <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-0.5 text-primary"><CheckCircle2 className="h-2.5 w-2.5" /> Live</Badge>;
  return null;
};

const PortfolioPage = () => {
  const { user } = useAuth();
  const { getValuation } = useAssetValuation();
  const [realAssets, setRealAssets] = useState<AssetValuation[]>([]);
  const [testAssets, setTestAssets] = useState<AssetValuation[]>([]);
  const [netWorth, setNetWorth] = useState({ portfolio: 0, realAssetCount: 0, testAssetCount: 0 });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const result = await portfolioService.getUserHoldings();
      if (result.error || !result.data) return;

      const activeHoldings = result.data.filter((h) => h.quantity > 0);

      const valuations = activeHoldings.map((h) =>
        getValuation(h.symbol, h.quantity)
      );

      const real = valuations.filter((v: AssetValuation) => !v.isTestnet);
      const test = valuations.filter((v: AssetValuation) => v.isTestnet);

      const portfolioVal = real.reduce((s: number, v: AssetValuation) => s + v.valueUsd, 0);

      setRealAssets(real);
      setTestAssets(test);
      setNetWorth({ portfolio: portfolioVal, realAssetCount: real.length, testAssetCount: test.length });
    };
    load();
  }, [user, getValuation]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Portfolio Command Center</h1>
          <p className="text-muted-foreground mt-1">
            Real asset holdings • live market valuation
          </p>
        </div>

        {/* Net Worth Summary — real assets only */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-primary"><Wallet className="h-4 w-4" /></span>
                <span className="text-xs text-muted-foreground">Net Worth (Real Assets)</span>
              </div>
              <p className="text-lg font-bold">${netWorth.portfolio.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-muted-foreground"><LayoutGrid className="h-4 w-4" /></span>
                <span className="text-xs text-muted-foreground">Real Assets</span>
              </div>
              <p className="text-lg font-bold">{netWorth.realAssetCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-muted-foreground"><Coins className="h-4 w-4" /></span>
                <span className="text-xs text-muted-foreground">Test Assets</span>
              </div>
              <p className="text-lg font-bold">{netWorth.testAssetCount}</p>
              <p className="text-[10px] text-muted-foreground">not included in net worth</p>
            </CardContent>
          </Card>
        </div>

        {/* Real Assets Table */}
        {realAssets.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Real Holdings</h3>
              <div className="space-y-2">
                {realAssets.map(val => (
                  <div key={val.symbol} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{val.symbol}</span>
                      <PriceBadge val={val} />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {val.priceUnavailable ? "Price Unavailable" : `$${val.valueUsd.toFixed(2)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {val.quantity.toFixed(2)} × ${val.priceUsd.toFixed(val.priceUsd < 1 ? 4 : 2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Assets — collapsed section */}
        {testAssets.length > 0 && (
          <Card className="mb-6 border-dashed opacity-70">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
                Test Assets
                <Badge variant="outline" className="text-[10px]">$0 value — not real</Badge>
              </h3>
              <div className="space-y-1">
                {testAssets.map(val => (
                  <div key={val.symbol} className="flex items-center justify-between py-1 text-xs text-muted-foreground">
                    <span>{val.symbol}</span>
                    <span>{val.quantity.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
