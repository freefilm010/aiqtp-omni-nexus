import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap, ArrowRight, Shield, TrendingUp, Bot,
  Rocket, CreditCard, Wallet, CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const QUICK_DEPOSITS = [20, 50, 100, 500];

const RevenueActivation = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");

  const startDeposit = async () => {
    if (!user) {
      toast.error("Sign in to add funds");
      return;
    }
    setLoading("deposit");
    window.location.href = "/billing";
    setLoading(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Free Access Revenue Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
            {["Platform $0", "Agents $0", "Bots $0 to start"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded bg-muted/50 p-2">
                <CheckCircle className="h-4 w-4 text-success shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Revenue comes from realized-profit bot fees: 9% / 6% / 3% / 1%. No profit means no charge.
          </p>
        </CardContent>
      </Card>

      {/* Quick Deposit */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            Quick Deposit — Add Funds Instantly
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {QUICK_DEPOSITS.map((amt) => (
              <Button
                key={amt}
                variant="outline"
                size="sm"
                onClick={startDeposit}
                disabled={loading === "deposit"}
              >
                ${amt}
              </Button>
            ))}
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Custom"
                className="w-20 h-8 text-xs"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                min={20}
                max={10000}
              />
              <Button
                size="sm"
                disabled={!customAmount || Number(customAmount) < 20}
                onClick={startDeposit}
              >
                Deposit
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Powered by Stripe • Funds available after payment confirmation • Min $20, Max $10,000
          </p>
        </CardContent>
      </Card>

      {/* Revenue Stats for Platform */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Revenue Channels Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <RevenueChannel icon={Shield} name="Free Access" status="live" />
            <RevenueChannel icon={Bot} name="Bot Rentals" status="live" />
            <RevenueChannel icon={Zap} name="Deposits" status="live" />
            <RevenueChannel icon={Rocket} name="NFT/Token" status="live" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const RevenueChannel = ({ icon: Icon, name, status }: { icon: any; name: string; status: string }) => (
  <div className="p-2 rounded bg-muted/50">
    <Icon className="h-4 w-4 mx-auto mb-1 text-primary" />
    <p className="text-[10px] font-medium text-foreground">{name}</p>
    <Badge variant="outline" className="text-[8px] border-green-500 text-green-500">{status}</Badge>
  </div>
);

export default RevenueActivation;
