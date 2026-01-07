import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CryptoScreener from "@/components/screener/CryptoScreener";

const ScreenerPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Crypto Screener</h1>
          <p className="text-muted-foreground mt-1">
            Filter assets by technical indicators • Find trading opportunities
          </p>
        </div>
        <CryptoScreener />
      </main>
      <Footer />
    </div>
  );
};

export default ScreenerPage;
