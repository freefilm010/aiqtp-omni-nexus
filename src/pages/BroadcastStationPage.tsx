import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BroadcastStation from "@/components/broadcast/BroadcastStation";

const BroadcastStationPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <BroadcastStation />
      </main>
      <Footer />
    </div>
  );
};

export default BroadcastStationPage;
