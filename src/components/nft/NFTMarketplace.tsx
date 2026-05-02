import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NFT_FEES } from "@/lib/fees/platformFees";
import {
  ShoppingCart, Search, Image, Heart, TrendingUp, Clock, Sparkles, Check, DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  isAuction: boolean;
}

const NFTMarketplace = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [chainFilter, setChainFilter] = useState("all");
  const [liked, setLiked] = useState<string[]>([]);
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadListings = useCallback(async () => {
    // Load from auto_nft_generations (the existing NFT table)
    const { data } = await supabase
      .from("auto_nft_generations")
      .select("*")
      .eq("mint_status", "minted")
      .order("created_at", { ascending: false })
      .limit(50) as any;

    if (data) {
      setListings(data.map((nft: any) => ({
        id: nft.id,
        name: nft.name,
        collection: 'Platform NFTs',
        price: Number(nft.list_price) || 0,
        currency: nft.currency || 'ETH',
        seller: nft.user_id?.slice(0, 8) || 'Unknown',
        image: nft.image_url || '',
        rarity: 'Unique',
        likes: 0,
        chain: nft.chain || 'Ethereum',
        isAuction: false,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  const filteredListings = listings
    .filter(l => {
      const matchesSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                           l.collection.toLowerCase().includes(search.toLowerCase());
      const matchesChain = chainFilter === 'all' || l.chain.toLowerCase() === chainFilter;
      return matchesSearch && matchesChain;
    })
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Fee Banner */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="font-medium">$0 to list</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium">{NFT_FEES.saleFee * 100}% sale fee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium">Up to {NFT_FEES.royaltyMax * 100}% creator royalties</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search NFTs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={chainFilter} onValueChange={setChainFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Chain" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Listed</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      {loading ? (
        <p className="text-center text-muted-foreground py-8">Loading marketplace...</p>
      ) : filteredListings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No NFTs listed yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create and mint NFTs in the NFT Studio to list them here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden hover:border-primary transition-colors">
              <div className="relative">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {listing.image ? (
                    <img src={listing.image} alt={listing.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <Image className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => setLiked(prev => 
                    prev.includes(listing.id) ? prev.filter(id => id !== listing.id) : [...prev, listing.id]
                  )}
                >
                  <Heart className={`h-4 w-4 ${liked.includes(listing.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
              </div>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{listing.collection}</p>
                <p className="font-medium truncate">{listing.name}</p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-bold">{listing.price > 0 ? `${listing.price} ${listing.currency}` : 'Not listed'}</p>
                  </div>
                  {listing.price > 0 && <Button size="sm">Buy Now</Button>}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>{listing.chain}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTMarketplace;
