import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuantumResearchLab from "@/components/quantum/QuantumResearchLab";

const QuantumLabPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Quantum Research Lab</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            IBM Quantum • Time Crystals • Post-Quantum Crypto
          </p>
        </div>
        <QuantumResearchLab />
      </main>
      <Footer />
    </div>
  );
};

export default QuantumLabPage;
