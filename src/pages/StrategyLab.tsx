import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BacktestPanel from "@/components/research/BacktestPanel";
import AutoPipeline from "@/components/strategy/AutoPipeline";

const StrategyLab = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-6">
        <AutoPipeline />
        <BacktestPanel />
      </main>
      <Footer />
    </div>
  );
};

export default StrategyLab;
