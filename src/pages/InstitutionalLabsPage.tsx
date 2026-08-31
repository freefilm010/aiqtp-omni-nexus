import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RegimeDetectionPanel from "@/components/labs/RegimeDetectionPanel";
import PatternRecognitionPanel from "@/components/labs/PatternRecognitionPanel";
import PortfolioOptimizerPanel from "@/components/labs/PortfolioOptimizerPanel";
import ArbitrageScannerPanel from "@/components/labs/ArbitrageScannerPanel";
import HFTSimulatorPanel from "@/components/labs/HFTSimulatorPanel";
import VolSurfacePanel from "@/components/labs/VolSurfacePanel";
import BacktestReplayPanel from "@/components/labs/BacktestReplayPanel";

const InstitutionalLabsPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold font-mono">Institutional Labs</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Seven quant engines running live: regime detection, pattern recognition, volatility surface,
          portfolio optimization, cross-venue arbitrage, HFT fill simulation and execution replay.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RegimeDetectionPanel />
        <PatternRecognitionPanel />
        <VolSurfacePanel />
        <PortfolioOptimizerPanel />
        <ArbitrageScannerPanel />
        <HFTSimulatorPanel />
        <BacktestReplayPanel />
      </div>
    </main>
    <Footer />
  </div>
);

export default InstitutionalLabsPage;
