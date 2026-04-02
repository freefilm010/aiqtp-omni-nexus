import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Target } from "lucide-react";

export interface CheckItem {
  id: string;
  label: string;
  description: string;
  deadline?: string;
  category: string;
  priority?: "critical" | "high" | "medium";
  resources?: string[];
  forms?: string[];
  cost?: string;
}

export const milestones: CheckItem[] = [
  // PHASE 1: Corporate Formation (Days 1-14)
  { id: "trust_wy", label: "File Wyoming Trust (TAH)", description: "TRUST AIQTP HOLDINGS — parent entity, IP owner. File with WY Secretary of State. Wyoming Statutory Trust Act §17-23.", deadline: "Day 1-3", category: "Corporate", priority: "critical", cost: "$100 filing fee", forms: ["WY Trust Registration Form", "Articles of Organization"], resources: ["https://sos.wyo.gov"] },
  { id: "llc_nj", label: "File NJ LLC (ATE)", description: "AIQTP TRUST ENTERPRISE — operating entity, OCC applicant. File Certificate of Formation with NJ DORES.", deadline: "Day 1-3", category: "Corporate", priority: "critical", cost: "$125 filing fee", forms: ["NJ Certificate of Formation", "Public Records Filing"], resources: ["https://www.njportal.com/DOR/BusinessFormation"] },
  { id: "ein_trust", label: "Obtain EIN — Trust (TAH)", description: "IRS Form SS-4 online. Instant issuance. Required for bank accounts and all tax filings.", deadline: "Day 4", category: "Corporate", priority: "critical", forms: ["IRS Form SS-4"], resources: ["https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online"] },
  { id: "ein_llc", label: "Obtain EIN — LLC (ATE)", description: "IRS Form SS-4 online. Separate EIN from trust. Required for OCC application.", deadline: "Day 4", category: "Corporate", priority: "critical", forms: ["IRS Form SS-4"] },
  { id: "oa_llc", label: "Draft Operating Agreement (ATE)", description: "Define member structure, management authority, profit distribution, IP licensing terms. Must reference trust as sole member.", deadline: "Day 5", category: "Corporate", priority: "critical" },
  { id: "loi_ip", label: "Draft LOI — IP Lease (Trust → LLC)", description: "Intellectual property licensing agreement. Trust licenses all IP to LLC. Include royalty terms, exclusivity, term, termination rights.", deadline: "Day 7", category: "Corporate", priority: "critical" },
  { id: "reg_agent", label: "Registered Agent in All Filing States", description: "Required for WY trust and NJ LLC. Consider nationwide registered agent service for 50-state expansion.", deadline: "Day 3", category: "Corporate", cost: "$99-199/state/year" },
  { id: "bank_acct", label: "Open Business Bank Account (ATE)", description: "With EIN + LLC formation docs. Recommend Mercury, Relay, or traditional bank with wire capability. Need for reserve deposits.", deadline: "Day 10", category: "Corporate", priority: "high" },
  { id: "bank_acct_trust", label: "Open Business Bank Account (TAH)", description: "Separate trust account. Required for IP royalty payments and trust asset management.", deadline: "Day 10", category: "Corporate", priority: "high" },
  { id: "duns", label: "Obtain D-U-N-S Number", description: "Dun & Bradstreet. Free. Required for business credit applications. Takes 1-2 weeks.", deadline: "Day 7", category: "Corporate", forms: ["D&B Registration"], resources: ["https://www.dnb.com/duns-number/get-a-duns.html"] },
  { id: "credit_app", label: "Apply for Business Credit Line", description: "Initial credit with EIN + D-U-N-S. Start with secured card → graduate to line. Target: $250K per state LLC.", deadline: "Day 14", category: "Corporate", priority: "high" },
  { id: "corp_bylaws", label: "Draft Corporate Governance Bylaws", description: "Board structure, meeting requirements, officer duties, conflict of interest policy. Required for OCC application.", deadline: "Day 10", category: "Corporate", priority: "high" },

  // PHASE 2: OCC Application Prep (Days 14-45)
  { id: "occ_prefiling", label: "OCC Pre-Filing Meeting Request", description: "Contact OCC Licensing Division to request pre-filing consultation. Discuss application scope, business model, and expected conditions.", deadline: "Day 14", category: "OCC Application", priority: "critical", resources: ["https://www.occ.gov/topics/charters-and-licensing/index-charters-licensing.html"] },
  { id: "occ_form", label: "Prepare OCC Application Package", description: "Federal Qualified Payment Stablecoin Issuer application. 376-page proposed rule framework. OMB No. 1557-0014 Interagency Charter Application form.", deadline: "Day 14-30", category: "OCC Application", priority: "critical", forms: ["Interagency Charter Application (OMB 1557-0014)", "OCC Supplemental Information Form", "Biographical & Financial Report"] },
  { id: "biz_plan", label: "Business Plan (3-Year Projections)", description: "Comprehensive plan: (1) Market analysis & competitive landscape, (2) Revenue model & fee structure, (3) 3-year financial projections with quarterly granularity, (4) Capital adequacy analysis, (5) Technology architecture overview, (6) Staffing plan, (7) Marketing strategy", deadline: "Day 20", category: "OCC Application", priority: "critical" },
  { id: "mgmt_bio", label: "Management Bios & Background Checks", description: "Interagency Biographical & Financial Report for each proposed director, officer, and principal shareholder (10%+). FBI background check consent. No relevant felony convictions per §15.30.", deadline: "Day 20", category: "OCC Application", priority: "critical", forms: ["Interagency Biographical & Financial Report", "FBI Background Check Consent", "Personal Financial Statement"] },
  { id: "board_composition", label: "Establish Board of Directors", description: "Minimum 5 directors recommended. Independent directors required. Audit committee, risk committee, compliance committee. Document expertise in finance, technology, compliance, legal.", deadline: "Day 25", category: "OCC Application", priority: "critical" },
  { id: "redemption_policy", label: "Draft Redemption Policy (§15.12)", description: "Par redemption within 2 business days. Non-discretionary extension to 7 calendar days ONLY if >10% of outstanding value redeemed in 24h. Must notify OCC within 24h of extension trigger. Policy must be publicly disclosed.", deadline: "Day 25", category: "OCC Application", priority: "critical" },
  { id: "reserve_plan", label: "Reserve Asset Framework (§15.11)", description: "1:1 backing at ALL times. Eligible assets: US Currency/Fed deposits, demand deposits at FDIC-insured banks, US Treasuries ≤93 days, overnight repos, gov money market funds, tokenized qualifying assets. NO crypto assets as reserves.", deadline: "Day 25", category: "OCC Application", priority: "critical" },
  { id: "reserve_diversification", label: "Reserve Diversification Plan", description: "Per OCC Option A safe harbor: ≥10% as demand deposits/Fed Bank, ≥30% immediately available, ≤40% at any one institution, weighted avg maturity ≤20 days. For >$25B issuance: min 0.5% insured deposits (max $500M).", deadline: "Day 28", category: "OCC Application", priority: "critical" },
  { id: "capital_plan", label: "Capital Plan (§15.41)", description: "Min $5M at inception (OCC notes $6.05M-$25M typical). 12-month operating expense backstop in highly liquid assets, separate from reserves. Include AOCI in CET1 capital. Ongoing capital adequacy assessment process.", deadline: "Day 30", category: "OCC Application", priority: "critical", cost: "Min $5,000,000" },
  { id: "custody_framework", label: "Custody Framework (§15.22)", description: "Segregation of customer assets from issuer assets. Non-commingling requirements. Omnibus arrangement controls if used. Written policies, procedures, internal controls. Private key management protocols.", deadline: "Day 30", category: "OCC Application", priority: "critical" },
  { id: "risk_mgmt", label: "Enterprise Risk Management Framework", description: "Credit risk, liquidity risk, interest rate risk, operational risk, concentration risk, technology risk, compliance risk. Board risk appetite statement. Risk limits and escalation procedures.", deadline: "Day 30", category: "OCC Application", priority: "high" },
  { id: "tech_plan", label: "Technology & Cybersecurity Plan", description: "IT infrastructure architecture, cybersecurity controls (NIST CSF framework), business continuity/disaster recovery, third-party risk management, penetration testing schedule, incident response plan.", deadline: "Day 35", category: "OCC Application", priority: "high" },
  { id: "vendor_mgmt", label: "Third-Party Risk Management Program", description: "Due diligence framework for all critical vendors. OCC Bulletin 2013-29 / 2023-17 compliance. Ongoing monitoring, performance standards, contingency plans for vendor failure.", deadline: "Day 35", category: "OCC Application", priority: "high" },

  // PHASE 3: Compliance Infrastructure (Days 30-55)
  { id: "bsa_officer", label: "Designate BSA/AML Compliance Officer", description: "Qualified individual with authority and resources. Reports directly to board. Must be named in application.", deadline: "Day 30", category: "Compliance", priority: "critical" },
  { id: "aml_program", label: "BSA/AML Program (5 Pillars)", description: "(1) Internal policies/procedures/controls, (2) Designated BSA Officer, (3) Ongoing employee training, (4) Independent testing/audit, (5) Risk-based CDD procedures. Per Bank Secrecy Act & FinCEN requirements.", deadline: "Day 35", category: "Compliance", priority: "critical" },
  { id: "kyc_cip", label: "CIP/CDD/EDD Program", description: "Customer Identification Program: verify identity at account opening. Customer Due Diligence: ongoing monitoring, beneficial ownership (>25%). Enhanced Due Diligence: PEPs, high-risk jurisdictions, large transactions.", deadline: "Day 35", category: "Compliance", priority: "critical" },
  { id: "ofac_screening", label: "OFAC/SDN Screening Integration", description: "Real-time screening against OFAC SDN list, Consolidated Sanctions List, EU sanctions, UN sanctions. Integrate with wallet creation, every transaction, ongoing periodic rescreening.", deadline: "Day 35", category: "Compliance", priority: "critical", resources: ["https://sanctionssearch.ofac.treas.gov/"] },
  { id: "sar_system", label: "SAR Filing System", description: "Suspicious Activity Report filing via FinCEN BSA E-Filing. Must file within 30 days of detection. $5K threshold for known suspects, $25K for unknown. Document investigation and decision rationale.", deadline: "Day 40", category: "Compliance", priority: "critical", forms: ["FinCEN SAR Form", "BSA E-Filing Registration"], resources: ["https://bsaefiling.fincen.treas.gov/"] },
  { id: "ctr_system", label: "CTR Filing System (>$10K)", description: "Currency Transaction Reports for transactions >$10,000. Filed within 15 days. Anti-structuring detection. FinCEN Form 104 / BSA E-Filing.", deadline: "Day 40", category: "Compliance", priority: "critical", forms: ["FinCEN CTR Form 104"] },
  { id: "tx_monitoring", label: "Transaction Monitoring System", description: "Blockchain analytics integration (Chainalysis/Elliptic/TRM Labs). Mixing/tumbler detection, darknet marketplace flagging, ransomware address screening, high-risk jurisdiction flagging. Alert management and investigation workflow.", deadline: "Day 45", category: "Compliance", priority: "critical" },
  { id: "freeze_capability", label: "Token Freeze/Block Capability", description: "Smart contract capability to freeze individual addresses, block specific transactions, burn tokens per lawful court orders. Required for OFAC compliance and law enforcement cooperation.", deadline: "Day 45", category: "Compliance", priority: "critical" },
  { id: "travel_rule", label: "Travel Rule Compliance", description: "FATF Travel Rule: transmit originator/beneficiary info for transfers >$3,000. Integrate with TRISA or similar network. FinCEN 31 CFR 1010.410.", deadline: "Day 45", category: "Compliance", priority: "high" },
  { id: "sanctions_cert", label: "AML/Sanctions Annual Board Certification", description: "Board certification within 180 days of approval per §15.14(k). Document board review process, certification template, annual renewal schedule.", deadline: "Day 50", category: "Compliance", priority: "high" },
  { id: "complaint_mgmt", label: "Consumer Complaint Management System", description: "Written complaint procedures, tracking system, escalation matrix, regulatory reporting of complaint trends. OCC consumer compliance expectations.", deadline: "Day 50", category: "Compliance", priority: "high" },
  { id: "insider_trading", label: "Insider Trading & Code of Ethics Policy", description: "Trading restrictions for officers/directors/employees. Material non-public information handling. Gift and entertainment policy. Annual attestation.", deadline: "Day 45", category: "Compliance", priority: "high" },
  { id: "records_retention", label: "Records Retention Policy", description: "BSA records: 5 years minimum. SAR records: 5 years. CTR records: 5 years. Customer identification records: 5 years after account closure. All transaction records per 31 CFR 1010.430.", deadline: "Day 50", category: "Compliance", priority: "high" },

  // PHASE 4: Documentation & Public Disclosures (Days 45-65)
  { id: "whitepaper", label: "Publish Platform Whitepaper", description: "Comprehensive document: token economics, blockchain architecture, consensus mechanism, governance model, reserve backing methodology, redemption mechanics, security architecture, post-quantum cryptography integration.", deadline: "Day 50", category: "Documentation", priority: "critical" },
  { id: "compliance_page", label: "Public Compliance Page (aiqtp.com)", description: "Publicly accessible page with: reserve transparency, redemption policy, KYC/AML disclosures, regulatory status, applicable licenses, complaint procedures, privacy policy.", deadline: "Day 50", category: "Documentation", priority: "critical" },
  { id: "reserve_report_template", label: "Monthly Reserve Report Template", description: "Posted by noon last day of month per §15.11(e). Must include: total outstanding issuance value, total reserve assets, breakdown by eligible category (8 categories), custodian identification, CPA examination attestation.", deadline: "Day 55", category: "Documentation", priority: "critical" },
  { id: "ceo_cfo_cert", label: "CEO/CFO Certification Template", description: "Monthly accuracy certification to OCC per §15.11(f). Personal liability for false certifications: $5M fine + 20 years. Template with attestation language.", deadline: "Day 55", category: "Documentation", priority: "critical" },
  { id: "audit_engage", label: "Engage Registered Public Accounting Firm", description: "PCAOB-registered CPA firm for: monthly reserve examination, quarterly financial statements, annual audit. Required for >$50B: GAAP audited financials within 120 days of FY-end per §15.14(l).", deadline: "Day 55", category: "Documentation", priority: "critical", cost: "$50K-200K/year" },
  { id: "weekly_report", label: "Weekly Confidential Report Template", description: "Submitted to OCC in prescribed format per §15.14(h). Contents: issuance/redemption volumes, trading volume, reserve asset positions, any material events.", deadline: "Day 55", category: "Documentation", priority: "high" },
  { id: "quarterly_report", label: "Quarterly Financial Condition Report", description: "Call Report-style filing within 30 days of quarter-end per §15.14(h). Financial condition, capital adequacy, reserve composition, risk metrics.", deadline: "Day 60", category: "Documentation", priority: "high" },
  { id: "privacy_policy", label: "Privacy Policy & Data Governance", description: "GLBA compliance, privacy notices, opt-out procedures, data sharing limitations. Per Gramm-Leach-Bliley Act for financial institutions.", deadline: "Day 55", category: "Documentation", priority: "high" },
  { id: "incident_response", label: "Cybersecurity Incident Response Plan", description: "Detection, containment, eradication, recovery procedures. OCC notification requirements for material incidents. Customer notification procedures. Post-incident review.", deadline: "Day 55", category: "Documentation", priority: "high" },
  { id: "bcp_dr", label: "Business Continuity & Disaster Recovery Plan", description: "Tested BCP/DR plan. Maximum tolerable downtime, recovery point objectives, alternate processing sites, communication plans, annual testing schedule.", deadline: "Day 60", category: "Documentation", priority: "high" },
  { id: "conflict_interest", label: "Conflict of Interest Policy", description: "Board-level conflict management. Related party transaction review. Affiliate transaction documentation per §15.xx — must be on market terms, not excessive, reviewed by board.", deadline: "Day 55", category: "Documentation", priority: "high" },

  // PHASE 5: Submission & Scale (Days 60-83)
  { id: "legal_counsel", label: "Engage Regulatory Counsel", description: "Specialized financial regulatory attorney. Essential for OCC application preparation, pre-filing meetings, conditional approval negotiations. Firms: Gibson Dunn, Sullivan & Cromwell, Davis Polk, Arnold & Porter.", deadline: "Day 15", category: "Submission", priority: "critical", cost: "$500-1,500/hour" },
  { id: "occ_submit", label: "Submit OCC Application Package", description: "Complete application with all supporting documents. OCC has 30 days to confirm 'substantially complete'. Include: charter application, business plan, financial projections, management bios, compliance programs, technology plans.", deadline: "Day 65", category: "Submission", priority: "critical" },
  { id: "public_comment", label: "Prepare for Public Comment Period", description: "OCC may publish notice of application. Prepare responses to potential public comments and objections. Community Reinvestment Act considerations.", deadline: "Day 70", category: "Submission", priority: "high" },
  { id: "conditional_approval", label: "Prepare for Conditional Approval", description: "OCC typically imposes conditions: enhanced reporting, activity restrictions, capital maintenance, board composition. Draft compliance plans for anticipated conditions.", deadline: "Day 75", category: "Submission", priority: "high" },
  { id: "llc_de", label: "File Delaware LLC", description: "Priority state #1 for 50-state expansion. $90 filing fee. Business-friendly laws.", deadline: "Day 60", category: "Submission", cost: "$90", forms: ["DE Certificate of Formation"] },
  { id: "llc_tx", label: "File Texas LLC", description: "Priority state #2. $300 filing fee. Large market.", deadline: "Day 62", category: "Submission", cost: "$300", forms: ["TX Certificate of Formation"] },
  { id: "llc_fl", label: "File Florida LLC", description: "Priority state #3. $125 filing fee. Crypto-friendly.", deadline: "Day 64", category: "Submission", cost: "$125", forms: ["FL Articles of Organization"] },
  { id: "llc_nv", label: "File Nevada LLC", description: "Priority state #4. $425 filing fee. No state income tax.", deadline: "Day 66", category: "Submission", cost: "$425" },
  { id: "llc_ca", label: "File California LLC", description: "Priority state #5. $70 filing fee. Largest market.", deadline: "Day 68", category: "Submission", cost: "$70" },
  { id: "llc_batch", label: "File Remaining 44 State LLCs", description: "Batch filing through registered agent service. Estimated $5K-15K total for all remaining states. Use formation service like Northwest, Incfile, or ZenBusiness.", deadline: "Day 70-83", category: "Submission", cost: "$5K-15K total" },
  { id: "credit_scale", label: "Scale Business Credit ($12.5M Target)", description: "$250K per state LLC credit allocation. Business credit cards → lines of credit → SBA loans. D&B credit building, Experian business, Equifax business.", deadline: "Day 70-83", category: "Submission", priority: "high" },
  { id: "charter_track", label: "Track Application Status", description: "Monitor OCC processing. Day 30: substantially complete notification. Day 120: deemed APPROVED if no denial per §15.30(b)(5). Prepare for potential information requests.", deadline: "Day 65-120+", category: "Submission", priority: "critical" },
];

