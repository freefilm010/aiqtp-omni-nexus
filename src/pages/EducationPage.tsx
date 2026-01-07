import Header from "@/components/Header";
import Footer from "@/components/Footer";
import EducationLibrary from "@/components/education/EducationLibrary";

const EducationPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Education Library</h1>
          <p className="text-muted-foreground mt-1">
            Learn trading strategies • Master technical analysis • Understand DeFi
          </p>
        </div>
        <EducationLibrary />
      </main>
      <Footer />
    </div>
  );
};

export default EducationPage;
