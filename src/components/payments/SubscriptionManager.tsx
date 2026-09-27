import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { RefreshCw, XCircle, ArrowUpDown } from "lucide-react";

interface Subscription {
  id: string;
  stripe_subscription_id: string;
  price_id: string;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
}

const PLAN_NAMES: Record<string, string> = {
  premium_monthly: "Premium (Monthly)",
  premium_yearly: "Premium (Yearly)",
  signals_monthly: "Premium Signals",
  api_monthly: "API Access",
};

const CHANGEABLE_PRICES = ["premium_monthly", "premium_yearly", "signals_monthly", "api_monthly"];

type CancelMode = "period_end" | "immediate" | "immediate_prorated";

export const SubscriptionManager = () => {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [cancelMode, setCancelMode] = useState<CancelMode>("period_end");
  const [changeTarget, setChangeTarget] = useState<Subscription | null>(null);
  const [newPriceId, setNewPriceId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("id, stripe_subscription_id, price_id, status, cancel_at_period_end, current_period_end")
      .eq("user_id", user.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false });
    setSubs((data as Subscription[]) ?? []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const callManage = async (body: Record<string, unknown>) => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("manage-subscription", {
      body: { ...body, environment: getStripeEnvironment() },
    });
    setBusy(false);
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Action failed");
      return false;
    }
    return true;
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    const ok = await callManage({
      action: "cancel",
      subscriptionId: cancelTarget.stripe_subscription_id,
      cancelMode,
    });
    if (ok) {
      toast.success(
        cancelMode === "period_end"
          ? "Subscription will cancel at the end of the paid period"
          : "Subscription canceled"
      );
      setCancelTarget(null);
      load();
    }
  };

  const handleReactivate = async (sub: Subscription) => {
    const ok = await callManage({ action: "reactivate", subscriptionId: sub.stripe_subscription_id });
    if (ok) { toast.success("Subscription reactivated"); load(); }
  };

  const handleChangePlan = async () => {
    if (!changeTarget || !newPriceId) return;
    const ok = await callManage({
      action: "change_plan",
      subscriptionId: changeTarget.stripe_subscription_id,
      newPriceId,
    });
    if (ok) {
      toast.success("Plan changed — the difference was pro-rated");
      setChangeTarget(null);
      setNewPriceId("");
      load();
    }
  };

  const isActive = (s: Subscription) =>
    ["active", "trialing", "past_due"].includes(s.status) ||
    (s.status === "canceled" && s.current_period_end && new Date(s.current_period_end) > new Date());

  if (loading) return null;
  const active = subs.filter(isActive);
  if (active.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your Subscriptions</CardTitle>
        <CardDescription>Manage, cancel, or change your active plans.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {active.map((sub) => (
          <div key={sub.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{PLAN_NAMES[sub.price_id] ?? sub.price_id}</span>
                <Badge variant={sub.status === "active" ? "secondary" : "outline"}>{sub.status}</Badge>
                {sub.cancel_at_period_end && <Badge variant="outline">Cancels at period end</Badge>}
              </div>
              {sub.current_period_end && (
                <p className="text-xs text-muted-foreground">
                  {sub.cancel_at_period_end ? "Access until" : "Renews"}{" "}
                  {new Date(sub.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {sub.cancel_at_period_end ? (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => handleReactivate(sub)}>
                  <RefreshCw className="h-3 w-3 mr-1" /> Reactivate
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setChangeTarget(sub)}>
                    <ArrowUpDown className="h-3 w-3 mr-1" /> Change plan
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => setCancelTarget(sub)}>
                    <XCircle className="h-3 w-3 mr-1" /> Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Cancel dialog — customer chooses how cancellation works */}
        <Dialog open={!!cancelTarget} onOpenChange={(o) => !o && setCancelTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel {cancelTarget ? PLAN_NAMES[cancelTarget.price_id] ?? "subscription" : ""}</DialogTitle>
              <DialogDescription>Choose how you want your cancellation handled.</DialogDescription>
            </DialogHeader>
            <RadioGroup value={cancelMode} onValueChange={(v) => setCancelMode(v as CancelMode)} className="space-y-3">
              <div className="flex items-start gap-2">
                <RadioGroupItem value="period_end" id="cm-period" className="mt-1" />
                <Label htmlFor="cm-period" className="font-normal">
                  <span className="font-medium">Keep access until period end</span>
                  <p className="text-xs text-muted-foreground">You keep premium features until the paid period ends. No refund.</p>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="immediate_prorated" id="cm-prorated" className="mt-1" />
                <Label htmlFor="cm-prorated" className="font-normal">
                  <span className="font-medium">Cancel now with pro-rated refund</span>
                  <p className="text-xs text-muted-foreground">Access ends immediately; unused time is refunded proportionally.</p>
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="immediate" id="cm-immediate" className="mt-1" />
                <Label htmlFor="cm-immediate" className="font-normal">
                  <span className="font-medium">Cancel immediately</span>
                  <p className="text-xs text-muted-foreground">Access ends right away. No refund for the remaining period.</p>
                </Label>
              </div>
            </RadioGroup>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCancelTarget(null)}>Keep subscription</Button>
              <Button variant="destructive" disabled={busy} onClick={handleCancel}>Confirm cancellation</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change plan dialog — customer-selected, pro-rated immediate switch */}
        <Dialog open={!!changeTarget} onOpenChange={(o) => !o && setChangeTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change plan</DialogTitle>
              <DialogDescription>
                Switch immediately — the difference is charged or credited pro-rata.
              </DialogDescription>
            </DialogHeader>
            <Select value={newPriceId} onValueChange={setNewPriceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a new plan" />
              </SelectTrigger>
              <SelectContent>
                {CHANGEABLE_PRICES.filter((p) => p !== changeTarget?.price_id).map((p) => (
                  <SelectItem key={p} value={p}>{PLAN_NAMES[p]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setChangeTarget(null)}>Cancel</Button>
              <Button disabled={busy || !newPriceId} onClick={handleChangePlan}>Switch plan</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
