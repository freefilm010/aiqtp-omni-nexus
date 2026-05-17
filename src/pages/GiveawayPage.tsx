import { useState, useEffect, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Trophy, Home, Car, Coins, Zap, Gift, Users,
  Copy, Share2, CheckCircle2, Star, Crown, Medal,
  ArrowRight, Sparkles, TrendingUp, Clock
} from "lucide-react";

interface Prize {
  id: string;
  tier: string;
  name: string;
  description: string | null;
  value_usd: number;
  quantity: number;
  min_referrals: number;
  prize_type: string;
  sort_order: number;
}

interface Campaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  total_prize_pool: number;
  funded_amount: number;
  funding_status: string;
  starts_at: string | null;
  ends_at: string | null;
}

interface Entry {
  id: string;
  referral_code: string;
  verified_referral_count: number;
  current_tier: string;
}

const tierConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  jackpot: { icon: <Crown className="h-6 w-6" />, color: "text-yellow-400", bg: "bg-gradient-to-br from-yellow-500/20 to-amber-600/10", border: "border-yellow-500/50 ring-2 ring-yellow-500/20" },
  grand: { icon: <Star className="h-6 w-6" />, color: "text-sky-400", bg: "bg-gradient-to-br from-sky-500/20 to-cyan-600/10", border: "border-sky-500/40" },
  gold: { icon: <Trophy className="h-6 w-6" />, color: "text-amber-400", bg: "bg-gradient-to-br from-amber-500/15 to-orange-500/10", border: "border-amber-500/30" },
  silver: { icon: <Medal className="h-6 w-6" />, color: "text-slate-300", bg: "bg-gradient-to-br from-slate-400/15 to-slate-500/10", border: "border-slate-400/30" },
  bronze: { icon: <Zap className="h-6 w-6" />, color: "text-orange-400", bg: "bg-gradient-to-br from-orange-500/15 to-red-500/10", border: "border-orange-500/30" },
  entry: { icon: <Gift className="h-6 w-6" />, color: "text-emerald-400", bg: "bg-gradient-to-br from-emerald-500/15 to-green-500/10", border: "border-emerald-500/30" },
};

