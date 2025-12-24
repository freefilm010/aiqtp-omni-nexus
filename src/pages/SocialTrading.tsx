import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CopyTrading from "@/components/social/CopyTrading";

const SocialTrading = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <CopyTrading />
      </main>
      <Footer />
    </div>
  );
};

export default SocialTrading;
