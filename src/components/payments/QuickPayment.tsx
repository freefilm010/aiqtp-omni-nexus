import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Zap, Crown, Rocket, TrendingUp, Loader2, CheckCircle, Gift, Atom } from "lucide-react";

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
    id: "starter",
    name: "Starter Pack",
    description: "Get started with AI trading",
    price: 49,
    mode: "payment",
    features: ["5 AI Strategy Generations", "Basic Backtesting", "Community Access", "Email Support"],
    icon: <Zap className="h-6 w-6" />,
  },
  {
    id: "qaqi-monthly",
    name: "QAQI Monthly",
    description: "Month-to-month quantum AI access",
    price: 12,
    mode: "subscription",
    interval: "month",
    features: ["QAQI Quantum Agent Access", "QuWallet Integration", "$QTC Mining Rewards", "Priority Support", "Cancel Anytime"],
    icon: <Atom className="h-6 w-6" />,
    monthlyEquivalent: 12,
  },
  {
    id: "qaqi-annual",
    name: "QAQI Annual",
    description: "Best value - 2 months FREE",
    price: 100,
    mode: "subscription",
    interval: "year",
    features: ["Everything in Monthly", "2 Months FREE ($44 savings)", "Early Feature Access", "1-on-1 Onboarding Call", "Exclusive Discord Role"],
    icon: <Crown className="h-6 w-6" />,
    popular: true,
    badge: "Best Value",
    freeMonths: 2,
    monthlyEquivalent: 8.33,
  },
  {
    id: "pro-monthly",
    name: "Pro Trader",
    description: "For serious traders",
    price: 99,
    mode: "subscription",
    interval: "month",
    features: ["Unlimited Strategies", "Advanced Backtesting", "Real-time Signals", "Priority Support", "Strategy Marketplace Access"],
    icon: <TrendingUp className="h-6 w-6" />,
  },
  {
    id: "elite-monthly",
    name: "Elite Trader",
    description: "Maximum alpha generation",
    price: 299,
    mode: "subscription",
    interval: "month",
    features: ["Everything in Pro", "Full Quantum Computing Access", "1-on-1 Strategy Consulting", "Custom Indicators", "White-label Solutions", "API Access"],
    icon: <Crown className="h-6 w-6" />,
  },
  {
    id: "institutional",
    name: "Institutional",
    description: "Enterprise-grade solution",
    price: 999,
    mode: "subscription",
    interval: "month",
    features: ["Everything in Elite", "Dedicated Account Manager", "Custom Integrations", "SLA Guarantee", "Multi-user Access", "Audit Logs"],
    icon: <Rocket className="h-6 w-6" />,
  },
];

export const QuickPayment = () => {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: PricingPlan) => {
    setLoading(plan.id);
    
    try {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          amount: plan.price,
          productName: `AIQTP ${plan.name}`,
          productDescription: plan.description,
          mode: plan.mode,
          successUrl: `${window.location.origin}/payment-success?plan=${plan.id}`,
          cancelUrl: `${window.location.origin}/pricing`,
          metadata: {
            plan_id: plan.id,
            plan_name: plan.name,
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout: " + error.message);
    } finally {
      setLoading(null);
    }
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
