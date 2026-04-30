import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Diamond, Flame, Clock, Eye, Gem, Star, Sparkles, MessageCircle, Copy, ExternalLink } from "lucide-react";
import { Twitter } from "@/lib/icons/brand-icons";
import { toast } from "sonner";

const COLLECTION = {
  name: "AIQTP Genesis Collection",
  description: "100 unique AI-generated artworks representing the birth of quantum-secured AI trading. Each piece is a 1-of-1 with embedded rarity traits.",
  totalSupply: 100,
  minted: 0,
  price: 0.25, // SOL
  currency: "SOL",
  maxPerWallet: 3,
};

const RARITY_TIERS = [
  { tier: "Legendary", count: 5, color: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30", pct: "5%" },
  { tier: "Epic", count: 15, color: "text-purple-400 bg-purple-500/20 border-purple-500/30", pct: "15%" },
  { tier: "Rare", count: 30, color: "text-blue-400 bg-blue-500/20 border-blue-500/30", pct: "30%" },
  { tier: "Common", count: 50, color: "text-muted-foreground bg-muted border-border", pct: "50%" },
];

const SAMPLE_NFTS = [
  { name: "Quantum Nexus #001", tier: "Legendary", emoji: "🌌", traits: ["Holographic", "Animated", "1-of-1"] },
  { name: "Neural Storm #012", tier: "Epic", emoji: "⚡", traits: ["Glitch", "Reactive", "Rare BG"] },
  { name: "Cipher Mind #034", tier: "Rare", emoji: "🧠", traits: ["Gradient", "Particle FX"] },
  { name: "Data Pulse #067", tier: "Common", emoji: "💎", traits: ["Static", "Clean"] },
  { name: "Void Walker #003", tier: "Legendary", emoji: "🕳️", traits: ["Animated", "Sound", "Ultra Rare"] },
  { name: "Photon Grid #022", tier: "Epic", emoji: "✨", traits: ["Neon", "Reactive"] },
];

const NFTDrop = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [mintCount, setMintCount] = useState(1);

  useEffect(() => {
    const dropDate = new Date();
    dropDate.setDate(dropDate.getDate() + 3); // 3-day countdown for urgency
    const timer = setInterval(() => {
      const diff = dropDate.getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getTierColor = (tier: string) => RARITY_TIERS.find(t => t.tier === tier)?.color || "";

  const share = () => {
    const text = `🎨 AIQTP Genesis Collection — 100 unique AI-generated NFTs dropping soon!\n\n💎 0.25 SOL mint\n🏆 5 Legendary 1-of-1s\n🔐 Post-Quantum secured\n\nhttps://aiqtp.lovable.app/nft-drop`;
    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-background to-primary/20" />
        <div className="relative max-w-4xl mx-auto px-4 py-12 text-center">
          <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30 text-sm px-4 py-1">
            <Diamond className="h-4 w-4 mr-1" /> LIMITED DROP
          </Badge>

          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-2">
            AIQTP Genesis Collection
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-6">
            {COLLECTION.description}
          </p>

          {/* Countdown */}
          <div className="flex justify-center gap-3 mb-8">
            {Object.entries(timeLeft).map(([key, val]) => (
              <div key={key} className="bg-card border border-border rounded-xl p-3 min-w-[65px]">
                <p className="text-2xl font-black text-primary">{String(val).padStart(2, "0")}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{key}</p>
              </div>
            ))}
          </div>

          {/* Mint Progress */}
          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Minted</span>
                <span className="font-bold text-foreground">{COLLECTION.minted} / {COLLECTION.totalSupply}</span>
              </div>
              <Progress value={(COLLECTION.minted / COLLECTION.totalSupply) * 100} className="h-3" />
            </CardContent>
          </Card>

          {/* Mint Box */}
          <Card className="max-w-sm mx-auto bg-gradient-to-b from-purple-500/5 to-card border-purple-500/20">
            <CardContent className="p-6">
              <p className="text-3xl font-black text-primary mb-1">{COLLECTION.price} SOL</p>
              <p className="text-xs text-muted-foreground mb-4">per NFT • max {COLLECTION.maxPerWallet} per wallet</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Button variant="outline" size="sm" onClick={() => setMintCount(Math.max(1, mintCount - 1))}>−</Button>
                <span className="text-xl font-bold text-foreground w-8 text-center">{mintCount}</span>
                <Button variant="outline" size="sm" onClick={() => setMintCount(Math.min(COLLECTION.maxPerWallet, mintCount + 1))}>+</Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Total: <span className="font-bold text-foreground">{(mintCount * COLLECTION.price).toFixed(2)} SOL</span>
              </p>
              <Button className="w-full text-lg py-6" size="lg" onClick={() => toast.info("Mint goes live at drop time — connect wallet & be ready!")}>
                <Sparkles className="h-5 w-5 mr-2" />
                Mint Now
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-3 mt-6">
            <Button variant="outline" size="sm" onClick={share}>
              <Twitter className="h-4 w-4 mr-1" /> Share
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.info("OpenSea / Magic Eden listing coming at drop")}>
              <ExternalLink className="h-4 w-4 mr-1" /> Marketplace
            </Button>
          </div>
        </div>
      </div>

      {/* Rarity Tiers */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-6">Rarity Tiers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {RARITY_TIERS.map(t => (
            <Card key={t.tier}>
              <CardContent className="p-4 text-center">
                <Badge variant="outline" className={`mb-2 ${t.color}`}>{t.tier}</Badge>
                <p className="text-2xl font-bold text-foreground">{t.count}</p>
                <p className="text-xs text-muted-foreground">{t.pct} of collection</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Preview Grid */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-6">Preview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SAMPLE_NFTS.map((nft, i) => (
            <Card key={i} className="overflow-hidden hover:border-primary/50 transition-colors">
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                <span className="text-6xl">{nft.emoji}</span>
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-bold text-foreground truncate">{nft.name}</p>
                  <Badge variant="outline" className={`text-[10px] ${getTierColor(nft.tier)}`}>{nft.tier}</Badge>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {nft.traits.map(t => (
                    <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NFTDrop;
