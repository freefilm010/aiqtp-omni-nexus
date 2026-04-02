import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Landmark, Shield, FileText, Building2, Clock, Target,
  CheckCircle2, AlertTriangle, Rocket, Crown, Scale, Banknote,
  Lock, Users, Globe, BookOpen, Gavel, AlertCircle
} from "lucide-react";

/* ─── QIP-001: GENIUS Act Federal Charter Application ─── */

interface CheckItem {
  id: string;
  label: string;
  description: string;
  deadline?: string;
  category: string;
}

const milestones: CheckItem[] = [
  // PHASE 1: Corporate Formation (Days 1-14)
  { id: "trust_wy", label: "File Wyoming Trust (TAH)", description: "TRUST AIQTP HOLDINGS — parent entity, IP owner", deadline: "Day 1-3", category: "Corporate" },
  { id: "llc_nj", label: "File NJ LLC (ATE)", description: "AIQTP TRUST ENTERPRISE — operating entity", deadline: "Day 1-3", category: "Corporate" },
  { id: "ein_trust", label: "Obtain EIN — Trust", description: "IRS online application, same-day", deadline: "Day 4", category: "Corporate" },
  { id: "ein_llc", label: "Obtain EIN — LLC", description: "IRS online application, same-day", deadline: "Day 4", category: "Corporate" },
  { id: "loi_ip", label: "Draft LOI — IP Lease (Trust → LLC)", description: "Intellectual property licensing agreement", deadline: "Day 7", category: "Corporate" },
  { id: "bank_acct", label: "Open Business Bank Account", description: "With EIN + LLC formation docs", deadline: "Day 10", category: "Corporate" },
  { id: "credit_app", label: "Apply for Business Credit Line", description: "Initial credit establishment with EIN", deadline: "Day 14", category: "Corporate" },

  // PHASE 2: OCC Application Prep (Days 14-45)
  { id: "occ_form", label: "Prepare OCC Application Package", description: "Federal qualified payment stablecoin issuer application", deadline: "Day 14-30", category: "OCC Application" },
  { id: "biz_plan", label: "Draft Business Plan & Financial Projections", description: "3-year projections, revenue model, capital plan", deadline: "Day 20", category: "OCC Application" },
  { id: "mgmt_bio", label: "Prepare Management Bios & Background Checks", description: "No relevant felony convictions requirement", deadline: "Day 20", category: "OCC Application" },
  { id: "redemption_policy", label: "Draft Redemption Policy", description: "Par redemption within 2 business days per §15.12", deadline: "Day 25", category: "OCC Application" },
  { id: "reserve_plan", label: "Design Reserve Asset Framework", description: "1:1 backing — US Treasuries ≤93 days, Fed deposits, demand deposits", deadline: "Day 25", category: "OCC Application" },
  { id: "capital_plan", label: "Establish Capital Plan", description: "Min $5M de novo + 12-month operating expense backstop per §15.41", deadline: "Day 30", category: "OCC Application" },
  { id: "custody_framework", label: "Document Custody Framework", description: "Segregation, non-commingling, omnibus controls per §15.22", deadline: "Day 30", category: "OCC Application" },

  // PHASE 3: Compliance Infrastructure (Days 30-55)
  { id: "aml_program", label: "Establish AML/BSA Program", description: "Risk-based program with designated compliance officer", deadline: "Day 35", category: "Compliance" },
  { id: "kyc_cip", label: "Implement CIP/CDD Program", description: "Customer identification, UBO verification, ongoing monitoring", deadline: "Day 35", category: "Compliance" },
  { id: "ofac_screening", label: "OFAC/SDN Screening Integration", description: "Sanctions list screening capability", deadline: "Day 35", category: "Compliance" },
  { id: "sar_system", label: "SAR Reporting System", description: "Suspicious Activity Report filing capability", deadline: "Day 40", category: "Compliance" },
  { id: "ctr_system", label: "CTR Reporting (>$10K)", description: "Currency Transaction Report system", deadline: "Day 40", category: "Compliance" },
  { id: "tx_monitoring", label: "Transaction Monitoring System", description: "Blockchain analytics, mixing/tumbler detection", deadline: "Day 45", category: "Compliance" },
  { id: "freeze_capability", label: "Token Freeze/Block Capability", description: "Ability to freeze, burn, block transactions per lawful orders", deadline: "Day 45", category: "Compliance" },
  { id: "sanctions_cert", label: "AML/Sanctions Annual Certification", description: "Board certification within 180 days of approval per §15.14(k)", deadline: "Day 50", category: "Compliance" },

  // PHASE 4: Public Disclosures & Documentation (Days 45-65)
  { id: "whitepaper", label: "Publish Platform Whitepaper", description: "Token economics, architecture, governance model", deadline: "Day 50", category: "Documentation" },
  { id: "compliance_page", label: "Publish Compliance Page on aiqtp.com", description: "Reserve transparency, redemption policy, KYC/AML docs", deadline: "Day 50", category: "Documentation" },
  { id: "reserve_report", label: "Monthly Reserve Composition Report Template", description: "Posted by noon last day of month per §15.11(e)", deadline: "Day 55", category: "Documentation" },
  { id: "audit_engage", label: "Engage Registered Public Accounting Firm", description: "Required for monthly reserve examination per §15.11(f)", deadline: "Day 55", category: "Documentation" },
  { id: "quarterly_report", label: "Quarterly Financial Report Template", description: "Call Report-style filing within 30 days of quarter-end per §15.14(h)", deadline: "Day 60", category: "Documentation" },

  // PHASE 5: Submission & Scale (Days 60-83)
  { id: "occ_submit", label: "Submit OCC Application", description: "OCC has 30 days to confirm 'substantially complete'", deadline: "Day 65", category: "Submission" },
  { id: "llc_scale", label: "Begin 50-State LLC Filings", description: "DE, TX, FL, NV, CA priority → scale to 50", deadline: "Day 60-83", category: "Submission" },
  { id: "credit_scale", label: "Scale Business Credit ($12.5M target)", description: "$250K per state LLC credit allocation", deadline: "Day 70-83", category: "Submission" },
  { id: "charter_approval", label: "🏛️ OCC Charter Approval", description: "Deemed approved on 120th day if no denial per §15.30(b)(5)", deadline: "Day 120+", category: "Submission" },
];

