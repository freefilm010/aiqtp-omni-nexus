import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BacktestPanel from "@/components/research/BacktestPanel";
import AutoPipeline from "@/components/strategy/AutoPipeline";

const StrategyLab = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <AutoPipeline />
        <BacktestPanel />
      </main>
      <Footer />
    </div>
  );
};

export default StrategyLab;
