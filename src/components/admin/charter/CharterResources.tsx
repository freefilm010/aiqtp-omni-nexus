import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, BookOpen, FileText, Scale, Users, Globe, Phone, Landmark } from "lucide-react";

const CharterResources = () => (
  <div className="space-y-4">
    {/* Official OCC Resources */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" />Official OCC Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {[
          { title: "OCC Charters & Licensing Portal", url: "https://www.occ.gov/topics/charters-and-licensing/index-charters-licensing.html", desc: "Main licensing page with forms, procedures, and contact information" },
          { title: "OCC GENIUS Act Proposed Rule (NPRM)", url: "https://www.occ.treas.gov/news-issuances/bulletins/2026/bulletin-2026-3.html", desc: "Bulletin 2026-3: 376-page proposed rulemaking implementing GENIUS Act" },
          { title: "Federal Register — National Bank Chartering", url: "https://www.federalregister.gov/documents/2026/03/02/2026-04088/national-bank-chartering", desc: "Official Federal Register notice with public comment instructions" },
          { title: "Interagency Charter Application (OMB 1557-0014)", url: "https://www.occ.gov/static/licensing/interim-bank-charter-application.pdf", desc: "Official charter application form" },
          { title: "Comptroller's Licensing Manual — Fintech Companies", url: "https://occ.gov/publications-and-resources/publications/comptrollers-licensing-manual/files/pub-considering-charter-apps-from-fin-tech-co.pdf", desc: "Supplement for evaluating fintech charter applications" },
          { title: "OCC Bulletin 2007-21", url: "https://www.occ.gov/news-issuances/bulletins/2007/bulletin-2007-21.html", desc: "National trust bank capital framework (referenced for PPSI capital requirements)" },
          { title: "OCC Bulletin 2023-17", url: "https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html", desc: "Third-party risk management guidance" },
        ].map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <ExternalLink className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>

    {/* FinCEN & BSA Resources */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />FinCEN / BSA / AML Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {[
          { title: "FinCEN BSA E-Filing System", url: "https://bsaefiling.fincen.treas.gov/", desc: "Online filing for SARs, CTRs, and other BSA forms" },
          { title: "OFAC Sanctions List Search", url: "https://sanctionssearch.ofac.treas.gov/", desc: "Search SDN and consolidated sanctions lists" },
          { title: "OFAC Compliance for Virtual Currency", url: "https://ofac.treasury.gov/media/44756/download?inline", desc: "OFAC guidance on virtual currency compliance obligations" },
          { title: "FinCEN CDD Rule", url: "https://www.fincen.gov/resources/statutes-and-regulations/cdd-final-rule", desc: "Customer Due Diligence requirements for financial institutions" },
          { title: "FinCEN Travel Rule", url: "https://www.fincen.gov/resources/statutes-regulations/administrative-rulings/definition-money-transmitter-recordkeeping", desc: "31 CFR 1010.410 — Recordkeeping for funds transfers" },
          { title: "FATF Virtual Asset Guidance", url: "https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Guidance-rba-virtual-assets-2021.html", desc: "International AML/CFT standards for virtual assets" },
        ].map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <ExternalLink className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>

    {/* State Filing Resources */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />State Formation Resources</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {[
          { title: "Wyoming Secretary of State", url: "https://sos.wyo.gov/", desc: "Trust registration, LLC filing, beneficial ownership privacy" },
          { title: "NJ Division of Revenue", url: "https://www.njportal.com/DOR/BusinessFormation", desc: "LLC Certificate of Formation filing" },
          { title: "Delaware Division of Corporations", url: "https://corp.delaware.gov/", desc: "Priority state for LLC expansion" },
          { title: "IRS EIN Online Application", url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online", desc: "Instant EIN issuance — Form SS-4" },
          { title: "D&B D-U-N-S Number Registration", url: "https://www.dnb.com/duns-number/get-a-duns.html", desc: "Free D-U-N-S number for business credit" },
          { title: "SBA Business Loans", url: "https://www.sba.gov/funding-programs/loans", desc: "Small Business Administration loan programs" },
        ].map((r, i) => (
          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
            <ExternalLink className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{r.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>

    {/* Compliance Technology Vendors */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Compliance Technology Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { name: "Chainalysis", cat: "Blockchain Analytics", desc: "KYT, Reactor, Address Screening. Industry standard for compliance." },
            { name: "TRM Labs", cat: "Blockchain Analytics", desc: "Transaction monitoring, risk scoring, sanctions screening." },
            { name: "Elliptic", cat: "Blockchain Analytics", desc: "AML compliance, OFAC screening, risk assessment." },
            { name: "Sardine", cat: "KYC/Fraud", desc: "Identity verification, fraud prevention, compliance automation." },
            { name: "Jumio", cat: "KYC/Identity", desc: "AI-powered identity verification and eKYC." },
            { name: "Sumsub", cat: "KYC/AML", desc: "Full-stack identity verification and AML compliance." },
            { name: "TRISA", cat: "Travel Rule", desc: "Open-source Travel Rule compliance network." },
            { name: "Notabene", cat: "Travel Rule", desc: "Travel Rule compliance for VASPs." },
            { name: "Fireblocks", cat: "Custody/Keys", desc: "MPC wallet infrastructure, institutional-grade custody." },
            { name: "BitGo", cat: "Custody", desc: "Qualified custodian, multi-sig, insurance." },
          ].map((v, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-foreground text-sm">{v.name}</span>
                <Badge variant="outline" className="text-[10px]">{v.cat}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Recommended Law Firms */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" />Recommended Regulatory Counsel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { firm: "Gibson Dunn", specialty: "Financial Institutions, Fintech, Digital Assets", note: "Published detailed GENIUS Act analysis" },
            { firm: "Sullivan & Cromwell", specialty: "Banking Regulation, Fintech", note: "Deep OCC charter experience" },
            { firm: "Davis Polk", specialty: "Financial Regulatory", note: "Published OCC GENIUS Act framework analysis" },
            { firm: "Arnold & Porter", specialty: "Financial Services, BSA/AML", note: "Published comprehensive GENIUS Act rulemaking advisory" },
            { firm: "Mayer Brown", specialty: "Banking, Fintech, Digital Assets", note: "Published OCC implementation analysis" },
            { firm: "K&L Gates", specialty: "Financial Services, Regulatory", note: "Published GENIUS Act market implications analysis" },
            { firm: "Orrick", specialty: "Fintech, Digital Assets", note: "Published OCC GENIUS Act implementation guide" },
            { firm: "Venable LLP", specialty: "Fintech Charter Licensing", note: "Published OCC fintech charter licensing guide" },
          ].map((f, i) => (
            <div key={i} className="p-3 rounded-lg bg-secondary/30">
              <p className="font-medium text-foreground text-sm">{f.firm}</p>
              <p className="text-xs text-muted-foreground">{f.specialty}</p>
              <p className="text-xs text-primary mt-1">{f.note}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* OCC Contact */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" />OCC Licensing Division Contact</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="font-bold text-foreground">Office of the Comptroller of the Currency</p>
          <p className="text-sm text-muted-foreground mt-1">Licensing Division</p>
          <p className="text-sm text-muted-foreground">400 7th Street SW, Washington, DC 20219</p>
          <p className="text-sm text-muted-foreground mt-2">📞 (202) 649-6260</p>
          <p className="text-sm text-muted-foreground">📧 licensing@occ.treas.gov</p>
          <p className="text-sm text-muted-foreground mt-2">🌐 <a href="https://www.occ.gov" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.occ.gov</a></p>
        </div>
        <div className="p-4 rounded-lg bg-secondary/30">
          <p className="font-medium text-foreground text-sm">Pre-Filing Meeting Request</p>
          <p className="text-xs text-muted-foreground mt-1">Contact the OCC Licensing Division to schedule a pre-filing meeting. This is STRONGLY recommended before submitting a formal application. Discuss business model, expected conditions, and identify potential deficiencies early.</p>
        </div>
      </CardContent>
    </Card>

    {/* Required Forms Checklist */}
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Complete Forms & Documents Checklist</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {[
            { form: "Interagency Charter Application (OMB 1557-0014)", source: "OCC", required: true },
            { form: "Interagency Biographical & Financial Report", source: "OCC/FDIC/Fed", required: true },
            { form: "FBI Background Check Consent", source: "FBI", required: true },
            { form: "Personal Financial Statement (each director/officer)", source: "OCC", required: true },
            { form: "Business Plan (3-year with quarterly projections)", source: "Applicant", required: true },
            { form: "Financial Projections Spreadsheet", source: "Applicant", required: true },
            { form: "Capital Adequacy Analysis", source: "Applicant", required: true },
            { form: "BSA/AML Program Document", source: "Applicant", required: true },
            { form: "KYC/CIP/CDD Procedures Manual", source: "Applicant", required: true },
            { form: "OFAC Compliance Procedures", source: "Applicant", required: true },
            { form: "SAR/CTR Filing Procedures", source: "Applicant", required: true },
            { form: "Redemption Policy & Procedures", source: "Applicant", required: true },
            { form: "Reserve Management Policy", source: "Applicant", required: true },
            { form: "Reserve Diversification Plan", source: "Applicant", required: true },
            { form: "Custody & Safekeeping Procedures", source: "Applicant", required: true },
            { form: "Corporate Governance Bylaws", source: "Applicant", required: true },
            { form: "Board Committee Charters (Audit, Risk, Compliance)", source: "Applicant", required: true },
            { form: "Conflict of Interest Policy", source: "Applicant", required: true },
            { form: "Code of Ethics & Insider Trading Policy", source: "Applicant", required: true },
            { form: "Technology & Cybersecurity Plan (NIST CSF)", source: "Applicant", required: true },
            { form: "Business Continuity/Disaster Recovery Plan", source: "Applicant", required: true },
            { form: "Third-Party Risk Management Program", source: "Applicant", required: true },
            { form: "Incident Response Plan", source: "Applicant", required: true },
            { form: "Consumer Complaint Management Procedures", source: "Applicant", required: true },
            { form: "Privacy Policy (GLBA)", source: "Applicant", required: true },
            { form: "Records Retention Policy", source: "Applicant", required: true },
            { form: "Transaction Monitoring Procedures", source: "Applicant", required: true },
            { form: "Token Freeze/Block Technical Documentation", source: "Applicant", required: true },
            { form: "Platform Whitepaper", source: "Applicant", required: true },
            { form: "Articles of Organization / Certificate of Formation", source: "State", required: true },
            { form: "EIN Confirmation Letter (IRS)", source: "IRS", required: true },
            { form: "IP Licensing Agreement (Trust → LLC)", source: "Applicant", required: true },
            { form: "Operating Agreement", source: "Applicant", required: true },
            { form: "IRS Form SS-4 (EIN Application)", source: "IRS", required: true },
            { form: "WY Trust Registration Form", source: "WY SOS", required: true },
            { form: "FinCEN BSA E-Filing Registration", source: "FinCEN", required: true },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded bg-secondary/20">
              <span className="text-xs">📋</span>
              <span className="text-xs text-foreground flex-1">{f.form}</span>
              <Badge variant="outline" className="text-[9px] shrink-0">{f.source}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export default CharterResources;
