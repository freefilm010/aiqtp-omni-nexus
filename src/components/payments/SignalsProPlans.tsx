import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StripeEmbeddedCheckout } from "@/components/payments/StripeEmbeddedCheckout";
import { useAuthContext } from "@/contexts/AuthContext";
import { useActiveSubscription } from "@/hooks/useActiveSubscription";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Bell, Bot, Check, CreditCard, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Plan = {
  tier: "signals_pro" | "pro_trader" | "elite";
  name: string;
  price: string;
  cadence: string;
  priceIdEnv: string;
  badge?: string;
  description: string;
  features: string[];
};

const PLANS: Plan[] = [
  {
    tier: "signals_pro",
    name: "Signals Pro",
    price: "$49",
    cadence: "/mo",
    priceIdEnv: "VITE_STRIPE_PRICE_SIGNALS_PRO",
    badge: "First launch",
    description: "Daily AI-assisted watchlists and signal commentary for active traders.",
    features: [
      "Daily market watchlist",
      "Signal feed with confidence factors",
      "Risk notes and invalidation levels",
      "Email-ready signal digest",
    ],
  },
  {
    tier: "pro_trader",
    name: "Pro Trader",
    price: "$149",
    cadence: "/mo",
    priceIdEnv: "VITE_STRIPE_PRICE_PRO_TRADER",
    description: "Signals Pro plus advanced strategy tooling and bot-deployment workflow access.",
    features: [
      "Everything in Signals Pro",
      "Strategy builder access",
      "Backtest and comparison workspace",
      "Broker connector workflows",
    ],
  },
  {
    tier: "elite",
    name: "Elite",
    price: "$299",
    cadence: "/mo",
    priceIdEnv: "VITE_STRIPE_PRICE_ELITE",
    badge: "Operator",
    description: "Advanced platform tier for high-intent operators and early enterprise testers.",
    features: [
      "Everything in Pro Trader",
      "Priority feature access",
      "Private beta feedback lane",
      "Compliance and platform roadmap previews",
    ],
  },
];

const priceIds: Record<string, string | undefined> = {
  VITE_STRIPE_PRICE_SIGNALS_PRO: import.meta.env.VITE_STRIPE_PRICE_SIGNALS_PRO,
  VITE_STRIPE_PRICE_PRO_TRADER: import.meta.env.VITE_STRIPE_PRICE_PRO_TRADER,
  VITE_STRIPE_PRICE_ELITE: import.meta.env.VITE_STRIPE_PRICE_ELITE,
};

export function SignalsProPlans() {
  const { user } = useAuthContext();
  const { isActive, tier, expiresAt, cancelAtPeriodEnd, loading, refresh } = useActiveSubscription();
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const activeLabel = useMemo(() => {
    if (!isActive || !tier) return null;
    const current = PLANS.find((p) => p.tier === tier);
    return current?.name ?? tier;
  }, [isActive, tier]);

  const openPlan = (plan: Plan) => {
    if (!user) {
      toast.error("Sign in to start a subscription");
      return;
    }
    const priceId = priceIds[plan.priceIdEnv];
    if (!priceId) {
      toast.error(`${plan.name} is not configured yet`, {
        description: `Add ${plan.priceIdEnv} in Vercel and STRIPE_SUB_PRICE_IDS in Supabase before launch.`,
      });
      return;
    }
    setCheckoutPlan(plan);
  };

  const openBillingPortal = async () => {
    if (!user) {
      toast.error("Sign in to manage billing");
      return;
    }
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-billing-portal-session", {
        body: {
          userId: user.id,
          returnUrl: `${window.location.origin}/pricing`,
          environment: import.meta.env.VITE_STRIPE_ENVIRONMENT === "live" ? "live" : "sandbox",
        },
      });
      if (error || !data?.url) throw new Error(error?.message ?? data?.error ?? "Billing portal failed");
      window.location.href = data.url;
    } catch (error) {
      toast.error("Billing portal unavailable", {
        description: error instanceof Error ? error.message : "Try again after your first subscription is active.",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <section className="mb-16">
      <div className="mb-8 text-center">
        <Badge className="mb-2 border-primary/30 bg-primary/15 text-primary">
          <Sparkles className="mr-1 h-3 w-3" />
          First Revenue Product
        </Badge>
        <h2 className="text-2xl font-bold">AIQTP Signals Pro</h2>
        <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
          Paid access to signal research, strategy tooling, and operator workflows. This is software and market commentary,
          not investment advice, guaranteed returns, or managed trading.
        </p>
      </div>

      {user && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {loading ? "Checking subscription..." : isActive ? `Active tier: ${activeLabel}` : "No active subscription"}
              </p>
              {isActive && expiresAt && (
                <p className="text-xs text-muted-foreground">
                  {cancelAtPeriodEnd ? "Access scheduled to end" : "Renews"} {new Date(expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refresh()} disabled={loading}>
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={openBillingPortal} disabled={portalLoading}>
                {portalLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                Manage Billing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const configured = Boolean(priceIds[plan.priceIdEnv]);
          const current = isActive && tier === plan.tier;
          return (
            <Card key={plan.tier} className={plan.tier === "signals_pro" ? "border-primary/50" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  {plan.badge && <Badge variant="outline">{plan.badge}</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.cadence}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" onClick={() => openPlan(plan)} disabled={current}>
                  {current ? "Current Plan" : configured ? "Start Checkout" : "Configure Stripe Price"}
                </Button>
                {!user && (
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/auth">Sign in first</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="flex gap-3 rounded-lg border p-4">
          <BarChart3 className="mt-1 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Signals, not promises</p>
            <p className="text-sm text-muted-foreground">No APY, ROI, or guaranteed-performance language.</p>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border p-4">
          <Bot className="mt-1 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Built from existing modules</p>
            <p className="text-sm text-muted-foreground">Signal engine, strategy tools, and broker workflows already exist.</p>
          </div>
        </div>
        <div className="flex gap-3 rounded-lg border p-4">
          <ShieldCheck className="mt-1 h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">Access gated</p>
            <p className="text-sm text-muted-foreground">Supabase RPCs mirror Stripe subscription status before unlocking paid surfaces.</p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Trading involves risk. AIQTP Signals Pro provides software, research workflow, and general market commentary only.
        It does not custody funds, manage accounts, or provide personalized investment advice.
      </p>

      <Dialog open={Boolean(checkoutPlan)} onOpenChange={(open) => !open && setCheckoutPlan(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{checkoutPlan ? `Subscribe to ${checkoutPlan.name}` : "Subscribe"}</DialogTitle>
          </DialogHeader>
          {checkoutPlan && user && (
            <StripeEmbeddedCheckout
              mode="subscription"
              priceId={priceIds[checkoutPlan.priceIdEnv]}
              tier={checkoutPlan.tier}
              customerEmail={user.email ?? undefined}
              userId={user.id}
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            />
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
