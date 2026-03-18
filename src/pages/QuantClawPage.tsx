import Header from "@/components/Header";
import StoreListingAutomation from "@/components/admin/StoreListingAutomation";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Brain, FlaskConical, Shield, Search, Zap, GitBranch, BarChart3, Lock, AlertTriangle, Megaphone, Share2, Mail, Calendar, Loader2 } from "lucide-react";
import StrategyBacktest from "@/components/strategy/StrategyBacktest";
import AIAgentLeaderboard from "@/components/trading/AIAgentLeaderboard";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AGENT_TOOLS_DEV = [
  { name: "search_trading_code", desc: "RAG search across Tier 1+2 trading repos", icon: Search },
  { name: "search_quant_research", desc: "RAG search across quant & ML repos", icon: Brain },
  { name: "search_onchain", desc: "On-chain contract & protocol search", icon: GitBranch },
  { name: "freqtrade_backtest", desc: "Run strategy backtests", icon: FlaskConical },
  { name: "freqtrade_optimize", desc: "Hyperparameter optimization", icon: Zap },
  { name: "ccxt_sim_order", desc: "Paper trading simulation", icon: BarChart3 },
  { name: "social_media_post", desc: "Create & schedule posts for X/Twitter, LinkedIn, Threads", icon: Share2 },
  { name: "marketing_campaign", desc: "Generate campaigns: email, airdrop, referral, influencer", icon: Megaphone },
  { name: "content_generator", desc: "Blog posts, press releases, newsletters for aiqtp.com", icon: Mail },
  { name: "campaign_scheduler", desc: "Schedule multi-channel campaigns with analytics", icon: Calendar },
];

const AGENT_TOOLS_PROD = [
  { name: "ccxt_live_order", desc: "Live order (admin-gated, ≤2% position)", icon: AlertTriangle, restricted: true },
];

const TIER_DATA = [
  { tier: 1, label: "Core Trading Brain", count: 27, color: "text-green-400", desc: "Default corpus — your platforms, strategies, ML" },
  { tier: 2, label: "Infra & On-Chain", count: 16, color: "text-blue-400", desc: "APIs, exchanges, smart contracts" },
  { tier: 3, label: "Frameworks & Research", count: 30, color: "text-muted-foreground", desc: "Opt-in only — LLMs, quantum, deep learning" },
];

