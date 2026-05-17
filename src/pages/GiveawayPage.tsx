import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Construction, ShieldAlert, ArrowLeft, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * "$2M Dream Giveaway" page — DISABLED pending sweepstakes compliance.
 *
 * Promotional sweepstakes that offer prizes of significant value to US
 * residents require state-by-state compliance, including:
 *   - Official Rules posted with disclosures (no-purchase-necessary, odds,
 *     ARV, restrictions, sponsor identity)
 *   - Registration + bond posting in FL, NY, RI (and others depending on ARV)
 *   - Tax reporting (1099-MISC for prizes ≥ $600)
 *   - State lottery-law analysis (the "consideration / chance / prize" test)
 *
 * The previous version of this page advertised a "$2M Dream Giveaway" with
 * a $1.5M home and $150K vehicle. Without the above compliance work, that
 * page exposes the operator to state AG enforcement, FTC Section 5 actions,
 * and lottery-law violations (felony in some states).
 *
 * Re-enable only after a sweepstakes attorney has signed off on rules,
 * disclosures, registration, and bonding.
 */

const GiveawayPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center">
          <Gift className="h-12 w-12 mx-auto mb-4 text-primary" />

          <div className="flex justify-center gap-2 mb-4">
            <Badge variant="outline" className="border-yellow-500/40 text-yellow-400">
              <Construction className="h-3 w-3 mr-1" /> Under Review
            </Badge>
            <Badge variant="outline" className="border-red-500/40 text-red-400">
              <ShieldAlert className="h-3 w-3 mr-1" /> Sweepstakes Compliance
            </Badge>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            Giveaway program — paused for compliance review
          </h1>

          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Promotional giveaways with prizes of meaningful value require
            state-by-state sweepstakes registration, bond posting in some states,
            published Official Rules with required disclosures, and tax reporting
            infrastructure. We are completing that work before re-launching any
            giveaway program.
          </p>

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

export default GiveawayPage;
