import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StrategyMarketplace from "@/components/strategy/StrategyMarketplace";
import GraduationPipeline from "@/components/strategy/GraduationPipeline";
import FactorLibrary from "@/components/strategy/FactorLibrary";
import MarketplaceCompetitions from "@/components/marketplace/MarketplaceCompetitions";
import MarketplaceSuggestions from "@/components/marketplace/MarketplaceSuggestions";
import AIAgentLeaderboard from "@/components/trading/AIAgentLeaderboard";
import { ShoppingCart, Award, Code2, Trophy, Lightbulb, Bot } from "lucide-react";

const StrategyMarketplacePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Strategy Marketplace</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Rent proven strategies • Graduate your own • Compete for prizes • 40/40/20 profit split
          </p>
        </div>

          <Tabs defaultValue="marketplace" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto">
            <TabsTrigger value="agents" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
              Agents
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              Market
            </TabsTrigger>
            <TabsTrigger value="graduation" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <Award className="h-3 w-3 sm:h-4 sm:w-4" />
              Graduate
            </TabsTrigger>
            <TabsTrigger value="factors" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <Code2 className="h-3 w-3 sm:h-4 sm:w-4" />
              Factors
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

          <TabsContent value="agents">
            <AIAgentLeaderboard />
          </TabsContent>

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
