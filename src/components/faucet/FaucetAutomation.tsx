import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bot, ArrowDownToLine, TrendingUp, Zap } from "lucide-react";

interface FaucetAutomationProps {
  autoClaim: boolean;
  setAutoClaim: (v: boolean) => void;
  autoClaimRunning: boolean;
  autoCompound: boolean;
  setAutoCompound: (v: boolean) => void;
  reinvestPercent: number;
  setReinvestPercent: (v: number) => void;
  availableCount: number;
  claiming: string | null;
  loading: boolean;
  onClaimAll: () => void;
  compoundStats: { deployed: number; transactions: number; profit: number };
}

const FaucetAutomation = ({
  autoClaim, setAutoClaim, autoClaimRunning,
  autoCompound, setAutoCompound,
  reinvestPercent, setReinvestPercent,
  availableCount, claiming, loading, onClaimAll,
  compoundStats,
}: FaucetAutomationProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-3"
    >
      {/* Auto-Claim Bot */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">Auto-Claim Bot</p>
                  {autoClaim && (
                    <Badge variant="secondary" className="text-[9px] px-1.5 py-0 animate-pulse">
                      {autoClaimRunning ? "CLAIMING" : "ACTIVE"}
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Claims all tokens automatically as cooldowns expire
                </p>
              </div>
            </div>
            <Switch checked={autoClaim} onCheckedChange={setAutoClaim} />
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={onClaimAll}
              disabled={claiming !== null || availableCount === 0 || loading}
              className="text-xs gap-1.5 flex-1"
            >
              <ArrowDownToLine className="h-3 w-3" />
              Claim All ({availableCount})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Compound */}
      <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/3">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">Auto-Compound</p>
                  {autoCompound && (
                    <Badge className="bg-green-500/20 text-green-400 text-[9px] px-1.5 py-0">
                      <Zap className="h-2.5 w-2.5 mr-0.5" />{reinvestPercent}%
                    </Badge>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Routes eligible priced claims into configured strategies
                </p>
              </div>
            </div>
            <Switch checked={autoCompound} onCheckedChange={setAutoCompound} />
          </div>

          {autoCompound && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 space-y-2"
            >
              <div className="flex gap-1">
                {[90, 95, 100].map(pct => (
                  <Button
                    key={pct}
                    size="sm"
                    variant={reinvestPercent === pct ? "default" : "ghost"}
                    className="h-7 px-2 text-[10px] flex-1"
                    onClick={() => setReinvestPercent(pct)}
                  >
                    {pct}%
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                {[
                  { label: "Deployed", value: `$${compoundStats.deployed.toFixed(2)}`, color: "text-green-500" },
                  { label: "Txns", value: compoundStats.transactions, color: "text-foreground" },
                  { label: "Recorded P/L", value: `$${compoundStats.profit.toFixed(2)}`, color: "text-green-500" },
                ].map(s => (
                  <div key={s.label} className="p-1.5 rounded-md bg-muted/30">
                    <p className="text-[9px] text-muted-foreground">{s.label}</p>
                    <p className={`font-bold text-xs ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FaucetAutomation;
