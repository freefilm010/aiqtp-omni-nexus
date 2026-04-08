import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets, Wallet, Gift, Flame, TrendingUp } from "lucide-react";

interface FaucetStatsProps {
  totalTokens: number;
  ownedTokens: number;
  totalClaims: number;
  streakCount: number;
  totalValue: number;
}

const stats = [
  { key: "totalTokens", icon: Droplets, label: "Available", color: "text-primary" },
  { key: "ownedTokens", icon: Wallet, label: "Your Tokens", color: "text-green-500" },
  { key: "totalClaims", icon: Gift, label: "Total Claims", color: "text-purple-500" },
  { key: "streak", icon: Flame, label: "Day Streak", color: "text-orange-500" },
  { key: "totalValue", icon: TrendingUp, label: "Current Claimed Value", color: "text-cyan-500" },
] as const;

const FaucetStats = ({ totalTokens, ownedTokens, totalClaims, streakCount, totalValue }: FaucetStatsProps) => {
  const values: Record<string, string | number> = {
    totalTokens,
    ownedTokens,
    totalClaims,
    streak: streakCount > 0 ? `${streakCount}🔥` : "0",
    totalValue: `$${totalValue.toFixed(2)}`,
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-muted/40 to-background border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-muted/60 ${stat.color}`}>
                    <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs text-muted-foreground truncate">{stat.label}</p>
                    <p className="text-base md:text-xl font-bold truncate">{values[stat.key]}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FaucetStats;
