import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, TrendingUp, Clock, Coins, Zap } from "lucide-react";
import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase = _supabase as any;

interface StakingPool {
  token: string;
  symbol: string;
  apy: number;
  lockPeriod: string;
  lockDays: number;
  totalStaked: string;
  minStake: number;
  color: string;
}

const STAKING_POOLS: StakingPool[] = [
  {
    token: "QuantClaw Token",
    symbol: "QTC",
    apy: 12.5,
    lockPeriod: "30 days",
    lockDays: 30,
    totalStaked: "2.4M QTC",
    minStake: 100,
    color: "text-blue-400",
  },
  {
    token: "AI Quant Token",
    symbol: "AIQ",
    apy: 18.0,
    lockPeriod: "90 days",
    lockDays: 90,
    totalStaked: "1.8M AIQ",
    minStake: 50,
    color: "text-purple-400",
  },
  {
    token: "Nexus Token",
    symbol: "NXS",
    apy: 24.0,
    lockPeriod: "180 days",
    lockDays: 180,
    totalStaked: "950K NXS",
    minStake: 25,
    color: "text-emerald-400",
  },
  {
    token: "QTC-AIQ LP",
    symbol: "QTC-AIQ",
    apy: 35.0,
    lockPeriod: "90 days",
    lockDays: 90,
    totalStaked: "420K LP",
    minStake: 10,
    color: "text-amber-400",
  },
];

export const PlatformStaking = () => {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [staking, setStaking] = useState<string | null>(null);

  const handleStake = async (pool: StakingPool) => {
    const amount = Number(amounts[pool.symbol] || 0);
    if (amount < pool.minStake) {
      toast.error(`Minimum stake is ${pool.minStake} ${pool.symbol}`);
      return;
    }

    setStaking(pool.symbol);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Sign in to stake"); return; }

      const lockUntil = new Date(Date.now() + pool.lockDays * 86400000).toISOString();
      const { error } = await supabase.from("user_stakes").insert({
        user_id: user.id,
        token_symbol: pool.symbol,
        token_name: pool.token,
        amount_staked: amount,
        apy: pool.apy,
        lock_days: pool.lockDays,
        lock_until: lockUntil,
        status: "active",
        expected_reward: (amount * pool.apy * pool.lockDays) / 100 / 365,
      });
      if (error) throw error;

      // Record in platform_revenue (non-fatal if it fails)
      const { error: feeErr } = await supabase.from("platform_revenue").insert({
        source_type: "staking_lock",
        source_category: "staking",
        amount: amount * 0.005, // 0.5% platform fee on staked amount
        currency: pool.symbol,
        status: "pending",
      });
      if (feeErr) console.warn("platform_revenue insert failed:", feeErr.message);

      toast.success(`Staked ${amount} ${pool.symbol} at ${pool.apy}% APY for ${pool.lockPeriod}`);
      setAmounts((prev) => ({ ...prev, [pool.symbol]: "" }));
    } catch (e: unknown) {
      toast.error("Staking failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setStaking(null);
    }
  };

  return (
    <div>
      <div className="text-center mb-4 sm:mb-8">
        <Badge className="mb-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
          <Coins className="h-3 w-3 mr-1" />
          Earn Passive Income
        </Badge>
        <h2 className="text-lg sm:text-2xl font-bold">Platform Token Staking</h2>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-xs sm:text-base">
          Lock tokens to earn rewards. Higher lock = higher APY.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
        {STAKING_POOLS.map((pool) => {
          const amount = Number(amounts[pool.symbol] || 0);
          const dailyReward = amount > 0 ? ((amount * pool.apy) / 100 / 365).toFixed(4) : "0";
          const totalReward = amount > 0 ? ((amount * pool.apy * pool.lockDays) / 100 / 365).toFixed(2) : "0";

          return (
            <Card key={pool.symbol} className="border-border hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2 sm:pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`text-sm sm:text-lg ${pool.color}`}>{pool.token}</CardTitle>
                    <CardDescription className="text-[10px] sm:text-sm">{pool.symbol}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs sm:text-lg font-bold border-emerald-500/50 text-emerald-400">
                    {pool.apy}% APY
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-sm">
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{pool.lockPeriod}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">{pool.totalStaked}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate">Min: {pool.minStake}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder={`Amount (min ${pool.minStake})`}
                    value={amounts[pool.symbol] || ""}
                    onChange={(e) => setAmounts((prev) => ({ ...prev, [pool.symbol]: e.target.value }))}
                    min={pool.minStake}
                  />
                  <Button
                    onClick={() => handleStake(pool)}
                    disabled={staking !== null}
                    size="sm"
                    className="shrink-0"
                  >
                    {staking === pool.symbol ? "Staking..." : "Stake"}
                  </Button>
                </div>

                {amount > 0 && (
                  <div className="p-2 sm:p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs sm:text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily:</span>
                      <span className="text-emerald-400 font-mono">{dailyReward} {pool.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total ({pool.lockPeriod}):</span>
                      <span className="text-emerald-400 font-bold font-mono">{totalReward} {pool.symbol}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
