import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Construction, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Token launch / presale route — DISABLED pending securities review.
 *
 * The previous version of this page advertised a live $AIQTP presale, token
 * price, market cap, and federal-charter-pending language. That is
 * not publishable until counsel has reviewed token classification, offering
 * exemption/registration path, disclosures, geofencing, and investor
 * suitability rules.
 */
export default function MemeCoinLaunch() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4 py-16">
        <Card className="border-primary/30">
          <CardHeader className="text-center">
            <Badge className="mx-auto mb-3 border-amber-500/30 bg-amber-500/10 text-amber-500">
              <Construction className="mr-1 h-3.5 w-3.5" />
              Compliance review
            </Badge>
            <CardTitle className="text-3xl">Token Launch Under Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-center">
            <ShieldAlert className="mx-auto h-12 w-12 text-primary" />
            <p className="text-muted-foreground">
              AIQTP token, QTC, and related protocol-token concepts are being separated into proper product and legal tracks
              before any launch, sale, or distribution is offered to the public.
            </p>
            <div className="rounded-lg border bg-muted/40 p-4 text-left text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Required before this page can be re-enabled:</p>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>securities-law analysis and offering-path decision</li>
                <li>token/product split: stablecoin, protocol token, QWallet, migration wrapper</li>
                <li>risk disclosures and jurisdiction controls</li>
                <li>verified contract address and production launch plan</li>
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              No token sale is live. No federal banking or stablecoin charter application is currently represented as pending
              from this page.
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to AIQTP
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
