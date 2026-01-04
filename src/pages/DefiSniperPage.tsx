import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeFiSniper from "@/components/defi/DeFiSniper";
import TokenScanner from "@/components/defi/TokenScanner";

const DefiSniperPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">DeFi Sniper</h1>
          <p className="text-muted-foreground mt-1">
            Solana pump.fun & Raydium sniper • Early token detection
          </p>
        </div>

        <Tabs defaultValue="sniper" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sniper">Token Sniper</TabsTrigger>
            <TabsTrigger value="scanner">New Token Scanner</TabsTrigger>
          </TabsList>

          <TabsContent value="sniper">
            <DeFiSniper />
          </TabsContent>

          <TabsContent value="scanner">
            <TokenScanner />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default DefiSniperPage;
