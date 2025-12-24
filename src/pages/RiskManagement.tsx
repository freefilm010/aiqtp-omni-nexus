import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AdvancedRiskManager from "@/components/risk/AdvancedRiskManager";

const RiskManagement = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AdvancedRiskManager />
      </main>
      <Footer />
    </div>
  );
};

export default RiskManagement;
