import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, Shield, Zap, Globe, Bot, Copy, GitBranch, Code2, LineChart,
} from "lucide-react";
import { Twitter } from "@/lib/icons/brand-icons";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Honest beta-stage facts only. No performance claims, no fabricated user counts,
// no charter language, no testimonials we don't have.
const PLATFORM_FACTS = [
  { label: "Brokers wired", value: "10+", note: "Alpaca, Tradier, Binance, Kraken, IBKR, Hyperliquid, +" },
  { label: "Stage", value: "Beta", note: "Private beta, invite-only" },
  { label: "Stack", value: "React 19 / FastAPI", note: "Modern, open-source" },
  { label: "Crypto", value: "PQ-ready", note: "ML-KEM + ML-DSA roadmap" },
];

const FEATURE_HIGHLIGHTS = [
  { icon: LineChart, title: "Multi-Asset Signals", desc: "Crypto, equities, options — one terminal" },
  { icon: Bot, title: "Strategy Builder", desc: "Compose, backtest, deploy" },
  { icon: Shield, title: "Post-Quantum Roadmap", desc: "NIST ML-KEM + ML-DSA wallet path" },
  { icon: Code2, title: "Open Architecture", desc: "Bring your own broker keys" },
];

const ViralLanding = () => {
  const navigate = useNavigate();

  // No fake "live user counter" — that was deceptive UX.

  const shareText = `Checking out AIQTP — multi-broker AI trading terminal currently in private beta.

→ React 19 / FastAPI stack
→ Post-quantum wallet path (ML-KEM + ML-DSA)
→ Bring your own broker keys

https://www.aiqtp.com`;

  const share = (platform: string) => {
    if (platform === "copy") {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied! Paste anywhere to share.");
      return;
    }
    const urls: Record<string, string> = {
      twitter: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
    };
    window.open(urls[platform], "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Top Bar — honest beta banner */}
      <div className="sticky top-0 z-50 bg-primary/10 border-b border-primary/20 py-2 px-4 text-center">
        <p className="text-sm text-foreground">
          <GitBranch className="h-4 w-4 inline mr-1 text-primary" />
          <span className="font-bold">Private beta</span> — building in public, no fabricated metrics
          <Button variant="link" className="text-primary ml-2 p-0 h-auto" onClick={() => navigate("/auth")}>
            Request access →
          </Button>
        </p>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-green-500/10" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30">
            <GitBranch className="h-3 w-3 mr-1" /> Private beta — early access
          </Badge>

          <h1 className="text-4xl md:text-6xl font-black text-foreground mb-4">
            AI-Powered <span className="text-primary">Trading Terminal</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Multi-broker terminal with AI signals, strategy builder, and a
            post-quantum wallet roadmap. Built by a solo founder. Currently in private beta.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
              <Rocket className="h-5 w-5 mr-2" /> Request beta access
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => window.open("https://github.com/freefilm010/aiqtp-omni-nexus", "_blank")}
            >
              <Code2 className="h-5 w-5 mr-2" /> View on GitHub
            </Button>
          </div>

          {/* Platform facts — honest */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PLATFORM_FACTS.map((f) => (
              <Card key={f.label}>
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-primary">{f.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{f.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* What you actually get in beta — replaces the unrealistic earnings projector */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-2">What's in the beta</h2>
        <p className="text-center text-muted-foreground mb-6 text-sm">
          What we can ship today. No projections, no promises — just the features that work.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURE_HIGHLIGHTS.map((f, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex gap-3 items-start">
                <f.icon className="h-6 w-6 mt-1 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
          AIQTP is a trading tools platform. It is not a broker-dealer, investment adviser, bank,
          or stablecoin issuer. Trading carries risk of loss. Past performance does not predict
          future results. You are responsible for your own trades and your own broker accounts.
        </p>
      </div>

      {/* Roadmap — honest "here's what we're building" instead of fake testimonials */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-foreground mb-6">Roadmap</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <Badge className="mb-2 bg-green-500/20 text-green-400 border-green-500/30">Shipped</Badge>
              <p className="text-sm text-muted-foreground">
                Multi-broker terminal · Strategy builder · Supabase backend ·
                CI security pipeline (Semgrep, CodeQL, Trivy, OSV, GitGuardian)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Badge className="mb-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">In progress</Badge>
              <p className="text-sm text-muted-foreground">
                Beta access program · Honest subscription tiers · Post-quantum wallet (ML-KEM + ML-DSA) ·
                Real performance attestations
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Badge className="mb-2 bg-blue-500/20 text-blue-400 border-blue-500/30">Researching</Badge>
              <p className="text-sm text-muted-foreground">
                Quantum-themed stablecoin (regulatory path TBD) ·
                EIP submissions for post-quantum migration ·
                State PPSI licensing under GENIUS Act
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Final CTA — invitation, not earnings promise */}
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Card className="bg-gradient-to-r from-primary/20 to-green-500/20 border-primary/30">
          <CardContent className="p-8">
            <h3 className="text-3xl font-black text-foreground mb-2">Want in on the beta?</h3>
            <p className="text-muted-foreground mb-6">
              Request access. We'll add you to the waitlist and invite you when we have capacity.
            </p>
            <Button size="lg" className="text-lg px-12 py-6 mb-4" onClick={() => navigate("/auth")}>
              <Rocket className="h-5 w-5 mr-2" /> Request beta access
            </Button>
            <div className="flex justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => share("twitter")}>
                <Twitter className="h-4 w-4 mr-1" /> Share
              </Button>
              <Button variant="ghost" size="sm" onClick={() => share("copy")}>
                <Copy className="h-4 w-4 mr-1" /> Copy link
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViralLanding;
