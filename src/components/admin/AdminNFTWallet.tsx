import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wallet,
  Image,
  Copyright,
  Bookmark,
  Crown,
  Sparkles,
  TrendingUp,
  DollarSign,
  Grid3x3,
  List,
  Search,
  Filter,
  Calendar,
  Layers,
  Zap,
  Shield,
  Star,
  Gem
} from "lucide-react";
import { INITIAL_COLLECTION, GeneratedNFT } from "@/lib/nft/premiumNFTGenerator";

const AdminNFTWallet = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedNFT, setSelectedNFT] = useState<GeneratedNFT | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('copyright');

  const allNFTs = useMemo(() => {
    return activeTab === 'copyright' 
      ? INITIAL_COLLECTION.copyrights 
      : INITIAL_COLLECTION.trademarks;
  }, [activeTab]);

  const filteredNFTs = useMemo(() => {
    return allNFTs.filter(nft => {
      const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRarity = rarityFilter === 'all' || nft.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    });
  }, [allNFTs, searchQuery, rarityFilter]);

  const stats = useMemo(() => {
    const all = [...INITIAL_COLLECTION.copyrights, ...INITIAL_COLLECTION.trademarks];
    return {
      total: all.length,
      copyrights: INITIAL_COLLECTION.copyrights.length,
      trademarks: INITIAL_COLLECTION.trademarks.length,
      totalValue: all.reduce((sum, nft) => sum + nft.estimatedValue, 0),
      legendary: all.filter(n => n.rarity === 'Legendary' || n.rarity === 'Mythic').length,
      listed: all.filter(n => n.status === 'listed').length
    };
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Mythic': return 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50 shadow-[0_0_15px_hsl(292,100%,50%,0.4)]';
      case 'Legendary': return 'bg-gold/20 text-gold border-gold/50 shadow-[0_0_15px_hsl(45,100%,50%,0.4)]';
      case 'Epic': return 'bg-royal-purple/20 text-royal-purple border-royal-purple/50';
      case 'Rare': return 'bg-royal-blue/20 text-royal-blue border-royal-blue/50';
      case 'Uncommon': return 'bg-accent/20 text-accent border-accent/50';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'copyright' ? Copyright : Bookmark;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-gold" />
            Admin NFT Vault
          </h2>
          <p className="text-muted-foreground">AIQTP™ Intellectual Property Collection</p>
        </div>
        <Badge variant="outline" className="border-gold/50 text-gold px-4 py-2">
          <Crown className="h-4 w-4 mr-2" />
          Founder's Collection
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="border-gold/20 bg-gradient-to-br from-gold/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/10">
                <Wallet className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total NFTs</p>
                <p className="text-2xl font-bold text-gold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-royal-blue/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-royal-blue/10">
                <Copyright className="h-5 w-5 text-royal-blue" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Copyrights</p>
                <p className="text-2xl font-bold text-royal-blue">{stats.copyrights}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-royal-purple/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-royal-purple/10">
                <Bookmark className="h-5 w-5 text-royal-purple" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trademarks</p>
                <p className="text-2xl font-bold text-royal-purple">{stats.trademarks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <DollarSign className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Est. Value</p>
                <p className="text-2xl font-bold text-accent">{stats.totalValue.toFixed(1)} ETH</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gold/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold/10">
                <Gem className="h-5 w-5 text-gold" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Legendary+</p>
                <p className="text-2xl font-bold text-gold">{stats.legendary}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-royal-red/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-royal-red/10">
                <TrendingUp className="h-5 w-5 text-royal-red" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collection</p>
                <p className="text-2xl font-bold text-royal-red">200/20K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="copyright" className="flex items-center gap-2">
              <Copyright className="h-4 w-4" />
              Copyrights ({INITIAL_COLLECTION.copyrights.length})
            </TabsTrigger>
            <TabsTrigger value="trademark" className="flex items-center gap-2">
              <Bookmark className="h-4 w-4" />
              Trademarks ({INITIAL_COLLECTION.trademarks.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select value={rarityFilter} onValueChange={setRarityFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarities</SelectItem>
                <SelectItem value="Common">Common</SelectItem>
                <SelectItem value="Uncommon">Uncommon</SelectItem>
                <SelectItem value="Rare">Rare</SelectItem>
                <SelectItem value="Epic">Epic</SelectItem>
                <SelectItem value="Legendary">Legendary</SelectItem>
                <SelectItem value="Mythic">Mythic</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant={view === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setView('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="copyright" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Copyright className="h-5 w-5 text-royal-blue" />
                  Copyright Collection
                </CardTitle>
                <CardDescription>100 of 10,000 minted • Protected IP assets</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {view === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredNFTs.map((nft) => (
                        <div
                          key={nft.id}
                          onClick={() => setSelectedNFT(nft)}
                          className={`rounded-xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                            selectedNFT?.id === nft.id 
                              ? 'border-gold ring-2 ring-gold/30' 
                              : 'border-border hover:border-gold/50'
                          }`}
                        >
                          <div className="aspect-square bg-gradient-to-br from-royal-blue/20 via-muted to-royal-purple/20 flex items-center justify-center relative">
                            <Image className="h-12 w-12 text-muted-foreground/50" />
                            <Badge className={`absolute top-2 right-2 text-xs ${getRarityColor(nft.rarity)}`}>
                              {nft.rarity}
                            </Badge>
                          </div>
                          <div className="p-3 bg-card">
                            <p className="font-medium text-sm truncate">{nft.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{nft.category}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-bold text-gold">{nft.estimatedValue.toFixed(3)} ETH</span>
                              <span className="text-xs text-muted-foreground">#{nft.edition}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredNFTs.map((nft) => (
                        <div
                          key={nft.id}
                          onClick={() => setSelectedNFT(nft)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedNFT?.id === nft.id 
                              ? 'border-gold bg-gold/5' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-royal-blue/20 to-royal-purple/20 flex items-center justify-center">
                              <Copyright className="h-6 w-6 text-royal-blue" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{nft.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{nft.category}</p>
                            </div>
                            <Badge className={`${getRarityColor(nft.rarity)}`}>{nft.rarity}</Badge>
                            <div className="text-right">
                              <p className="font-bold text-gold">{nft.estimatedValue.toFixed(3)} ETH</p>
                              <p className="text-xs text-muted-foreground">{nft.mintedDate}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* NFT Details Sidebar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">NFT Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedNFT ? (
                  <div className="space-y-4">
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-royal-blue/30 via-card to-royal-purple/30 flex items-center justify-center relative border border-gold/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {selectedNFT.type === 'copyright' ? (
                          <Copyright className="h-24 w-24 text-royal-blue/50" />
                        ) : (
                          <Bookmark className="h-24 w-24 text-royal-purple/50" />
                        )}
                      </div>
                      <Badge className={`absolute top-3 right-3 ${getRarityColor(selectedNFT.rarity)}`}>
                        <Star className="h-3 w-3 mr-1" />
                        {selectedNFT.rarity}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold">{selectedNFT.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedNFT.category}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-gold/50 text-gold">
                        <Layers className="h-3 w-3 mr-1" />
                        {selectedNFT.chain}
                      </Badge>
                      <Badge variant="outline">
                        Edition {selectedNFT.edition}/{selectedNFT.maxEdition.toLocaleString()}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Token ID</span>
                        <span className="font-mono text-xs">{selectedNFT.tokenId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Minted</span>
                        <span>{selectedNFT.mintedDate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rarity Score</span>
                        <span className="text-gold">{selectedNFT.rarityScore.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Attributes</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedNFT.attributes.slice(0, 8).map((attr, i) => (
                          <div key={i} className="p-2 rounded bg-muted/30 text-xs">
                            <p className="text-muted-foreground truncate">{attr.trait_type}</p>
                            <p className="font-medium truncate">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estimated Value</span>
                        <span className="text-xl font-bold text-gold">{selectedNFT.estimatedValue.toFixed(3)} ETH</span>
                      </div>
                      <Button className="w-full" variant="gold">
                        <Sparkles className="h-4 w-4 mr-2" />
                        List for Sale
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Shield className="h-4 w-4 mr-2" />
                        View Certificate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Image className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Select an NFT to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trademark" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bookmark className="h-5 w-5 text-royal-purple" />
                  Trademark Collection
                </CardTitle>
                <CardDescription>100 of 10,000 minted • Registered brand assets</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {view === 'grid' ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredNFTs.map((nft) => (
                        <div
                          key={nft.id}
                          onClick={() => setSelectedNFT(nft)}
                          className={`rounded-xl border overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                            selectedNFT?.id === nft.id 
                              ? 'border-gold ring-2 ring-gold/30' 
                              : 'border-border hover:border-gold/50'
                          }`}
                        >
                          <div className="aspect-square bg-gradient-to-br from-royal-purple/20 via-muted to-gold/20 flex items-center justify-center relative">
                            <Image className="h-12 w-12 text-muted-foreground/50" />
                            <Badge className={`absolute top-2 right-2 text-xs ${getRarityColor(nft.rarity)}`}>
                              {nft.rarity}
                            </Badge>
                          </div>
                          <div className="p-3 bg-card">
                            <p className="font-medium text-sm truncate">{nft.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{nft.category}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-sm font-bold text-gold">{nft.estimatedValue.toFixed(3)} ETH</span>
                              <span className="text-xs text-muted-foreground">#{nft.edition}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredNFTs.map((nft) => (
                        <div
                          key={nft.id}
                          onClick={() => setSelectedNFT(nft)}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            selectedNFT?.id === nft.id 
                              ? 'border-gold bg-gold/5' 
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-royal-purple/20 to-gold/20 flex items-center justify-center">
                              <Bookmark className="h-6 w-6 text-royal-purple" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{nft.name}</p>
                              <p className="text-sm text-muted-foreground truncate">{nft.category}</p>
                            </div>
                            <Badge className={`${getRarityColor(nft.rarity)}`}>{nft.rarity}</Badge>
                            <div className="text-right">
                              <p className="font-bold text-gold">{nft.estimatedValue.toFixed(3)} ETH</p>
                              <p className="text-xs text-muted-foreground">{nft.mintedDate}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* NFT Details Sidebar - Same as copyright */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">NFT Details</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedNFT ? (
                  <div className="space-y-4">
                    <div className="aspect-square rounded-xl bg-gradient-to-br from-royal-purple/30 via-card to-gold/30 flex items-center justify-center relative border border-gold/20">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Bookmark className="h-24 w-24 text-royal-purple/50" />
                      </div>
                      <Badge className={`absolute top-3 right-3 ${getRarityColor(selectedNFT.rarity)}`}>
                        <Star className="h-3 w-3 mr-1" />
                        {selectedNFT.rarity}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold">{selectedNFT.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedNFT.category}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-gold/50 text-gold">
                        <Layers className="h-3 w-3 mr-1" />
                        {selectedNFT.chain}
                      </Badge>
                      <Badge variant="outline">
                        Edition {selectedNFT.edition}/{selectedNFT.maxEdition.toLocaleString()}
                      </Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Token ID</span>
                        <span className="font-mono text-xs">{selectedNFT.tokenId}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Minted</span>
                        <span>{selectedNFT.mintedDate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rarity Score</span>
                        <span className="text-gold">{selectedNFT.rarityScore.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Attributes</p>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedNFT.attributes.slice(0, 8).map((attr, i) => (
                          <div key={i} className="p-2 rounded bg-muted/30 text-xs">
                            <p className="text-muted-foreground truncate">{attr.trait_type}</p>
                            <p className="font-medium truncate">{attr.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Estimated Value</span>
                        <span className="text-xl font-bold text-gold">{selectedNFT.estimatedValue.toFixed(3)} ETH</span>
                      </div>
                      <Button className="w-full" variant="gold">
                        <Sparkles className="h-4 w-4 mr-2" />
                        List for Sale
                      </Button>
                      <Button className="w-full" variant="outline">
                        <Shield className="h-4 w-4 mr-2" />
                        View Certificate
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Image className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground">Select an NFT to view details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNFTWallet;
