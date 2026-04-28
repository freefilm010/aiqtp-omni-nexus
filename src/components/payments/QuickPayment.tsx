import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, CreditCard, Wallet } from "lucide-react";

const QUICK_DEPOSITS = [20, 50, 100, 500];

const FREE_ACCESS = [
  "Platform access: $0",
  "AI agents: $0",
  "Strategy bot rental start: $0",
  "Fees only after realized profit",
];

export const QuickPayment = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="border-primary/40">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <Wallet className="h-6 w-6 text-primary" />
            <Badge variant="secondary">Free Access</Badge>
          </div>
          <CardTitle>Access Model</CardTitle>
          <CardDescription>No subscription plan is required to use AIQTP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {FREE_ACCESS.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <Button onClick={() => navigate("/billing")} className="w-full">
            Fund trading balance
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CreditCard className="h-6 w-6 text-primary" />
          <CardTitle>Quick Deposits</CardTitle>
          <CardDescription>Add USD funds for bot deployment and trading.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {QUICK_DEPOSITS.map((amount) => (
              <Button key={amount} variant="outline" onClick={() => navigate("/billing")}>
                ${amount}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum deposit is $20. Profit fees are handled in-platform after realized gains.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};