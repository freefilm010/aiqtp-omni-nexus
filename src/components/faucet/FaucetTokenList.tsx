import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Droplets, Clock, Timer, ArrowDownToLine, Sparkles
} from "lucide-react";
import type { FaucetToken } from "./faucetTypes";
import { useAssetValuation, formatUsdValue, formatQuantity } from "@/hooks/useAssetValuation";

interface FaucetTokenListProps {
  tokens: FaucetToken[];
  balances: Record<string, number>;
  claiming: string | null;
  loading: boolean;
  isOnCooldown: (token: FaucetToken) => boolean;
  getCooldownRemaining: (token: FaucetToken) => string;
  getCooldownProgress: (token: FaucetToken) => number;
  onClaim: (token: FaucetToken) => void;
}

const EARN_CATEGORIES = [
  { value: "all-earn", label: "💰 All Earn" },
  { value: "platform", label: "Platform" },
  { value: "stablecoin", label: "Stables" },
  { value: "defi", label: "DeFi" },
  { value: "lightning", label: "⚡ Lightning" },
  { value: "l2", label: "L2" },
];

const TEST_CATEGORIES = [
  { value: "all-test", label: "🧪 All Testnet" },
  { value: "testnet", label: "Testnet" },
  { value: "privacy", label: "Privacy" },
];

const isTestnetToken = (t: FaucetToken) =>
  t.category === "testnet" || t.category === "privacy" || t.symbol.startsWith("t");

const FaucetTokenList = ({
  tokens, balances, claiming, loading,
  isOnCooldown, getCooldownRemaining, getCooldownProgress, onClaim,
}: FaucetTokenListProps) => {
  const { getValuation } = useAssetValuation();
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Droplets className="h-5 w-5 text-primary" />
          Crypto Faucet
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Claim testnet, platform & DeFi tokens — only priced assets count toward value
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="mb-3 flex-wrap h-auto gap-1">
            {CATEGORIES.map(cat => (
              <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORIES.map(cat => (
            <TabsContent key={cat.value} value={cat.value}>
              <ScrollArea className="h-[420px] md:h-[520px]">
                <div className="space-y-2">
                  {tokens
                    .filter(t => cat.value === "all" || t.category === cat.value)
                    .map((token, i) => {
                      const onCd = isOnCooldown(token);
                      const balance = balances[token.symbol] || 0;
                      const progress = getCooldownProgress(token);
                      const valuation = getValuation(token.symbol, balance > 0 ? balance : 1);

                      return (
                        <motion.div
                          key={token.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className={`relative p-3 border rounded-xl transition-all group ${
                            onCd
                              ? "border-border/30 opacity-70"
                              : "border-border/50 hover:border-primary/40 hover:bg-muted/20"
                          }`}
                        >
                          {/* Cooldown progress bar */}
                          {onCd && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl overflow-hidden">
                              <Progress value={progress} className="h-full rounded-none" />
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="shrink-0 p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                                {token.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-sm">{token.symbol}</span>
                                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                    {token.name}
                                  </span>
                                  {token.bonus && (
                                    <Badge variant="secondary" className="text-[8px] px-1 py-0 gap-0.5">
                                      <Sparkles className="h-2 w-2" />
                                      {token.bonus}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                    <Timer className="h-2.5 w-2.5" />
                                    {token.claimInterval}h
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    @ {formatUsdValue(valuation.priceUsd)}
                                  </span>
                                  {balance > 0 && (
                                    <span className="text-[10px] text-primary font-medium">
                                      {formatQuantity(balance)} · {formatUsdValue(valuation.priceUsd * balance)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-sm text-green-500">+{token.claimAmount}</span>
                              <Button
                                size="sm"
                                onClick={() => onClaim(token)}
                                disabled={!token.available || claiming === token.id || onCd || loading}
                                className="min-w-[80px] md:min-w-[100px] text-xs h-8"
                                variant={onCd ? "outline" : "default"}
                              >
                                {claiming === token.id ? (
                                  <><Clock className="h-3 w-3 mr-1 animate-spin" /> ...</>
                                ) : onCd ? (
                                  <>{getCooldownRemaining(token)}</>
                                ) : (
                                  <><ArrowDownToLine className="h-3 w-3 mr-1" /> Claim</>
                                )}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FaucetTokenList;
