import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MarketplaceCategories from "@/components/MarketplaceCategories";
import Features from "@/components/Features";
import Security from "@/components/Security";
import Footer from "@/components/Footer";
import AimeStyleAIPanel from "@/components/home/AimeStyleAIPanel";
import SmartMoneyFlow from "@/components/home/SmartMoneyFlow";
import FinancialCalendarWidget from "@/components/home/FinancialCalendarWidget";
import SuperchartsWidget from "@/components/home/SuperchartsWidget";
import CopyTradingLeaderboard from "@/components/home/CopyTradingLeaderboard";
import PortfolioSyncWidget from "@/components/home/PortfolioSyncWidget";
import UltimateAIScreener from "@/components/home/UltimateAIScreener";
import DynamicIslandNotifications from "@/components/home/DynamicIslandNotifications";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Dynamic Island Notifications - iOS style */}
      <DynamicIslandNotifications />
      
      <Header />
      <main>
        <Hero />
        
        {/* ===== AI COMMAND CENTER ===== */}
        {/* Best of: AInvest Aime + Bloomberg Terminal + Microsoft Copilot */}
        <section className="py-16 bg-[hsl(225,20%,6%)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                AI-Powered <span className="text-[hsl(270,91%,65%)]">Command Center</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The best features from AInvest, Bloomberg, TradingView, Robinhood, and eToro — unified in one award-winning platform.
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
        
        <MarketplaceCategories />
        <Features />
        <Security />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
