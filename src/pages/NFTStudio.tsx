import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NFTCreator from "@/components/nft/NFTCreator";
import NFTWallet from "@/components/nft/NFTWallet";
import NFTMarketplace from "@/components/nft/NFTMarketplace";
import ContractBuilder from "@/components/nft/ContractBuilder";
import ComplianceRegistry from "@/components/standards/ComplianceRegistry";
import MarketplaceCompetitions from "@/components/marketplace/MarketplaceCompetitions";
import MarketplaceSuggestions from "@/components/marketplace/MarketplaceSuggestions";
import CrossChainBridge from "@/components/nft/CrossChainBridge";
import NFTRarityAnalyzer from "@/components/nft/NFTRarityAnalyzer";
import { 
  Palette, 
  Wallet, 
  ShoppingCart, 
  FileCode,
  Trophy,
  Lightbulb,
  Shield,
  ArrowLeftRight,
  Diamond
} from "lucide-react";

const NFTStudio = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">NFT Studio</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Create • Collect • Trade • Deploy
          </p>
        </div>

        <Tabs defaultValue="create" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5 sm:grid-cols-9 h-auto">
            <TabsTrigger value="create" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="wallet" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <Wallet className="h-3 w-3 sm:h-4 sm:w-4" />
              Wallet
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
              Market
            </TabsTrigger>
            <TabsTrigger value="bridge" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <ArrowLeftRight className="h-3 w-3 sm:h-4 sm:w-4" />
              Bridge
            </TabsTrigger>
            <TabsTrigger value="rarity" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5">
              <Diamond className="h-3 w-3 sm:h-4 sm:w-4" />
              Rarity
            </TabsTrigger>
            <TabsTrigger value="competitions" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5 hidden sm:flex">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              Compete
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5 hidden sm:flex">
              <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5 hidden sm:flex">
              <FileCode className="h-3 w-3 sm:h-4 sm:w-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="standards" className="flex items-center gap-0.5 text-[9px] sm:text-xs px-1 py-1.5 hidden sm:flex">
              <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
              Standards
            </TabsTrigger>
          </TabsList>

          {/* Second row for mobile - overflow tabs */}
          <TabsList className="grid w-full grid-cols-4 sm:hidden h-auto">
            <TabsTrigger value="competitions" className="flex items-center gap-0.5 text-[9px] px-1 py-1.5">
              <Trophy className="h-3 w-3" />
              Compete
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-0.5 text-[9px] px-1 py-1.5">
              <Lightbulb className="h-3 w-3" />
              Ideas
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-0.5 text-[9px] px-1 py-1.5">
              <FileCode className="h-3 w-3" />
              Contracts
            </TabsTrigger>
            <TabsTrigger value="standards" className="flex items-center gap-0.5 text-[9px] px-1 py-1.5">
              <Shield className="h-3 w-3" />
              Standards
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

          <TabsContent value="bridge">
            <CrossChainBridge />
          </TabsContent>

          <TabsContent value="rarity">
            <NFTRarityAnalyzer />
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

          <TabsContent value="standards">
            <ComplianceRegistry />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default NFTStudio;
