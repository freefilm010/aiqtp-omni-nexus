import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NFTCreator from "@/components/nft/NFTCreator";
import NFTWallet from "@/components/nft/NFTWallet";
import NFTMarketplace from "@/components/nft/NFTMarketplace";
import ContractBuilder from "@/components/nft/ContractBuilder";
import MarketplaceCompetitions from "@/components/marketplace/MarketplaceCompetitions";
import MarketplaceSuggestions from "@/components/marketplace/MarketplaceSuggestions";
import { 
  Palette, 
  Wallet, 
  ShoppingCart, 
  FileCode,
  Trophy,
  Lightbulb
} from "lucide-react";

const NFTStudio = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">NFT Studio</h1>
          <p className="text-muted-foreground mt-1">
            Create • Collect • Trade • Compete • Deploy Smart Contracts
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="create" className="flex items-center gap-1 text-xs">
              <Palette className="h-4 w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-1 text-xs">
              <Wallet className="h-4 w-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-1 text-xs">
              <ShoppingCart className="h-4 w-4" />
              Market
            </TabsTrigger>
            <TabsTrigger value="competitions" className="flex items-center gap-1 text-xs">
              <Trophy className="h-4 w-4" />
              Compete
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-1 text-xs">
              <Lightbulb className="h-4 w-4" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-1 text-xs">
              <FileCode className="h-4 w-4" />
              Contracts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <NFTCreator />
          </TabsContent>

          <TabsContent value="wallet">
            <NFTWallet />
          </TabsContent>

          <TabsContent value="marketplace">
            <NFTMarketplace />
          </TabsContent>

          <TabsContent value="competitions">
            <MarketplaceCompetitions marketType="nft" />
          </TabsContent>

          <TabsContent value="suggestions">
            <MarketplaceSuggestions marketType="nft" />
          </TabsContent>

          <TabsContent value="contracts">
            <ContractBuilder />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default NFTStudio;
