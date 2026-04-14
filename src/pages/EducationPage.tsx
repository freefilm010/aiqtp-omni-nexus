import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EducationLibrary from "@/components/education/EducationLibrary";

const EducationPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Education Library</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Trading strategies • Technical analysis • DeFi
          </p>
        </div>
        <EducationLibrary />
      </main>
      <Footer />
    </div>
  );
};

export default EducationPage;
