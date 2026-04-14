import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EconomicCalendar from "@/components/trading/EconomicCalendar";

const EconomicCalendarPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Economic Calendar</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Global events • Central bank • Crypto regulation
          </p>
        </div>
        <EconomicCalendar />
      </main>
      <Footer />
    </div>
  );
};

export default EconomicCalendarPage;