const QuantClawPage = () => {
  const [activeAgent, setActiveAgent] = useState<"dev" | "prod">("dev");
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [marketingResult, setMarketingResult] = useState("");
  const [marketingTopic, setMarketingTopic] = useState("");
  const [marketingPlatform, setMarketingPlatform] = useState("twitter");
  const [marketingAction, setMarketingAction] = useState<"generate_post" | "generate_campaign" | "generate_content">("generate_post");

  const handleMarketing = async () => {
    setMarketingLoading(true);
    setMarketingResult("");
    try {
      const { data, error } = await supabase.functions.invoke("quantclaw-marketing", {
        body: {
          action: marketingAction,
          platform: marketingPlatform,
          topic: marketingTopic || "AIQTP quantum trading platform features",
          tone: "professional",
          targetAudience: "crypto traders and quant developers",
        },
      });
      if (error) throw error;
      setMarketingResult(data?.content || "No content generated");
      toast.success("Content generated successfully");
    } catch (e: any) {
      toast.error(e.message || "Failed to generate content");
    } finally {
      setMarketingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(225,20%,6%)]">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">QuantClaw Command Center</h1>
            <p className="text-muted-foreground">
              Unified agent layer • RAG-powered • 73 repos indexed across 3 tiers
            </p>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="flex gap-3 mb-6">
          <Button
            variant={activeAgent === "dev" ? "default" : "outline"}
            onClick={() => setActiveAgent("dev")}
            className="gap-2"
          >
            <Brain className="h-4 w-4" />
            QuantClaw-Dev
            <Badge variant="secondary" className="ml-1">Active</Badge>
          </Button>
          <Button
            variant={activeAgent === "prod" ? "default" : "outline"}
            onClick={() => setActiveAgent("prod")}
            className="gap-2"
          >
            <Shield className="h-4 w-4" />
            QuantClaw-Prod
            <Badge variant="outline" className="ml-1 border-destructive text-destructive">Restricted</Badge>
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[hsl(223,18%,9%)] border border-[hsl(222,14%,17%)] flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="marketing">Marketing</TabsTrigger>
            <TabsTrigger value="store-listings">Store Listings</TabsTrigger>
            <TabsTrigger value="rag">RAG Corpus</TabsTrigger>
            <TabsTrigger value="tools">Agent Tools</TabsTrigger>
            <TabsTrigger value="backtest">Backtest</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {TIER_DATA.map(t => (
                <Card key={t.tier} className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-lg ${t.color}`}>Tier {t.tier}: {t.label}</CardTitle>
                    <CardDescription>{t.desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <span className="text-3xl font-bold text-foreground">{t.count}</span>
                    <span className="text-muted-foreground ml-2">repos</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
              <CardHeader>
                <CardTitle>
                  {activeAgent === "dev" ? "QuantClaw-Dev" : "QuantClaw-Prod"} Agent
                </CardTitle>
                <CardDescription>
                  {activeAgent === "dev"
                    ? "Research, code assistance, strategy exploration, backtests, simulated trades"
                    : "Tightly controlled live trading with safety constraints"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AGENT_TOOLS_DEV.map(tool => (
                    <div key={tool.name} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50">
                      <tool.icon className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium text-foreground truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.desc}</p>
                      </div>
                    </div>
                  ))}
                  {activeAgent === "prod" && AGENT_TOOLS_PROD.map(tool => (
                    <div key={tool.name} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                      <tool.icon className="h-5 w-5 text-destructive shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-mono font-medium text-foreground truncate">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.desc}</p>
                        <div className="flex gap-1 mt-1">
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">≤2% position</Badge>
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">5/hr limit</Badge>
                          <Badge variant="outline" className="text-[10px] border-destructive/30 text-destructive">Admin gate</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {activeAgent === "dev" && (
                  <div className="mt-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-destructive shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      <span className="text-destructive font-medium">ccxt_live_order</span> is blocked on Dev agent — switch to Prod for live trading
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="marketing">
            <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  Social Media & Marketing Engine
                </CardTitle>
                <CardDescription>
                  AI-powered content generation for www.aiqtp.com — posts, campaigns, newsletters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Action</label>
                    <Select value={marketingAction} onValueChange={(v) => setMarketingAction(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generate_post">Social Media Post</SelectItem>
                        <SelectItem value="generate_campaign">Full Campaign</SelectItem>
                        <SelectItem value="generate_content">Blog / Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Platform</label>
                    <Select value={marketingPlatform} onValueChange={setMarketingPlatform}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="twitter">X / Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="threads">Threads</SelectItem>
                        <SelectItem value="blog">Blog Post</SelectItem>
                        <SelectItem value="email">Email / Newsletter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Topic</label>
                    <Input
                      placeholder="e.g. $QTC token launch, quantum trading..."
                      value={marketingTopic}
                      onChange={(e) => setMarketingTopic(e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleMarketing}
                  disabled={marketingLoading}
                  className="gap-2"
                >
                  {marketingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                  {marketingLoading ? "Generating..." : "Generate Content"}
                </Button>

                {marketingResult && (
                  <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-foreground">Generated Content</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(marketingResult);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
                      {marketingResult}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="store-listings">
            <StoreListingAutomation />
          </TabsContent>

          <TabsContent value="rag">
            <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
              <CardHeader>
                <CardTitle>RAG Corpus — 73 Repositories</CardTitle>
                <CardDescription>
                  Tier 1 is always searched • Tier 2 added for infra/API queries • Tier 3 opt-in only
                </CardDescription>
              </CardHeader>
              <CardContent>
                {TIER_DATA.map(t => (
                  <div key={t.tier} className="mb-6">
                    <h3 className={`text-sm font-semibold ${t.color} mb-2`}>
                      Tier {t.tier} — {t.label} ({t.count} repos)
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">{t.desc}</p>
                  </div>
                ))}
                <div className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                  <p className="text-xs text-yellow-400">
                    ⚠️ <strong>exploit-uniswap</strong> is tagged as <strong>REFERENCE ONLY</strong> — never used to propose or execute exploits
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools">
            <div className="grid gap-4">
              <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
                <CardHeader>
                  <CardTitle>Tool → Service Mapping</CardTitle>
                  <CardDescription>Every QuantClaw tool maps to an existing platform service</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {[
                      ["search_trading_code", "qaqi-agent edge function"],
                      ["search_quant_research", "aiqtp-agent edge function"],
                      ["freqtrade_backtest", "Strategy Studio + generate-strategy"],
                      ["freqtrade_optimize", "ml-predictions + factor engine"],
                      ["ccxt_sim_order", "ccxt-trading (paper mode)"],
                      ["ccxt_live_order", "ccxt-trading (live, admin-gated)"],
                      ["social_media_post", "quantclaw-marketing (Lovable AI)"],
                      ["marketing_campaign", "quantclaw-marketing (campaign engine)"],
                      ["content_generator", "quantclaw-marketing (content AI)"],
                      ["campaign_scheduler", "automation_templates + webhooks"],
                      ["factor_generation", "generate-factors edge function"],
                      ["portfolio_optimize", "portfolio/optimization.ts"],
                    ].map(([tool, service]) => (
                      <div key={tool} className="flex items-center justify-between p-2 rounded bg-background/30">
                        <code className="text-primary text-xs">{tool}</code>
                        <span className="text-muted-foreground text-xs">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="backtest">
            <StrategyBacktest />
          </TabsContent>

          <TabsContent value="leaderboard">
            <AIAgentLeaderboard />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default QuantClawPage;
