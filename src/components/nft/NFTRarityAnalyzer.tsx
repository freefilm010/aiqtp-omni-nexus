import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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

const NFTRarityAnalyzer = () => {
  const { user } = useAuth();
  const [contractAddress, setContractAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<NFTRarityResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<NFTRarityResult | null>(null);

  // Load user's NFTs for analysis on mount
  useEffect(() => {
    if (!user) return;
    const loadUserNFTs = async () => {
      const { data } = await (supabase
        .from("user_nfts") as any)
        .select("id, name, image_url, collection_name, attributes")
        .eq("owner_id", user.id)
        .limit(20);

      if (data && data.length > 0) {
        setResults(data.map((nft: any, idx: number) => ({
          id: nft.id,
          name: nft.name || `NFT #${idx + 1}`,
          image: nft.image_url || "🤖",
          collection: nft.collection_name || "User Collection",
          rank: idx + 1,
          totalSupply: data.length,
          rarityScore: 0,
          traits: (nft.attributes as RarityTrait[]) || [],
          estimatedValue: "—",
          priceVsFloor: "—",
        })));
      }
    };
    loadUserNFTs();
  }, [user]);

  const handleAnalyze = async () => {
    if (!contractAddress) {
      toast.error("Enter a contract address");
      return;
    }
    setAnalyzing(true);

    try {
      // Call the edge function for real analysis
      const { data, error } = await supabase.functions.invoke("nft-generate-image", {
        body: { action: "analyze_rarity", contract: contractAddress, tokenId, chain },
      });

      if (error) throw error;

      if (data?.results) {
        setResults(data.results);
        setSelectedResult(data.results[0]);
      } else {
        toast.info("No rarity data found for this contract. Try another address.");
      }
    } catch (err) {
      console.error("Rarity analysis error:", err);
      toast.error("Analysis failed. Ensure the contract address is valid.");
    } finally {
      setAnalyzing(false);
    }
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
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Diamond className="h-5 w-5 text-primary" /> NFT Rarity Analyzer</CardTitle>
          <CardDescription>Analyze trait rarity scores and collection rankings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input placeholder="Contract address (0x...)" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} className="md:col-span-2" />
            <Input placeholder="Token ID (optional)" value={tokenId} onChange={(e) => setTokenId(e.target.value)} />
            <div className="flex gap-2">
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* NFT List */}
          <Card className="md:col-span-1">
            <CardHeader><CardTitle className="text-sm">Results ({results.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {results.map(nft => {
                const tier = getOverallTier(nft.rank, nft.totalSupply);
                return (
                  <div
                    key={nft.id}
                    onClick={() => setSelectedResult(nft)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedResult?.id === nft.id ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{nft.image.startsWith('http') ? '🖼️' : nft.image}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{nft.name}</p>
                        <p className="text-xs text-muted-foreground">Rank #{nft.rank}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${tier.color}`}>{tier.label}</Badge>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Detail Panel */}
          {selectedResult && (
            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedResult.name}</CardTitle>
                    <CardDescription>{selectedResult.collection}</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{selectedResult.rarityScore.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Rarity Score</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Rank</p>
                    <p className="text-lg font-bold">#{selectedResult.rank}</p>
                    <p className="text-xs text-muted-foreground">of {selectedResult.totalSupply}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">Est. Value</p>
                    <p className="text-lg font-bold text-green-500">{selectedResult.estimatedValue}</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground">vs Floor</p>
                    <p className="text-lg font-bold text-primary">{selectedResult.priceVsFloor}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold mb-3">Trait Analysis</h4>
                  <div className="space-y-3">
                    {selectedResult.traits.map((trait, i) => {
                      const tier = getRarityTier(trait.rarity_percent);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{trait.trait_type}: <span className="text-foreground font-medium">{trait.value}</span></span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] ${tier.color}`}>{tier.label}</Badge>
                              <span className="font-mono">{trait.rarity_percent.toFixed(1)}%</span>
                            </div>
                          </div>
                          <Progress value={Math.min(trait.rarity_percent * 2, 100)} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {results.length === 0 && !analyzing && (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Diamond className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">No NFTs Analyzed</p>
          <p className="text-sm">Enter a contract address above or your owned NFTs will load automatically.</p>
        </CardContent></Card>
      )}
    </div>
  );
};

export default NFTRarityAnalyzer;
