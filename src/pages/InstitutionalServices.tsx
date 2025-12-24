import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrimeServices from "@/components/institutional/PrimeServices";

const InstitutionalServices = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <PrimeServices />
      </main>
      <Footer />
    </div>
  );
};

export default InstitutionalServices;
