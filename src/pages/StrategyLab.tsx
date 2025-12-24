import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BacktestPanel from "@/components/research/BacktestPanel";

const StrategyLab = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <BacktestPanel />
      </main>
      <Footer />
    </div>
  );
};

export default StrategyLab;
