import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EconomicCalendar from "@/components/trading/EconomicCalendar";

const EconomicCalendarPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Economic Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Track global economic events • Central bank decisions • Crypto regulation updates
          </p>
        </div>
        <EconomicCalendar />
      </main>
      <Footer />
    </div>
  );
};

export default EconomicCalendarPage;
