import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Shield, 
  Cpu, 
  Hash,
  AlertTriangle,
  Network,
  Zap,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface TransactionRecord {
  hash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  timestamp: number;
  blockNumber: number;
}

interface Cluster {
  id: string;
  addresses: string[];
  riskScore: number;
  totalVolume: number;
  transactionCount: number;
}

const ForensicsPanel = () => {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [isHunting, setIsHunting] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [taintAddress, setTaintAddress] = useState("");
  const [taintResults, setTaintResults] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('forensic_transactions')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(500);

        if (error) throw error;

        if (data && data.length > 0) {
          setTransactions(data.map(tx => ({
            hash: tx.tx_hash,
            fromAddress: tx.from_address,
            toAddress: tx.to_address,
            amount: Number(tx.amount),
            timestamp: new Date(tx.timestamp).getTime(),
            blockNumber: Number(tx.block_number) || 0
          })));
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const runForensicScan = async () => {
    if (transactions.length === 0) {
      toast.error("No transaction data available");
      return;
    }

    setIsHunting(true);
    toast.info("Analyzing transaction graph...");

    // Simple clustering based on connected addresses
    const addressMap = new Map<string, Set<string>>();
    
    transactions.forEach(tx => {
      if (!addressMap.has(tx.fromAddress)) addressMap.set(tx.fromAddress, new Set());
      if (!addressMap.has(tx.toAddress)) addressMap.set(tx.toAddress, new Set());
      addressMap.get(tx.fromAddress)!.add(tx.toAddress);
      addressMap.get(tx.toAddress)!.add(tx.fromAddress);
    });

    // Create clusters from connected components
    const visited = new Set<string>();
    const foundClusters: Cluster[] = [];

    addressMap.forEach((_, addr) => {
      if (visited.has(addr)) return;
      
      const cluster: string[] = [];
      const stack = [addr];
      
      while (stack.length > 0) {
        const current = stack.pop()!;
        if (visited.has(current)) continue;
        visited.add(current);
        cluster.push(current);
        
        addressMap.get(current)?.forEach(neighbor => {
          if (!visited.has(neighbor)) stack.push(neighbor);
        });
      }

      if (cluster.length >= 3) {
        const clusterTxs = transactions.filter(tx => 
          cluster.includes(tx.fromAddress) || cluster.includes(tx.toAddress)
        );
        
        foundClusters.push({
          id: `cluster_${foundClusters.length + 1}`,
          addresses: cluster,
          riskScore: Math.min(0.3 + (cluster.length * 0.05), 0.95),
          totalVolume: clusterTxs.reduce((sum, tx) => sum + tx.amount, 0),
          transactionCount: clusterTxs.length
        });
      }
    });

    setClusters(foundClusters.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10));
    setIsHunting(false);
    toast.success(`Found ${foundClusters.length} clusters`);
  };

  const getClusterRiskColor = (riskScore: number) => {
    if (riskScore >= 0.8) return 'text-red-500 bg-red-500/10';
    if (riskScore >= 0.5) return 'text-amber-500 bg-amber-500/10';
    return 'text-green-500 bg-green-500/10';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="clusters">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="clusters">Proxy Clusters</TabsTrigger>
          <TabsTrigger value="taint">Taint Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="clusters" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Proxy Cluster Detection
                  </CardTitle>
                  <CardDescription>
                    Identify related wallet clusters via transaction graph analysis
                  </CardDescription>
                </div>
                <Button onClick={runForensicScan} disabled={isHunting || transactions.length === 0}>
                  {isHunting ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Scanning...</>
                  ) : (
                    <><Search className="h-4 w-4 mr-2" />Run Scan</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transaction data available</p>
                </div>
              ) : clusters.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    {transactions.length} transactions loaded. Run scan to detect clusters.
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {clusters.map((cluster) => (
                      <Card key={cluster.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{cluster.id}</span>
                              <Badge className={getClusterRiskColor(cluster.riskScore)}>
                                Risk: {(cluster.riskScore * 100).toFixed(0)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {cluster.addresses.length} addresses • {cluster.totalVolume.toFixed(2)} ETH
                            </p>
                          </div>
                          <p className="text-sm font-medium">{cluster.transactionCount} txs</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taint" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Taint Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label>Source Address</Label>
                  <Input
                    placeholder="0x..."
                    value={taintAddress}
                    onChange={(e) => setTaintAddress(e.target.value)}
                  />
                </div>
                <Button className="mt-6" disabled={transactions.length === 0}>
                  <Zap className="h-4 w-4 mr-2" />Trace
                </Button>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                {transactions.length === 0 
                  ? "No transaction data for analysis"
                  : "Enter an address to trace fund flows"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ForensicsPanel;
