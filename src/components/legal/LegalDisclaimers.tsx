import { AlertTriangle, Info, Shield, FileText } from "lucide-react";
import { LEGAL_DISCLAIMERS, COMPACT_DISCLAIMERS } from "@/lib/fees/platformFees";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Compact risk banner for use across the platform
export function RiskBanner({ className = "" }: { className?: string }) {
  return (
    <Alert className={`border-yellow-500/50 bg-yellow-500/10 ${className}`}>
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertDescription className="text-xs text-yellow-200">
        {COMPACT_DISCLAIMERS.risk} • {COMPACT_DISCLAIMERS.notAdvice} • {COMPACT_DISCLAIMERS.noGuarantee}
      </AlertDescription>
    </Alert>
  );
}

// Inline disclaimer badge
export function DisclaimerBadge({ 
  type 
}: { 
  type: keyof typeof COMPACT_DISCLAIMERS 
}) {
  return (
    <span className="inline-flex items-center text-xs text-muted-foreground/80 bg-muted/30 px-2 py-0.5 rounded">
      {COMPACT_DISCLAIMERS[type]}
    </span>
  );
}

// Full legal disclaimers accordion
export function FullLegalDisclaimers() {
  const disclaimerSections = [
    { key: "riskWarning", title: "Risk Warning", icon: AlertTriangle },
    { key: "notFinancialAdvice", title: "Not Financial Advice", icon: Info },
    { key: "notBrokerAdviser", title: "Not a Broker or Adviser", icon: Shield },
    { key: "noGuarantees", title: "No Guarantees", icon: FileText },
    { key: "forceMajeure", title: "Force Majeure & Acts of God", icon: AlertTriangle },
    { key: "limitationOfLiability", title: "Limitation of Liability", icon: Shield },
    { key: "assumptionOfRisk", title: "Assumption of Risk & Waiver", icon: AlertTriangle },
    { key: "insuranceNotice", title: "Insurance & Asset Protection", icon: Shield },
    { key: "systemAvailability", title: "System Availability", icon: Info },
    { key: "dataBreachNotice", title: "Data Breach Protocol", icon: Shield },
    { key: "visualPurposes", title: "Visual Purposes Disclaimer", icon: Info },
    { key: "feeDisclaimer", title: "Fee Notice", icon: FileText },
    { key: "aiDisclaimer", title: "AI & Algorithm Disclaimer", icon: Info },
    { key: "affiliateDisclaimer", title: "Affiliate Program Terms", icon: FileText },
    { key: "lossOfFunds", title: "Potential Loss of Funds", icon: AlertTriangle },
    { key: "thirdPartyDisclaimer", title: "Third-Party Services", icon: Shield },
    { key: "regulatoryCompliance", title: "Regulatory Notice", icon: Shield },
    { key: "dataAccuracy", title: "Data Accuracy", icon: Info },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Shield className="h-5 w-5 text-primary" />
        Legal Disclaimers & Risk Warnings
      </div>
      
      <Accordion type="multiple" className="space-y-2">
        {disclaimerSections.map(({ key, title, icon: Icon }) => (
          <AccordionItem 
            key={key} 
            value={key}
            className="border border-border/50 rounded-lg px-4"
          >
            <AccordionTrigger className="text-sm hover:no-underline">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {title}
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
              {LEGAL_DISCLAIMERS[key as keyof typeof LEGAL_DISCLAIMERS]}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

// Footer legal text
export function FooterLegalText() {
  return (
    <div className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-4xl">
      <p className="mb-2">
        <strong>⚠️ RISK DISCLOSURE:</strong> {LEGAL_DISCLAIMERS.riskWarning.slice(0, 300)}...
      </p>
      <p className="mb-2">
        <strong>📋 DISCLAIMER:</strong> {LEGAL_DISCLAIMERS.notFinancialAdvice.slice(0, 250)}...
      </p>
      <p>
        {LEGAL_DISCLAIMERS.fullDisclaimer}
      </p>
    </div>
  );
}

// Trading page disclaimer
export function TradingDisclaimer() {
  return (
    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-1 text-muted-foreground">
          <p><strong className="text-destructive">Risk Warning:</strong> Trading involves substantial risk of loss.</p>
          <p>• Not financial advice • Past performance ≠ future results • Never invest more than you can afford to lose</p>
          <p>• All fees subject to actual network costs • AI predictions are experimental</p>
        </div>
      </div>
    </div>
  );
}

// AI prediction disclaimer
export function AIPredictionDisclaimer() {
  return (
    <Alert className="border-blue-500/30 bg-blue-500/5">
      <Info className="h-4 w-4 text-blue-400" />
      <AlertDescription className="text-xs text-blue-200/80">
        AI predictions are experimental and for informational purposes only. 
        They do not constitute financial advice and should not be the sole basis for trading decisions.
      </AlertDescription>
    </Alert>
  );
}

// NFT/Marketplace disclaimer
export function MarketplaceDisclaimer() {
  return (
    <div className="text-[10px] text-muted-foreground/70 border-t border-border/30 pt-2 mt-4">
      <p>
        💡 All images and listings are for illustrative purposes only. Prices and availability subject to change. 
        NFT and digital asset trading involves risk. Platform fees apply to completed sales. 
        Not responsible for third-party content or external links.
      </p>
    </div>
  );
}
