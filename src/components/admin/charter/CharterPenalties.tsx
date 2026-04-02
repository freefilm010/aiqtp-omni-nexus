import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Shield, Gavel, Clock } from "lucide-react";

const CharterPenalties = () => (
  <div className="space-y-4">
    {/* Civil & Criminal Penalties */}
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertCircle className="h-5 w-5" />Civil & Criminal Penalties (GENIUS Act)</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground">Violation</th>
                <th className="text-left p-3 text-muted-foreground">Civil Penalty</th>
                <th className="text-left p-3 text-muted-foreground">Criminal Penalty</th>
                <th className="text-left p-3 text-muted-foreground">Statute</th>
              </tr>
            </thead>
            <tbody>
              {[
                { v: "Unauthorized Stablecoin Issuance", civil: "$100,000/day", criminal: "$1,000,000 + 5 years", statute: "§15.50" },
                { v: "Material Regulatory Violations", civil: "$100,000/day", criminal: "—", statute: "§15.51" },
                { v: "Knowing/Willful Violations", civil: "+$100,000/day (enhanced)", criminal: "—", statute: "§15.51" },
                { v: "False CEO/CFO Certifications", civil: "—", criminal: "$5,000,000 + 20 years", statute: "§15.11(f)" },
                { v: "Prohibited Officers (felony convictions)", civil: "—", criminal: "$1,000,000 + 5 years", statute: "§15.52" },
                { v: "Misrepresenting FDIC/Gov Insurance", civil: "$500,000/violation", criminal: "—", statute: "§15.53" },
                { v: "Paying Interest/Yield to Holders", civil: "$100,000/day", criminal: "—", statute: "§15.10" },
                { v: "Rehypothecating Reserve Assets", civil: "$100,000/day", criminal: "—", statute: "§15.11" },
                { v: "Failure to Redeem Within 2 Days", civil: "Supervisory action", criminal: "—", statute: "§15.12" },
                { v: "BSA/AML Program Failure", civil: "$1,000,000/day (FinCEN)", criminal: "5 years", statute: "31 USC 5321-22" },
                { v: "SAR Filing Failure", civil: "$250,000/violation", criminal: "5 years", statute: "31 USC 5322" },
              ].map((p, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="p-3 font-medium text-foreground">{p.v}</td>
                  <td className="p-3 text-destructive font-mono text-xs">{p.civil}</td>
                  <td className="p-3 text-destructive font-mono text-xs">{p.criminal}</td>
                  <td className="p-3 text-muted-foreground font-mono text-xs">{p.statute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>

    {/* Administrative Actions */}
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><Gavel className="h-5 w-5" />Administrative Enforcement Actions</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {[
          { action: "Cease and Desist Orders", desc: "Immediate if imminent threat exists. OCC can order immediate cessation of unsafe/unsound practices or violations.", severity: "Immediate" },
          { action: "Formal Enforcement Actions", desc: "Consent orders, civil money penalties, removal/prohibition orders. Published on OCC website. Material impact on reputation.", severity: "Severe" },
          { action: "Suspend or Revoke Approval", desc: "For willful, reckless, or repeated violations. Mandatory wind-down and redemption of all outstanding stablecoins.", severity: "Terminal" },
          { action: "Remove Officers/Directors", desc: "OCC can remove individuals from positions and prohibit future participation in banking industry.", severity: "Personal" },
          { action: "Capital Directive", desc: "OCC can order PPSI to increase capital to specific level. 2 consecutive quarters of shortfall → mandatory wind-down.", severity: "Critical" },
          { action: "Temporary Cease and Desist", desc: "Ex parte order without notice if violation likely to cause insolvency, dissipation of assets, or prejudice to depositors.", severity: "Emergency" },
        ].map((a, i) => (
          <div key={i} className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-foreground">{a.action}</p>
              <Badge variant="destructive" className="text-[10px] bg-destructive/10">{a.severity}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{a.desc}</p>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Key Deadlines */}
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" />Critical Regulatory Deadlines</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {[
          { date: "July 18, 2025", event: "GENIUS Act signed into law", status: "✅ Passed" },
          { date: "February 25, 2026", event: "OCC proposed rule (NPRM) published — 376 pages", status: "✅ Published" },
          { date: "~April 26, 2026", event: "60-day public comment period ends (est.)", status: "⏳ Active" },
          { date: "June 24, 2026", event: "🎯 83-DAY TARGET — Application submission deadline", status: "🔴 TARGET" },
          { date: "~July 24, 2026", event: "OCC 30-day completeness review (if submitted Day 65)", status: "📋 Pending" },
          { date: "~October 22, 2026", event: "Day 120 — Auto-approval if no denial issued", status: "🏛️ Goal" },
          { date: "July 2028", event: "UNLAWFUL for any provider to offer non-compliant stablecoins", status: "⚠️ Enforcement" },
        ].map((d, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
            <Badge variant="outline" className="shrink-0 text-xs font-mono min-w-[120px] justify-center">{d.date}</Badge>
            <span className="text-sm text-foreground flex-1">{d.event}</span>
            <span className="text-xs shrink-0">{d.status}</span>
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Risk Mitigations */}
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Risk Mitigations & Protections</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {[
          { risk: "Application Denial", mitigation: "Pre-filing meeting with OCC. Engage specialized counsel. Address all evaluation criteria. Public blockchain protection clause prevents denial based on technology choice." },
          { risk: "Capital Shortfall", mitigation: "50-state LLC credit strategy ($12.5M). Trading bot revenue. Platform fees. Investor outreach. SBA loan options." },
          { risk: "Compliance Gap", mitigation: "Systematic readiness tracking. Engage compliance consultants. Build all required systems before submission. Independent BSA audit." },
          { risk: "Management Challenge", mitigation: "Recruit qualified board members with banking/fintech experience. Advisory board with regulatory expertise. Hire BSA officer." },
          { risk: "Operational Risk", mitigation: "Post-quantum security (already integrated). Event-sourced ledger (already live). Multi-tier insurance framework. BCP/DR plan." },
          { risk: "Regulatory Change", mitigation: "Final rule may differ from proposal. Engage in comment period. Build flexible architecture. Monitor OCC bulletins." },
        ].map((r, i) => (
          <div key={i} className="p-4 rounded-lg bg-secondary/30">
            <p className="font-medium text-foreground text-sm">{r.risk}</p>
            <p className="text-xs text-muted-foreground mt-1">{r.mitigation}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);

export default CharterPenalties;
