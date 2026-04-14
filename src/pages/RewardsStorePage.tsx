import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Gift, ShoppingBag, Plane, Cpu, Coins, Trophy,
  Star, Crown, Lock, CheckCircle2, Package,
  Shirt, Watch, Monitor, Palmtree, Sparkles
} from "lucide-react";

interface RewardItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  value_usd: number;
  qtc_price: number | null;
  points_price: number | null;
  tier_required: string;
  stock_quantity: number | null;
  redeemed_count: number;
  is_active: boolean;
  is_seasonal: boolean;
}

const categoryConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  merch: { icon: <Shirt className="h-5 w-5" />, label: "Merch", color: "text-purple-400" },
  swag: { icon: <ShoppingBag className="h-5 w-5" />, label: "Swag", color: "text-pink-400" },
  trip: { icon: <Plane className="h-5 w-5" />, label: "Trips", color: "text-sky-400" },
  experience: { icon: <Palmtree className="h-5 w-5" />, label: "Experiences", color: "text-emerald-400" },
  hardware: { icon: <Monitor className="h-5 w-5" />, label: "Hardware", color: "text-slate-300" },
  qtc_tokens: { icon: <Coins className="h-5 w-5" />, label: "$QTC Tokens", color: "text-amber-400" },
  platform_credit: { icon: <Sparkles className="h-5 w-5" />, label: "Credits", color: "text-primary" },
  nft: { icon: <Star className="h-5 w-5" />, label: "NFTs", color: "text-orange-400" },
  vehicle: { icon: <Trophy className="h-5 w-5" />, label: "Vehicles", color: "text-cyan-400" },
  home: { icon: <Crown className="h-5 w-5" />, label: "Dream Home", color: "text-yellow-400" },
};

const tierColors: Record<string, string> = {
  any: "border-border",
  bronze: "border-orange-500/40",
  silver: "border-slate-400/40",
  gold: "border-amber-400/40",
  platinum: "border-purple-400/40",
  diamond: "border-cyan-400/40 ring-1 ring-cyan-400/10",
};

const tierLabels: Record<string, string> = {
  any: "Everyone",
  bronze: "Bronze+",
  silver: "Silver+",
  gold: "Gold+",
  platinum: "Platinum+",
  diamond: "Diamond",
};

