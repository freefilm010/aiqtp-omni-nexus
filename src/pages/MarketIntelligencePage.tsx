import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  Building2, 
  Wallet, 
  MessageCircle, 
  Zap
} from "lucide-react";

const OptionsFlowTracker = lazy(() => import("@/components/intelligence/OptionsFlowTracker"));
const InstitutionalTracker = lazy(() => import("@/components/intelligence/InstitutionalTracker"));
const OnChainIntelligence = lazy(() => import("@/components/intelligence/OnChainIntelligence"));
const SocialAlphaFeed = lazy(() => import("@/components/intelligence/SocialAlphaFeed"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-[300px] sm:h-[400px]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const MarketIntelligencePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold">Market Intelligence</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Options flow • Institutional • On-chain • Social alpha
          </p>
        </div>

        <Tabs defaultValue="options" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="options" className="gap-1 sm:gap-2 text-[10px] sm:text-sm px-1 sm:px-3">
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              Options
            </TabsTrigger>
            <TabsTrigger value="institutional" className="gap-1 sm:gap-2 text-[10px] sm:text-sm px-1 sm:px-3">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              Inst.
            </TabsTrigger>
            <TabsTrigger value="onchain" className="gap-1 sm:gap-2 text-[10px] sm:text-sm px-1 sm:px-3">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
              Chain
            </TabsTrigger>
            <TabsTrigger value="social" className="gap-1 sm:gap-2 text-[10px] sm:text-sm px-1 sm:px-3">
              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              Social
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
