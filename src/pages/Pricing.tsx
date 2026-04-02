import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RevenueActivation from "@/components/payments/RevenueActivation";

const Pricing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Unlock the Full Platform
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            AI-powered trading, 10,000-cycle strategy training, bot marketplace — choose your plan and start generating returns today.
          </p>
        </div>
        <RevenueActivation />
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