const RewardsStorePage = () => {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<RewardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    const { data } = await supabase
      .from("rewards_catalog")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    setRewards((data as unknown as RewardItem[]) || []);
    setLoading(false);
  };

  const handleRedeem = async (reward: RewardItem, method: "qtc_tokens" | "points") => {
    if (!user) { toast.error("Sign in to redeem rewards"); return; }
    setRedeeming(true);
    const amount = method === "qtc_tokens" ? reward.qtc_price : reward.points_price;
    const { error } = await supabase.from("reward_redemptions").insert({
      user_id: user.id,
      reward_id: reward.id,
      payment_method: method,
      amount_paid: amount || 0,
      currency: method === "qtc_tokens" ? "QTC" : "PTS",
    });
    if (error) {
      if (error.message?.includes("budget")) toast.error("Annual rewards budget reached — try again next year!");
      else if (error.message?.includes("locked")) toast.error("Rewards are temporarily locked");
      else toast.error("Redemption failed");
    } else {
      toast.success(`🎉 ${reward.name} redeemed! We'll process your order shortly.`);
      setSelectedReward(null);
      fetchRewards();
    }
    setRedeeming(false);
  };

  const filtered = filter === "all" ? rewards : rewards.filter(r => r.category === filter);
  const categories = [...new Set(rewards.map(r => r.category))];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight flex items-center justify-center gap-3">
            <Gift className="h-8 w-8 text-primary" />
            Rewards Store
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Trade like a pro, earn like a champion. Redeem $QTC tokens and points for merch, trips, hardware, and more.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <Badge variant="outline" className="border-emerald-500 text-emerald-500">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Budget-Capped at 10% of Annual Profits
            </Badge>
            <Badge variant="outline" className="border-primary text-primary">
              {rewards.length} Rewards Available
            </Badge>
          </div>
        </div>

        {/* Category Filter */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList className="flex flex-wrap h-auto gap-1 justify-center">
            <TabsTrigger value="all" className="text-xs gap-1">
              <ShoppingBag className="h-3 w-3" /> All
            </TabsTrigger>
            {categories.map(cat => {
              const cfg = categoryConfig[cat];
              return cfg ? (
                <TabsTrigger key={cat} value={cat} className="text-xs gap-1">
                  {cfg.icon} {cfg.label}
                </TabsTrigger>
              ) : null;
            })}
          </TabsList>
        </Tabs>

        {/* Rewards Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(reward => {
              const cfg = categoryConfig[reward.category] || categoryConfig.merch;
              const soldOut = reward.stock_quantity !== null && reward.redeemed_count >= reward.stock_quantity;
              const isExclusive = reward.tier_required !== "any";
              return (
                <Card
                  key={reward.id}
                  className={`transition-all hover:shadow-lg hover:scale-[1.01] ${tierColors[reward.tier_required] || ""} ${soldOut ? "opacity-60" : ""}`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={cfg.color}>{cfg.icon}</span>
                        <div>
                          <CardTitle className="text-sm leading-tight">{reward.name}</CardTitle>
                          <Badge variant="outline" className="text-[9px] mt-1">{cfg.label}</Badge>
                        </div>
                      </div>
                      {isExclusive && (
                        <Badge variant="outline" className="text-[9px] shrink-0 border-amber-400 text-amber-400">
                          <Lock className="h-2.5 w-2.5 mr-0.5" /> {tierLabels[reward.tier_required]}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <p className="text-xs text-muted-foreground line-clamp-2">{reward.description}</p>
                    
                    <div className="flex items-baseline gap-2">
                      {reward.qtc_price && (
                        <span className="text-lg font-black font-mono text-amber-400">
                          {reward.qtc_price.toLocaleString()} <span className="text-xs">$QTC</span>
                        </span>
                      )}
                      {reward.points_price && (
                        <span className="text-xs text-muted-foreground">
                          or {reward.points_price.toLocaleString()} pts
                        </span>
                      )}
                      {!reward.qtc_price && !reward.points_price && (
                        <span className="text-sm font-bold text-muted-foreground">Contest/Giveaway Only</span>
                      )}
                    </div>
                    
                    <div className="text-[10px] text-muted-foreground">
                      Value: ${reward.value_usd.toLocaleString()}
                      {reward.stock_quantity && (
                        <span className="ml-2">• {Math.max(0, reward.stock_quantity - reward.redeemed_count)} left</span>
                      )}
                    </div>

                    {soldOut ? (
                      <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                        <Package className="h-3 w-3 mr-1" /> Sold Out
                      </Button>
                    ) : reward.qtc_price || reward.points_price ? (
                      <Button
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setSelectedReward(reward)}
                      >
                        <Gift className="h-3 w-3 mr-1" /> Redeem
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                        <Trophy className="h-3 w-3 mr-1" /> Win to Claim
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Budget Transparency */}
        <Card className="mt-8 max-w-2xl mx-auto bg-muted/30">
          <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
            <h4 className="font-medium text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> 
              Budget-Capped Rewards
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>10% Annual Cap</strong> — Total giveaways and rewards never exceed 10% of the platform's annual taxable profit.</li>
              <li><strong>Automated Guard</strong> — A database-level trigger blocks any redemption that would exceed the budget.</li>
              <li><strong>Profit-First</strong> — Rewards only flow when the platform is profitable. No debt-funded prizes.</li>
              <li><strong>Tax-Compliant</strong> — All prize values are reported. Winners receive applicable tax documentation.</li>
              <li><strong>$QTC Token Value</strong> — Earning and spending $QTC in the rewards store creates real demand and utility for the native token.</li>
            </ul>
          </CardContent>
        </Card>
      </main>
      <Footer />

      {/* Redemption Dialog */}
      <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Redeem: {selectedReward?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedReward && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
              <div className="text-xs text-muted-foreground">
                Value: ${selectedReward.value_usd.toLocaleString()} • Tier: {tierLabels[selectedReward.tier_required]}
              </div>
              <div className="space-y-2">
                {selectedReward.qtc_price && (
                  <Button
                    className="w-full"
                    onClick={() => handleRedeem(selectedReward, "qtc_tokens")}
                    disabled={redeeming}
                  >
                    <Coins className="h-4 w-4 mr-2" />
                    {redeeming ? "Processing..." : `Pay ${selectedReward.qtc_price.toLocaleString()} $QTC`}
                  </Button>
                )}
                {selectedReward.points_price && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleRedeem(selectedReward, "points")}
                    disabled={redeeming}
                  >
                    <Star className="h-4 w-4 mr-2" />
                    {redeeming ? "Processing..." : `Pay ${selectedReward.points_price.toLocaleString()} Points`}
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Physical items require shipping details — we'll email you after redemption.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RewardsStorePage;
