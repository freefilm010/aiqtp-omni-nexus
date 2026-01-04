import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StrategyMarketplace from "@/components/strategy/StrategyMarketplace";
import GraduationPipeline from "@/components/strategy/GraduationPipeline";
import FactorLibrary from "@/components/strategy/FactorLibrary";
import { ShoppingCart, Award, Code2 } from "lucide-react";

const StrategyMarketplacePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Strategy Marketplace</h1>
          <p className="text-muted-foreground mt-1">
            Rent proven strategies • Graduate your own • 40/40/20 profit split
          </p>
        </div>

        <Tabs defaultValue="marketplace" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="marketplace" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Marketplace
            </TabsTrigger>
            <TabsTrigger value="graduation" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Graduation Pipeline
            </TabsTrigger>
            <TabsTrigger value="factors" className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Factor Library
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
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default StrategyMarketplacePage;
