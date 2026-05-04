import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Users, TrendingUp, Coins, RefreshCw, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PoolStat {
  token_symbol: string;
  token_name: string;
  staker_count: number;
  total_staked: number;
  pool_apy: number;
  max_lock_days: number;
}

interface UserStake {
  id: string;
  user_id: string;
  token_symbol: string;
  amount_staked: number;
  apy: number;
  lock_days: number;
  lock_until: string;
  expected_reward: number;
  actual_reward: number;
  status: string;
  created_at: string;
}

export default function StakingAdmin() {
  const [pools, setPools] = useState<PoolStat[]>([]);
  const [stakes, setStakes] = useState<UserStake[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");

  const load = async () => {
    setLoading(true);
    const [{ data: poolData }, { data: stakeData }] = await Promise.all([
      supabase.from("staking_pool_stats").select("*"),
      supabase
        .from("user_stakes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    if (poolData) setPools(poolData as PoolStat[]);
    if (stakeData) setStakes(stakeData as UserStake[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalStakedUSD = stakes
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.amount_staked, 0);

  const totalExpectedRewards = stakes
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.expected_reward, 0);

  const filtered = stakes.filter((s) => {
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    const matchSearch =
      !search ||
      s.token_symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.user_id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleForceComplete = async (stakeId: string) => {
    const { error } = await supabase
      .from("user_stakes")
      .update({ status: "completed", unstaked_at: new Date().toISOString() })
      .eq("id", stakeId);
    if (error) toast.error("Failed to complete stake");
    else { toast.success("Stake marked completed"); load(); }
  };

  const handleCancel = async (stakeId: string) => {
    const { error } = await supabase
      .from("user_stakes")
      .update({ status: "cancelled" })
      .eq("id", stakeId);
    if (error) toast.error("Failed to cancel stake");
    else { toast.success("Stake cancelled"); load(); }
  };

  const statusColor = (status: string) => {
    if (status === "active") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (status === "completed") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staking Admin</h1>
          <p className="text-muted-foreground text-sm">Manage user stakes and pool performance</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3 w-3" /> Active Stakers
            </div>
            <div className="text-2xl font-bold">
              {stakes.filter((s) => s.status === "active").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Coins className="h-3 w-3" /> Total Staked (tokens)
            </div>
            <div className="text-2xl font-bold">{totalStakedUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3 w-3" /> Expected Rewards
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {totalExpectedRewards.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Lock className="h-3 w-3" /> Pools Active
            </div>
            <div className="text-2xl font-bold">{pools.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pool Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pool Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          {pools.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active staking pools yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-4">Token</th>
                    <th className="text-right py-2 pr-4">Stakers</th>
                    <th className="text-right py-2 pr-4">Total Staked</th>
                    <th className="text-right py-2 pr-4">Avg APY</th>
                    <th className="text-right py-2">Max Lock</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((p) => (
                    <tr key={p.token_symbol} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium">{p.token_symbol}</td>
                      <td className="py-2 pr-4 text-right">{p.staker_count}</td>
                      <td className="py-2 pr-4 text-right font-mono">
                        {Number(p.total_staked).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2 pr-4 text-right text-emerald-400">
                        {Number(p.pool_apy).toFixed(1)}%
                      </td>
                      <td className="py-2 text-right">{p.max_lock_days}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Stakes */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <CardTitle className="text-base">All Stakes</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by token or user ID"
                  className="pl-7 h-8 text-xs w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {(["all", "active", "completed"] as const).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setStatusFilter(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No stakes found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border text-xs">
                    <th className="text-left py-2 pr-3">User</th>
                    <th className="text-left py-2 pr-3">Token</th>
                    <th className="text-right py-2 pr-3">Staked</th>
                    <th className="text-right py-2 pr-3">APY</th>
                    <th className="text-right py-2 pr-3">Reward</th>
                    <th className="text-left py-2 pr-3">Lock Until</th>
                    <th className="text-left py-2 pr-3">Status</th>
                    <th className="text-left py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-border/30 hover:bg-muted/20 text-xs">
                      <td className="py-2 pr-3 font-mono text-muted-foreground">
                        {s.user_id.slice(0, 8)}…
                      </td>
                      <td className="py-2 pr-3 font-medium">{s.token_symbol}</td>
                      <td className="py-2 pr-3 text-right font-mono">
                        {Number(s.amount_staked).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                      </td>
                      <td className="py-2 pr-3 text-right text-emerald-400">{s.apy}%</td>
                      <td className="py-2 pr-3 text-right font-mono text-emerald-400">
                        {Number(s.expected_reward).toFixed(4)}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {new Date(s.lock_until).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge className={`text-[10px] ${statusColor(s.status)}`}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="py-2">
                        {s.status === "active" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2"
                              onClick={() => handleForceComplete(s.id)}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2 text-red-400 hover:text-red-300"
                              onClick={() => handleCancel(s.id)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">
                Showing {filtered.length} of {stakes.length} stakes
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
