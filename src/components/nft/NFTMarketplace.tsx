import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NFT_FEES } from "@/lib/fees/platformFees";
import {
  ShoppingCart,
  Search,
  Image,
  Heart,
  TrendingUp,
  Clock,
  Filter,
  Grid3x3,
  Sparkles,
  Check,
  DollarSign
} from "lucide-react";

interface NFTListing {
  id: string;
  name: string;
  collection: string;
  price: number;
  currency: string;
  seller: string;
  image: string;
  rarity: string;
  likes: number;
  chain: string;
  endTime?: Date;
  isAuction: boolean;
}

const mockListings: NFTListing[] = [
  { id: '1', name: 'Cosmic Voyager #42', collection: 'Cosmic Collection', price: 2.5, currency: 'ETH', seller: '0x1234...5678', image: '', rarity: 'Epic', likes: 124, chain: 'Ethereum', isAuction: false },
  { id: '2', name: 'Digital Dreams #88', collection: 'Dreams', price: 0.8, currency: 'ETH', seller: '0x2345...6789', image: '', rarity: 'Rare', likes: 89, chain: 'Ethereum', isAuction: true, endTime: new Date(Date.now() + 3600000) },
  { id: '3', name: 'Neon Genesis #156', collection: 'Neon Art', price: 150, currency: 'SOL', seller: '0x3456...7890', image: '', rarity: 'Legendary', likes: 456, chain: 'Solana', isAuction: false },
  { id: '4', name: 'Abstract Mind #7', collection: 'Abstract', price: 1.2, currency: 'ETH', seller: '0x4567...8901', image: '', rarity: 'Common', likes: 34, chain: 'Polygon', isAuction: false },
  { id: '5', name: 'Future City #23', collection: 'Cyberpunk', price: 5.0, currency: 'ETH', seller: '0x5678...9012', image: '', rarity: 'Epic', likes: 267, chain: 'Ethereum', isAuction: true, endTime: new Date(Date.now() + 7200000) },
  { id: '6', name: 'Ocean Depths #99', collection: 'Nature', price: 0.5, currency: 'ETH', seller: '0x6789...0123', image: '', rarity: 'Uncommon', likes: 56, chain: 'Base', isAuction: false },
];

const NFTMarketplace = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [chainFilter, setChainFilter] = useState("all");
  const [liked, setLiked] = useState<string[]>([]);

  const filteredListings = mockListings
    .filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                           l.collection.toLowerCase().includes(search.toLowerCase());
      const matchesChain = chainFilter === 'all' || l.chain.toLowerCase() === chainFilter;
      return matchesSearch && matchesChain;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'likes') return b.likes - a.likes;
      return 0;
    });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'bg-amber-500';
      case 'Epic': return 'bg-purple-500';
      case 'Rare': return 'bg-blue-500';
      case 'Uncommon': return 'bg-green-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Fee Banner */}
      <Card className="border-success/30 bg-success/5">
        <CardContent className="py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-success" />
                <span className="font-medium">$0 to list</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="font-medium">{NFT_FEES.saleFee * 100}% sale fee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-success" />
                <span className="font-medium">Up to {NFT_FEES.royaltyMax * 100}% creator royalties</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>vs OpenSea 2.5%</span>
              <Badge variant="outline" className="text-success border-success">We're cheaper</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured */}
      <Card className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <Badge className="mb-2 bg-gradient-to-r from-purple-500 to-pink-500">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured Collection
              </Badge>
              <h2 className="text-2xl font-bold">Cosmic Voyagers</h2>
              <p className="text-muted-foreground mt-1">Explore the universe through digital art</p>
              <div className="flex gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Floor Price</p>
                  <p className="text-xl font-bold">2.5 ETH</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="text-xl font-bold">1,234 ETH</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Items</p>
                  <p className="text-xl font-bold">10,000</p>
                </div>
              </div>
            </div>
            <Button size="lg">
              View Collection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search NFTs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={chainFilter} onValueChange={setChainFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="base">Base</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Listed</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      <div className="grid grid-cols-4 gap-4">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="overflow-hidden hover:border-primary transition-colors">
            <div className="relative">
              <div className="aspect-square bg-muted flex items-center justify-center">
                <Image className="h-16 w-16 text-muted-foreground" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                onClick={() => setLiked(prev => 
                  prev.includes(listing.id) 
                    ? prev.filter(id => id !== listing.id)
                    : [...prev, listing.id]
                )}
              >
                <Heart className={`h-4 w-4 ${liked.includes(listing.id) ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
              <Badge className={`absolute top-2 left-2 ${getRarityColor(listing.rarity)}`}>
                {listing.rarity}
              </Badge>
              {listing.isAuction && (
                <div className="absolute bottom-2 left-2 right-2 bg-background/90 rounded px-2 py-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span className="text-xs">Ends in 1h 23m</span>
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{listing.collection}</p>
              <p className="font-medium truncate">{listing.name}</p>
              <div className="flex items-center justify-between mt-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {listing.isAuction ? 'Current Bid' : 'Price'}
                  </p>
                  <p className="font-bold">{listing.price} {listing.currency}</p>
                </div>
                <Button size="sm">
                  {listing.isAuction ? 'Place Bid' : 'Buy Now'}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>{listing.chain}</span>
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {listing.likes}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NFTMarketplace;
