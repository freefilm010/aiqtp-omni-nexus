import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Image,
  Send,
  Download,
  ExternalLink,
  Grid3x3,
  List,
  TrendingUp,
  DollarSign
} from "lucide-react";

interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  chain: string;
  floorPrice: number;
  lastPrice: number;
  rarity: string;
}

const mockNFTs: NFT[] = [
  { id: '1', name: 'Bored Ape #1234', collection: 'BAYC', image: '', chain: 'Ethereum', floorPrice: 28.5, lastPrice: 32.1, rarity: 'Rare' },
  { id: '2', name: 'Azuki #5678', collection: 'Azuki', image: '', chain: 'Ethereum', floorPrice: 8.2, lastPrice: 9.5, rarity: 'Common' },
  { id: '3', name: 'DeGod #9012', collection: 'DeGods', image: '', chain: 'Solana', floorPrice: 45.0, lastPrice: 48.0, rarity: 'Legendary' },
  { id: '4', name: 'Pudgy #3456', collection: 'Pudgy Penguins', image: '', chain: 'Ethereum', floorPrice: 12.3, lastPrice: 14.0, rarity: 'Uncommon' },
  { id: '5', name: 'Mad Lad #7890', collection: 'Mad Lads', image: '', chain: 'Solana', floorPrice: 120.0, lastPrice: 125.0, rarity: 'Epic' },
  { id: '6', name: 'CryptoPunk #1111', collection: 'CryptoPunks', image: '', chain: 'Ethereum', floorPrice: 52.0, lastPrice: 55.0, rarity: 'Legendary' },
];

const NFTWallet = () => {
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);

  const totalValue = mockNFTs.reduce((sum, nft) => sum + nft.floorPrice, 0);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'text-amber-500 border-amber-500';
      case 'Epic': return 'text-purple-500 border-purple-500';
      case 'Rare': return 'text-blue-500 border-blue-500';
      case 'Uncommon': return 'text-green-500 border-green-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wallet className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total NFTs</p>
                <p className="text-3xl font-bold">{mockNFTs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Portfolio Value</p>
                <p className="text-3xl font-bold text-green-500">{totalValue.toFixed(1)} ETH</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Image className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Collections</p>
                <p className="text-3xl font-bold">{new Set(mockNFTs.map(n => n.collection)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                <p className="text-3xl font-bold text-green-500">+12.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* NFT List */}
        <Card className="col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                My NFTs
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={view === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === 'list' ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setView('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {view === 'grid' ? (
                <div className="grid grid-cols-3 gap-4">
                  {mockNFTs.map((nft) => (
                    <div
                      key={nft.id}
                      className={`rounded-lg border overflow-hidden cursor-pointer hover:border-primary transition-colors ${
                        selectedNFT?.id === nft.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        <Image className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="p-3">
                        <p className="font-medium truncate">{nft.name}</p>
                        <p className="text-xs text-muted-foreground">{nft.collection}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-bold">{nft.floorPrice} ETH</span>
                          <Badge variant="outline" className={`text-xs ${getRarityColor(nft.rarity)}`}>
                            {nft.rarity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {mockNFTs.map((nft) => (
                    <div
                      key={nft.id}
                      className={`p-4 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                        selectedNFT?.id === nft.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded bg-muted flex items-center justify-center">
                          <Image className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{nft.name}</p>
                          <p className="text-sm text-muted-foreground">{nft.collection}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{nft.floorPrice} ETH</p>
                          <Badge variant="outline" className={getRarityColor(nft.rarity)}>
                            {nft.rarity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
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
                  <Image className="h-24 w-24 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedNFT.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedNFT.collection}</p>
                </div>
                <div className="flex gap-2">
                  <Badge>{selectedNFT.chain}</Badge>
                  <Badge variant="outline" className={getRarityColor(selectedNFT.rarity)}>
                    {selectedNFT.rarity}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Floor Price</p>
                    <p className="font-bold">{selectedNFT.floorPrice} ETH</p>
                  </div>
                  <div className="p-3 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Last Sale</p>
                    <p className="font-bold">{selectedNFT.lastPrice} ETH</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Transfer
                  </Button>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    List for Sale
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
