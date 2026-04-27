import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Crown, Zap, Check, ArrowRight, Star, Shield, TrendingUp, Bot,
  Rocket, CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PLANS = [
  {
    id: "pro-monthly",
    name: "Pro",
    price: 19,
    interval: "mo",
    features: ["Unlimited strategies", "Auto-backtest 10K cycles", "Strategy marketplace access", "Real-time signals", "Priority support"],
    popular: true,
    icon: Zap,
  },
  {
    id: "enterprise-monthly",
    name: "Enterprise",
    price: 99,
    interval: "mo",
    features: ["Everything in Pro", "Unlimited bot rentals", "API access", "Custom indicators", "White-label ready", "Dedicated account manager"],
    popular: false,
    icon: Crown,
  },
  {
    id: "elite-monthly",
    name: "Elite",
    price: 299,
    interval: "mo",
    features: ["Everything in Enterprise", "Quantum portfolio optimization", "Institutional analytics", "Priority bot graduation", "Revenue share on marketplace"],
    popular: false,
    icon: Star,
  },
];

const QUICK_DEPOSITS = [20, 50, 100, 500];

const RevenueActivation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const startCheckout = async (planId: string, amount?: number) => {
    if (!user) {
      toast.error("Sign in to subscribe");
      return;
    }
    setLoading(planId);
    // Routed to unified Billing page (Platform Access subscription + custom deposit)
    window.location.href = "/billing";
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`relative ${plan.popular ? "border-primary shadow-lg shadow-primary/10" : ""}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="pb-2 text-center">
                <Icon className="h-6 w-6 mx-auto text-primary mb-1" />
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="mt-1">
                  <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.interval}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1.5">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Check className="h-3 w-3 mt-0.5 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => startCheckout(plan.id)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? "Opening..." : "Subscribe Now"}
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Deposit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Quick Deposit — Add Funds Instantly
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {QUICK_DEPOSITS.map((amt) => (
              <Button
                key={amt}
                variant="outline"
                size="sm"
                onClick={() => startCheckout("custom-deposit", amt)}
                disabled={loading === `dep-${amt}`}
              >
                ${amt}
              </Button>
            ))}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Custom"
                className="w-20 h-8 text-xs"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min={5}
                max={10000}
              />
              <Button
                size="sm"
                disabled={!customAmount || Number(customAmount) < 5}
                onClick={() => startCheckout("custom-deposit", Number(customAmount))}
              >
                Deposit
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Powered by Stripe • Funds available instantly • Min $5, Max $10,000
          </p>
        </CardContent>
      </Card>

      {/* Revenue Stats for Platform */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Revenue Channels Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <RevenueChannel icon={CreditCard} name="Subscriptions" status="live" />
            <RevenueChannel icon={Bot} name="Bot Rentals" status="live" />
            <RevenueChannel icon={Zap} name="Deposits" status="live" />
            <RevenueChannel icon={Rocket} name="NFT/Token" status="live" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RevenueChannel = ({ icon: Icon, name, status }: { icon: any; name: string; status: string }) => (
  <div className="p-2 rounded bg-muted/50">
    <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
    <p className="text-[10px] font-medium text-foreground">{name}</p>
    <Badge variant="outline" className="text-[8px] border-green-500 text-green-500">{status}</Badge>
  </div>
);

export default RevenueActivation;
