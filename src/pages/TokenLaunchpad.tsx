import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TokenCreator from "@/components/token/TokenCreator";
import TokenMarketplace from "@/components/token/TokenMarketplace";
import DEXScreener from "@/components/token/DEXScreener";
import MarketplaceCompetitions from "@/components/marketplace/MarketplaceCompetitions";
import MarketplaceSuggestions from "@/components/marketplace/MarketplaceSuggestions";
import { 
  Coins, 
  ShoppingCart, 
  BarChart3,
  Trophy,
  Lightbulb
} from "lucide-react";

const TokenLaunchpad = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Token Launchpad</h1>
          <p className="text-muted-foreground mt-1">
            Create tokens • Launch with bonding curves • Track on DEX • Compete
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="create" className="flex items-center gap-1 text-xs">
              <Coins className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-1 text-xs">
              <ShoppingCart className="h-4 w-4" />
              Market
            </TabsTrigger>
            <TabsTrigger value="screener" className="flex items-center gap-1 text-xs">
              <BarChart3 className="h-4 w-4" />
              DEX
            </TabsTrigger>
            <TabsTrigger value="competitions" className="flex items-center gap-1 text-xs">
              <Trophy className="h-4 w-4" />
              Compete
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-1 text-xs">
              <Lightbulb className="h-4 w-4" />
              Ideas
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

          <TabsContent value="competitions">
            <MarketplaceCompetitions marketType="token" />
          </TabsContent>

          <TabsContent value="suggestions">
            <MarketplaceSuggestions marketType="token" />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TokenLaunchpad;
