import { useEffect, useState } from "react";
import { Droplets, FileCheck2, Landmark, Scale, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  H20_ALLOCATIONS,
  H20_CORE_DISCLOSURE,
  H20_LIQUIDITY_DISCLOSURE,
  H20_TAX_DISCLOSURE,
  formatH20Code,
} from "@/lib/h20/terminology";

type PublicClaim = {
  id: string;
  claim_category: string;
  public_label: string;
  public_content: string;
  approval_status: string;
  verification_status: string;
  effective_at: string;
};

type AccountingSummary = {
  account_code: string;
  display_name: string;
  currency: string;
  confirmed_amount: number;
};

const H20ReservePage = () => {
  const [claims, setClaims] = useState<PublicClaim[]>([]);
  const [summary, setSummary] = useState<AccountingSummary[]>([]);

  useEffect(() => {
    const loadVerifiedRecords = async () => {
      const [claimsResult, summaryResult] = await Promise.all([
        supabase
          .from("h20_public_claims")
          .select("id,claim_category,public_label,public_content,approval_status,verification_status,effective_at")
          .order("effective_at", { ascending: false }),
        supabase.rpc("h20_public_accounting_summary"),
      ]);
      if (!claimsResult.error) setClaims((claimsResult.data ?? []) as PublicClaim[]);
      if (!summaryResult.error) setSummary((summaryResult.data ?? []) as AccountingSummary[]);
    };
    void loadVerifiedRecords();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="border-b border-border bg-panel-header">
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
            <div className="mb-4 flex items-center gap-3">
              <Droplets className="h-9 w-9 text-neon-cyan" aria-hidden="true" />
              <Badge variant="outline" className="border-neon-cyan/40 text-neon-cyan">FACTUAL DISCLOSURE</Badge>
            </div>
            <h1 className="max-w-4xl text-3xl font-bold md:text-5xl">H20 Global Water Reserve</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
              Truthful terminology, separated accounting, evidence-backed public statements, and traceable Water-Impact Program activity.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
          <Alert className="border-neon-cyan/30 bg-neon-cyan-light/30">
            <ShieldCheck className="h-4 w-4 text-neon-cyan" />
            <AlertTitle>Core public disclosure</AlertTitle>
            <AlertDescription className="whitespace-pre-line leading-6 text-muted-foreground">{H20_CORE_DISCLOSURE}</AlertDescription>
          </Alert>

          <section aria-labelledby="allocation-heading">
            <div className="mb-4 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-gold" />
              <h2 id="allocation-heading" className="text-xl font-semibold">Confirmed Net Primary-Sale Receipts</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {H20_ALLOCATIONS.map((allocation) => (
                <Card key={allocation.code}>
                  <CardHeader className="pb-2">
                    <p className="font-mono text-3xl font-bold text-gold">{allocation.percent}%</p>
                    <CardTitle className="text-sm">{allocation.label}</CardTitle>
                  </CardHeader>
                  <CardContent className="font-mono text-[10px] text-muted-foreground">{allocation.code}</CardContent>
                </Card>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Allocations apply only after specifically disclosed payment-processing costs, blockchain transaction costs, taxes, and statutory charges are recorded.
            </p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Scale className="h-4 w-4 text-primary" />Tax treatment</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <Badge variant="secondary" className="font-mono">TAX_TREATMENT_NOT_DETERMINED</Badge>
                <p>{H20_TAX_DISCLOSURE}</p>
                <p>Transaction-history exports are provided for recordkeeping and are not tax advice.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Droplets className="h-4 w-4 text-neon-cyan" />Liquidity-Support Reserve</CardTitle></CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{H20_LIQUIDITY_DISCLOSURE}</CardContent>
            </Card>
          </section>

          <section aria-labelledby="accounting-heading">
            <div className="mb-4 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-accent" />
              <h2 id="accounting-heading" className="text-xl font-semibold">Confirmed public accounting</h2>
            </div>
            <Card>
              <Table>
                <TableHeader><TableRow><TableHead>Separated account</TableHead><TableHead className="text-right">Confirmed amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {summary.length === 0 ? (
                    <TableRow><TableCell colSpan={2} className="py-8 text-center text-muted-foreground">No confirmed H20 financial activity is recorded.</TableCell></TableRow>
                  ) : summary.map((row) => (
                    <TableRow key={row.account_code}>
                      <TableCell><p className="font-medium">{row.display_name}</p><p className="font-mono text-[10px] text-muted-foreground">{row.account_code}</p></TableCell>
                      <TableCell className="text-right font-mono">{Number(row.confirmed_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {row.currency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>

          <section aria-labelledby="claims-heading">
            <h2 id="claims-heading" className="mb-4 text-xl font-semibold">Evidence-backed public records</h2>
            {claims.length === 0 ? (
              <Card><CardContent className="py-8 text-center"><Badge variant="outline" className="mb-3 font-mono">NOT_VERIFIED</Badge><p className="text-sm text-muted-foreground">No supported public H20 claims have been authorized.</p></CardContent></Card>
            ) : (
              <div className="space-y-3">
                {claims.map((claim) => (
                  <Card key={claim.id}>
                    <CardHeader className="pb-2"><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">{claim.public_label}</CardTitle><div className="flex gap-2"><Badge variant="outline">{formatH20Code(claim.approval_status)}</Badge><Badge variant="secondary">{formatH20Code(claim.verification_status)}</Badge></div></div></CardHeader>
                    <CardContent><p className="text-sm leading-6 text-muted-foreground">{claim.public_content}</p><p className="mt-3 font-mono text-[10px] text-muted-foreground">{claim.claim_category} · EFFECTIVE {new Date(claim.effective_at).toLocaleDateString()}</p></CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default H20ReservePage;
