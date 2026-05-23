import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (sessionId) {
      // Stripe webhook handles the credit — just show confirmation
      setTimeout(() => {
        setStatus("success");
        setMessage("Your transaction was processed. Balance will update within seconds.");
      }, 1500);
    } else {
      setStatus("error");
      setMessage("No payment reference found in the return URL.");
    }
  }, [sessionId]);

  return (
    <div className="container max-w-xl py-16">
      <Card>
        <CardHeader className="text-center">
          {status === "loading" && <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />}
          {status === "success" && <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />}
          {status === "error" && <XCircle className="h-12 w-12 mx-auto text-destructive" />}
          <CardTitle className="mt-4">
            {status === "loading" && "Confirming your payment…"}
            {status === "success" && "Payment received"}
            {status === "error" && "Payment issue"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {sessionId && (
            <p className="text-xs text-muted-foreground break-all">
              Reference: {sessionId}
            </p>
          )}
          <div className="flex gap-2 justify-center pt-4">
            <Button asChild>
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/billing">Billing</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
