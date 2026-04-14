import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TitanCodexDashboard from "@/components/titan/TitanCodexDashboard";

const TitanCodexPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-24">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl sm:text-3xl font-bold">TITAN CODEX™</h1>
            <span className="px-2 py-1 text-xs font-mono bg-purple-500/20 text-purple-500 rounded">
              OMEGA // QUANTUM-NATIVE
            </span>
          </div>
          <p className="text-muted-foreground">
            Quantum Time Crystal ($QTC™) Ecosystem • NQI Act Aligned • NIST PQC Compliant
          </p>
        </div>
        <TitanCodexDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default TitanCodexPage;
