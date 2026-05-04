import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, CheckCircle2, DollarSign, TrendingUp, Link2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedUser } from "@/lib/auth/getCachedUser";
import { toast } from "sonner";

type ReferralStats = {
  referral_code: string;
  total_referred: number;
  total_earnings_usd: number;
  pending_earnings_usd: number;
};

export default function ReferralPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCachedUser().then(u => {
      if (u) setUser({ id: u.id, email: u.email ?? undefined });
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    (async () => {
      setLoading(true);
      try {
        const { data: codeRow } = await supabase
          .from("user_referral_codes")
          .select("referral_code")
          .eq("user_id", user.id)
          .single();

        const { data: referred } = await supabase
          .from("affiliate_signups")
          .select("id")
          .eq("referrer_user_id", user.id);

        const { data: earnings } = await supabase
          .from("affiliate_earnings_summary")
          .select("total_earned_usd, pending_usd")
          .eq("referrer_user_id", user.id)
          .single();

        setStats({
          referral_code: codeRow?.referral_code ?? "—",
          total_referred: referred?.length ?? 0,
          total_earnings_usd: Number(earnings?.total_earned_usd ?? 0),
          pending_earnings_usd: Number(earnings?.pending_usd ?? 0),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const refUrl = stats?.referral_code && stats.referral_code !== "—"
    ? `${window.location.origin}/auth?ref=${stats.referral_code}`
    : null;

  const copyLink = async () => {
    if (!refUrl) return;
    await navigator.clipboard.writeText(refUrl);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-3xl py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Refer & Earn</h1>
          <p className="text-muted-foreground">
            Earn <strong className="text-primary">10%</strong> of every platform fee your referrals generate — forever.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: "Referred Users", value: loading ? "…" : String(stats?.total_referred ?? 0), icon: Users, color: "text-blue-400" },
            { label: "Total Earned", value: loading ? "…" : `$${(stats?.total_earnings_usd ?? 0).toFixed(2)}`, icon: DollarSign, color: "text-emerald-400" },
            { label: "Pending", value: loading ? "…" : `$${(stats?.pending_earnings_usd ?? 0).toFixed(2)}`, icon: TrendingUp, color: "text-amber-400" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-6 flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-muted-foreground text-xs">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Referral link card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Your Referral Link
            </CardTitle>
            <CardDescription>
              Share this link. When someone signs up and trades, you earn 10% of the platform's profit fee — automatically, indefinitely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading your referral code…
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={refUrl ?? "Generating your code…"}
                    className="font-mono text-sm"
                  />
                  <Button onClick={copyLink} disabled={!refUrl} variant="outline" className="shrink-0 gap-2">
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    Code: {stats?.referral_code ?? "—"}
                  </Badge>
                  <span className="text-muted-foreground text-xs">Also works as ?ref={stats?.referral_code} appended to any page</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {[
                ["Share your link", "Send your unique referral URL to traders, friends, or your audience."],
                ["They sign up & trade", "When they register using your link, they're permanently linked to you."],
                ["You earn automatically", "For every profitable trade they close, the platform takes a tiered fee (1–9%). You receive 10% of that fee, credited to your account balance — no action needed."],
                ["Withdraw anytime", "Your referral earnings accumulate in your USD balance and can be withdrawn at any time."],
              ].map(([title, desc], i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium">{title}</p>
                    <p className="text-muted-foreground">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* Exchange affiliate links for passive revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Boost Your Earnings — Exchange Affiliate Programs
            </CardTitle>
            <CardDescription>
              Sign up to these exchanges through affiliate programs and earn commission when users you refer trade there too.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                { name: "Binance", commission: "Up to 40%", note: "Largest crypto exchange by volume" },
                { name: "Kraken", commission: "20%", note: "Reputable US exchange, futures support" },
                { name: "Coinbase", commission: "50% for 3 months", note: "Best for US retail users" },
                { name: "OKX", commission: "Up to 50%", note: "Strong derivatives + copy trading" },
              ].map(ex => (
                <div key={ex.name} className="p-3 rounded-lg bg-muted/20 border border-border space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ex.name}</span>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs">
                      {ex.commission} commission
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">{ex.note}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Apply directly on each exchange's affiliate/partner page. Commission is paid by the exchange — separate from AIQTP earnings.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
