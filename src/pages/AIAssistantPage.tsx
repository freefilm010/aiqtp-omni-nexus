import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIAssistantHub from "@/components/ai/AIAssistantHub";

const AIAssistantPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-2xl">
        <AIAssistantHub />
      </main>
      <Footer />
    </div>
  );
};

export default AIAssistantPage;
