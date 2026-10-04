import { useEffect, useState } from "react";
import { ClipboardCheck, FileWarning, Landmark, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  H20_CLAIM_CATEGORIES,
  H20_DISTRIBUTION_TYPES,
  H20_RECIPIENT_CLASSIFICATIONS,
  H20_VERIFICATION_STATUSES,
  formatH20Code,
} from "@/lib/h20/terminology";

type Claim = { id: string; claim_key: string; public_label: string; claim_category: string; approval_status: string; verification_status: string; source_document_reference: string; public_content: string };
type Recipient = { id: string; public_name: string; legal_name: string; recipient_classification: string; verification_status: string };
type Distribution = { id: string; distribution_type: string; amount: number; currency: string; status: string; purpose: string; recipient_id: string };
type LedgerEntry = { id: string; transaction_type: string; amount: number; currency: string; transaction_reference: string; ledger_status: string; created_at: string };

const H20Governance = () => {
  const { user } = useAuth();
  const db = supabase as any;
  const [claims, setClaims] = useState<Claim[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [claim, setClaim] = useState({ claimKey: "", category: "PUBLIC_DISCLOSURE", label: "", content: "", source: "", effectiveAt: "" });
  const [recipient, setRecipient] = useState({ legalName: "", publicName: "", classification: "OTHER_APPROVED_WATER_IMPACT_ENTITY", verification: "NOT_VERIFIED", scope: "", source: "", date: "", expires: "", document: "" });
  const [distribution, setDistribution] = useState({ recipientId: "", type: "OTHER_APPROVED_DISTRIBUTION", purpose: "", amount: "", currency: "USD", approval: "", agreement: "", reportingPeriod: "" });

  const load = async () => {
    const [claimResult, recipientResult, distributionResult, ledgerResult] = await Promise.all([
      db.from("h20_public_claims").select("*").order("created_at", { ascending: false }),
      db.from("h20_recipients").select("*").order("created_at", { ascending: false }),
      db.from("h20_distributions").select("*").order("created_at", { ascending: false }),
      db.from("h20_ledger_entries").select("id,transaction_type,amount,currency,transaction_reference,ledger_status,created_at").order("created_at", { ascending: false }).limit(100),
    ]);
    if (claimResult.error || recipientResult.error || distributionResult.error || ledgerResult.error) {
      toast.error("Could not load H20 governance records");
      return;
    }
    setClaims((claimResult.data ?? []) as Claim[]);
    setRecipients((recipientResult.data ?? []) as Recipient[]);
    setDistributions((distributionResult.data ?? []) as Distribution[]);
    setLedger((ledgerResult.data ?? []) as LedgerEntry[]);
  };

  useEffect(() => { void load(); }, []);

  const createClaim = async () => {
    if (!user || !claim.claimKey || !claim.label || !claim.content || !claim.source || !claim.effectiveAt) return toast.error("Complete every claim evidence field");
    setBusy(true);
    const { error } = await db.from("h20_public_claims").insert({
      claim_key: claim.claimKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "_"), claim_category: claim.category,
      public_label: claim.label.trim(), public_content: claim.content.trim(), source_document_reference: claim.source.trim(),
      effective_at: new Date(claim.effectiveAt).toISOString(), created_by: user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Claim saved for review; it is not public");
    setClaim({ claimKey: "", category: "PUBLIC_DISCLOSURE", label: "", content: "", source: "", effectiveAt: "" });
    void load();
  };

  const reviewClaim = async (id: string, action: string) => {
    setBusy(true);
    const { error } = await db.rpc("h20_review_claim", { p_claim_id: id, p_action: action, p_verification_status: action === "ADMIN_APPROVED" ? "VERIFIED" : "VERIFICATION_FAILED" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(action === "REJECTED" ? "Claim rejected" : "Claim authorized with its exact status");
    void load();
  };

  const createRecipient = async () => {
    if (!user || !recipient.legalName || !recipient.publicName) return toast.error("Legal and public names are required");
    setBusy(true);
    const { error } = await db.from("h20_recipients").insert({
      legal_name: recipient.legalName.trim(), public_name: recipient.publicName.trim(), recipient_classification: recipient.classification,
      verification_status: recipient.verification, verification_scope: recipient.scope || null, evidence_source: recipient.source || null,
      verification_date: recipient.date || null, verification_expires_at: recipient.expires || null, document_reference: recipient.document || null,
      reviewed_by: recipient.verification === "VERIFIED" ? user.id : null, created_by: user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Recipient record created");
    setRecipient({ legalName: "", publicName: "", classification: "OTHER_APPROVED_WATER_IMPACT_ENTITY", verification: "NOT_VERIFIED", scope: "", source: "", date: "", expires: "", document: "" });
    void load();
  };

  const createDistribution = async () => {
    if (!user || !distribution.recipientId || !distribution.purpose || !distribution.amount || !distribution.approval || !distribution.agreement || !distribution.reportingPeriod) return toast.error("Complete every distribution field");
    setBusy(true);
    const { error } = await db.from("h20_distributions").insert({
      recipient_id: distribution.recipientId, distribution_type: distribution.type, purpose: distribution.purpose.trim(),
      amount: Number(distribution.amount), currency: distribution.currency.trim().toUpperCase(), approval_reference: distribution.approval.trim(),
      agreement_document_reference: distribution.agreement.trim(), reporting_period: distribution.reportingPeriod.trim(), created_by: user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Distribution saved for review; no funds were represented as sent");
    setDistribution({ recipientId: "", type: "OTHER_APPROVED_DISTRIBUTION", purpose: "", amount: "", currency: "USD", approval: "", agreement: "", reportingPeriod: "" });
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-bold">H20 Governance</h1><p className="mt-1 text-sm text-muted-foreground">Evidence, approvals, separated funds, corrections, and production authorization.</p></div>
        <Button variant="outline" size="sm" onClick={() => void load()}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>
      <Card className="border-warning/40 bg-warning-light/20"><CardContent className="flex items-start gap-3 pt-6"><FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-warning" /><p className="text-sm text-muted-foreground">Administrative approval is internal production authorization only. It is not legal, regulatory, tax, government, securities, or audit approval.</p></CardContent></Card>

      <Tabs defaultValue="claims" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 md:grid-cols-4"><TabsTrigger value="claims">Claims</TabsTrigger><TabsTrigger value="recipients">Recipients</TabsTrigger><TabsTrigger value="distributions">Distributions</TabsTrigger><TabsTrigger value="ledger">Ledger</TabsTrigger></TabsList>
        <TabsContent value="claims" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">New evidence-backed claim</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
            <Field label="Claim key"><Input value={claim.claimKey} onChange={(e) => setClaim({ ...claim, claimKey: e.target.value })} placeholder="MAINNET_STATUS" /></Field>
            <Field label="Category"><Select value={claim.category} onValueChange={(category) => setClaim({ ...claim, category })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{H20_CLAIM_CATEGORIES.map((value) => <SelectItem key={value} value={value}>{formatH20Code(value)}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Public label"><Input value={claim.label} onChange={(e) => setClaim({ ...claim, label: e.target.value })} /></Field>
            <Field label="Effective date"><Input type="datetime-local" value={claim.effectiveAt} onChange={(e) => setClaim({ ...claim, effectiveAt: e.target.value })} /></Field>
            <Field label="Source or document reference"><Input value={claim.source} onChange={(e) => setClaim({ ...claim, source: e.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Exact public statement"><Textarea value={claim.content} onChange={(e) => setClaim({ ...claim, content: e.target.value })} /></Field></div>
            <div className="md:col-span-2"><Button disabled={busy} onClick={createClaim}><ClipboardCheck className="mr-2 h-4 w-4" />Save for review</Button></div>
          </CardContent></Card>
          <Card><Table><TableHeader><TableRow><TableHead>Claim</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Review</TableHead></TableRow></TableHeader><TableBody>{claims.length === 0 ? <EmptyRow columns={3} label="No claims recorded" /> : claims.map((item) => <TableRow key={item.id}><TableCell><p className="font-medium">{item.public_label}</p><p className="font-mono text-[10px] text-muted-foreground">{item.claim_key} · {item.claim_category}</p></TableCell><TableCell><Badge variant="outline">{item.approval_status}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" disabled={busy || item.approval_status !== "PENDING_REVIEW"} onClick={() => reviewClaim(item.id, "REJECTED")}>Reject</Button><Button size="sm" disabled={busy || item.approval_status !== "PENDING_REVIEW"} onClick={() => reviewClaim(item.id, "ADMIN_APPROVED")}>Administrative approval</Button></div></TableCell></TableRow>)}</TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Recipient evidence record</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
            <Field label="Legal name"><Input value={recipient.legalName} onChange={(e) => setRecipient({ ...recipient, legalName: e.target.value })} /></Field><Field label="Public name"><Input value={recipient.publicName} onChange={(e) => setRecipient({ ...recipient, publicName: e.target.value })} /></Field>
            <Field label="Classification"><Select value={recipient.classification} onValueChange={(classification) => setRecipient({ ...recipient, classification })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{H20_RECIPIENT_CLASSIFICATIONS.map((value) => <SelectItem key={value} value={value}>{formatH20Code(value)}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Verification status"><Select value={recipient.verification} onValueChange={(verification) => setRecipient({ ...recipient, verification })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{H20_VERIFICATION_STATUSES.map((value) => <SelectItem key={value} value={value}>{formatH20Code(value)}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="What was verified"><Input value={recipient.scope} onChange={(e) => setRecipient({ ...recipient, scope: e.target.value })} placeholder="Organization identity verified" /></Field><Field label="Evidence source"><Input value={recipient.source} onChange={(e) => setRecipient({ ...recipient, source: e.target.value })} /></Field>
            <Field label="Verification date"><Input type="date" value={recipient.date} onChange={(e) => setRecipient({ ...recipient, date: e.target.value })} /></Field><Field label="Expiration date"><Input type="date" value={recipient.expires} onChange={(e) => setRecipient({ ...recipient, expires: e.target.value })} /></Field>
            <Field label="Document reference"><Input value={recipient.document} onChange={(e) => setRecipient({ ...recipient, document: e.target.value })} /></Field><div className="flex items-end"><Button disabled={busy} onClick={createRecipient}>Create recipient record</Button></div>
          </CardContent></Card>
          <Card><Table><TableHeader><TableRow><TableHead>Approved Water-Impact Recipient</TableHead><TableHead>Classification</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{recipients.length === 0 ? <EmptyRow columns={3} label="No recipients recorded" /> : recipients.map((item) => <TableRow key={item.id}><TableCell><p className="font-medium">{item.public_name}</p><p className="text-xs text-muted-foreground">{item.legal_name}</p></TableCell><TableCell className="font-mono text-xs">{item.recipient_classification}</TableCell><TableCell><Badge variant="outline">{item.verification_status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="distributions" className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Proposed Water-Impact Distribution</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2">
            <Field label="Recipient"><Select value={distribution.recipientId} onValueChange={(recipientId) => setDistribution({ ...distribution, recipientId })}><SelectTrigger><SelectValue placeholder="Select a recorded recipient" /></SelectTrigger><SelectContent>{recipients.map((item) => <SelectItem key={item.id} value={item.id}>{item.public_name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Distribution type"><Select value={distribution.type} onValueChange={(type) => setDistribution({ ...distribution, type })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{H20_DISTRIBUTION_TYPES.map((value) => <SelectItem key={value} value={value}>{formatH20Code(value)}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Amount"><Input type="number" min="0" step="0.01" value={distribution.amount} onChange={(e) => setDistribution({ ...distribution, amount: e.target.value })} /></Field><Field label="Currency"><Input value={distribution.currency} onChange={(e) => setDistribution({ ...distribution, currency: e.target.value })} /></Field>
            <Field label="Approval reference"><Input value={distribution.approval} onChange={(e) => setDistribution({ ...distribution, approval: e.target.value })} /></Field><Field label="Agreement/document reference"><Input value={distribution.agreement} onChange={(e) => setDistribution({ ...distribution, agreement: e.target.value })} /></Field>
            <Field label="Reporting period"><Input value={distribution.reportingPeriod} onChange={(e) => setDistribution({ ...distribution, reportingPeriod: e.target.value })} placeholder="2026-Q4" /></Field><Field label="Purpose"><Textarea value={distribution.purpose} onChange={(e) => setDistribution({ ...distribution, purpose: e.target.value })} /></Field>
            <div className="md:col-span-2"><Button disabled={busy} onClick={createDistribution}>Save proposed distribution</Button></div>
          </CardContent></Card>
          <Card><Table><TableHeader><TableRow><TableHead>Classification</TableHead><TableHead>Purpose</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{distributions.length === 0 ? <EmptyRow columns={4} label="No distributions recorded" /> : distributions.map((item) => <TableRow key={item.id}><TableCell className="font-mono text-xs">{item.distribution_type}</TableCell><TableCell>{item.purpose}</TableCell><TableCell className="text-right font-mono">{item.amount} {item.currency}</TableCell><TableCell><Badge variant="outline">{item.status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
        </TabsContent>

        <TabsContent value="ledger"><Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Landmark className="h-4 w-4" />Append-only financial history</CardTitle></CardHeader><Table><TableHeader><TableRow><TableHead>Classification</TableHead><TableHead>Reference</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{ledger.length === 0 ? <EmptyRow columns={4} label="No H20 financial movements recorded" /> : ledger.map((item) => <TableRow key={item.id}><TableCell className="font-mono text-xs">{item.transaction_type}</TableCell><TableCell className="font-mono text-xs">{item.transaction_reference}</TableCell><TableCell className="text-right font-mono">{item.amount} {item.currency}</TableCell><TableCell><Badge variant="outline">{item.ledger_status}</Badge></TableCell></TableRow>)}</TableBody></Table></Card></TabsContent>
      </Tabs>
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
const EmptyRow = ({ columns, label }: { columns: number; label: string }) => <TableRow><TableCell colSpan={columns} className="py-8 text-center text-muted-foreground">{label}</TableCell></TableRow>;

export default H20Governance;