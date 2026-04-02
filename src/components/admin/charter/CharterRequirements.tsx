import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gavel, Banknote, Lock, FileText, AlertCircle, Shield,
  CheckCircle2, Users, BookOpen, Scale, Globe, Building2
} from "lucide-react";

const CharterRequirements = () => (
  <div className="space-y-4">
    {/* Application Evaluation Criteria */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5 text-primary" />OCC Application Evaluation Criteria (§15.30)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {[
          { label: "Financial Condition", desc: "Sufficient resources to meet all reserve, capital, and operational requirements. OCC notes $6.05M–$25M typical minimum capital for de novo stablecoin charters.", icon: Banknote },
          { label: "Management Competence", desc: "Experience, integrity, and character of officers/directors. Interagency Biographical & Financial Reports required. No relevant felony convictions.", icon: Users },
          { label: "Business Plan Viability", desc: "Credible 3-year business plan with quarterly financial projections, revenue model, capital adequacy analysis, technology architecture, and staffing plan.", icon: FileText },
          { label: "Compliance Infrastructure", desc: "Complete BSA/AML program, KYC/CIP/CDD/EDD procedures, OFAC screening, SAR/CTR systems, transaction monitoring, travel rule compliance.", icon: Shield },
          { label: "Redemption Policy", desc: "Must redeem at par within 2 business days. Non-discretionary extension to 7 days ONLY if >10% of outstanding value redeemed in 24h. Must notify OCC within 24h.", icon: Scale },
          { label: "Operational Resilience", desc: "Technology plan, cybersecurity controls (NIST CSF), BCP/DR plan, third-party risk management, penetration testing, incident response.", icon: Lock },
          { label: "Safety & Soundness", desc: "Activities must not be 'unsafe or unsound'. Critical protection: Issuance on open/public blockchains CANNOT be grounds for denial.", icon: Shield },
          { label: "Timeline", desc: "OCC has 30 days to confirm 'substantially complete'. Application deemed APPROVED on Day 120 if no denial per §15.30(b)(5). OCC may impose conditions.", icon: Gavel },
        ].map((r, i) => (
          <div key={i} className="p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <r.icon className="h-4 w-4 text-primary" />
              <p className="font-medium text-foreground">{r.label}</p>
            </div>
            <p className="text-sm text-muted-foreground">{r.desc}</p>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Permissible & Prohibited Activities */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />Permissible & Prohibited Activities (PPSI)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium text-green-500 mb-2 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Permissible</p>
            <div className="space-y-2">
              {[
                "Issuing and redeeming payment stablecoins",
                "Managing reserves (purchase, sell, hold reserve assets)",
                "Custody/safekeeping of stablecoins, reserves, private keys",
                "Activities directly supporting core functions",
                "Holding non-stablecoin crypto to test DLT functionality",
                "Acting as principal/agent for payment stablecoins",
                "Paying gas/network fees for customer transactions",
                "Assessing fees for purchasing/redeeming stablecoins",
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-green-500/5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-foreground">{a}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="font-medium text-destructive mb-2 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Prohibited</p>
            <div className="space-y-2">
              {[
                "Paying ANY form of interest or yield to holders",
                "Balance-based rewards, rebates, loyalty tokens tied to holding",
                "Profit-sharing with holders for passive holding",
                "Using deceptive names suggesting US government backing",
                "Suggesting stablecoins are legal tender",
                "Claiming FDIC insurance or government guarantee",
                "Pledging or rehypothecating reserve assets",
                "Using stablecoins or crypto as reserve assets",
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded bg-destructive/5">
                  <AlertCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                  <span className="text-xs text-foreground">{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-xs text-muted-foreground"><strong className="text-foreground">Important Exception:</strong> Merchants may independently offer discounts for using a specific stablecoin. Issuers may share profits with non-affiliated partners in white-label agreements. Boundaries are still being defined.</p>
        </div>
      </CardContent>
    </Card>

    {/* Reserve Requirements - Detailed */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Banknote className="h-5 w-5 text-primary" />Reserve Requirements (§15.11) — 1:1 Backing</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">Reserve assets must be maintained at fair value ≥ outstanding issuance value AT ALL TIMES. "Outstanding issuance value" = total consolidated par value of all stablecoins in circulation (excludes unissued or permanently removed).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {[
            { asset: "US Currency / Federal Reserve Deposits", detail: "Highest quality. Immediately available." },
            { asset: "Demand Deposits at FDIC-Insured Banks", detail: "Immediately available. Subject to FDIC limits per institution." },
            { asset: "US Treasuries (≤93 days maturity)", detail: "Short-dated. Minimal interest rate risk." },
            { asset: "Overnight Reverse Repo (qualifying collateral)", detail: "Treasury-backed. T+0 settlement." },
            { asset: "Government Money Market Funds", detail: "Invested solely in eligible assets. SEC-registered." },
            { asset: "Tokenized Qualifying Assets", detail: "Must meet specified on-chain/off-chain criteria." },
          ].map((a, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-sm font-medium text-foreground">{a.asset}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-6">{a.detail}</p>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <p className="font-medium text-foreground mb-2">OCC Option A — Diversification Safe Harbor</p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>• <strong>≥10%</strong> as demand deposits or money at Federal Reserve Bank</p>
            <p>• <strong>≥30%</strong> immediately available (demand deposits, Fed Bank, pending settlements)</p>
            <p>• <strong>≤40%</strong> at any single eligible financial institution</p>
            <p>• <strong>≤50%</strong> of immediately available liquidity at any one institution</p>
            <p>• Weighted average maturity <strong>≤20 days</strong></p>
            <p>• For <strong>&gt;$25B issuance</strong>: min 0.5% insured deposits (max $500M)</p>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="font-medium text-destructive flex items-center gap-2"><AlertCircle className="h-4 w-4" />Critical Restrictions</p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
            <li><strong>No Rehypothecation</strong> — Reserves cannot be pledged, reused, or lent (directly or via custodians)</li>
            <li><strong>No Commingling</strong> — Must be legally and operationally segregated from issuer assets</li>
            <li><strong>No Interest/Yield</strong> — Cannot pay holders for holding stablecoins (§15.10)</li>
            <li><strong>Priority in Insolvency</strong> — Holders' claims first over ALL creditors</li>
            <li><strong>No Crypto Reserves</strong> — Stablecoins and other crypto excluded as eligible reserves</li>
          </ul>
        </div>
      </CardContent>
    </Card>

    {/* Capital Requirements - Detailed */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Capital Requirements (§15.41)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-bold text-foreground">De Novo Minimum Capital</p>
          <p className="text-sm text-muted-foreground mt-1">Greater of: (1) amount specified in OCC approval order, or (2) <strong className="text-primary">$5,000,000</strong></p>
          <p className="text-xs text-muted-foreground mt-1">⚠️ OCC notes typical minimums range <strong>$6.05M to $25M</strong> based on business model complexity</p>
        </div>
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-bold text-foreground">Operational Liquidity Backstop</p>
          <p className="text-sm text-muted-foreground mt-1">Highly liquid assets sufficient to maintain operations during disruption. Based on actual total operating expenses over past 12 months, calculated quarterly. <strong>Separate from reserves.</strong></p>
        </div>
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-bold text-foreground">AOCI Inclusion</p>
          <p className="text-sm text-muted-foreground mt-1">Must include Accumulated Other Comprehensive Income in CET1 capital. Short-dated securities expected to generate immaterial AOCI amounts.</p>
        </div>
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-bold text-foreground">Ongoing Capital Adequacy</p>
          <p className="text-sm text-muted-foreground mt-1">Must establish process for ongoing assessment based on risk profile and operating history, subject to OCC supervisory review. Variable capital component tied to price/interest rate risk under consideration.</p>
        </div>
        <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <p className="font-bold text-destructive">Failure Consequence</p>
          <p className="text-sm text-muted-foreground mt-1">2 consecutive quarters of capital shortfall → mandatory wind-down, liquidation of reserves, redemption of all outstanding stablecoins at par.</p>
        </div>
      </CardContent>
    </Card>

    {/* Ongoing Reporting Requirements */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Ongoing Reporting & Examination Requirements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[
            { freq: "Weekly", desc: "Confidential report to OCC: issuance/redemption volumes, trading volume, reserve asset positions, material events (§15.14(h))", critical: true },
            { freq: "Monthly", desc: "Public reserve composition report by noon last business day. Breakdown by 8 eligible asset categories. CPA examination required (§15.11(e-f))", critical: true },
            { freq: "Monthly", desc: "CEO & CFO personal accuracy certification to OCC. False certification: $5M fine + 20 years imprisonment (§15.11(f))", critical: true },
            { freq: "Quarterly", desc: "Financial condition report (Call Report-style) within 30 days of quarter-end. Capital adequacy, risk metrics (§15.14(h))", critical: true },
            { freq: "Annually", desc: "Full-scope OCC examination. Every 12 months (may extend to 18-36 months for <$1B issuance with good standing)", critical: false },
            { freq: "Annually", desc: "AML/Sanctions board certification within 180 days of charter anniversary (§15.14(k))", critical: false },
            { freq: ">$50B", desc: "GAAP audited financials by PCAOB-registered CPA within 120 days of FY-end (§15.14(l))", critical: false },
            { freq: "Event", desc: "Notify OCC within 24 hours if >10% redemption demand in 24h period", critical: true },
            { freq: "Event", desc: "Notify OCC within 5 business days if exceeding $10B issuance threshold (state issuers)", critical: false },
            { freq: "Event", desc: "Prior notice to OCC for any change in control (>10% voting interest acquisition)", critical: true },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
              <Badge variant={r.critical ? "destructive" : "outline"} className={`shrink-0 text-xs ${r.critical ? "bg-destructive/10 text-destructive border-destructive/20" : ""}`}>{r.freq}</Badge>
              <span className="text-sm text-foreground">{r.desc}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Custody Standards */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Covered Custodian Standards (§15.22)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Covered assets include: payment stablecoin reserves, stablecoins as collateral, private keys, and any cash/property received in connection with custody services.</p>
        {[
          { label: "Segregation", desc: "Customer assets treated as customer property, protected from custodian's creditors. Legally and operationally insulated from issuer's commercial activities." },
          { label: "Written Controls", desc: "Written policies, procedures, and internal controls commensurate with size, complexity, and risk profile." },
          { label: "Possession/Control", desc: "Maintain possession or control of covered assets held directly, including digital wallets where custodian controls private keys." },
          { label: "Omnibus Arrangements", desc: "Permitted if recordkeeping and controls are sufficient to preserve customers' interests and meet safety/soundness standards." },
          { label: "Separate Accounting", desc: "Must separately account for all covered assets. Clear audit trail." },
          { label: "Reporting", desc: "Report total covered assets under custody, total stablecoin reserves under custody (affiliate vs. third-party), deposit account details, FDIC insurance coverage gaps." },
        ].map((item, i) => (
          <div key={i} className="p-3 rounded-lg bg-secondary/30">
            <p className="font-medium text-foreground text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Key Legal References */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" />Key Legal & Regulatory References</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { ref: "GENIUS Act (P.L. 119-XX)", desc: "Guiding and Establishing National Innovation for U.S. Stablecoins Act, signed July 18, 2025" },
            { ref: "12 CFR Part 15 (Proposed)", desc: "OCC proposed rule implementing GENIUS Act, 376-page NPRM, Feb 25, 2026" },
            { ref: "§15.10", desc: "Prohibition on interest/yield payments" },
            { ref: "§15.11", desc: "Reserve asset requirements, 1:1 backing, monthly reporting" },
            { ref: "§15.12", desc: "Redemption policy, 2-day standard, 7-day extension" },
            { ref: "§15.14", desc: "Examination, reporting, and certification requirements" },
            { ref: "§15.22", desc: "Custody and safekeeping standards" },
            { ref: "§15.30", desc: "Application, evaluation, and approval process" },
            { ref: "§15.41", desc: "Capital requirements, $5M floor, liquidity backstop" },
            { ref: "OCC Bulletin 2007-21", desc: "National trust bank capital framework (referenced for PPSI capital)" },
            { ref: "OCC Bulletin 2013-29/2023-17", desc: "Third-party risk management guidance" },
            { ref: "31 CFR 1010", desc: "FinCEN BSA/AML regulations" },
            { ref: "Bank Secrecy Act", desc: "AML/KYC/SAR/CTR requirements for financial institutions" },
            { ref: "Gramm-Leach-Bliley Act", desc: "Privacy and data protection for financial institutions" },
            { ref: "NIST CSF", desc: "Cybersecurity Framework for critical infrastructure" },
            { ref: "FATF Travel Rule", desc: "Originator/beneficiary information for transfers >$3,000" },
          ].map((r, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-secondary/30">
              <p className="font-mono text-xs text-primary">{r.ref}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default CharterRequirements;
