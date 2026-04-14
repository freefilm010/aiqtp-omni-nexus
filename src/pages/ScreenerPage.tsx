import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CryptoScreener from "@/components/screener/CryptoScreener";
import AIScreener from "@/components/screener/AIScreener";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Activity } from "lucide-react";

const ScreenerPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Crypto Screener</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Filter by indicators • Find opportunities
          </p>
        </div>
        
        <Tabs defaultValue="ai" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="ai" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              AI Screener
            </TabsTrigger>
            <TabsTrigger value="standard" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Screener
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <AIScreener />
          </TabsContent>

          <TabsContent value="standard">
            <CryptoScreener />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ScreenerPage;
