import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarketAlertsFeed from "@/components/alerts/MarketAlertsFeed";

const AlertsFeedPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Market Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Pattern recognition • RSI/Volume anomalies • Politician trades • Economic data • Whale movements
          </p>
        </div>
        <MarketAlertsFeed />
      </main>
      <Footer />
    </div>
  );
};

export default AlertsFeedPage;
