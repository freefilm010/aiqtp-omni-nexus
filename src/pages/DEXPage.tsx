import { useState, useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTradingStats } from "@/hooks/useTradingStats";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowDownUp, Plus, TrendingUp } from "lucide-react";

const YOUR_TOKENS = [
  { symbol: "DCENT",  name: "Decentralized Cent",   balance: "1000", price: 0.000005 },
  { symbol: "BOLT",   name: "Bolt Token",            balance: "500",  price: 0.000005 },
  { symbol: "MANTRA", name: "Mantra Token",           balance: "750",  price: 0.0000498 },
  { symbol: "QTC",    name: "Quantum Time Crystal",  balance: "2000", price: 0.01 },
];

const COMMON_TOKENS = [
  { symbol: "ETH",  name: "Ethereum", balance: "0", price: 3120 },
  { symbol: "USDC", name: "USD Coin", balance: "0", price: 1 },
  { symbol: "USDT", name: "Tether",   balance: "0", price: 1 },
];

const ALL_TOKENS = [...YOUR_TOKENS, ...COMMON_TOKENS];

export default function DEXPage() {
  const { user } = useAuth();
  const { data: stats } = useTradingStats(10000);

  const [fromToken, setFromToken] = useState("DCENT");
  const [toToken, setToToken]     = useState("ETH");
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount]     = useState("");

  const pools = useMemo(() => {
    const base  = stats?.allTimeProfit ?? 1000;
    const today = stats?.todayProfit   ?? 100;
    return [
      { pair: "DCENT/ETH",   tvl: base * 0.15, apr: "45.2%", vol: today * 0.25 },
      { pair: "BOLT/USDC",   tvl: base * 0.12, apr: "38.7%", vol: today * 0.18 },
      { pair: "MANTRA/ETH",  tvl: base * 0.18, apr: "52.1%", vol: today * 0.32 },
      { pair: "QTC/USDT",    tvl: base * 0.55, apr: "67.8%", vol: today * 0.45 },
    ];
  }, [stats]);

  const fmt = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const calculateSwap = (amount: string): string => {
    if (!amount) return "";
    const from = ALL_TOKENS.find(t => t.symbol === fromToken);
    const to   = ALL_TOKENS.find(t => t.symbol === toToken);
    if (!from || !to || !to.price) return "";
    return ((parseFloat(amount) * from.price) / to.price).toFixed(6);
  };

  const handleFromChange = (val: string) => {
    setFromAmount(val);
    setToAmount(calculateSwap(val));
  };

  const flipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(""); setToAmount("");
  };

  const handleSwap = () => {
    if (!user) { toast.error("Sign in to swap"); return; }
    if (!fromAmount || !toAmount) { toast.error("Enter an amount"); return; }
    toast.success(`Swap queued: ${fromAmount} ${fromToken} → ${toAmount} ${toToken}`);
    setFromAmount(""); setToAmount("");
  };

  const TokenSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select value={value} onChange={e => onChange(e.target.value)} className="px-4 py-2 bg-background border rounded-md text-sm">
      {ALL_TOKENS.map(t => <option key={t.symbol} value={t.symbol}>{t.symbol}</option>)}
    </select>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">DEX — Decentralized Exchange</h1>
          <p className="text-muted-foreground mt-1">Swap tokens, add liquidity, earn fees • DCENT · BOLT · MANTRA · QTC</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Tabs defaultValue="swap">
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="swap">Swap</TabsTrigger><TabsTrigger value="liquidity">Liquidity</TabsTrigger></TabsList>

              <TabsContent value="swap">
                <Card>
                  <CardHeader><CardTitle>Swap Tokens</CardTitle><CardDescription>0.3% fee</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="0.0" value={fromAmount} onChange={e => handleFromChange(e.target.value)} className="flex-1" />
                        <TokenSelect value={fromToken} onChange={setFromToken} />
                      </div>
                      <p className="text-xs text-muted-foreground">Balance: {YOUR_TOKENS.find(t => t.symbol === fromToken)?.balance ?? "0"}</p>
                    </div>
                    <div className="flex justify-center">
                      <Button variant="outline" size="icon" onClick={flipTokens}><ArrowDownUp className="h-4 w-4" /></Button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">To</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="0.0" value={toAmount} readOnly className="flex-1 bg-muted" />
                        <TokenSelect value={toToken} onChange={setToToken} />
                      </div>
                    </div>
                    <Button onClick={handleSwap} className="w-full" size="lg">Swap Tokens</Button>
                    <div className="text-xs text-muted-foreground border-t pt-2 space-y-1">
                      <div className="flex justify-between"><span>Fee</span><span>0.3%</span></div>
                      <div className="flex justify-between"><span>Slippage</span><span>0.5%</span></div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="liquidity">
                <Card>
                  <CardHeader><CardTitle>Add Liquidity</CardTitle><CardDescription>Earn 0.25% of all trades</CardDescription></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token A</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="0.0" className="flex-1" />
                        <select className="px-4 py-2 bg-background border rounded-md text-sm">
                          {YOUR_TOKENS.map(t => <option key={t.symbol}>{t.symbol}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-center"><Plus className="h-6 w-6 text-muted-foreground" /></div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Token B</label>
                      <div className="flex gap-2">
                        <Input type="number" placeholder="0.0" className="flex-1" />
                        <select className="px-4 py-2 bg-background border rounded-md text-sm">
                          {COMMON_TOKENS.map(t => <option key={t.symbol}>{t.symbol}</option>)}
                        </select>
                      </div>
                    </div>
                    <Button className="w-full" size="lg" onClick={() => toast.info("Liquidity provision — mainnet integration pending")}>
                      <Plus className="mr-2 h-4 w-4" />Add Liquidity
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold">Liquidity Pools</h2>
            {pools.map(pool => (
              <Card key={pool.pair}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{pool.pair}</span>
                    <span className="text-green-500 text-lg">{pool.apr} APR</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><div className="text-muted-foreground">TVL</div><div className="font-bold">{fmt(pool.tvl)}</div></div>
                    <div><div className="text-muted-foreground">24h Volume</div><div className="font-bold">{fmt(pool.vol)}</div></div>
                    <div className="flex items-end justify-end">
                      <Button size="sm" onClick={() => toast.info(`Adding liquidity to ${pool.pair}`)}>
                        <TrendingUp className="mr-2 h-4 w-4" />Add
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Token overview */}
        <Card className="mt-6">
          <CardHeader><CardTitle>Your Tokens</CardTitle><CardDescription>DCENT · BOLT · MANTRA · QTC</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {YOUR_TOKENS.map(t => (
              <div key={t.symbol} className="flex items-center justify-between p-3 border rounded-lg">
                <div><div className="font-bold">{t.symbol}</div><div className="text-sm text-muted-foreground">{t.name}</div></div>
                <div className="text-right">
                  <div className="font-bold">{t.balance} {t.symbol}</div>
                  <div className="text-sm text-muted-foreground">${(parseFloat(t.balance) * t.price).toFixed(2)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
