import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Crown, Rocket, TrendingUp, Loader2, CheckCircle, Gift, Atom, Building2 } from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  mode: "payment" | "subscription";
  interval?: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  badge?: string;
  freeMonths?: number;
  monthlyEquivalent?: number;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "qaqi-monthly",
    name: "QAQI™ Monthly",
    description: "Month-to-month quantum AI access",
    price: 12,
    mode: "subscription",
    interval: "month",
    features: ["QAQI™ Quantum Agent Access", "QuWallet® Integration", "$QTC™ Mining Rewards", "Priority Support", "Cancel Anytime"],
    icon: <Atom className="h-6 w-6" />,
    monthlyEquivalent: 12,
  },
  {
    id: "pro-monthly",
    name: "Pro Trader",
    description: "For serious traders who want an edge",
    price: 19,
    mode: "subscription",
    interval: "month",
    features: ["Unlimited AI Strategies", "Advanced Backtesting", "Real-time Signals", "Strategy Marketplace Access", "Priority Support"],
    icon: <TrendingUp className="h-6 w-6" />,
    popular: true,
    badge: "Most Popular",
  },
  {
    id: "pro-annual",
    name: "Pro Trader Annual",
    description: "Best value — 2 months FREE",
    price: 190,
    mode: "subscription",
    interval: "year",
    features: ["Everything in Pro Monthly", "2 Months FREE ($38 savings)", "Early Feature Access", "1-on-1 Onboarding Call", "Exclusive Discord Role"],
    icon: <Crown className="h-6 w-6" />,
    badge: "Best Value",
    freeMonths: 2,
    monthlyEquivalent: 15.83,
  },
  {
    id: "enterprise-monthly",
    name: "Enterprise",
    description: "Full power for funds & desks",
    price: 99,
    mode: "subscription",
    interval: "month",
    features: ["Everything in Pro", "Full Quantum Computing Access", "Custom Indicators & Models", "White-label Solutions", "API Access", "Dedicated Account Manager"],
    icon: <Building2 className="h-6 w-6" />,
  },
  {
    id: "enterprise-annual",
    name: "Enterprise Annual",
    description: "Save $198/year",
    price: 990,
    mode: "subscription",
    interval: "year",
    features: ["Everything in Enterprise", "2 Months FREE ($198 savings)", "SLA Guarantee", "Custom Integrations", "Audit Logs"],
    icon: <Rocket className="h-6 w-6" />,
    freeMonths: 2,
    monthlyEquivalent: 82.50,
  },
  {
    id: "starter",
    name: "Starter Pack",
    description: "One-time purchase to get started",
    price: 49,
    mode: "payment",
    features: ["5 AI Strategy Generations", "Basic Backtesting", "Community Access", "Email Support"],
    icon: <Zap className="h-6 w-6" />,
  },
];

export const QuickPayment = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: PricingPlan) => {
    setLoading(plan.id);
    // Legacy plans now route through the unified Billing page (Platform Access $1/mo + custom deposits)
    window.location.href = "/billing";
    setLoading(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {PRICING_PLANS.map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative flex flex-col ${plan.popular ? "border-primary shadow-lg scale-105" : ""}`}
        >
          {plan.badge && (
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
              {plan.badge}
            </Badge>
          )}
          
          {plan.freeMonths && (
            <div className="absolute -top-2 -right-2">
              <Badge variant="secondary" className="bg-green-500 text-white">
                <Gift className="h-3 w-3 mr-1" />
                {plan.freeMonths} Months FREE
              </Badge>
            </div>
          )}
          
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary w-fit">
              {plan.icon}
            </div>
            <CardTitle className="text-xl">{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <div className="text-center mb-6">
              <span className="text-4xl font-bold">${plan.price}</span>
              {plan.mode === "subscription" && (
                <span className="text-muted-foreground">/{plan.interval}</span>
              )}
              {plan.monthlyEquivalent && plan.interval === "year" && (
                <div className="text-sm text-green-500 mt-1">
                  Only ${plan.monthlyEquivalent.toFixed(2)}/month
                </div>
              )}
            </div>
            
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            
            <Button 
              onClick={() => handleCheckout(plan)}
              disabled={loading !== null}
              className="w-full"
              variant={plan.popular ? "default" : "outline"}
            >
              {loading === plan.id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                plan.mode === "subscription" ? "Subscribe Now" : "Buy Now"
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
