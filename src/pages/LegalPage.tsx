import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FullLegalDisclaimers } from "@/components/legal/LegalDisclaimers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { REQUIRED_ACKNOWLEDGMENTS, FEE_SUMMARY } from "@/lib/fees/platformFees";
import { Shield, AlertTriangle, FileText, Scale } from "lucide-react";

const LegalPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-4">
            <Scale className="h-4 w-4" />
            Legal & Compliance
          </div>
          <h1 className="text-4xl font-bold mb-4">Risk Disclosures & Legal Terms</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Please read these important disclosures carefully before using our platform. 
            Your use of AIQTP constitutes acceptance of these terms.
          </p>
        </div>

        {/* Critical Warning */}
        <Card className="mb-8 border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Critical Risk Warning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              <strong>Trading and investing in cryptocurrencies, digital assets, NFTs, real estate, 
              collectibles, and other financial instruments involves substantial risk of loss.</strong>
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You could lose some or all of your invested capital</li>
              <li>Past performance is not indicative of future results</li>
              <li>AI predictions and automated strategies are experimental and may fail</li>
              <li>Market conditions can change rapidly and unpredictably</li>
              <li>Technical failures, hacks, and smart contract vulnerabilities can occur</li>
              <li>Regulatory changes may impact the availability of services</li>
            </ul>
            <p className="font-semibold text-destructive">
              Never invest more than you can afford to lose.
            </p>
          </CardContent>
        </Card>

        {/* Fee Structure Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Fee Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{FEE_SUMMARY.subheadline}</p>
            
            <div className="grid gap-2">
              {FEE_SUMMARY.tiers.map((tier, i) => (
                <div key={i} className="flex justify-between text-sm py-2 border-b border-border/50 last:border-0">
                  <span>{tier.range}</span>
                  <span className="font-medium text-primary">{tier.rate}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="font-medium mb-2">Additional Costs (at actual cost)</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {FEE_SUMMARY.additionalCosts.map((cost, i) => (
                  <li key={i}>• {cost}</li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-muted-foreground/70 mt-4">
              * All fees are subject to change without notice based on market conditions and regulatory requirements.
            </p>
          </CardContent>
        </Card>

        {/* Required Acknowledgments */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              User Acknowledgments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              By using AIQTP, you acknowledge and agree to the following:
            </p>
            <ul className="space-y-3">
              {REQUIRED_ACKNOWLEDGMENTS.map((ack, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0">
                    {i + 1}
                  </span>
                  {ack}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Full Disclaimers */}
        <Card>
          <CardContent className="pt-6">
            <FullLegalDisclaimers />
          </CardContent>
        </Card>

        {/* Contact for Legal */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>For legal inquiries, please contact:</p>
          <p className="font-medium">legal@aiqtp.com</p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LegalPage;
