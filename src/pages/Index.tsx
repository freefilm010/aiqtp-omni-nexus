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

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        
        {/* Award-Winning Command Center - AInvest + Bloomberg + TradingView hybrid */}
        <section className="py-16 bg-[hsl(225,20%,6%)]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
                AI-Powered <span className="text-[hsl(270,91%,65%)]">Command Center</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Best-in-class features from AInvest, Bloomberg, and TradingView — unified in one award-winning platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <AimeStyleAIPanel />
              <div className="space-y-6">
                <SuperchartsWidget />
                <SmartMoneyFlow />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialCalendarWidget />
              <SmartMoneyFlow />
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
