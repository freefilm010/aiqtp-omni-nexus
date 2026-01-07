import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, LayoutGrid, BarChart3, Wallet } from "lucide-react";

const PortfolioAnalyticsDashboard = lazy(() => import("@/components/portfolio/PortfolioAnalyticsDashboard"));
const MarketHeatmap = lazy(() => import("@/components/analytics/MarketHeatmap"));
const FundamentalAnalysis = lazy(() => import("@/components/analytics/FundamentalAnalysis"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-[400px]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const PortfolioPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Portfolio & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive portfolio analytics • Heatmaps • Fundamental analysis
          </p>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="portfolio" className="gap-2">
              <Wallet className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Heatmaps
            </TabsTrigger>
            <TabsTrigger value="fundamentals" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Fundamentals
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
