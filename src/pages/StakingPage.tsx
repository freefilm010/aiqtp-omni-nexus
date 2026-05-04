import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { TrendingUp, Lock, Coins, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PlatformStaking } from "@/components/staking/PlatformStaking";

interface UserStake {
  id: string;
  token_symbol: string;
  token_name: string;
  amount_staked: number;
  apy: number;
  lock_days: number;
  lock_until: string;
  expected_reward: number;
  actual_reward: number;
  status: string;
  created_at: string;
}

export default function StakingPage() {
  const [stakes, setStakes] = useState<UserStake[]>([]);
  const [loading, setLoading] = useState(true);
  const [unstaking, setUnstaking] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from("user_stakes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) toast.error("Failed to load stakes");
    else setStakes((data as UserStake[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUnstake = async (stakeId: string) => {
    setUnstaking(stakeId);
    try {
      const { error } = await supabase.rpc("unstake", { p_stake_id: stakeId });
      if (error) toast.error("Unstake failed", { description: error.message });
      else { toast.success("Unstaked successfully — rewards credited"); load(); }
    } finally {
      setUnstaking(null);
    }
  };

  const activeStakes = stakes.filter(s => s.status === "active");
  const totalStaked = activeStakes.reduce((s, r) => s + Number(r.amount_staked), 0);
  const totalExpected = activeStakes.reduce((s, r) => s + Number(r.expected_reward), 0);

  const daysLeft = (lockUntil: string) => {
    const d = Math.ceil((new Date(lockUntil).getTime() - Date.now()) / 86400000);
    return d > 0 ? `${d}d left` : "Unlocked";
  };

  const statusColor = (s: UserStake) => {
    if (s.status === "completed") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (new Date(s.lock_until) < new Date()) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Staking</h1>
            <p className="text-muted-foreground mt-1">Lock platform tokens to earn passive rewards</p>
          </div>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Coins className="h-3 w-3" /> Active Stakes
              </div>
              <div className="text-2xl font-bold">{activeStakes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Lock className="h-3 w-3" /> Total Locked (tokens)
              </div>
              <div className="text-2xl font-bold">
                {totalStaked.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3 w-3" /> Expected Rewards
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {totalExpected.toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="stake" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
            <TabsTrigger value="positions">
              My Positions
              {activeStakes.length > 0 && (
                <Badge className="ml-2 h-4 px-1 text-[10px] bg-primary">{activeStakes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="stake">
            <PlatformStaking />
          </TabsContent>

          <TabsContent value="positions">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading positions...</div>
            ) : activeStakes.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Lock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No active stakes yet. Go to Stake Tokens to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {activeStakes.map(stake => {
                  const unlocked = new Date(stake.lock_until) <= new Date();
                  return (
                    <Card key={stake.id} className="border-border hover:border-primary/30 transition-colors">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{stake.token_symbol}</CardTitle>
                          <Badge className={statusColor(stake)}>
                            <Clock className="h-3 w-3 mr-1" />
                            {daysLeft(stake.lock_until)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{stake.token_name}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-muted-foreground text-xs">Staked</div>
                            <div className="font-mono font-bold">
                              {Number(stake.amount_staked).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">APY</div>
                            <div className="font-bold text-emerald-400">{stake.apy}%</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Expected Reward</div>
                            <div className="font-mono text-emerald-400">
                              {Number(stake.expected_reward).toFixed(4)} {stake.token_symbol}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-xs">Lock Period</div>
                            <div>{stake.lock_days} days</div>
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          variant={unlocked ? "default" : "outline"}
                          disabled={!unlocked || unstaking === stake.id}
                          onClick={() => handleUnstake(stake.id)}
                        >
                          {unstaking === stake.id ? "Processing..." : unlocked ? "Unstake & Claim Rewards" : "Locked"}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading...</div>
            ) : stakes.filter(s => s.status !== "active").length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No completed stakes yet.</div>
            ) : (
              <div className="space-y-2">
                {stakes.filter(s => s.status !== "active").map(stake => (
                  <Card key={stake.id}>
                    <CardContent className="py-3 flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium">{stake.token_symbol}</span>
                        <span className="text-muted-foreground ml-2">
                          {Number(stake.amount_staked).toFixed(2)} staked
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-400 font-mono text-xs">
                          +{Number(stake.actual_reward).toFixed(4)} reward
                        </span>
                        <Badge variant={stake.status === "completed" ? "default" : "destructive"}>
                          {stake.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
