import Header from "@/components/Header";
import Hero from "@/components/Hero";
import MarketplaceCategories from "@/components/MarketplaceCategories";
import Features from "@/components/Features";
import Security from "@/components/Security";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <MarketplaceCategories />
        <Features />
        <Security />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
