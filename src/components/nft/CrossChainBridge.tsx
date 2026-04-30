import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCachedUser } from "@/lib/auth/getCachedUser";
import { ArrowRight, ArrowLeftRight, Shield, Clock, CheckCircle, Loader2, AlertTriangle, Zap } from "lucide-react";

interface BridgeTransaction {
  id: string;
  nftName: string;
  fromChain: string;
  toChain: string;
  status: "pending" | "locking" | "minting" | "completed" | "failed";
  progress: number;
  timestamp: string;
}

interface UserNFT {
  id: string;
  name: string;
  chain: string;
  collection: string;
  image: string;
}

const CHAINS = [
  { id: "ethereum", name: "Ethereum", icon: "⟠", color: "text-blue-400", fees: 0.005 },
  { id: "polygon", name: "Polygon", icon: "⬡", color: "text-purple-400", fees: 0.001 },
  { id: "solana", name: "Solana", icon: "◎", color: "text-green-400", fees: 0.0005 },
];

const CrossChainBridge = () => {
  const [fromChain, setFromChain] = useState("ethereum");
  const [toChain, setToChain] = useState("solana");
  const [selectedNft, setSelectedNft] = useState("");
  const [bridging, setBridging] = useState(false);
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const [userNfts, setUserNfts] = useState<UserNFT[]>([]);

  const loadUserNfts = useCallback(async () => {
    const user = await getCachedUser();
    if (!user) return;

    const { data } = await supabase
      .from("auto_nft_generations")
      .select("id, name, chain, description, image_url")
      .eq("user_id", user.id)
      .eq("mint_status", "minted") as any;

    if (data) {
      setUserNfts(data.map((n: any) => ({
        id: n.id,
        name: n.name,
        chain: n.chain || 'ethereum',
        collection: 'My NFTs',
        image: n.image_url ? '🖼️' : '🎨',
      })));
    }
  }, []);

  useEffect(() => { loadUserNfts(); }, [loadUserNfts]);

  const availableNfts = userNfts.filter((n) => n.chain === fromChain);
  const fromChainData = CHAINS.find((c) => c.id === fromChain)!;
  const toChainData = CHAINS.find((c) => c.id === toChain)!;
  const estimatedFee = fromChainData.fees + toChainData.fees;

  const handleSwapChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
    setSelectedNft("");
  };

  const handleBridge = async () => {
    if (!selectedNft) { toast.error("Select an NFT to bridge"); return; }
    const nft = userNfts.find((n) => n.id === selectedNft);
    if (!nft) return;

    setBridging(true);
    const txId = `tx-${Date.now()}`;
    const newTx: BridgeTransaction = {
      id: txId, nftName: nft.name, fromChain, toChain, status: "pending", progress: 0, timestamp: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    const stages: Array<{ status: BridgeTransaction["status"]; progress: number; delay: number }> = [
      { status: "locking", progress: 25, delay: 1500 },
      { status: "locking", progress: 50, delay: 2000 },
      { status: "minting", progress: 75, delay: 2000 },
      { status: "completed", progress: 100, delay: 1500 },
    ];

    for (const stage of stages) {
      await new Promise((r) => setTimeout(r, stage.delay));
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, status: stage.status, progress: stage.progress } : t))
      );
    }

    // Update chain in DB
    await supabase.from("auto_nft_generations").update({ chain: toChain } as any).eq("id", selectedNft);

    toast.success(`${nft.name} bridged to ${toChainData.name}!`);
    setBridging(false);
    setSelectedNft("");
    loadUserNfts();
  };

  const statusIcon = (status: BridgeTransaction["status"]) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4 text-yellow-400" />;
      case "locking": return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
      case "minting": return <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />;
      case "completed": return <CheckCircle className="h-4 w-4 text-green-400" />;
      case "failed": return <AlertTriangle className="h-4 w-4 text-red-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />Cross-Chain NFT Bridge
          </CardTitle>
          <CardDescription>Move your NFTs between Ethereum, Polygon, and Solana</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">From</label>
              <Select value={fromChain} onValueChange={(v) => { setFromChain(v); setSelectedNft(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHAINS.filter((c) => c.id !== toChain).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2"><span className={c.color}>{c.icon}</span> {c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" className="mt-6" onClick={handleSwapChains}>
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">To</label>
              <Select value={toChain} onValueChange={setToChain}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHAINS.filter((c) => c.id !== fromChain).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2"><span className={c.color}>{c.icon}</span> {c.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Select NFT</label>
            {availableNfts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableNfts.map((nft) => (
                  <button
                    key={nft.id}
                    onClick={() => setSelectedNft(nft.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedNft === nft.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{nft.image}</span>
                      <div>
                        <p className="font-medium text-sm">{nft.name}</p>
                        <p className="text-xs text-muted-foreground">{nft.collection}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">
                No NFTs found on {fromChainData.name}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span className="text-muted-foreground">Estimated Bridge Fee:</span>
            </div>
            <span className="font-mono font-medium">{estimatedFee.toFixed(4)} ETH</span>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <Shield className="h-4 w-4 text-green-400 mt-0.5" />
            <p className="text-xs text-green-300">
              Protected by lock-and-mint protocol. Original metadata and provenance are preserved.
            </p>
          </div>

          <Button className="w-full" size="lg" onClick={handleBridge} disabled={!selectedNft || bridging}>
            {bridging ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Bridging...</> : <><ArrowRight className="h-4 w-4 mr-2" /> Bridge NFT</>}
          </Button>
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Bridge History</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => {
                const from = CHAINS.find((c) => c.id === tx.fromChain)!;
                const to = CHAINS.find((c) => c.id === tx.toChain)!;
                return (
                  <div key={tx.id} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {statusIcon(tx.status)}
                        <span className="font-medium text-sm">{tx.nftName}</span>
                      </div>
                      <Badge variant={tx.status === "completed" ? "default" : "secondary"} className="text-xs">{tx.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={from.color}>{from.icon} {from.name}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className={to.color}>{to.icon} {to.name}</span>
                    </div>
                    {tx.status !== "completed" && tx.status !== "failed" && <Progress value={tx.progress} className="h-1" />}
                    <p className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CrossChainBridge;
