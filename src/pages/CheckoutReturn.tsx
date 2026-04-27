import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutReturn() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="container max-w-xl py-16">
      <Card>
        <CardHeader className="text-center">
          {loading ? (
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          ) : (
            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
          )}
          <CardTitle className="mt-4">
            {loading ? "Confirming your payment…" : "Payment received"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {sessionId
              ? "Your transaction was processed successfully. Your account will reflect the change within a few seconds."
              : "No session information found in the return URL."}
          </p>
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
              <Link to="/">Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}