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
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Token Launchpad</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Create tokens • Bonding curves • DEX • Compete
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="create" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <Coins className="h-3 w-3 sm:h-4 sm:w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              Market
            </TabsTrigger>
            <TabsTrigger value="screener" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              DEX
            </TabsTrigger>
            <TabsTrigger value="competitions" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              Compete
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
              Ideas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create"><TokenCreator /></TabsContent>
          <TabsContent value="marketplace"><TokenMarketplace /></TabsContent>
          <TabsContent value="screener"><DEXScreener /></TabsContent>
          <TabsContent value="competitions"><MarketplaceCompetitions marketType="token" /></TabsContent>
          <TabsContent value="suggestions"><MarketplaceSuggestions marketType="token" /></TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TokenLaunchpad;
