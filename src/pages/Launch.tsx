import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Rocket, TrendingUp, Users, Flame, Copy, ExternalLink,
  Zap, Shield, BarChart3, Globe, Twitter, MessageCircle
} from "lucide-react";
import { toast } from "sonner";

const TOKEN_DATA = {
  name: "AIQTP",
  symbol: "$AIQTP",
  tagline: "The AI Quantum Trading Protocol",
  description: "First AI-powered quantum trading platform with post-quantum security. Federal banking charter pending. 51-state enterprise network.",
  contractAddress: "Coming Soon",
  chain: "Solana",
  totalSupply: "1,000,000,000",
  price: 0.001,
  marketCap: "$1,000,000",
  holders: 0,
  liquidity: "$0",
  launched: false,
  website: "https://aiqtp.lovable.app",
  twitter: "https://x.com/aiqtp",
  telegram: "https://t.me/aiqtp",
};

const TOKENOMICS = [
  { label: "Public Sale", pct: 40, color: "bg-primary" },
  { label: "Liquidity Pool", pct: 25, color: "bg-blue-500" },
  { label: "Team & Dev", pct: 15, color: "bg-purple-500" },
  { label: "Treasury", pct: 10, color: "bg-yellow-500" },
  { label: "Community Rewards", pct: 10, color: "bg-green-500" },
];

const FEATURES = [
  { icon: Shield, title: "Post-Quantum Security", desc: "ML-KEM & ML-DSA cryptography" },
  { icon: BarChart3, title: "AI Trading Bots", desc: "Autonomous strategy marketplace" },
  { icon: Zap, title: "Lightning Fast", desc: "Sub-second execution on Solana" },
  { icon: Globe, title: "Federal Charter", desc: "OCC banking license pending" },
];

const MemeCoinLaunch = () => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [buyAmount, setBuyAmount] = useState(1);

  // Countdown to a launch date (7 days from now for urgency)
  useEffect(() => {
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + 7);
    
    const timer = setInterval(() => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const copyContract = () => {
    navigator.clipboard.writeText(TOKEN_DATA.contractAddress);
    toast.success("Contract address copied!");
  };

  const share = (platform: string) => {
    const text = `🚀 $AIQTP — The AI Quantum Trading Protocol is launching!\n\n🧠 AI Trading Bots\n🔐 Post-Quantum Security\n🏛️ Federal Banking Charter Pending\n⚡ Built on Solana\n\n${TOKEN_DATA.website}`;
    const urls: Record<string, string> = {
      twitter: `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(TOKEN_DATA.website)}&text=${encodeURIComponent(text)}`,
    };
    window.open(urls[platform], "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-accent/20" />
        <div className="relative max-w-4xl mx-auto px-4 py-12 text-center">
          <Badge className="mb-4 bg-destructive/20 text-destructive border-destructive/30 text-sm px-4 py-1">
            <Flame className="h-4 w-4 mr-1" /> PRESALE LIVE
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-2">
            {TOKEN_DATA.symbol}
          </h1>
          <p className="text-xl md:text-2xl text-primary font-bold mb-2">
            {TOKEN_DATA.tagline}
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            {TOKEN_DATA.description}
          </p>

          {/* Countdown */}
          <div className="flex justify-center gap-3 mb-8">
            {Object.entries(timeLeft).map(([key, val]) => (
              <div key={key} className="bg-card border border-border rounded-xl p-3 min-w-[70px]">
                <p className="text-2xl md:text-3xl font-black text-primary">{String(val).padStart(2, "0")}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{key}</p>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{TOKEN_DATA.marketCap}</p>
              <p className="text-xs text-muted-foreground">Market Cap</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{TOKEN_DATA.totalSupply}</p>
              <p className="text-xs text-muted-foreground">Total Supply</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-primary">${TOKEN_DATA.price}</p>
              <p className="text-xs text-muted-foreground">Presale Price</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{TOKEN_DATA.chain}</p>
              <p className="text-xs text-muted-foreground">Network</p>
            </CardContent></Card>
          </div>

          {/* Buy Section */}
          <Card className="max-w-md mx-auto bg-gradient-to-b from-primary/5 to-card border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">🚀 Get $AIQTP</h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[0.5, 1, 5, 10].map(amt => (
                  <Button
                    key={amt}
                    variant={buyAmount === amt ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBuyAmount(amt)}
                  >
                    {amt} SOL
                  </Button>
                ))}
              </div>
              <div className="text-center mb-4">
                <p className="text-sm text-muted-foreground">You receive</p>
                <p className="text-2xl font-black text-primary">
                  {(buyAmount / TOKEN_DATA.price).toLocaleString()} $AIQTP
                </p>
              </div>
              <Button className="w-full text-lg py-6" size="lg" onClick={() => toast.info("Token contract deploying soon — join Telegram for launch alert!")}>
                <Rocket className="h-5 w-5 mr-2" />
                Buy $AIQTP
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Connect Phantom/Solflare wallet to purchase
              </p>
            </CardContent>
          </Card>

          {/* Share Buttons */}
          <div className="flex justify-center gap-3 mt-6">
            <Button variant="outline" size="sm" onClick={() => share("twitter")}>
              <Twitter className="h-4 w-4 mr-1" /> Share on X
            </Button>
            <Button variant="outline" size="sm" onClick={() => share("telegram")}>
              <MessageCircle className="h-4 w-4 mr-1" /> Telegram
            </Button>
            <Button variant="outline" size="sm" onClick={copyContract}>
              <Copy className="h-4 w-4 mr-1" /> Copy CA
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">Why $AIQTP?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <Card key={i}>
              <CardContent className="p-4 text-center">
                <f.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-bold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Tokenomics */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">Tokenomics</h2>
        <Card>
          <CardContent className="p-6 space-y-3">
            {TOKENOMICS.map((t, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-foreground font-medium">{t.label}</span>
                  <span className="text-muted-foreground">{t.pct}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${t.color} rounded-full`} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* CTA Footer */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Card className="bg-gradient-to-r from-primary/20 to-accent/20 border-primary/30">
          <CardContent className="p-8">
            <Rocket className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold text-foreground mb-2">Don't Miss the Launch</h3>
            <p className="text-muted-foreground mb-6">Join the community. Get early access. Be part of the future of AI trading.</p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => window.open(TOKEN_DATA.twitter, "_blank")}>
                <Twitter className="h-4 w-4 mr-2" /> Follow on X
              </Button>
              <Button variant="outline" onClick={() => window.open(TOKEN_DATA.telegram, "_blank")}>
                <MessageCircle className="h-4 w-4 mr-2" /> Join Telegram
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MemeCoinLaunch;
