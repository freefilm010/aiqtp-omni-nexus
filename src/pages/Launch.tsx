import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Construction, ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Token presale page — DISABLED pending legal compliance.
 *
 * The previous version of this page advertised an unregistered token presale
 * ($AIQTP on Solana) with statements like "Federal Banking Charter Pending"
 * and "PRESALE LIVE". Issuing or offering tokens to US persons without proper
 * registration (or a valid exemption such as Reg D / Reg CF / Reg S) is a
 * federal securities-law violation. The page is being held until:
 *
 *   1. Securities-law review by qualified counsel
 *   2. Token classification analysis (Howey test)
 *   3. If pursued: Reg D filing, Reg CF portal, or Reg S offshore structure
 *   4. Honest disclosures and risk factors drafted
 *
 * Do not re-enable this page or any token-sale UI without that work complete.
 */

const Launch = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="outline" className="border-yellow-500/40 text-yellow-400">
              <Construction className="h-3 w-3 mr-1" /> Under Review
            </Badge>
            <Badge variant="outline" className="border-red-500/40 text-red-400">
              <ShieldAlert className="h-3 w-3 mr-1" /> Legal Compliance
            </Badge>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            Token launch — paused for compliance review
          </h1>

          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            We pulled this page down while we complete the legal work required to
            offer a token to US persons. Any token offering must satisfy federal
            and state securities laws — typically via SEC registration, Reg D
            (accredited investors), Reg CF (regulation crowdfunding), or Reg S
            (offshore). We are not at the stage where we can responsibly accept
            funds from anyone.
          </p>

          <div className="bg-muted/30 rounded-lg p-4 mb-6 text-left text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-2">What we will NOT do:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Accept funds for an unregistered token sale</li>
              <li>Promise specific returns, APY, or "guaranteed" yields</li>
              <li>Claim a federal banking charter we do not have</li>
              <li>Use fabricated user counts, AUM figures, or fake testimonials</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to AIQTP
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Join beta waitlist instead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Launch;