const GiveawayPage = () => {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    fetchCampaign();
  }, []);

  useEffect(() => {
    if (user && campaign) fetchEntry();
  }, [user, campaign]);

  const fetchCampaign = async () => {
    const { data: campaigns } = await supabase
      .from("giveaway_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);
    if (campaigns && campaigns.length > 0) {
      const c = campaigns[0] as unknown as Campaign;
      setCampaign(c);
      const { data: prizeData } = await supabase
        .from("giveaway_prizes")
        .select("*")
        .eq("campaign_id", c.id)
        .order("sort_order");
      setPrizes((prizeData as unknown as Prize[]) || []);
    }
    setLoading(false);
  };

  const fetchEntry = async () => {
    if (!user || !campaign) return;
    const { data } = await supabase
      .from("giveaway_entries")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) setEntry(data as unknown as Entry);
  };

  const handleEnter = async () => {
    if (!user || !campaign) {
      toast.error("Sign in to enter the giveaway");
      return;
    }
    setEntering(true);
    const code = `AIQTP-${user.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const { data, error } = await supabase
      .from("giveaway_entries")
      .insert({ campaign_id: campaign.id, user_id: user.id, referral_code: code })
      .select()
      .single();
    if (error) {
      toast.error(error.code === "23505" ? "You're already entered!" : "Failed to enter");
    } else {
      setEntry(data as unknown as Entry);
      toast.success("🎉 You're in! Share your referral code to climb tiers!");
    }
    setEntering(false);
  };

  const copyReferralLink = () => {
    if (!entry) return;
    const link = `${window.location.origin}/giveaway?ref=${entry.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const fundingPercent = campaign ? Math.min((campaign.funded_amount / campaign.total_prize_pool) * 100, 100) : 0;

  const currentTierIndex = useMemo(() => {
    if (!entry) return -1;
    const tiers = ["entry", "bronze", "silver", "gold", "grand", "jackpot"];
    return tiers.indexOf(entry.current_tier);
  }, [entry]);

  const nextTierPrize = useMemo(() => {
    if (!entry) return null;
    const tiers = ["entry", "bronze", "silver", "gold", "grand", "jackpot"];
    const nextIdx = tiers.indexOf(entry.current_tier) + 1;
    if (nextIdx >= tiers.length) return null;
    return prizes.find(p => p.tier === tiers[nextIdx]);
  }, [entry, prizes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Funded 100% from platform profits — zero cost to you
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            <span className="bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 bg-clip-text text-transparent">
              $2M Dream Giveaway
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {campaign?.description}
          </p>

          {/* Funding Progress */}
          <Card className="max-w-lg mx-auto bg-card/50 backdrop-blur">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Prize Pool Funding
                </span>
                <span className="font-mono font-bold">
                  ${campaign?.funded_amount?.toLocaleString() || "0"} / ${campaign?.total_prize_pool?.toLocaleString()}
                </span>
              </div>
              <Progress value={fundingPercent} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {campaign?.funding_status === "accruing"
                  ? "Accruing from platform profits — giveaway launches when fully funded"
                  : campaign?.funding_status === "partially_funded"
                  ? "Partially funded — growing every day from platform revenue"
                  : "Fully funded — giveaway is live!"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tier Ladder */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-center mb-2">Referral Tier System</h2>
          <p className="text-center text-muted-foreground mb-6">
            More referrals = higher tier = bigger prizes. Everyone qualifies for entry-level prizes just by joining.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map(prize => {
              const tc = tierConfig[prize.tier] || tierConfig.entry;
              const qualified = entry && entry.verified_referral_count >= prize.min_referrals;
              return (
                <Card key={prize.id} className={`relative overflow-hidden transition-all hover:scale-[1.02] ${tc.bg} ${tc.border} ${qualified ? "ring-2 ring-emerald-500/30" : ""}`}>
                  {prize.tier === "jackpot" && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500" />
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className={tc.color}>{tc.icon}</span>
                        <div>
                          <CardTitle className="text-base">{prize.name}</CardTitle>
                          <Badge variant="outline" className={`text-[10px] mt-1 ${tc.color}`}>
                            {prize.tier.toUpperCase()} TIER
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black font-mono">${prize.value_usd.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{prize.quantity} winner{prize.quantity > 1 ? "s" : ""}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground mb-3">{prize.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">
                          {prize.min_referrals === 0 ? "No referrals needed" : `${prize.min_referrals}+ referrals`}
                        </span>
                      </div>
                      {qualified && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Qualified
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* User's Status / Enter */}
        <div className="max-w-2xl mx-auto mb-12">
          {!user ? (
            <Card className="text-center bg-primary/5 border-primary/20">
              <CardContent className="p-8 space-y-4">
                <Gift className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-xl font-bold">Sign Up to Enter — It's Free</h3>
                <p className="text-muted-foreground">
                  Create an account to get your unique referral code and start earning entries toward the Dream Giveaway.
                </p>
                <Button size="lg" onClick={() => window.location.href = "/auth"}>
                  Sign Up Now <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ) : !entry ? (
            <Card className="text-center bg-primary/5 border-primary/20">
              <CardContent className="p-8 space-y-4">
                <Sparkles className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-xl font-bold">Enter the Dream Giveaway</h3>
                <p className="text-muted-foreground">
                  Get your unique referral code instantly. Every qualified referral moves you up a tier.
                </p>
                <Button size="lg" onClick={handleEnter} disabled={entering}>
                  {entering ? "Entering..." : "Enter Now — It's Free"} <Gift className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Your Status</p>
                    <p className="text-lg font-bold flex items-center gap-2">
                      {tierConfig[entry.current_tier]?.icon}
                      <span className={tierConfig[entry.current_tier]?.color}>
                        {entry.current_tier.toUpperCase()} TIER
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Verified Referrals</p>
                    <p className="text-2xl font-black">{entry.verified_referral_count}</p>
                  </div>
                </div>

                {nextTierPrize && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Next tier unlock</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{nextTierPrize.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {nextTierPrize.min_referrals - entry.verified_referral_count} more referrals needed
                      </span>
                    </div>
                    <Progress
                      value={(entry.verified_referral_count / nextTierPrize.min_referrals) * 100}
                      className="h-2 mt-2"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Your Referral Link</p>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`${window.location.origin}/giveaway?ref=${entry.referral_code}`}
                      className="font-mono text-xs"
                    />
                    <Button aria-label="Copy referral link" variant="outline" size="icon" onClick={copyReferralLink}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button aria-label="Share referral link on X" variant="outline" size="icon" onClick={() => {
                      const url = `${window.location.origin}/giveaway?ref=${entry.referral_code}`;
                      const text = "I just entered the AIQTP $2M Dream Giveaway! 🏠🚗 Sign up with my link:";
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
                    }}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* How it Works */}
        <div className="max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-center mb-6">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Sign Up Free", desc: "Create your AIQTP account — instant entry into the giveaway", icon: <Gift className="h-6 w-6" /> },
              { step: "2", title: "Get Your Code", desc: "Receive a unique referral link to share with friends and followers", icon: <Copy className="h-6 w-6" /> },
              { step: "3", title: "Climb Tiers", desc: "Each verified referral moves you up — unlocking bigger prize pools", icon: <TrendingUp className="h-6 w-6" /> },
              { step: "4", title: "Win Big", desc: "Winners drawn from qualified tier pools — highest tiers, biggest prizes", icon: <Crown className="h-6 w-6" /> },
            ].map(s => (
              <Card key={s.step} className="text-center">
                <CardContent className="p-4 space-y-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    {s.icon}
                  </div>
                  <h4 className="font-bold text-sm">{s.title}</h4>
                  <p className="text-xs text-muted-foreground">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Fine Print */}
        <Card className="max-w-3xl mx-auto bg-muted/30">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
            <h4 className="font-medium text-foreground text-sm">Important Details</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>All prize money is funded entirely from platform profits. The giveaway launches only when fully funded.</li>
              <li>Dream Home Credit ($1.5M) and Dream Vehicle Credit ($150K) are applied toward the purchase of your chosen property/vehicle.</li>
              <li>Referrals must create a verified account and remain active for 30+ days to count.</li>
              <li>Winners are selected via verifiable random drawing from each qualified tier pool.</li>
              <li>One entry per person. Multiple/fraudulent accounts will be disqualified.</li>
              <li>No purchase necessary. Void where prohibited. Tax obligations are the winner's responsibility.</li>
              <li>AIQTP™ reserves the right to modify campaign terms. Full rules available upon launch.</li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default GiveawayPage;
