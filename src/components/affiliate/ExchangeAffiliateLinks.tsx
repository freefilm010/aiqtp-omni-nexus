import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Gift, Percent, Zap } from "lucide-react";

interface AffiliateExchange {
  name: string;
  description: string;
  referralUrl: string;
  bonus: string;
  feeDiscount: string;
  logo: string;
}

const AFFILIATE_EXCHANGES: AffiliateExchange[] = [
  {
    name: "Binance",
    description: "World's largest crypto exchange",
    referralUrl: "https://accounts.binance.com/register?ref=AIQTP2025",
    bonus: "Up to $100 USDT welcome bonus",
    feeDiscount: "20% trading fee discount",
    logo: "🟡",
  },
  {
    name: "Bybit",
    description: "Top derivatives exchange",
    referralUrl: "https://www.bybit.com/register?affiliate_id=AIQTP",
    bonus: "Up to $30,000 deposit bonus",
    feeDiscount: "20% fee rebate",
    logo: "🟠",
  },
  {
    name: "OKX",
    description: "Advanced trading & Web3",
    referralUrl: "https://www.okx.com/join/AIQTP2025",
    bonus: "Up to $10,000 welcome package",
    feeDiscount: "20% fee discount",
    logo: "⚫",
  },
  {
    name: "Bitget",
    description: "Copy trading leader",
    referralUrl: "https://www.bitget.com/referral/register?clacCode=AIQTP",
    bonus: "$5,005 welcome bonus",
    feeDiscount: "20% fee discount",
    logo: "🔵",
  },
  {
    name: "KuCoin",
    description: "The people's exchange",
    referralUrl: "https://www.kucoin.com/r/AIQTP",
    bonus: "Up to $500 welcome bonus",
    feeDiscount: "20% trading fee discount",
    logo: "🟢",
  },
  {
    name: "MEXC",
    description: "MX token ecosystem",
    referralUrl: "https://www.mexc.com/register?inviteCode=AIQTP",
    bonus: "Up to $1,000 bonus",
    feeDiscount: "10% fee discount",
    logo: "🔷",
  },
];

export const ExchangeAffiliateLinks = () => {
  const handleClick = (exchange: AffiliateExchange) => {
    window.open(exchange.referralUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <div className="text-center mb-8">
        <Badge className="mb-2 bg-primary/20 text-primary border-primary/30">
          <Gift className="h-3 w-3 mr-1" />
          Exclusive Partner Bonuses
        </Badge>
        <h2 className="text-2xl font-bold">Connect Your Exchange</h2>
        <p className="text-muted-foreground mt-2">
          Sign up through our links to get exclusive bonuses and fee discounts
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {AFFILIATE_EXCHANGES.map((exchange) => (
          <Card key={exchange.name} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{exchange.logo}</span>
                <div>
                  <CardTitle className="text-lg">{exchange.name}</CardTitle>
                  <CardDescription className="text-xs">{exchange.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-green-500" />
                <span>{exchange.bonus}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Percent className="h-4 w-4 text-blue-500" />
                <span>{exchange.feeDiscount}</span>
              </div>
              <Button
                onClick={() => handleClick(exchange)}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Sign Up & Get Bonus
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center">
        <p className="text-xs text-muted-foreground">
          <Zap className="h-3 w-3 inline mr-1" />
          AIQTP earns a referral commission when you sign up through these links. 
          This helps fund platform development at no extra cost to you.
        </p>
      </div>
    </div>
  );
};
