import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CreditDerivatives from "@/components/derivatives/CreditDerivatives";

const DerivativesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Credit Derivatives</h1>
          <p className="text-muted-foreground mt-1">
            CDS valuation • Credit indices • Risk analysis
          </p>
        </div>
        <CreditDerivatives />
      </main>
      <Footer />
    </div>
  );
};

export default DerivativesPage;
