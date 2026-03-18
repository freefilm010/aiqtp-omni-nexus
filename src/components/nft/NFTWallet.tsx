import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Wallet,
  Image,
  Send,
  ExternalLink,
  Grid3x3,
  List,
  TrendingUp,
  DollarSign,
  Loader2,
  RefreshCw
} from "lucide-react";

interface UserNFT {
  id: string;
  name: string;
  description: string | null;
  chain: string;
  royalty_percent: number;
  supply: number;
  attributes: any[];
  image_url: string | null;
  ai_generated: boolean;
  mint_status: string;
  list_price: number | null;
  currency: string;
  created_at: string;
}

const NFTWallet = () => {
  const { user } = useAuth();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedNFT, setSelectedNFT] = useState<UserNFT | null>(null);
  const [nfts, setNfts] = useState<UserNFT[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNFTs = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_nfts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setNfts((data as UserNFT[]) || []);
    } catch (err: any) {
      console.error("Error fetching NFTs:", err);
      toast.error("Failed to load NFTs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNFTs(); }, [user]);

  const totalValue = nfts.reduce((sum, nft) => sum + (nft.list_price || 0), 0);
  const collections = new Set(nfts.map(n => n.chain));

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Sign in to view your NFT wallet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total NFTs</p>
                <p className="text-3xl font-bold">{nfts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Listed Value</p>
                <p className="text-3xl font-bold text-green-500">{totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Image className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Chains</p>
                <p className="text-3xl font-bold">{collections.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Minted</p>
                <p className="text-3xl font-bold">{nfts.filter(n => n.mint_status === 'minted').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* NFT List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" /> My NFTs
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchNFTs}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant={view === 'grid' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setView('grid')}>
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button variant={view === 'list' ? 'default' : 'outline'} size="icon" className="h-8 w-8" onClick={() => setView('list')}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                <p className="text-muted-foreground mt-2">Loading NFTs...</p>
              </div>
            ) : nfts.length === 0 ? (
              <div className="py-12 text-center">
                <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No NFTs yet. Create one in the Create tab!</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                {view === 'grid' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {nfts.map((nft) => (
                      <div
                        key={nft.id}
                        className={`rounded-lg border overflow-hidden cursor-pointer hover:border-primary transition-colors ${
                          selectedNFT?.id === nft.id ? 'border-primary' : ''
                        }`}
                        onClick={() => setSelectedNFT(nft)}
                      >
                        <div className="aspect-square bg-muted flex items-center justify-center">
                          {nft.image_url ? (
                            <img src={nft.image_url} alt={nft.name} className="w-full h-full object-cover" />
                          ) : (
                            <Image className="h-12 w-12 text-muted-foreground" />
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-medium truncate">{nft.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{nft.chain}</p>
                          <div className="flex items-center justify-between mt-2">
                            <Badge variant="outline" className="text-xs">{nft.mint_status}</Badge>
                            {nft.ai_generated && (
                              <Badge variant="secondary" className="text-xs">AI</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nfts.map((nft) => (
                      <div
                        key={nft.id}
                        className={`p-4 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                          selectedNFT?.id === nft.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedNFT(nft)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded bg-muted flex items-center justify-center shrink-0">
                            {nft.image_url ? (
                              <img src={nft.image_url} alt={nft.name} className="w-full h-full object-cover rounded" />
                            ) : (
                              <Image className="h-8 w-8 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{nft.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{nft.chain} • {nft.royalty_percent}% royalty</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{nft.mint_status}</Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Selected NFT Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">NFT Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNFT ? (
              <div className="space-y-4">
                <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                  {selectedNFT.image_url ? (
                    <img src={selectedNFT.image_url} alt={selectedNFT.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Image className="h-24 w-24 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedNFT.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedNFT.description || "No description"}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge className="capitalize">{selectedNFT.chain}</Badge>
                  <Badge variant="outline">{selectedNFT.royalty_percent}% royalty</Badge>
                  <Badge variant="secondary">{selectedNFT.supply} ed.</Badge>
                </div>
                {selectedNFT.attributes && (selectedNFT.attributes as any[]).length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {(selectedNFT.attributes as any[]).map((attr: any, i: number) => (
                      <div key={i} className="p-2 rounded bg-muted/50 text-center">
                        <p className="text-xs text-muted-foreground">{attr.trait}</p>
                        <p className="font-medium text-sm">{attr.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="font-bold capitalize">{selectedNFT.mint_status}</p>
                  </div>
                  <div className="p-3 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-bold text-sm">{new Date(selectedNFT.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" /> Transfer
                  </Button>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" /> List for Sale
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select an NFT to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NFTWallet;
