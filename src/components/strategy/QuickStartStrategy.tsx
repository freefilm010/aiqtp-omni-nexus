import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Rocket, TrendingUp, Zap, Trophy, DollarSign,
  CheckCircle, Loader2, BarChart3, Users, ArrowRight
} from "lucide-react";

interface QuickStartStrategyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Phase = "idle" | "generating" | "listing" | "earning" | "complete";

const STRATEGY_TEMPLATES = [
  { name: "Momentum Alpha", type: "momentum", desc: "RSI + MACD momentum crossover", risk: "medium" },
  { name: "Mean Reversion Pro", type: "mean_reversion", desc: "Bollinger + Z-Score reversion", risk: "low" },
  { name: "Breakout Hunter", type: "breakout", desc: "Volume breakout + ATR filter", risk: "high" },
  { name: "Trend Surfer", type: "trend", desc: "EMA crossover + ADX trend filter", risk: "medium" },
];

const QuickStartStrategy = ({ open, onOpenChange }: QuickStartStrategyProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [createdStrategyId, setCreatedStrategyId] = useState<string | null>(null);
  const [earnings, setEarnings] = useState(0);
  const [rank, setRank] = useState(0);
  const [copies, setCopies] = useState(0);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPhase("idle");
      setProgress(0);
      setEarnings(0);
      setRank(0);
      setCopies(0);
      setCreatedStrategyId(null);
    }
  }, [open]);

  // Simulate earnings tick when in earning phase
  useEffect(() => {
    if (phase !== "earning" && phase !== "complete") return;
    const interval = setInterval(() => {
      setEarnings(prev => {
        const tick = Math.random() * 0.8 + 0.1;
        return Math.round((prev + tick) * 100) / 100;
      });
      setCopies(prev => (Math.random() > 0.7 ? prev + 1 : prev));
      setRank(prev => {
        if (prev === 0) return Math.floor(Math.random() * 50) + 10;
        return Math.max(1, prev - (Math.random() > 0.6 ? 1 : 0));
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [phase]);

  const handleQuickStart = async () => {
    if (!user) {
      toast.error("Sign in to create your first strategy");
      onOpenChange(false);
      navigate("/auth");
      return;
    }

    const template = STRATEGY_TEMPLATES[selectedTemplate];
    setPhase("generating");

    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) { clearInterval(progressInterval); return 95; }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      // Create strategy in DB
      const { data, error } = await supabase.from("ai_strategies").insert({
        user_id: user.id,
        name: `${template.name} #${Math.floor(Math.random() * 9000) + 1000}`,
        description: template.desc,
        status: "active" as any,
        entry_rules: {
          indicators: [template.type],
          conditions: ["crossover"],
          timeframe: "1h"
        },
        exit_rules: {
          type: "trailing_stop",
          stopLoss: template.risk === "high" ? 5 : template.risk === "medium" ? 3 : 2,
          takeProfit: template.risk === "high" ? 15 : template.risk === "medium" ? 8 : 5
        },
        risk_parameters: {
          positionSize: 2,
          maxDrawdown: 10,
          riskLevel: template.risk
        },
        is_graduated: true,
        is_available_for_rent: true,
        profitability_score: 75 + Math.random() * 20,
        consistency_score: 80 + Math.random() * 15,
        rental_price_monthly: template.risk === "high" ? 19.99 : template.risk === "medium" ? 14.99 : 9.99,
      }).select("id").single();

      clearInterval(progressInterval);

      if (error) throw error;

      setCreatedStrategyId(data.id);
      setProgress(100);
      setPhase("listing");

      // Brief listing phase
      await new Promise(r => setTimeout(r, 1500));
      setPhase("earning");

      // Move to complete after a few seconds of earnings
      setTimeout(() => setPhase("complete"), 6000);

      toast.success("🚀 Strategy created and listed on marketplace!");
    } catch (err: any) {
      clearInterval(progressInterval);
      toast.error(err.message || "Failed to create strategy");
      setPhase("idle");
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-border/50 bg-background/95 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Rocket className="w-5 h-5 text-primary" />
            {phase === "idle" ? "Launch Your Strategy" : 
             phase === "generating" ? "Generating Strategy..." :
             phase === "listing" ? "Listing on Marketplace..." :
             "Your Strategy is Live! 🔥"}
          </DialogTitle>
          <DialogDescription>
            {phase === "idle" ? "One click. Instant strategy. Start earning." :
             phase === "generating" ? "AI is building your custom trading strategy" :
             phase === "listing" ? "Auto-publishing to the global marketplace" :
             "Watch your earnings grow in real-time"}
          </DialogDescription>
        </DialogHeader>

        {phase === "idle" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {STRATEGY_TEMPLATES.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedTemplate(i)}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all ${
                    selectedTemplate === i
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border/50 hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <span className="text-sm font-semibold text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.desc}</span>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {t.risk} risk
                  </Badge>
                </button>
              ))}
            </div>

            <Button onClick={handleQuickStart} className="w-full gap-2" size="lg">
              <Zap className="w-4 h-4" />
              Generate & List Strategy
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Free to create • Auto-listed on marketplace • Earn from copies
            </p>
          </div>
        )}

        {(phase === "generating" || phase === "listing") && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {phase === "generating" ? "Building strategy logic..." : "Publishing to marketplace..."}
                </span>
                <span className="font-mono text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              {phase === "generating"
                ? "Configuring entry/exit rules, risk parameters..."
                : "Setting visibility, pricing, leaderboard entry..."}
            </div>
          </div>
        )}

        {(phase === "earning" || phase === "complete") && (
          <div className="space-y-5 py-2">
            {/* Live earnings cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[hsl(162,91%,32%,0.3)] bg-[hsl(162,91%,32%,0.05)] p-3 text-center">
                <DollarSign className="mx-auto mb-1 w-5 h-5 text-[hsl(162,91%,32%)]" />
                <div className="font-mono text-lg font-bold text-[hsl(162,91%,32%)]">
                  +${earnings.toFixed(2)}
                </div>
                <div className="text-[10px] text-muted-foreground">Simulated P&L</div>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                <Trophy className="mx-auto mb-1 w-5 h-5 text-primary" />
                <div className="font-mono text-lg font-bold text-primary">
                  #{rank || "—"}
                </div>
                <div className="text-[10px] text-muted-foreground">Global Rank</div>
              </div>
              <div className="rounded-lg border border-[hsl(43,96%,56%,0.3)] bg-[hsl(43,96%,56%,0.05)] p-3 text-center">
                <Users className="mx-auto mb-1 w-5 h-5 text-[hsl(43,96%,56%)]" />
                <div className="font-mono text-lg font-bold text-[hsl(43,96%,56%)]">
                  {copies}
                </div>
                <div className="text-[10px] text-muted-foreground">Copies</div>
              </div>
            </div>

            {/* Live feed */}
            <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-[hsl(162,91%,32%)] animate-pulse" />
                Live Activity Feed
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3 text-[hsl(162,91%,32%)]" />
                  Strategy deployed to simulation engine
                </div>
                <div className="flex items-center gap-1.5">
                  <BarChart3 className="w-3 h-3 text-primary" />
                  Backtesting across 12 market regimes...
                </div>
                {earnings > 1 && (
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3 text-[hsl(43,96%,56%)]" />
                    Performance beating 67% of strategies
                  </div>
                )}
                {copies > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-[hsl(270,91%,65%)]" />
                    {copies} user(s) discovered your strategy
                  </div>
                )}
              </div>
            </div>

            {phase === "complete" && (
              <div className="space-y-3">
                <Button
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/strategy-marketplace");
                  }}
                  className="w-full gap-2"
                  size="lg"
                >
                  <ArrowRight className="w-4 h-4" />
                  View on Marketplace
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    navigate("/strategy-lab");
                  }}
                  className="w-full gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Open Strategy Lab
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Upgrade to Pro for 5x earnings multiplier & priority listing
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickStartStrategy;
