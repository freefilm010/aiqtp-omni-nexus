import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StrategyMarketplace from "@/components/strategy/StrategyMarketplace";
import GraduationPipeline from "@/components/strategy/GraduationPipeline";
import FactorLibrary from "@/components/strategy/FactorLibrary";
import MarketplaceCompetitions from "@/components/marketplace/MarketplaceCompetitions";
import MarketplaceSuggestions from "@/components/marketplace/MarketplaceSuggestions";
import { ShoppingCart, Award, Code2, Trophy, Lightbulb } from "lucide-react";

const StrategyMarketplacePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Strategy Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Rent proven strategies • Graduate your own • Compete for prizes • 40/40/20 profit split
          </p>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="marketplace" className="flex items-center gap-1 text-xs">
              <ShoppingCart className="h-4 w-4" />
              Market
            </TabsTrigger>
            <TabsTrigger value="graduation" className="flex items-center gap-1 text-xs">
              <Award className="h-4 w-4" />
              Graduate
            </TabsTrigger>
            <TabsTrigger value="factors" className="flex items-center gap-1 text-xs">
              <Code2 className="h-4 w-4" />
              Factors
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

          <TabsContent value="marketplace">
            <StrategyMarketplace />
          </TabsContent>

          <TabsContent value="graduation">
            <GraduationPipeline />
          </TabsContent>

          <TabsContent value="factors">
            <FactorLibrary />
          </TabsContent>

          <TabsContent value="competitions">
            <MarketplaceCompetitions marketType="strategy" />
          </TabsContent>

          <TabsContent value="suggestions">
            <MarketplaceSuggestions marketType="strategy" />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default StrategyMarketplacePage;
