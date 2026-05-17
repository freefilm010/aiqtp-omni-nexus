import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { TrendingUp, Zap, DollarSign, Upload, ShoppingCart, ImageIcon } from "lucide-react";

const NFTS = [
  { id: 1, name: "Quantum Arbitrage Bot #001", desc: "HFT arbitrage using Grover's algorithm. 95.2% win rate over 10,000 trades.", price: "0.5 ETH", profitability: "95.2%", trades: "10,000+", owner: "0x1234...5678" },
  { id: 2, name: "Quantum Market Maker #042",  desc: "Automated market making with quantum-enhanced liquidity optimization.", price: "0.8 ETH", profitability: "92.8%", trades: "25,000+", owner: "0xabcd...efgh" },
  { id: 3, name: "MEV Extraction Bot #007",    desc: "Maximal Extractable Value bot with quantum transaction ordering.", price: "1.2 ETH", profitability: "98.1%", trades: "5,000+",  owner: "0x9876...5432" },
  { id: 4, name: "Grid Trading Strategy #128", desc: "Multi-pair grid trading with dynamic range adjustment.", price: "0.3 ETH", profitability: "89.5%", trades: "15,000+", owner: "0xdef0...1234" },
  { id: 5, name: "Flash Loan Arbitrage #099",  desc: "Cross-exchange flash loan arbitrage with zero capital requirement.", price: "2.0 ETH", profitability: "96.7%", trades: "8,000+",  owner: "0x5555...6666" },
  { id: 6, name: "Momentum Trading Bot #256",  desc: "AI-powered momentum detection with quantum signal processing.", price: "0.6 ETH", profitability: "91.3%", trades: "20,000+", owner: "0x7777...8888" },
];

export default function StrategyNFTMarketplace() {
  const { user } = useAuth();
  const [mintOpen, setMintOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleBuy = (nft: typeof NFTS[0]) => {
    if (!user) { toast.error("Sign in to purchase"); return; }
    toast.success(`Purchase queued: ${nft.name} for ${nft.price} — blockchain integration pending`);
  };

  const handleMint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error("Sign in to mint"); return; }
    toast.success("NFT minted! Blockchain integration pending for mainnet.");
    setMintOpen(false);
  };

  const NFTCard = ({ nft }: { nft: typeof NFTS[0] }) => (
    <Card className="hover:border-primary/50 transition-all overflow-hidden group">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-muted-foreground bg-gradient-to-br from-purple-900/40 to-blue-900/40">
          {nft.id}
        </div>
        <div className="absolute top-2 right-2">
          <Badge className="bg-green-500/90 text-white">{nft.profitability}</Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{nft.name}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">{nft.desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Trades</span><span className="font-semibold">{nft.trades}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-mono text-xs">{nft.owner}</span></div>
          <div className="flex justify-between items-center pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground">Price</div>
              <div className="text-xl font-bold">{nft.price}</div>
            </div>
            <Button onClick={() => handleBuy(nft)} size="sm">
              <ShoppingCart className="mr-2 h-4 w-4" />Buy
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Strategy NFT Marketplace</h1>
            <p className="text-muted-foreground mt-1">Trade tokenized strategies • 10% creator royalties • ERC-721</p>
          </div>
          <Dialog open={mintOpen} onOpenChange={setMintOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Upload className="mr-2 h-4 w-4" />Mint NFT
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Mint Trading Strategy NFT</DialogTitle>
                <DialogDescription>Tokenize your trading strategy as an ERC-721 NFT</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleMint} className="space-y-4 mt-2">
                <div><Label>Strategy Name</Label><Input placeholder="Quantum Arbitrage Bot #001" required /></div>
                <div><Label>Description</Label><Textarea placeholder="Describe your strategy..." required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Win Rate (%)</Label><Input type="number" step="0.1" placeholder="95.2" required /></div>
                  <div><Label>Total Trades</Label><Input type="number" placeholder="10000" required /></div>
                </div>
                <div>
                  <Label>NFT Image (optional)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50" onClick={() => document.getElementById("nft-img-upload")?.click()}>
                    {imagePreview ? <img src={imagePreview} alt="Preview of NFT strategy artwork" className="max-h-32 mx-auto rounded" loading="lazy" /> : <><ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" /><p className="text-sm text-muted-foreground">Click to upload</p></>}
                    <input id="nft-img-upload" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">Mint NFT (0.01 ETH)</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Volume", val: "127.5 ETH", icon: DollarSign },
            { label: "Floor Price",  val: "0.3 ETH",   icon: TrendingUp },
            { label: "Total NFTs",   val: String(NFTS.length), icon: ImageIcon },
            { label: "Owners",       val: "42",         icon: Zap },
          ].map(s => (
            <Card key={s.label}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><s.icon className="h-4 w-4 text-muted-foreground" />{s.label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{s.val}</div></CardContent>
            </Card>
          ))}
        </div>

        {/* Listings */}
        <Tabs defaultValue="all">
          <TabsList><TabsTrigger value="all">All NFTs</TabsTrigger><TabsTrigger value="listed">Listed</TabsTrigger><TabsTrigger value="mine">My NFTs</TabsTrigger></TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {NFTS.map(nft => <NFTCard key={nft.id} nft={nft} />)}
            </div>
          </TabsContent>

          <TabsContent value="listed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {NFTS.map(nft => <NFTCard key={nft.id} nft={nft} />)}
            </div>
          </TabsContent>

          <TabsContent value="mine" className="mt-6">
            <div className="text-center py-12 text-muted-foreground">
              {user ? (
                <><ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" /><p className="mb-4">You don't own any NFTs yet</p><Button onClick={() => setMintOpen(true)}>Mint Your First NFT</Button></>
              ) : (
                <p>Sign in to view your NFTs</p>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Info cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { title: "Creator Royalties", body: "Earn 10% royalties on every resale forever. Passive income from your strategies.", icon: TrendingUp, color: "purple" },
            { title: "ERC-721 Standard",  body: "Fully compliant ERC-721 with EIP-2981 royalty standard. Compatible with all major marketplaces.", icon: Zap, color: "blue" },
            { title: "2.5% Platform Fee", body: "Low platform fee on sales. All proceeds go directly to creators minus royalties.", icon: DollarSign, color: "green" },
          ].map(c => (
            <Card key={c.title} className={`border-${c.color}-500/30`}>
              <CardHeader><CardTitle className="flex items-center gap-2"><c.icon className={`h-5 w-5 text-${c.color}-400`} />{c.title}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{c.body}</p></CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
