import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Crown, Signal, Code } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptionCheckout } from "@/hooks/useSubscriptionCheckout";
import { toast } from "sonner";

interface Plan {
  priceId: string;
  name: string;
  price: string;
  interval: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    priceId: "premium_monthly",
    name: "Premium",
    price: "$1.90",
    interval: "/month",
    description: "Full platform access with advanced analytics and priority AI agents.",
    icon: <Crown className="h-6 w-6 text-primary" />,
    highlight: true,
    features: [
      "All premium features unlocked",
      "Advanced analytics suite",
      "Priority AI agent access",
      "Priority support",
    ],
  },
  {
    priceId: "premium_yearly",
    name: "Premium Yearly",
    price: "$19.00",
    interval: "/year",
    description: "Everything in Premium — two months free.",
    icon: <Crown className="h-6 w-6 text-primary" />,
    features: [
      "Everything in Premium",
      "Two months free vs monthly",
      "Locked-in annual rate",
    ],
  },
  {
    priceId: "signals_monthly",
    name: "Premium Signals",
    price: "$1.90",
    interval: "/month",
    description: "AI-powered premium trading signals with real-time alerts.",
    icon: <Signal className="h-6 w-6 text-primary" />,
    features: [
      "Real-time AI trading signals",
      "Premium signal channel access",
      "Signal performance history",
    ],
  },
  {
    priceId: "api_monthly",
    name: "API Access & Strategy Agents",
    price: "$0",
    interval: " + performance royalty",
    description: "Every graduated strategy is a selectable agent. No profit, no fee — you only pay actual order/exchange costs.",
    icon: <Code className="h-6 w-6 text-primary" />,
    features: [
      "Full REST API + all graduated strategy agents",
      "Royalty per realized gain: ≤10% → 5%, ≤100% → 3%",
      "≤1,000% → 1%, above 1,000% → 0.10%",
      "Applicable sales tax calculated at checkout",
    ],
  },
];

export const SubscriptionPlans = () => {
  const { user } = useAuth();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useSubscriptionCheckout();

  const handleSubscribe = (priceId: string) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    openCheckout({
      priceId,
      customerEmail: user.email ?? undefined,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLANS.map((plan) => (
          <Card key={plan.priceId} className={plan.highlight ? "border-primary/40" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                {plan.icon}
                {plan.highlight && <Badge variant="secondary">Most Popular</Badge>}
              </div>
              <CardTitle className="flex items-baseline gap-1">
                {plan.name}
                <span className="text-lg font-bold text-primary">{plan.price}</span>
                <span className="text-xs text-muted-foreground">{plan.interval}</span>
              </CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => handleSubscribe(plan.priceId)}>
                Subscribe
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={(o) => !o && closeCheckout()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete your subscription</DialogTitle>
          </DialogHeader>
          {checkoutElement}
        </DialogContent>
      </Dialog>
    </div>
  );
};
