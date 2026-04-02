import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, TrendingUp, Users, DollarSign, Shield, Zap,
  BarChart3, Globe, ArrowRight, Star, Flame, Bot,
  Twitter, MessageCircle, Copy
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const LIVE_STATS = {
  totalVolume: "$2.4M+",
  activeStrategies: "150+",
  avgROI: "34.7%",
  users: "1,200+",
  uptime: "99.9%",
  chains: "5",
};

const EARNINGS_EXAMPLES = [
  { invested: "$100", monthly: "$34", yearly: "$416", icon: "🌱" },
  { invested: "$1,000", monthly: "$347", yearly: "$4,164", icon: "🌿" },
  { invested: "$10,000", monthly: "$3,470", yearly: "$41,640", icon: "🌳" },
  { invested: "$100,000", monthly: "$34,700", yearly: "$416,400", icon: "🏦" },
];

const SOCIAL_PROOF = [
  { name: "CryptoWhale", msg: "Best AI trading platform I've used. 40% ROI in 2 months.", avatar: "🐋" },
  { name: "DeFi_Sage", msg: "The quantum security alone is worth it. Plus the bots print.", avatar: "🧙" },
  { name: "TradingApe", msg: "Started with $500, now at $2,100. The strategies are legit.", avatar: "🦍" },
  { name: "NexusTrader", msg: "Federal charter pending? This is going to be huge.", avatar: "⚡" },
];

const ViralLanding = () => {
  const navigate = useNavigate();
  const [counter, setCounter] = useState(1247);

  // Simulated live user counter
  useEffect(() => {
    const timer = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const shareText = `🚀 I'm earning passive income with AI trading bots on @AIQTP\n\n📈 34.7% avg ROI\n🔐 Post-Quantum Security\n🏛️ Federal Banking Charter Pending\n\nJoin free 👇\nhttps://aiqtp.lovable.app`;

  const share = (platform: string) => {
    const urls: Record<string, string> = {
      twitter: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      copy: "",
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied! Paste anywhere to share.");
      return;
    }
    window.open(urls[platform], "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 bg-destructive/10 border-b border-destructive/20 py-2 px-4 text-center">
        <p className="text-sm text-foreground">
          <Flame className="h-4 w-4 inline mr-1 text-destructive" />
          <span className="font-bold">{counter.toLocaleString()}</span> people are trading right now
          <Button variant="link" className="text-primary ml-2 p-0 h-auto" onClick={() => navigate("/auth")}>
            Join Free →
          </Button>
        </p>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-green-500/10" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
            <TrendingUp className="h-3 w-3 mr-1" /> Avg {LIVE_STATS.avgROI} Monthly ROI
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4">
            Let AI Trade <span className="text-primary">For You</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Copy top AI trading strategies. Earn while you sleep. 
            Post-quantum secured. Federal banking charter pending.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
              <Rocket className="h-5 w-5 mr-2" /> Start Earning Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6" onClick={() => navigate("/launch")}>
              <DollarSign className="h-5 w-5 mr-2" /> Buy $AIQTP Token
            </Button>
          </div>

          {/* Live Stats */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {Object.entries(LIVE_STATS).map(([key, val]) => (
              <Card key={key}>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-primary">{val}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Earnings Calculator */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-2">💰 Earnings Potential</h2>
        <p className="text-center text-muted-foreground mb-6 text-sm">Based on {LIVE_STATS.avgROI} avg monthly ROI from top strategies</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EARNINGS_EXAMPLES.map((e, i) => (
            <Card key={i} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4 text-center">
                <span className="text-3xl mb-2 block">{e.icon}</span>
                <p className="text-sm text-muted-foreground">Invest {e.invested}</p>
                <p className="text-lg font-bold text-primary">{e.monthly}/mo</p>
                <p className="text-xs text-green-400">{e.yearly}/yr</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          *Projections based on historical performance. Past results don't guarantee future returns. Trading involves risk.
        </p>
      </div>

      {/* Social Proof */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-6">What Traders Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SOCIAL_PROOF.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{s.avatar}</span>
                  <div>
                    <p className="text-sm font-bold text-foreground">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.msg}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[1,2,3,4,5].map(n => <Star key={n} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Why AIQTP */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-6">Why AIQTP?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Bot, title: "AI Bots", desc: "150+ autonomous strategies" },
            { icon: Shield, title: "Quantum Secure", desc: "Post-quantum cryptography" },
            { icon: Globe, title: "Federal Charter", desc: "OCC banking license pending" },
            { icon: Zap, title: "Instant", desc: "Lightning-fast execution" },
          ].map((f, i) => (
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

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Card className="bg-gradient-to-r from-primary/20 to-green-500/20 border-primary/30">
          <CardContent className="p-8">
            <h3 className="text-3xl font-black text-foreground mb-2">Ready to Earn?</h3>
            <p className="text-muted-foreground mb-6">Join thousands of traders using AI to grow their wealth.</p>
            <Button size="lg" className="text-lg px-12 py-6 mb-4" onClick={() => navigate("/auth")}>
              <Rocket className="h-5 w-5 mr-2" /> Start Free Now
            </Button>
            <div className="flex justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => share("twitter")}>
                <Twitter className="h-4 w-4 mr-1" /> Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => share("copy")}>
                <Copy className="h-4 w-4 mr-1" /> Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViralLanding;
