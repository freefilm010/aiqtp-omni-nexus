import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertTriangle, Scale, XCircle } from "lucide-react";

interface ReadinessItem {
  name: string;
  status: string;
  ok: boolean;
  category: string;
  detail?: string;
  action?: string;
}

const readinessItems: ReadinessItem[] = [
  // READY
  { name: "Event-Sourced Ledger (trade_events)", category: "Technology", status: "Live", ok: true, detail: "Append-only audit trail. Immutable transaction history." },
  { name: "KYC/AML + 2FA Authentication", category: "Compliance", status: "Enforced", ok: true, detail: "One account per SSN/EIN. 2FA required." },
  { name: "Post-Quantum Cryptography (ML-KEM/ML-DSA)", category: "Technology", status: "Integrated", ok: true, detail: "NIST PQC standards. Future-proof security." },
  { name: "90+ Protocol Standards Registry", category: "Compliance", status: "Live", ok: true, detail: "EIP/ERC, NIST, FIPS, ISO, PQC compliance tracking." },
  { name: "Token Price Feeds (Real-time)", category: "Technology", status: "Active", ok: true, detail: "Live market data feeds for asset valuation." },
  { name: "Audit Trail (append-only)", category: "Compliance", status: "Live", ok: true, detail: "Complete transaction audit trail for regulatory examination." },
  { name: "4-Tier Insurance Framework", category: "Risk", status: "Designed", ok: true, detail: "Coverage framework for platform operations." },
  { name: "Treasury Wallet System", category: "Operations", status: "Operational", ok: true, detail: "Multi-currency wallet management. Balance tracking." },
  { name: "IP Protection NFT Vault (37 assets)", category: "Legal", status: "Minted", ok: true, detail: "Decentralized proof of IP ownership on-chain." },
  { name: "Profit Distribution Rules Engine", category: "Operations", status: "Live", ok: true, detail: "Automated revenue distribution and fee collection." },
  { name: "Platform Activity Logging", category: "Compliance", status: "Live", ok: true, detail: "System-wide event logging for administrative auditing." },
  { name: "Role-Based Access Control", category: "Security", status: "Enforced", ok: true, detail: "Admin/Moderator/User roles with RLS policies." },
  { name: "Security Audit Logging", category: "Security", status: "Live", ok: true, detail: "Real-time security event monitoring and scoring." },
  
  // NEEDS WORK
  { name: "Token Freeze/Block Smart Contract", category: "Compliance", status: "Needed", ok: false, detail: "Required for OFAC compliance and law enforcement.", action: "Implement ERC-20 with freeze/burn functions + admin controls" },
  { name: "OFAC/SDN Screening Integration", category: "Compliance", status: "Needed", ok: false, detail: "Real-time sanctions list screening on every transaction.", action: "Integrate Chainalysis/Elliptic API or OFAC API" },
  { name: "SAR/CTR Reporting System", category: "Compliance", status: "Needed", ok: false, detail: "FinCEN BSA E-Filing for suspicious activity & currency transaction reports.", action: "Build SAR/CTR workflow + FinCEN integration" },
  { name: "Transaction Monitoring (Blockchain Analytics)", category: "Compliance", status: "Needed", ok: false, detail: "Automated detection of mixing, darknet, ransomware addresses.", action: "Integrate Chainalysis KYT or TRM Labs" },
  { name: "Travel Rule Compliance", category: "Compliance", status: "Needed", ok: false, detail: "FATF Travel Rule for transfers >$3,000.", action: "Integrate TRISA network or equivalent" },
  { name: "Reserve Transparency Dashboard", category: "Documentation", status: "Needed", ok: false, detail: "Public monthly reserve composition report page.", action: "Build public-facing reserve attestation page" },
  { name: "Published Whitepaper", category: "Documentation", status: "Needed", ok: false, detail: "Comprehensive platform whitepaper.", action: "Draft and publish at aiqtp.com/whitepaper" },
  { name: "Registered CPA Engagement", category: "Documentation", status: "Needed", ok: false, detail: "PCAOB-registered firm for monthly reserve examination.", action: "Engage CPA firm ($50K-200K/year)" },
  { name: "$5M+ Minimum Capital", category: "Financial", status: "Needed", ok: false, detail: "De novo minimum. OCC typically requires $6.05M-$25M.", action: "Capital raising via credit strategy + revenue" },
  { name: "Board of Directors (5+ members)", category: "Governance", status: "Needed", ok: false, detail: "Independent directors, audit/risk/compliance committees.", action: "Recruit qualified board members" },
  { name: "BSA/AML Compliance Officer", category: "Compliance", status: "Needed", ok: false, detail: "Qualified individual with board reporting authority.", action: "Hire or designate BSA officer" },
  { name: "Cybersecurity Plan (NIST CSF)", category: "Technology", status: "Needed", ok: false, detail: "Formal cybersecurity framework aligned with NIST.", action: "Document NIST CSF alignment + pen test schedule" },
  { name: "Business Continuity/DR Plan", category: "Operations", status: "Needed", ok: false, detail: "Tested BCP/DR with recovery objectives.", action: "Draft and test BCP/DR plan" },
  { name: "Third-Party Risk Management", category: "Compliance", status: "Needed", ok: false, detail: "OCC Bulletin 2023-17 vendor management.", action: "Document vendor due diligence framework" },
  { name: "Consumer Complaint System", category: "Compliance", status: "Needed", ok: false, detail: "Tracking, escalation, regulatory reporting.", action: "Build complaint management workflow" },
  { name: "Privacy Policy (GLBA)", category: "Legal", status: "Needed", ok: false, detail: "Gramm-Leach-Bliley Act compliance.", action: "Draft GLBA-compliant privacy notices" },
];

const CharterReadiness = () => {
  const ready = readinessItems.filter(i => i.ok).length;
  const total = readinessItems.length;
  const pct = Math.round((ready / total) * 100);

  const categories = [...new Set(readinessItems.map(i => i.category))];

  return (
    <div className="space-y-4">
      {/* Overall Readiness Score */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              <span className="font-bold text-foreground text-lg">OCC Application Readiness Score</span>
            </div>
            <span className="text-2xl font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-4 mb-3" />
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-500"><CheckCircle2 className="h-4 w-4" />{ready} Ready</span>
            <span className="flex items-center gap-1 text-yellow-500"><AlertTriangle className="h-4 w-4" />{total - ready} Action Needed</span>
          </div>
        </CardContent>
      </Card>

      {/* By Category */}
      {categories.map(cat => {
        const items = readinessItems.filter(i => i.category === cat);
        const catReady = items.filter(i => i.ok).length;
        return (
          <Card key={cat} className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{cat}</span>
                <Badge variant="outline" className={catReady === items.length ? "text-green-500 border-green-500/30" : "text-yellow-500 border-yellow-500/30"}>
                  {catReady}/{items.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {item.ok ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                    </div>
                    <Badge variant={item.ok ? "default" : "outline"} className={item.ok ? "bg-green-500/10 text-green-500 border-green-500/20 text-xs" : "text-yellow-500 border-yellow-500/30 text-xs"}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{item.detail}</p>
                  {item.action && (
                    <p className="text-xs text-primary ml-6 mt-1 flex items-center gap-1">
                      → {item.action}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CharterReadiness;
