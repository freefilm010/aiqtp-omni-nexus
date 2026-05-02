import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTradingStats } from "@/hooks/useTradingStats";
import { toast } from "sonner";
import { TrendingUp, Lock, Unlock, DollarSign, RefreshCw } from "lucide-react";

const POOLS = [
  { token: "DCENT", apy: 45.2, available: "1000", lockPeriod: "30 days", minStake: "100" },
  { token: "BOLT",  apy: 38.7, available: "500",  lockPeriod: "30 days", minStake: "50" },
  { token: "MANTRA",apy: 52.1, available: "750",  lockPeriod: "60 days", minStake: "100" },
  { token: "QTC",   apy: 67.8, available: "2000", lockPeriod: "90 days", minStake: "500" },
  { token: "ETH",   apy: 4.5,  available: "0",    lockPeriod: "Flexible", minStake: "0.01" },
];

export default function StakingPage() {
  const { data: stats, refetch } = useTradingStats(10000);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [staked, setStaked] = useState<Record<string, number>>({});
  const [rewards, setRewards] = useState<Record<string, number>>({});

  const stakedValue = useMemo(() => (stats?.allTimeProfit ?? 0) * 0.1, [stats]);
  const stakingRewards = useMemo(() => stakedValue * 0.05, [stakedValue]);
  const activePools = Object.values(staked).filter(v => v > 0).length;

  const handleStake = (token: string) => {
    const amt = parseFloat(amounts[token] ?? "");
    const pool = POOLS.find(p => p.token === token);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (pool && amt < parseFloat(pool.minStake)) { toast.error(`Minimum stake: ${pool.minStake} ${token}`); return; }
    setStaked(p => ({ ...p, [token]: (p[token] ?? 0) + amt }));
    setAmounts(p => ({ ...p, [token]: "" }));
    toast.success(`Staked ${amt} ${token}`);
  };

  const handleUnstake = (token: string) => {
    const s = staked[token] ?? 0;
    if (!s) return;
    setStaked(p => ({ ...p, [token]: 0 }));
    toast.success(`Unstaked ${s} ${token}`);
  };

  const handleClaim = (token: string) => {
    const r = rewards[token] ?? 0;
    if (!r) { toast.info("No rewards to claim yet"); return; }
    setRewards(p => ({ ...p, [token]: 0 }));
    toast.success(`Claimed ${r.toFixed(4)} ${token} rewards`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Staking Dashboard</h1>
            <p className="text-muted-foreground mt-1">Stake tokens and earn passive income • Auto-compound available</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
        </div>

        {/* Overview stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          {[
            { label: "Total Staked Value", val: `$${stakedValue.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`, sub: "Across all pools" },
            { label: "Total Rewards", val: `$${stakingRewards.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`, sub: "Claimable now", color: "text-green-500" },
            { label: "Average APY", val: "51.7%", sub: "Weighted average", color: "text-purple-500" },
            { label: "Active Pools", val: `${activePools}/${POOLS.length}`, sub: "Pools staking" },
          ].map(s => (
            <Card key={s.label}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{s.label}</CardTitle></CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${s.color ?? ""}`}>{s.val}</div>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pools */}
        <div className="grid gap-4">
          {POOLS.map(pool => {
            const stakedAmt = staked[pool.token] ?? 0;
            const rewardAmt = rewards[pool.token] ?? 0;
            return (
              <Card key={pool.token} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {pool.token}
                        <Badge variant="outline" className="text-green-500 border-green-500">{pool.apy}% APY</Badge>
                      </CardTitle>
                      <CardDescription>Lock: {pool.lockPeriod} • Min: {pool.minStake} {pool.token}</CardDescription>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-medium mb-1">Available</div>
                        <div className="text-2xl font-bold">{pool.available} {pool.token}</div>
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder={`Min ${pool.minStake}`}
                          value={amounts[pool.token] ?? ""}
                          onChange={e => setAmounts(p => ({ ...p, [pool.token]: e.target.value }))}
                        />
                        <Button onClick={() => handleStake(pool.token)} className="w-full">
                          <Lock className="mr-2 h-4 w-4" />Stake {pool.token}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-1">Staked</div>
                          <div className="text-xl font-bold">{stakedAmt.toFixed(2)} {pool.token}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Rewards</div>
                          <div className="text-xl font-bold text-green-500">{rewardAmt.toFixed(4)} {pool.token}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button onClick={() => handleUnstake(pool.token)} variant="outline" disabled={stakedAmt === 0}>
                          <Unlock className="mr-2 h-4 w-4" />Unstake
                        </Button>
                        <Button onClick={() => handleClaim(pool.token)} disabled={rewardAmt === 0}>
                          <DollarSign className="mr-2 h-4 w-4" />Claim
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Stake {pool.minStake} {pool.token} → earn ~<span className="font-bold text-green-500">{(parseFloat(pool.minStake) * pool.apy / 100).toFixed(2)} {pool.token}</span>/year ({pool.apy}% APY)
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Auto-compound teaser */}
        <Card className="mt-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-purple-500/30">
          <CardHeader>
            <CardTitle>Auto-Compound</CardTitle>
            <CardDescription>Automatically reinvest rewards to maximize earnings</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Enable auto-compound to automatically stake rewards and earn compound interest. Available once you have active stakes.
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
