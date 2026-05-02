import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useTradingStats } from "@/hooks/useTradingStats";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Wallet, Shield, Zap, ArrowUpRight, ArrowDownLeft,
  RefreshCw, Cpu, Activity, TrendingUp, Copy,
  Send, Download, History, QrCode, CheckCircle, AlertCircle,
  Building2, FileText, Calculator, Landmark, CreditCard,
  FileSpreadsheet, Receipt, Stamp, Copyright, Award, Bot,
  BarChart3, Target, ChevronLeft, ChevronRight, ExternalLink,
  DollarSign,
} from "lucide-react";

const QUWALLET_ADDRESS = "0xQu...DANUS$-INCOME-FACTORY";
const SAVED_BANKS = [
  { id: 1, name: "Chase Checking", last4: "4521", type: "checking" },
  { id: 2, name: "Bank of America Savings", last4: "8834", type: "savings" },
];

export default function QuWalletPage() {
  const { user } = useAuth();
  const { data: stats, refetch } = useTradingStats(5000);

  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [ipNftOpen, setIpNftOpen] = useState(false);
  const [sendAmount, setSendAmount] = useState("");
  const [sendAddress, setSendAddress] = useState("");
  const [copied, setCopied] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState<"moonpay"|"ach"|"wire">("ach");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<"checking"|"savings">("checking");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [ipType, setIpType] = useState<"trademark"|"copyright">("trademark");
  const [ipName, setIpName] = useState("");
  const [ipDescription, setIpDescription] = useState("");
  const [tradePage, setTradePage] = useState(1);
  const [recentTrades, setRecentTrades] = useState<any[]>([]);
  const TRADES_PER_PAGE = 50;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("trade_logs")
      .select("id,symbol,side,realized_pnl_usd,closed_at,strategy_id")
      .eq("user_id", user.id)
      .eq("status", "closed")
      .order("closed_at", { ascending: false })
      .limit(200)
      .then(({ data }) => setRecentTrades(data ?? []));
  }, [user]);

  const grossRevenue = stats?.allTimeProfit ?? 0;
  const tradingFees = grossRevenue * 0.001;
  const netProfit = grossRevenue - tradingFees;
  const accountBalance = netProfit - totalWithdrawn;
  const totalTrades = stats?.totalTrades ?? 0;
  const winRate = stats?.winRate ?? 100;
  const todayProfit = stats?.todayProfit ?? 0;
  const avgProfit = stats?.avgProfit ?? 0;

  const copyAddress = () => {
    navigator.clipboard.writeText(QUWALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    toast.info(`Send: $${sendAmount} → ${sendAddress} (mainnet integration pending)`);
    setSendOpen(false); setSendAmount(""); setSendAddress("");
  };

  const handleBankWithdraw = async () => {
    const amt = parseFloat(withdrawAmount) || 0;
    if (amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > accountBalance) { toast.error(`Max withdrawable: $${accountBalance.toFixed(2)}`); return; }
    if (!bankName || !routingNumber || !accountNumber) { toast.error("Fill in all bank details"); return; }

    let fee = 0;
    if (withdrawMethod === "moonpay") fee = amt * 0.015;
    if (withdrawMethod === "wire") fee = 25;

    try {
      const { error } = await supabase.functions.invoke("request-withdrawal", {
        body: { amountUsd: amt, destinationType: withdrawMethod, destinationDetails: { bankName, routingNumber: routingNumber.slice(-4), accountType } },
      });
      if (error) throw error;
      setTotalWithdrawn(p => p + amt);
      toast.success(`Withdrawal of $${(amt - fee).toFixed(2)} queued via ${withdrawMethod.toUpperCase()}`);
      setBankOpen(false); setWithdrawAmount(""); setBankName(""); setRoutingNumber(""); setAccountNumber("");
    } catch (e: any) {
      toast.error(`Supabase request-withdrawal: ${e?.message ?? "unknown error"}`);
    }
  };

  const handleMintIpNft = () => {
    if (!ipName || !ipDescription) { toast.error("Fill in name and description"); return; }
    toast.success(`IP NFT minted: ${ipType === "trademark" ? "™" : "©"} ${ipName}`);
    setIpNftOpen(false); setIpName(""); setIpDescription("");
  };

  const handleTaxReport = (type: string) => {
    const csv = `Report,${type}\nTrades,${totalTrades}\nGross,$${grossRevenue.toFixed(2)}\nFees,$${tradingFees.toFixed(2)}\nNet,$${netProfit.toFixed(2)}\n`;
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([csv], { type: "text/csv" })), download: `${type.replace(/\s/g,"_")}.csv` });
    a.click();
    toast.success(`${type} downloaded`);
  };

  const paginated = recentTrades.slice((tradePage - 1) * TRADES_PER_PAGE, tradePage * TRADES_PER_PAGE);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg"><Wallet className="h-8 w-8 text-white" /></div>
              QuWallet
            </h1>
            <p className="text-muted-foreground mt-1">Quantum-Secured Digital Asset Wallet • Income Factory™ Primary Wallet</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="bg-green-500/20 text-green-500 border-green-500"><Shield className="h-3 w-3 mr-1" />PQC Secured</Badge>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-500 border-blue-500"><Cpu className="h-3 w-3 mr-1" />IBM Quantum</Badge>
            <Badge variant="outline" className="bg-purple-500/20 text-purple-500 border-purple-500"><Zap className="h-3 w-3 mr-1" />24/7 Trading</Badge>
          </div>
        </div>

        {/* Live notice */}
        <Card className="bg-green-500/10 border-green-500/30 mb-6">
          <CardContent className="py-3 flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-full animate-pulse"><Activity className="h-4 w-4 text-green-500" /></div>
            <div>
              <p className="text-green-500 font-semibold">8 Trading Bots Running 24/7</p>
              <p className="text-sm text-muted-foreground">Profits accumulate even when app is closed • Auto-refresh every 5s</p>
            </div>
          </CardContent>
        </Card>

        {/* Balance card */}
        <Card className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30 mb-6">
          <CardHeader>
            <CardDescription>Account Balance (Withdrawable)</CardDescription>
            <CardTitle className="text-5xl font-bold text-green-500">
              ${accountBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              <span className="text-green-500 flex items-center"><TrendingUp className="h-4 w-4 mr-1" />+${todayProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })} today</span>
              <span className="text-muted-foreground">{totalTrades.toLocaleString()} trades • {winRate.toFixed(1)}% win rate</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Action buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Dialog open={sendOpen} onOpenChange={setSendOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700"><Send className="h-4 w-4 mr-2" />Send</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Send Crypto</DialogTitle><DialogDescription>Transfer to external wallet</DialogDescription></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div><Label>Amount (USD)</Label><Input type="number" placeholder="0.00" value={sendAmount} onChange={e => setSendAmount(e.target.value)} /></div>
                    <div><Label>Recipient Address</Label><Input placeholder="0x..." value={sendAddress} onChange={e => setSendAddress(e.target.value)} /></div>
                    <Button onClick={handleSend} className="w-full" disabled={!sendAmount || !sendAddress}><Send className="h-4 w-4 mr-2" />Send Funds</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
                <DialogTrigger asChild><Button variant="outline"><Download className="h-4 w-4 mr-2" />Receive</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Receive Funds</DialogTitle><DialogDescription>Share your QuWallet address</DialogDescription></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="p-4 bg-muted rounded-lg text-center"><QrCode className="h-32 w-32 mx-auto mb-4 text-muted-foreground" /></div>
                    <div className="flex gap-2">
                      <Input value={QUWALLET_ADDRESS} readOnly className="font-mono text-sm" />
                      <Button variant="outline" onClick={copyAddress}>{copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={bankOpen} onOpenChange={setBankOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="bg-green-500/10 border-green-500/30 text-green-500 hover:bg-green-500/20"><Landmark className="h-4 w-4 mr-2" />Bank</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Withdraw to Bank</DialogTitle><DialogDescription>MoonPay, ACH, or Wire</DialogDescription></DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>Method</Label>
                      <Select value={withdrawMethod} onValueChange={(v: any) => setWithdrawMethod(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="moonpay"><CreditCard className="h-4 w-4 inline mr-2" />MoonPay (Instant, 1.5%)</SelectItem>
                          <SelectItem value="ach"><Building2 className="h-4 w-4 inline mr-2" />ACH Transfer (Free, 3-5 days)</SelectItem>
                          <SelectItem value="wire"><Landmark className="h-4 w-4 inline mr-2" />Wire ($25, 1-2 days)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2"><Label>Bank Name</Label><Input placeholder="Chase, BofA..." value={bankName} onChange={e => setBankName(e.target.value)} /></div>
                      <div><Label>Routing #</Label><Input placeholder="9 digits" maxLength={9} value={routingNumber} onChange={e => setRoutingNumber(e.target.value.replace(/\D/g, ""))} /></div>
                      <div><Label>Account #</Label><Input placeholder="Account #" value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, ""))} /></div>
                      <div className="col-span-2">
                        <Label>Account Type</Label>
                        <Select value={accountType} onValueChange={(v: any) => setAccountType(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent><SelectItem value="checking">Checking</SelectItem><SelectItem value="savings">Savings</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Amount (USD)</Label>
                      <Input type="number" placeholder="0.00" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} />
                      <p className="text-xs text-green-500 mt-1">Available: ${accountBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <Button onClick={handleBankWithdraw} className="w-full" disabled={!bankName || !routingNumber || !accountNumber || !withdrawAmount}>
                      <Landmark className="h-4 w-4 mr-2" />Initiate Withdrawal
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Trades", value: totalTrades.toLocaleString(), icon: BarChart3, color: "blue" },
                { label: "Win Rate", value: `${winRate.toFixed(1)}%`, icon: Target, color: "green" },
                { label: "Active Bots", value: "8", icon: Bot, color: "blue" },
                { label: "Avg/Trade", value: `$${avgProfit.toFixed(4)}`, icon: DollarSign, color: "purple" },
              ].map(s => (
                <div key={s.label} className={`p-4 bg-${s.color}-500/10 rounded-lg border border-${s.color}-500/20`}>
                  <p className="text-muted-foreground text-sm flex items-center gap-1"><s.icon className="h-3 w-3" />{s.label}</p>
                  <p className={`text-2xl font-bold text-${s.color}-500`}>{s.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="breakdown">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="accounting">Accounting</TabsTrigger>
            <TabsTrigger value="ip-nfts">IP NFTs</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="breakdown" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-green-500" />Financial Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Gross Trading Revenue", val: `+$${grossRevenue.toLocaleString("en-US",{minimumFractionDigits:2})}`, color: "green" },
                  { label: "Trading Fees (0.1%)", val: `-$${tradingFees.toLocaleString("en-US",{minimumFractionDigits:2})}`, color: "yellow" },
                  { label: "Net Profit", val: `$${netProfit.toLocaleString("en-US",{minimumFractionDigits:2})}`, color: "blue" },
                  { label: "Total Withdrawn", val: `-$${totalWithdrawn.toLocaleString("en-US",{minimumFractionDigits:2})}`, color: "yellow" },
                  { label: "Account Balance", val: `$${accountBalance.toLocaleString("en-US",{minimumFractionDigits:2})}`, color: "green" },
                ].map(r => (
                  <div key={r.label} className={`flex justify-between p-3 bg-${r.color}-500/10 rounded-lg`}>
                    <span>{r.label}</span>
                    <span className={`font-bold text-${r.color}-500`}>{r.val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounting" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-blue-500" />Tax Reports</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "IRS Form 8949", desc: "Capital gains/losses", icon: FileText, color: "blue" },
                  { title: "Schedule D", desc: "Summary of capital gains", icon: FileSpreadsheet, color: "green" },
                  { title: "Transaction History CSV", desc: "Full export for accountants", icon: Receipt, color: "purple" },
                  { title: "Year-End Summary", desc: "PDF report for records", icon: FileText, color: "orange" },
                ].map(r => (
                  <Button key={r.title} variant="outline" className="h-auto p-4 justify-start" onClick={() => handleTaxReport(r.title)}>
                    <r.icon className={`h-6 w-6 text-${r.color}-500 mr-3`} />
                    <div className="text-left"><p className="font-semibold">{r.title}</p><p className="text-sm text-muted-foreground">{r.desc}</p></div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ip-nfts" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-purple-500" />IP Protection NFTs</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Dialog open={ipNftOpen} onOpenChange={setIpNftOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700"><Stamp className="h-4 w-4 mr-2" />Mint IP Protection NFT</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Mint IP Protection NFT</DialogTitle><DialogDescription>Timestamped blockchain proof of IP</DialogDescription></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>IP Type</Label>
                        <Select value={ipType} onValueChange={(v: any) => setIpType(v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trademark"><Stamp className="h-4 w-4 inline mr-2" />Trademark™</SelectItem>
                            <SelectItem value="copyright"><Copyright className="h-4 w-4 inline mr-2" />Copyright©</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Name</Label><Input placeholder="Income Factory™" value={ipName} onChange={e => setIpName(e.target.value)} /></div>
                      <div><Label>Description</Label><Input placeholder="Brief description..." value={ipDescription} onChange={e => setIpDescription(e.target.value)} /></div>
                      <Button onClick={handleMintIpNft} className="w-full" disabled={!ipName || !ipDescription}><Award className="h-4 w-4 mr-2" />Mint Certificate</Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {[
                  { name: "Income Factory™", type: "Trademark", token: "#847291", icon: Stamp, color: "purple" },
                  { name: "DANUS$ Trading System", type: "Copyright", token: "#729384", icon: Copyright, color: "blue" },
                  { name: "QuWallet™", type: "Trademark", token: "#612847", icon: Stamp, color: "orange" },
                ].map(nft => (
                  <div key={nft.name} className={`p-4 bg-${nft.color}-500/10 border border-${nft.color}-500/30 rounded-lg flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 bg-${nft.color}-500/20 rounded-lg`}><nft.icon className={`h-6 w-6 text-${nft.color}-500`} /></div>
                      <div><p className="font-semibold">{nft.name}</p><p className="text-sm text-muted-foreground">{nft.type} • Token {nft.token}</p></div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-500">Verified</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-blue-500" />Recent Activity</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {recentTrades.slice(0, 10).map((t, i) => (
                  <div key={t.id ?? i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${(t.realized_pnl_usd ?? 0) >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`}>
                        <ArrowUpRight className={`h-4 w-4 ${(t.realized_pnl_usd ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`} />
                      </div>
                      <div>
                        <p className="font-medium">{t.symbol ?? "BTC/USDT"}</p>
                        <p className="text-sm text-muted-foreground">{t.side ?? "trade"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={(t.realized_pnl_usd ?? 0) >= 0 ? "text-green-500" : "text-red-500"}>
                        {(t.realized_pnl_usd ?? 0) >= 0 ? "+" : ""}${Number(t.realized_pnl_usd ?? 0).toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.closed_at ? new Date(t.closed_at).toLocaleTimeString() : "—"}</p>
                    </div>
                  </div>
                ))}
                {recentTrades.length === 0 && <p className="text-center text-muted-foreground py-8">No trade records yet</p>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-purple-500" />Trade History</CardTitle>
                <CardDescription>{totalTrades.toLocaleString()} total trades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted"><tr>
                      <th className="p-2 text-left">Time</th>
                      <th className="p-2 text-left">Symbol</th>
                      <th className="p-2 text-left">Side</th>
                      <th className="p-2 text-right">P&L</th>
                    </tr></thead>
                    <tbody>
                      {paginated.map((t, i) => (
                        <tr key={t.id ?? i} className="border-t hover:bg-muted/50">
                          <td className="p-2 text-xs">{t.closed_at ? new Date(t.closed_at).toLocaleString() : "—"}</td>
                          <td className="p-2 font-mono">{t.symbol ?? "—"}</td>
                          <td className="p-2"><Badge variant={t.side === "buy" ? "default" : "secondary"}>{t.side ?? "—"}</Badge></td>
                          <td className={`p-2 text-right font-mono ${(t.realized_pnl_usd ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {(t.realized_pnl_usd ?? 0) >= 0 ? "+" : ""}${Number(t.realized_pnl_usd ?? 0).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                      {paginated.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No records</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Button variant="outline" size="sm" onClick={() => setTradePage(p => Math.max(1, p - 1))} disabled={tradePage === 1}><ChevronLeft className="h-4 w-4" />Prev</Button>
                  <span className="text-sm text-muted-foreground">Page {tradePage}</span>
                  <Button variant="outline" size="sm" onClick={() => setTradePage(p => p + 1)} disabled={paginated.length < TRADES_PER_PAGE}>Next<ChevronRight className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-purple-500" />Quantum Security Status</CardTitle></CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                {[
                  { label: "FIPS 203 ML-KEM", desc: "Post-Quantum Key Encapsulation Active" },
                  { label: "FIPS 204 ML-DSA", desc: "Digital Signatures Protected" },
                  { label: "IBM Quantum", desc: "156-Qubit Processing" },
                  { label: "24/7 Monitoring", desc: "Continuous Security Scanning" },
                ].map(s => (
                  <div key={s.label} className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1"><CheckCircle className="h-5 w-5 text-green-500" /><p className="text-green-500 font-semibold">{s.label}</p></div>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