interface CharterChecklistProps {
  checkedItems: Record<string, boolean>;
  toggle: (id: string) => void;
}

const CharterChecklist = ({ checkedItems, toggle }: CharterChecklistProps) => {
  const categories = ["Corporate", "OCC Application", "Compliance", "Documentation", "Submission"];

  const getCatProgress = (cat: string) => {
    const items = milestones.filter(m => m.category === cat);
    const done = items.filter(m => checkedItems[m.id]).length;
    return { done, total: items.length, pct: items.length ? Math.round((done / items.length) * 100) : 0 };
  };

  const getPriorityColor = (p?: string) => {
    if (p === "critical") return "text-destructive border-destructive/30";
    if (p === "high") return "text-yellow-500 border-yellow-500/30";
    return "text-muted-foreground border-border";
  };

  return (
    <div className="space-y-4">
      {categories.map(cat => (
        <Card key={cat} className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Phase: {cat}
              </span>
              <div className="flex items-center gap-2">
                <Progress value={getCatProgress(cat).pct} className="w-24 h-2" />
                <Badge variant="outline">{getCatProgress(cat).done}/{getCatProgress(cat).total}</Badge>
              </div>
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
                      {item.priority && <Badge variant="outline" className={`text-[10px] ${getPriorityColor(item.priority)}`}>{item.priority.toUpperCase()}</Badge>}
                      {item.cost && <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/30">{item.cost}</Badge>}
                      {checked && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    {item.forms && item.forms.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.forms.map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">📋 {f}</Badge>
                        ))}
                      </div>
                    )}
                    {item.resources && item.resources.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {item.resources.map((r, i) => (
                          <a key={i} href={r} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline">🔗 {new URL(r).hostname}</a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CharterChecklist;
