import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TokenCreator from "@/components/token/TokenCreator";
import TokenMarketplace from "@/components/token/TokenMarketplace";
import DEXScreener from "@/components/token/DEXScreener";
import { 
  Coins, 
  ShoppingCart, 
  BarChart3
} from "lucide-react";

const TokenLaunchpad = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Token Launchpad</h1>
          <p className="text-muted-foreground mt-1">
            Create tokens • Launch with bonding curves • Track on DEX
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Create Token
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Token Market
            </TabsTrigger>
            <TabsTrigger value="screener" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              DEX Screener
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <TokenCreator />
          </TabsContent>

          <TabsContent value="marketplace">
            <TokenMarketplace />
          </TabsContent>

          <TabsContent value="screener">
            <DEXScreener />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TokenLaunchpad;
