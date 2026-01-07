import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QuantumResearchLab from "@/components/quantum/QuantumResearchLab";

const QuantumLabPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Quantum Research Lab</h1>
          <p className="text-muted-foreground mt-1">
            IBM Quantum Integration • Time Crystal Research • Post-Quantum Cryptography
          </p>
        </div>
        <QuantumResearchLab />
      </main>
      <Footer />
    </div>
  );
};

export default QuantumLabPage;
