import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Building2, 
  Wallet, 
  MessageCircle, 
  TrendingUp,
  Zap
} from "lucide-react";

const OptionsFlowTracker = lazy(() => import("@/components/intelligence/OptionsFlowTracker"));
const InstitutionalTracker = lazy(() => import("@/components/intelligence/InstitutionalTracker"));
const OnChainIntelligence = lazy(() => import("@/components/intelligence/OnChainIntelligence"));
const SocialAlphaFeed = lazy(() => import("@/components/intelligence/SocialAlphaFeed"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-[400px]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const MarketIntelligencePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Market Intelligence</h1>
          </div>
          <p className="text-muted-foreground">
            Options flow • Institutional filings • On-chain data • Social alpha • The data edge
          </p>
        </div>

        <Tabs defaultValue="options" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="options" className="gap-2">
              <Activity className="h-4 w-4" />
              Options Flow
            </TabsTrigger>
            <TabsTrigger value="institutional" className="gap-2">
              <Building2 className="h-4 w-4" />
              Institutional
            </TabsTrigger>
            <TabsTrigger value="onchain" className="gap-2">
              <Wallet className="h-4 w-4" />
              On-Chain
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Social Alpha
            </TabsTrigger>
          </TabsList>

          <TabsContent value="options">
            <Suspense fallback={<TabLoader />}>
              <OptionsFlowTracker />
            </Suspense>
          </TabsContent>

          <TabsContent value="institutional">
            <Suspense fallback={<TabLoader />}>
              <InstitutionalTracker />
            </Suspense>
          </TabsContent>

          <TabsContent value="onchain">
            <Suspense fallback={<TabLoader />}>
              <OnChainIntelligence />
            </Suspense>
          </TabsContent>

          <TabsContent value="social">
            <Suspense fallback={<TabLoader />}>
              <SocialAlphaFeed />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default MarketIntelligencePage;
