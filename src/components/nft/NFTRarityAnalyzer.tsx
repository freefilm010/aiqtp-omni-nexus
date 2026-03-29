import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Search, Diamond, BarChart3, Loader2, TrendingUp, Star, Gem, Eye } from "lucide-react";

interface RarityTrait {
  trait_type: string;
  value: string;
  rarity_percent: number;
  rarity_score: number;
}

interface NFTRarityResult {
  id: string;
  name: string;
  image: string;
  collection: string;
  rank: number;
  totalSupply: number;
  rarityScore: number;
  traits: RarityTrait[];
  estimatedValue: string;
  priceVsFloor: string;
}

const SAMPLE_RESULTS: NFTRarityResult[] = [
  {
    id: "1",
    name: "QuantBot #4217",
    image: "🤖",
    collection: "QuantBots Genesis",
    rank: 42,
    totalSupply: 10000,
    rarityScore: 287.5,
    estimatedValue: "2.4 ETH",
    priceVsFloor: "+340%",
    traits: [
      { trait_type: "Background", value: "Quantum Field", rarity_percent: 0.5, rarity_score: 200 },
      { trait_type: "Body", value: "Titanium", rarity_percent: 3.2, rarity_score: 31.25 },
      { trait_type: "Eyes", value: "Laser Red", rarity_percent: 1.8, rarity_score: 55.6 },
      { trait_type: "Accessory", value: "Neural Crown", rarity_percent: 100, rarity_score: 1 },
    ],
  },
  {
    id: "2",
    name: "QuantBot #891",
    image: "🤖",
    collection: "QuantBots Genesis",
    rank: 891,
    totalSupply: 10000,
    rarityScore: 145.2,
    estimatedValue: "0.8 ETH",
    priceVsFloor: "+60%",
    traits: [
      { trait_type: "Background", value: "Deep Space", rarity_percent: 5.1, rarity_score: 19.6 },
      { trait_type: "Body", value: "Carbon", rarity_percent: 8.4, rarity_score: 11.9 },
      { trait_type: "Eyes", value: "Holographic", rarity_percent: 2.1, rarity_score: 47.6 },
      { trait_type: "Accessory", value: "Data Visor", rarity_percent: 1.5, rarity_score: 66.7 },
    ],
  },
];

const NFTRarityAnalyzer = () => {
  const [contractAddress, setContractAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<NFTRarityResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<NFTRarityResult | null>(null);

  const handleAnalyze = async () => {
    if (!contractAddress) {
      toast.error("Enter a contract address");
      return;
    }
    setAnalyzing(true);
    // Simulate analysis
    await new Promise((r) => setTimeout(r, 2500));
    setResults(SAMPLE_RESULTS);
    setSelectedResult(SAMPLE_RESULTS[0]);
    setAnalyzing(false);
    toast.success("Rarity analysis complete!");
  };

  const getRarityTier = (percentile: number) => {
    if (percentile <= 1) return { label: "Legendary", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    if (percentile <= 5) return { label: "Epic", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" };
    if (percentile <= 15) return { label: "Rare", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" };
    if (percentile <= 40) return { label: "Uncommon", color: "bg-green-500/20 text-green-400 border-green-500/30" };
    return { label: "Common", color: "bg-muted text-muted-foreground border-border" };
  };

  const getOverallTier = (rank: number, total: number) => {
    const pct = (rank / total) * 100;
    return getRarityTier(pct);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Diamond className="h-5 w-5 text-primary" />
            NFT Rarity Analyzer
          </CardTitle>
          <CardDescription>
            Analyze rarity scores for any NFT collection. Supports Ethereum, Polygon, and Solana.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">⟠ Ethereum</SelectItem>
                <SelectItem value="polygon">⬡ Polygon</SelectItem>
                <SelectItem value="solana">◎ Solana</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Contract address (0x...)"
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              className="sm:col-span-2"
            />
            <Input
              placeholder="Token ID (optional)"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={analyzing} className="w-full">
            {analyzing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing Collection...</>
            ) : (
              <><Search className="h-4 w-4 mr-2" /> Analyze Rarity</>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Results List */}
          <div className="space-y-3">
            {results.map((nft) => {
              const tier = getOverallTier(nft.rank, nft.totalSupply);
              return (
                <button
                  key={nft.id}
                  onClick={() => setSelectedResult(nft)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedResult?.id === nft.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{nft.image}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{nft.name}</p>
                      <p className="text-xs text-muted-foreground">{nft.collection}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${tier.color}`}>{tier.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Rank #{nft.rank}/{nft.totalSupply.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail View */}
          {selectedResult && (
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedResult.name}</CardTitle>
                    <Badge className={getOverallTier(selectedResult.rank, selectedResult.totalSupply).color}>
                      {getOverallTier(selectedResult.rank, selectedResult.totalSupply).label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <Star className="h-4 w-4 mx-auto text-yellow-400 mb-1" />
                      <p className="text-lg font-bold">{selectedResult.rarityScore.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Rarity Score</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <BarChart3 className="h-4 w-4 mx-auto text-blue-400 mb-1" />
                      <p className="text-lg font-bold">#{selectedResult.rank}</p>
                      <p className="text-xs text-muted-foreground">Rank</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <Gem className="h-4 w-4 mx-auto text-purple-400 mb-1" />
                      <p className="text-lg font-bold">{selectedResult.estimatedValue}</p>
                      <p className="text-xs text-muted-foreground">Est. Value</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <TrendingUp className="h-4 w-4 mx-auto text-green-400 mb-1" />
                      <p className="text-lg font-bold text-green-400">{selectedResult.priceVsFloor}</p>
                      <p className="text-xs text-muted-foreground">vs Floor</p>
                    </div>
                  </div>

                  {/* Traits */}
                  <h3 className="font-medium text-sm mb-3">Trait Breakdown</h3>
                  <div className="space-y-3">
                    {selectedResult.traits.map((trait, i) => {
                      const tier = getRarityTier(trait.rarity_percent);
                      return (
                        <div key={i} className="p-3 rounded-lg border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground">{trait.trait_type}</p>
                              <p className="font-medium text-sm">{trait.value}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={`text-xs ${tier.color}`}>{tier.label}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {trait.rarity_percent}% have this
                              </p>
                            </div>
                          </div>
                          <Progress
                            value={Math.min(trait.rarity_percent, 100)}
                            className="h-1.5"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NFTRarityAnalyzer;
