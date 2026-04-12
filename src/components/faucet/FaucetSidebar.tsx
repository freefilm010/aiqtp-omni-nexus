import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Wallet, Clock, CheckCircle, Coins, Flame, Trophy, Users, Share2, DollarSign, ArrowRightLeft, Bot, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { FaucetToken, ClaimRecord } from "./faucetTypes";
import { useAssetValuation, formatUsdValue, formatQuantity } from "@/hooks/useAssetValuation";

interface FaucetSidebarProps {
  balances: Record<string, number>;
  claims: ClaimRecord[];
  tokens: FaucetToken[];
  loading: boolean;
  streakCount: number;
  userId: string | null;
}

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  total_claims: number;
  active_days: number;
  arb_profit: number;
  arb_trades: number;
  invest_total: number;
  invest_txns: number;
  strategies_created: number;
  strategies_graduated: number;
  factors_created: number;
  composite_score: number;
}

const FaucetSidebar = ({ balances, claims, tokens, loading, streakCount, userId }: FaucetSidebarProps) => {
  const { getPortfolioValuation } = useAssetValuation();
  const { items: valuedItems } = getPortfolioValuation(balances);
  const realValuedItems = valuedItems.filter((item) => item.quantity > 0 && !item.isTestnet);
  const totalTokenTypes = realValuedItems.length;
  const totalUsd = realValuedItems.reduce((sum, item) => sum + item.valueUsd, 0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const loadLeaderboard = async () => {
      const { data } = await supabase
        .from("faucet_leaderboard")
        .select("user_id, display_name, total_claims, active_days, arb_profit, arb_trades, invest_total, invest_txns, strategies_created, strategies_graduated, factors_created, composite_score")
        .order("composite_score", { ascending: false })
        .limit(10);
      if (data) setLeaderboard(data as LeaderboardEntry[]);
    };
    loadLeaderboard();

    // Realtime refresh for leaderboard when claims change
    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'faucet_claims' },
        () => { loadLeaderboard(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleReferral = () => {
    if (!userId) { toast.error("Sign in first"); return; }
    const link = `${window.location.origin}/faucet?ref=${userId.slice(0, 8)}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!", { description: "Friends get 2x first claim bonus" });
  };

  return (
    <div className="space-y-3">
      {/* Referral Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-cyan-500" />
                <div>
                  <p className="font-semibold text-xs">Refer & Earn</p>
                  <p className="text-[9px] text-muted-foreground">2x bonus for friends</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={handleReferral}>
                Copy Link
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Balances with USD/USDT */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet className="h-4 w-4 text-primary" />
              Claimed Assets
              {totalTokenTypes > 0 && (
                <Badge variant="secondary" className="text-[9px] ml-auto">{totalTokenTypes}</Badge>
              )}
            </CardTitle>
            {totalUsd > 0 && (
              <div className="mt-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-primary" />
                  <span className="text-[10px] text-muted-foreground">Current claimed value</span>
                  <span className="text-xs font-bold text-primary">{formatUsdValue(totalUsd)}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">Live value of claimed real assets • excludes test assets</p>
              </div>
            )}
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[200px]">
              {realValuedItems.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground px-2 pb-1 border-b border-border/30">
                    <span className="w-14">Asset</span>
                    <span className="text-right w-12">Qty</span>
                    <span className="text-right w-14">Unit $</span>
                    <span className="text-right w-14">USD</span>
                    <span className="text-right w-14">USDT</span>
                  </div>
                  {realValuedItems
                    .sort((a, b) => b.valueUsd - a.valueUsd)
                    .map((item) => {
                      const token = tokens.find(t => t.symbol === item.symbol);
                      const unitPrice = item.quantity > 0 ? item.valueUsd / item.quantity : 0;
                      return (
                        <div key={item.symbol} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-1 w-14">
                            {token?.icon || <Coins className="h-3.5 w-3.5" />}
                            <span className="font-medium text-[10px]">{item.symbol}</span>
                          </div>
                          <span className="font-mono text-[10px] text-right w-12">
                            {formatQuantity(item.quantity)}
                          </span>
                          <span className="font-mono text-[10px] text-primary text-right w-14">
                            {formatUsdValue(unitPrice)}
                          </span>
                          <span className="font-mono text-[10px] text-green-500 text-right w-14">
                            {formatUsdValue(item.valueUsd)}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground text-right w-14">
                            {formatUsdValue(item.valueUsdt)}
                          </span>
                        </div>
                      );
                    })}
                </div>
              ) : (
                  <p className="text-muted-foreground text-center py-6 text-xs">
                    {loading ? "Loading..." : "No claimed real assets yet"}
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Leaderboard — from DB */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Trophy className="h-4 w-4 text-amber-500" />
              Claim Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="space-y-1.5">
              {leaderboard.length > 0 ? leaderboard.map((entry, i) => (
                <div key={entry.user_id} className="p-2 rounded-lg bg-muted/20 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold w-4 text-center ${i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-600" : "text-muted-foreground"}`}>
                        {i + 1}
                      </span>
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{entry.display_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{entry.total_claims}</span>
                      <span className="text-orange-500 text-[10px]">📅{entry.active_days}d</span>
                    </div>
                  </div>
                  {entry.arb_profit > 0 && (
                    <div className="flex items-center gap-1.5 pl-6 text-[10px]">
                      <ArrowRightLeft className="h-2.5 w-2.5 text-green-500" />
                      <span className="text-green-500 font-mono">${Number(entry.arb_profit).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      <span className="text-muted-foreground">arb ({entry.arb_trades} trades)</span>
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4 text-xs">No claims yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Claims */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <Card>
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              Recent Claims
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <ScrollArea className="h-[180px]">
              {claims.length > 0 ? (
                <div className="space-y-1">
                  {claims.slice(0, 15).map(claim => {
                    const token = tokens.find(t => t.id === claim.chain);
                    return (
                      <div key={claim.id} className="flex justify-between items-center text-xs p-1.5 rounded-md hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                          <span className="font-medium">{token?.symbol || claim.chain}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-green-500">+{Number(claim.amount)}</span>
                          <p className="text-[9px] text-muted-foreground">
                            {new Date(claim.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-6 text-xs">
                  {loading ? "Loading..." : "Start claiming!"}
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Streak */}
      {streakCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="font-bold text-lg">{streakCount}-Day Streak!</p>
                  <p className="text-[10px] text-muted-foreground">Keep it alive for bonus multipliers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default FaucetSidebar;
