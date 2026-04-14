import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AchievementsPanel from "@/components/achievements/AchievementsPanel";

const AchievementsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold">Achievements & Perks</h1>
          <p className="text-muted-foreground mt-2">
            Track your progress, unlock achievements, and earn exclusive perks
          </p>
        </div>
        <AchievementsPanel />
      </main>
      <Footer />
    </div>
  );
};

export default AchievementsPage;