const FederalCharterMission = () => {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("charter_checklist_v2") || "{}"); }
    catch { return {}; }
  });

  const toggle = (id: string) => {
    const next = { ...checkedItems, [id]: !checkedItems[id] };
    setCheckedItems(next);
    localStorage.setItem("charter_checklist_v2", JSON.stringify(next));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = Math.round((completedCount / milestones.length) * 100);

  const categories = ["Corporate", "OCC Application", "Compliance", "Documentation", "Submission"];
  const getCatProgress = (cat: string) => {
    const items = milestones.filter(m => m.category === cat);
    const done = items.filter(m => checkedItems[m.id]).length;
    return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  };

  const targets = [
    { label: "$10M", desc: "Trust funded, 50 LLCs, credit maxed", icon: Building2 },
    { label: "$100M", desc: "Federal charter, institutional clients", icon: Shield },
    { label: "$1B", desc: "Industry standard platform", icon: Crown },
    { label: "$100B", desc: "Legendary legacy", icon: Rocket },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <Card className="bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border-primary/30">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Landmark className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                🏛️ QIP-001: Federal Charter Mission Control
              </h2>
              <p className="text-muted-foreground">
                GENIUS Act • OCC Federal Qualified Payment Stablecoin Issuer • 83-Day Sprint
              </p>
            </div>
            <Badge className="ml-auto bg-destructive/10 text-destructive border-destructive/20 text-lg px-4 py-2">
              <Clock className="h-4 w-4 mr-2" />
              83 Days → June 24, 2026
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-bold text-primary">{progress}% ({completedCount}/{milestones.length})</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          {/* Category Progress */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {categories.map(cat => {
              const p = getCatProgress(cat);
              return (
                <div key={cat} className="text-center">
                  <p className="text-xs text-muted-foreground">{cat}</p>
                  <p className="text-sm font-bold text-foreground">{p.done}/{p.total}</p>
                  <Progress value={p.pct} className="h-1 mt-1" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Wealth Ladder */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {targets.map((t, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <t.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-lg font-bold text-foreground">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="checklist" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="checklist">Mission Checklist</TabsTrigger>
          <TabsTrigger value="requirements">OCC Requirements</TabsTrigger>
          <TabsTrigger value="readiness">Platform Readiness</TabsTrigger>
          <TabsTrigger value="structure">Corporate Structure</TabsTrigger>
          <TabsTrigger value="penalties">Penalties & Risks</TabsTrigger>
        </TabsList>

        {/* CHECKLIST TAB */}
        <TabsContent value="checklist" className="space-y-4">
          {categories.map(cat => (
            <Card key={cat} className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    {cat}
                  </span>
                  <Badge variant="outline">{getCatProgress(cat).done}/{getCatProgress(cat).total}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {milestones.filter(m => m.category === cat).map(item => {
                  const checked = !!checkedItems[item.id];
                  return (
                    <div key={item.id} className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${checked ? "bg-primary/5" : "hover:bg-muted/50"}`}>
                      <Checkbox checked={checked} onCheckedChange={() => toggle(item.id)} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.label}</span>
                          {item.deadline && <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{item.deadline}</Badge>}
                          {checked && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* OCC REQUIREMENTS TAB */}
        <TabsContent value="requirements" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5 text-primary" />OCC Application Evaluation Criteria (§15.30)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Financial Condition", desc: "Sufficient resources to meet all reserve, capital, and operational requirements" },
                { label: "Management Competence", desc: "Experience, integrity, and character of officers/directors. No relevant felony convictions." },
                { label: "Redemption Policy", desc: "Must redeem at par within 2 business days. Non-discretionary extension to 7 days only if >10% redemptions in 24h." },
                { label: "Safety & Soundness", desc: "Activities must not be 'unsafe or unsound'. Issuance on open/public blockchains CANNOT be denied." },
                { label: "Timeline", desc: "OCC has 30 days to confirm 'substantially complete'. Application deemed approved on Day 120 if no denial." },
              ].map((r, i) => (
                <div key={i} className="p-4 rounded-lg bg-secondary/30">
                  <p className="font-medium text-foreground">{r.label}</p>
                  <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" />Reserve Requirements (§15.11) — 1:1 Backing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { asset: "US Currency / Fed Deposits", ok: true },
                  { asset: "Demand Deposits at FDIC-insured Banks", ok: true },
                  { asset: "US Treasuries (≤93 days maturity)", ok: true },
                  { asset: "Overnight Repos (qualifying collateral)", ok: true },
                  { asset: "Government Money Market Funds", ok: true },
                  { asset: "Tokenized Qualifying Assets", ok: true },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-foreground">{a.asset}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="font-medium text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />Critical Restrictions</p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li><strong>No Rehypothecation</strong> — Reserves cannot be pledged or reused</li>
                  <li><strong>No Commingling</strong> — Must be segregated from issuer assets</li>
                  <li><strong>No Interest/Yield</strong> — Cannot pay holders for holding stablecoins (§15.10)</li>
                  <li><strong>Priority in Insolvency</strong> — Holders' claims first over all creditors</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Capital Requirements (§15.41)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-bold text-foreground">De Novo Period (First 3 Years)</p>
                <p className="text-sm text-muted-foreground mt-1">Minimum capital floor: <strong>$5,000,000</strong> (CET1 + AT1)</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="font-bold text-foreground">Operational Backstop</p>
                <p className="text-sm text-muted-foreground mt-1">Must maintain liquid assets equal to <strong>12 months of total expenses</strong>, held separately from reserves</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <p className="font-bold text-destructive">Failure Consequence</p>
                <p className="text-sm text-muted-foreground mt-1">2 consecutive quarters of shortfall → mandatory wind-down, liquidation of reserves, redemption of all stablecoins</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Ongoing Reporting Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { freq: "Weekly", desc: "Confidential reports in OCC-specified format (§15.14(h))" },
                  { freq: "Monthly", desc: "Reserve composition report by noon on last day of month, with CPA examination (§15.11(e-f))" },
                  { freq: "Monthly", desc: "CEO & CFO accuracy certification to OCC (§15.11(f))" },
                  { freq: "Quarterly", desc: "Call Report-style financial condition report within 30 days (§15.14(h))" },
                  { freq: "Annually", desc: "Full-scope OCC examination (§15.14(a))" },
                  { freq: "Annually", desc: "AML/Sanctions board certification (§15.14(k))" },
                  { freq: ">$50B", desc: "GAAP audited financials by registered CPA within 120 days of FY-end (§15.14(l))" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                    <Badge variant="outline" className="shrink-0 text-xs">{r.freq}</Badge>
                    <span className="text-sm text-foreground">{r.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLATFORM READINESS TAB */}
        <TabsContent value="readiness" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />Platform Readiness for OCC Application</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { name: "Event-Sourced Ledger", status: "Live", ok: true },
                  { name: "KYC/AML + 2FA Auth", status: "Enforced", ok: true },
                  { name: "Post-Quantum Security (ML-KEM/ML-DSA)", status: "Integrated", ok: true },
                  { name: "90+ Compliance Standards Registry", status: "Live", ok: true },
                  { name: "Token Price Feeds (Live)", status: "Active", ok: true },
                  { name: "Audit Trail (append-only trade_events)", status: "Live", ok: true },
                  { name: "4-Tier Insurance Framework", status: "Designed", ok: true },
                  { name: "Treasury Wallet System", status: "Operational", ok: true },
                  { name: "IP Protection NFT Vault (36 assets)", status: "Minted", ok: true },
                  { name: "Token Freeze/Block Capability", status: "Needed", ok: false },
                  { name: "OFAC/SDN Screening Integration", status: "Needed", ok: false },
                  { name: "SAR/CTR Reporting System", status: "Needed", ok: false },
                  { name: "Reserve Transparency Page", status: "Needed", ok: false },
                  { name: "Published Whitepaper", status: "Needed", ok: false },
                  { name: "Registered CPA Engagement", status: "Needed", ok: false },
                  { name: "$5M Minimum Capital", status: "Needed", ok: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      {item.ok ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <Badge variant={item.ok ? "default" : "outline"} className={item.ok ? "bg-green-500/10 text-green-500 border-green-500/20" : "text-yellow-500 border-yellow-500/30"}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CORPORATE STRUCTURE TAB */}
        <TabsContent value="structure" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Corporate Structure & Charter Path</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">PARENT ENTITY</p>
                  <p className="font-bold text-foreground text-lg">TRUST AIQTP HOLDINGS (TAH)</p>
                  <p className="text-xs text-muted-foreground">Wyoming • IP Owner • Beneficial Ownership Protected</p>
                </div>
                <div className="flex justify-center"><div className="w-px h-6 bg-border" /></div>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-center">
                  <p className="text-xs text-muted-foreground">OPERATING ENTITY (OCC APPLICANT)</p>
                  <p className="font-bold text-foreground text-lg">AIQTP TRUST ENTERPRISE (ATE)</p>
                  <p className="text-xs text-muted-foreground">New Jersey • Licensed Operator • Federal Qualified Issuer Applicant</p>
                </div>
                <div className="flex justify-center"><div className="w-px h-6 bg-border" /></div>
                <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
                  <p className="text-xs text-muted-foreground">SCALE INFRASTRUCTURE</p>
                  <p className="font-bold text-foreground">50 State LLCs → $12.5M Business Credit Line</p>
                  <p className="text-xs text-muted-foreground">$250K per state LLC credit allocation</p>
                </div>
                <div className="flex justify-center"><div className="w-px h-6 bg-border" /></div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
                  <p className="text-xs text-muted-foreground">CHARTER APPLICATION</p>
                  <p className="font-bold text-primary text-lg">🏛️ OCC Federal Qualified Payment Stablecoin Issuer</p>
                  <p className="text-xs text-muted-foreground">GENIUS Act §15.30 • Nonbank Federal Track</p>
                </div>
                <div className="flex justify-center"><div className="w-px h-6 bg-border" /></div>
                <div className="p-4 rounded-lg bg-primary/20 border border-primary/40 text-center">
                  <p className="text-xs text-muted-foreground">ULTIMATE GOAL</p>
                  <p className="font-bold text-foreground text-xl">🌍 Sovereign Micro-Nation HQ</p>
                  <p className="text-xs text-muted-foreground">Bir Tawil, Africa • Unclaimed Territory • AIQTP Global Operations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />OCC Application Pathway — Nonbank Federal Track</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="font-medium text-foreground">Step 1: Submit Application to OCC</p>
                <p className="text-sm text-muted-foreground">Nonbank entities seeking Federal Qualified Payment Stablecoin Issuer status apply directly to OCC (§15.30(a))</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="font-medium text-foreground">Step 2: Completeness Review (30 days)</p>
                <p className="text-sm text-muted-foreground">OCC notifies within 30 days whether application is "substantially complete" (§15.30(b-e))</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <p className="font-medium text-foreground">Step 3: Decision or Auto-Approval (120 days)</p>
                <p className="text-sm text-muted-foreground">Application deemed APPROVED on Day 120 if OCC does not deny (§15.30(b)(5))</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="font-medium text-primary">Key Protection</p>
                <p className="text-sm text-muted-foreground">OCC can only deny if activities would be "unsafe or unsound." Issuance on open/public blockchains CANNOT be grounds for denial.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PENALTIES TAB */}
        <TabsContent value="penalties" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" />Civil & Criminal Penalties</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-muted-foreground">Violation</th>
                        <th className="text-left p-3 text-muted-foreground">Civil Penalty</th>
                        <th className="text-left p-3 text-muted-foreground">Criminal Penalty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { v: "Unauthorized Issuance", civil: "$100K/day", criminal: "$1M + 5 years" },
                        { v: "Material Violations", civil: "$100K/day", criminal: "—" },
                        { v: "Knowing Violations", civil: "+$100K/day", criminal: "—" },
                        { v: "False Certifications", civil: "—", criminal: "$5M + 20 years" },
                        { v: "Prohibited Officers", civil: "—", criminal: "$1M + 5 years" },
                        { v: "Misrepresenting Insured Status", civil: "$500K/violation", criminal: "—" },
                      ].map((p, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="p-3 font-medium text-foreground">{p.v}</td>
                          <td className="p-3 text-destructive">{p.civil}</td>
                          <td className="p-3 text-destructive">{p.criminal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="font-medium text-destructive">Administrative Actions</p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>Cease and desist orders (immediate if threats exist)</li>
                    <li>Suspend or revoke approval for willful/reckless violations</li>
                    <li>Remove officers/directors or prohibit industry participation</li>
                    <li>By July 2028: Unlawful for any provider to offer non-compliant stablecoins</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FederalCharterMission;
