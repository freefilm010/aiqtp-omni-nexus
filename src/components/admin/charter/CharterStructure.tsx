import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Globe, ArrowDown, Shield, Landmark, DollarSign, Scale, Crown } from "lucide-react";

const CharterStructure = () => (
  <div className="space-y-4">
    {/* Org Chart */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" />Complete Corporate & Charter Structure</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Level 1: Trust */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
            <Crown className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">PARENT ENTITY — ULTIMATE OWNER</p>
            <p className="font-bold text-foreground text-lg">TRUST AIQTP HOLDINGS (TAH)</p>
            <p className="text-xs text-muted-foreground">Wyoming Statutory Trust • §17-23 • IP Owner • Beneficial Ownership Protected</p>
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">IP Licensor</Badge>
              <Badge variant="outline" className="text-[10px]">Asset Holder</Badge>
              <Badge variant="outline" className="text-[10px]">Royalty Recipient</Badge>
              <Badge variant="outline" className="text-[10px]">WY Privacy Shield</Badge>
            </div>
          </div>
          <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>

          {/* Level 2: Operating LLC */}
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20 text-center">
            <Landmark className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">OPERATING ENTITY — OCC APPLICANT</p>
            <p className="font-bold text-foreground text-lg">AIQTP TRUST ENTERPRISE (ATE)</p>
            <p className="text-xs text-muted-foreground">New Jersey LLC • Federal Qualified Payment Stablecoin Issuer Applicant</p>
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">Platform Operator</Badge>
              <Badge variant="outline" className="text-[10px]">IP Licensee</Badge>
              <Badge variant="outline" className="text-[10px]">Revenue Generator</Badge>
              <Badge variant="outline" className="text-[10px]">OCC Supervised</Badge>
            </div>
          </div>
          <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>

          {/* Level 3: 50-State LLCs */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border text-center">
            <Globe className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">SCALE INFRASTRUCTURE</p>
            <p className="font-bold text-foreground">50 State LLCs</p>
            <p className="text-xs text-muted-foreground">$250K credit per state = $12.5M aggregate business credit line</p>
            <div className="grid grid-cols-5 gap-1 mt-3">
              {["DE", "TX", "FL", "NV", "CA", "NY", "WA", "CO", "GA", "IL", "PA", "OH", "NC", "MI", "AZ", "MA", "VA", "TN", "MO", "MD",
                "WI", "MN", "SC", "AL", "LA", "KY", "OR", "OK", "CT", "UT", "IA", "MS", "AR", "KS", "NE", "NM", "HI", "WV", "ID", "ME",
                "NH", "MT", "RI", "SD", "ND", "AK", "VT", "WY", "NJ", "DC"].map(st => (
                <Badge key={st} variant="outline" className="text-[9px] justify-center">{st}</Badge>
              ))}
            </div>
          </div>
          <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>

          {/* Level 4: Charter */}
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
            <Shield className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">FEDERAL CHARTER</p>
            <p className="font-bold text-primary text-lg">🏛️ OCC Federal Qualified Payment Stablecoin Issuer</p>
            <p className="text-xs text-muted-foreground">GENIUS Act §15.30 • Nonbank Federal Track • 12 CFR Part 15</p>
            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-[10px]">Federal Preemption</Badge>
              <Badge variant="outline" className="text-[10px]">OCC Supervision</Badge>
              <Badge variant="outline" className="text-[10px]">National Trust Powers</Badge>
            </div>
          </div>
          <div className="flex justify-center"><ArrowDown className="h-5 w-5 text-muted-foreground" /></div>

          {/* Level 5: Global HQ */}
          <div className="p-4 rounded-lg bg-primary/20 border border-primary/40 text-center">
            <Crown className="h-6 w-6 mx-auto mb-1 text-primary" />
            <p className="text-xs text-muted-foreground">ULTIMATE VISION</p>
            <p className="font-bold text-foreground text-xl">🌍 Sovereign Micro-Nation HQ</p>
            <p className="text-xs text-muted-foreground">Bir Tawil, Africa • Unclaimed Territory • AIQTP Global Operations Center</p>
            <p className="text-xs text-muted-foreground mt-1">Dubai Corporate HQ for Tax Optimization</p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* OCC Application Pathway */}
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />OCC Application Pathway — Step by Step</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {[
          { step: 1, title: "Pre-Filing Meeting", desc: "Contact OCC Licensing Division. Discuss business model, expected conditions, application scope. Helps identify deficiencies early.", time: "Week 1-2" },
          { step: 2, title: "Prepare Application Package", desc: "Interagency Charter Application (OMB 1557-0014), business plan, financial projections, management bios, compliance programs, technology plans, governance documents.", time: "Week 2-8" },
          { step: 3, title: "Submit Application to OCC", desc: "Nonbank entities apply directly to OCC as Federal Qualified Payment Stablecoin Issuer per §15.30(a). Include all supporting documentation.", time: "Week 9" },
          { step: 4, title: "Completeness Review (30 days)", desc: "OCC reviews and notifies within 30 days if application is 'substantially complete'. May request additional information. Clock starts when complete.", time: "Week 9-13" },
          { step: 5, title: "Public Comment Period", desc: "OCC may publish notice. Public can submit comments. Prepare responses to anticipated objections.", time: "Week 13-17" },
          { step: 6, title: "OCC Evaluation", desc: "OCC evaluates financial condition, management, business plan, compliance readiness, safety & soundness. May conduct interviews.", time: "Week 13-26" },
          { step: 7, title: "Conditional Approval or Denial", desc: "OCC issues decision. Typically includes conditions: enhanced reporting, activity restrictions, capital maintenance. Application deemed APPROVED on Day 120 if no denial.", time: "Day 120" },
          { step: 8, title: "Charter Granted", desc: "Begin operations under OCC supervision. Comply with all conditions. First full-scope examination within 12 months.", time: "Post-Approval" },
        ].map((s, i) => (
          <div key={i} className="p-4 rounded-lg bg-secondary/30 flex gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{s.step}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{s.title}</p>
                <Badge variant="outline" className="text-xs">{s.time}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </div>
          </div>
        ))}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="font-medium text-primary">Critical Protection</p>
          <p className="text-sm text-muted-foreground">OCC can ONLY deny if activities would be "unsafe or unsound." Issuance on open/public blockchains <strong>CANNOT</strong> be grounds for denial. Application deemed approved on Day 120 if no denial issued.</p>
        </div>
      </CardContent>
    </Card>

    {/* Cost Estimates */}
    <Card className="bg-card border-border">
      <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Estimated Costs & Budget</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[
            { item: "WY Trust Filing", cost: "$100", cat: "Formation" },
            { item: "NJ LLC Filing", cost: "$125", cat: "Formation" },
            { item: "50-State LLC Filings (batch)", cost: "$5,000-15,000", cat: "Formation" },
            { item: "Registered Agent (50 states)", cost: "$5,000-10,000/yr", cat: "Ongoing" },
            { item: "Regulatory Counsel", cost: "$100,000-500,000", cat: "Legal" },
            { item: "CPA Engagement (annual)", cost: "$50,000-200,000/yr", cat: "Audit" },
            { item: "Blockchain Analytics (Chainalysis/TRM)", cost: "$50,000-150,000/yr", cat: "Compliance" },
            { item: "D&O Insurance", cost: "$10,000-50,000/yr", cat: "Insurance" },
            { item: "Cybersecurity Pen Testing", cost: "$10,000-50,000", cat: "Security" },
            { item: "Minimum Capital (OCC)", cost: "$5,000,000-25,000,000", cat: "Capital" },
            { item: "12-Month Operating Backstop", cost: "Varies (separate from reserves)", cat: "Capital" },
          ].map((c, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] shrink-0">{c.cat}</Badge>
                <span className="text-sm text-foreground">{c.item}</span>
              </div>
              <span className="text-sm font-bold text-primary">{c.cost}</span>
            </div>
          ))}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mt-3">
            <p className="font-medium text-foreground text-sm">Total Estimated: $5.3M - $26M+</p>
            <p className="text-xs text-muted-foreground">Primary driver: OCC minimum capital requirement. Strategy: 50-state LLC credit scaling to $12.5M covers base capital requirement.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default CharterStructure;
