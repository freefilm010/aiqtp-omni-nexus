import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LazySection from "@/components/LazySection";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy-load Footer — it pulls in useAdminAuth + GitHubEcosystem which are heavy
const Footer = lazy(() => import("@/components/Footer"));

// Lazy-load all below-fold widgets to reduce initial JS payload
const AimeStyleAIPanel = lazy(() => import("@/components/home/AimeStyleAIPanel"));
const SmartMoneyFlow = lazy(() => import("@/components/home/SmartMoneyFlow"));
const FinancialCalendarWidget = lazy(() => import("@/components/home/FinancialCalendarWidget"));
const SuperchartsWidget = lazy(() => import("@/components/home/SuperchartsWidget"));
const CopyTradingLeaderboard = lazy(() => import("@/components/home/CopyTradingLeaderboard"));
const PortfolioSyncWidget = lazy(() => import("@/components/home/PortfolioSyncWidget"));
const UltimateAIScreener = lazy(() => import("@/components/home/UltimateAIScreener"));
const DynamicIslandNotifications = lazy(() => import("@/components/home/DynamicIslandNotifications"));
const MarketplaceCategories = lazy(() => import("@/components/MarketplaceCategories"));
const Features = lazy(() => import("@/components/Features"));
const Security = lazy(() => import("@/components/Security"));

const SectionLoader = () => (
  <div className="flex items-center justify-center py-12">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const heroSectionRootMargin = isMobile ? "80px" : "400px";
  const standardSectionRootMargin = isMobile ? "40px" : "200px";
  const footerRootMargin = isMobile ? "0px" : "200px";

  return (
    <div className="min-h-screen">
      {user ? (
        <Suspense fallback={null}>
          <DynamicIslandNotifications />
        </Suspense>
      ) : null}

      <Header />
      <main>
        <Hero />

        {/* ===== AI COMMAND CENTER ===== */}
        <LazySection minHeight="600px" rootMargin={heroSectionRootMargin}>
          <Suspense fallback={<SectionLoader />}>
            <section className="py-16 bg-[hsl(225,20%,6%)]">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center mb-10">
                  <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                    AI-Powered <span className="text-[hsl(270,91%,65%)]">Command Center</span>
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Professional-grade tools for crypto, stocks, and beyond — unified in one powerful platform.
                  </p>
                </div>

                {/* Row 1: AI Panel + Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <AimeStyleAIPanel />
                  <div className="space-y-6">
                    <SuperchartsWidget />
                  </div>
                </div>

                {/* Row 2: Screener + Smart Money */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <UltimateAIScreener />
                  <SmartMoneyFlow />
                </div>

                {/* Row 3: Calendar + Portfolio + Copy Trading */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <FinancialCalendarWidget />
                  <PortfolioSyncWidget />
                  <CopyTradingLeaderboard />
                </div>
              </div>
            </section>
          </Suspense>
        </LazySection>

        <LazySection minHeight="400px" rootMargin={standardSectionRootMargin}>
          <Suspense fallback={<SectionLoader />}>
            <MarketplaceCategories />
          </Suspense>
        </LazySection>

        <LazySection minHeight="400px" rootMargin={standardSectionRootMargin}>
          <Suspense fallback={<SectionLoader />}>
            <Features />
          </Suspense>
        </LazySection>

        <LazySection minHeight="400px" rootMargin={standardSectionRootMargin}>
          <Suspense fallback={<SectionLoader />}>
            <Security />
          </Suspense>
        </LazySection>
      </main>
      <LazySection minHeight="200px" rootMargin={footerRootMargin}>
        <Suspense fallback={<SectionLoader />}>
          <Footer />
        </Suspense>
      </LazySection>
    </div>
  );
};

export default Index;
