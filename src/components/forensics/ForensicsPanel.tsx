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
  CheckCircle2,
  Target,
  Network,
  Fingerprint,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { 
  proxyHunter, 
  type ProxyCluster, 
  type ForensicAlert,
  type TransactionRecord
} from "@/lib/forensics/proxyClusterHunter";
import { 
  ibmQMAC, 
  type QuantumJob,
  IQM_SPECS 
} from "@/lib/quantum/ibmQuantumMAC";
import { 
  sovereignRegistry, 
  type SovereignNFT 
} from "@/lib/registry/sovereignAssetRegistry";

// Generate mock transaction data
function generateMockTransactions(count: number): TransactionRecord[] {
  const transactions: TransactionRecord[] = [];
  const addresses = Array(50).fill(null).map(() => 
    '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  );

  for (let i = 0; i < count; i++) {
    transactions.push({
      hash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      fromAddress: addresses[Math.floor(Math.random() * addresses.length)],
      toAddress: addresses[Math.floor(Math.random() * addresses.length)],
      amount: Math.random() * 100000,
      timestamp: Date.now() - Math.floor(Math.random() * 86400000 * 30),
      blockNumber: 18000000 + Math.floor(Math.random() * 100000)
    });
  }

  return transactions;
}

const ForensicsPanel = () => {
  const [clusters, setClusters] = useState<ProxyCluster[]>([]);
  const [alerts, setAlerts] = useState<ForensicAlert[]>([]);
  const [isHunting, setIsHunting] = useState(false);
  const [quantumJobs, setQuantumJobs] = useState<QuantumJob[]>([]);
  const [nfts, setNfts] = useState<SovereignNFT[]>([]);
  const [newHashtag, setNewHashtag] = useState("");
  const [taintAddress, setTaintAddress] = useState("");
  const [taintResults, setTaintResults] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // Load existing NFTs
    setNfts(sovereignRegistry.exportRegistry());
  }, []);

  const runForensicScan = async () => {
    setIsHunting(true);
    toast.info("Initializing Proxy Cluster Hunt...");

    // Load mock transactions
    const transactions = generateMockTransactions(500);
    proxyHunter.loadTransactions(transactions);

    // Detect peel chains
    const peelChains = proxyHunter.detectPeelChains();
    toast.info(`Found ${peelChains.length} potential peel chains`);

    // Cluster proxies
    const foundClusters = proxyHunter.clusterProxies();
    setClusters(foundClusters);

    // Get alerts
    setAlerts(proxyHunter.getAlerts());

    // Run quantum classification on top clusters
    for (const cluster of foundClusters.slice(0, 3)) {
      const fingerprint = proxyHunter.getQuantumFingerprint(cluster);
      const job = await ibmQMAC.submitClassificationJob(fingerprint);
      setQuantumJobs(prev => [job, ...prev]);

      // Wait for completion
      const completed = await ibmQMAC.waitForJob(job.jobId);
      setQuantumJobs(prev => prev.map(j => j.jobId === job.jobId ? completed : j));

      if (completed.result?.classification === 'fraud') {
        toast.error(`Cluster ${cluster.clusterId} classified as FRAUD (${(completed.result.confidence * 100).toFixed(1)}% confidence)`);
      }
    }

    setIsHunting(false);
    toast.success(`Forensic scan complete: ${foundClusters.length} clusters, ${proxyHunter.getAlerts().length} alerts`);
  };

  const runTaintAnalysis = () => {
    if (!taintAddress) {
      toast.error("Enter an address to trace");
      return;
    }

    const results = proxyHunter.taintAnalysis(taintAddress, 5);
    setTaintResults(results);
    toast.success(`Traced taint to ${results.size} addresses`);
  };

  const mintHashtag = () => {
    if (!newHashtag) {
      toast.error("Enter a hashtag to register");
      return;
    }

    const result = sovereignRegistry.mintSovereignAsset('hashtag', newHashtag, 'user-wallet-001');
    if ('error' in result) {
      toast.error(result.error);
    } else {
      setNfts(sovereignRegistry.exportRegistry());
      toast.success(`Registered #${newHashtag} as sovereign NFT`);
      setNewHashtag("");
    }
  };

  const registryStats = sovereignRegistry.getStats();

  return (
    <Tabs defaultValue="hunter" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="hunter" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Proxy Hunter
        </TabsTrigger>
        <TabsTrigger value="quantum" className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Q-MAC
        </TabsTrigger>
        <TabsTrigger value="taint" className="flex items-center gap-2">
          <Fingerprint className="h-4 w-4" />
          Taint Trace
        </TabsTrigger>
        <TabsTrigger value="registry" className="flex items-center gap-2">
          <Hash className="h-4 w-4" />
          NFT Registry
        </TabsTrigger>
      </TabsList>

      {/* Proxy Hunter */}
      <TabsContent value="hunter">
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Proxy Cluster Detection
              </CardTitle>
              <CardDescription>
                DBSCAN + Bit-CHetG for organized money laundering detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full" 
                onClick={runForensicScan}
                disabled={isHunting}
              >
                {isHunting ? (
                  <>
                    <Search className="h-4 w-4 mr-2 animate-pulse" />
                    Hunting Proxies...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Run Forensic Scan
                  </>
                )}
              </Button>

              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {clusters.map(cluster => (
                    <div key={cluster.clusterId} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm">{cluster.clusterId}</span>
                        <Badge variant={
                          cluster.riskScore > 0.7 ? 'destructive' :
                          cluster.riskScore > 0.4 ? 'secondary' : 'outline'
                        }>
                          {cluster.pattern.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Nodes: </span>
                          <span className="font-bold">{cluster.nodes.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Volume: </span>
                          <span className="font-bold">${cluster.totalVolume.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Risk: </span>
                          <span className={cluster.riskScore > 0.7 ? 'text-red-500 font-bold' : ''}>
                            {(cluster.riskScore * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className={`p-3 rounded-lg border ${
                      alert.severity === 'critical' ? 'border-red-500 bg-red-500/10' :
                      alert.severity === 'high' ? 'border-orange-500 bg-orange-500/10' : ''
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' : 'secondary'
                        }>
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{alert.type}</span>
                      </div>
                      <p className="text-xs">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Q-MAC */}
      <TabsContent value="quantum">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-blue-500" />
                IBM Quantum MAC
              </CardTitle>
              <CardDescription>VQC Classification Jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {ibmQMAC.getBackends().map(backend => (
                    <div key={backend.name} className="p-3 rounded-lg bg-muted">
                      <div className="font-mono text-sm">{backend.name}</div>
                      <div className="text-xs text-muted-foreground">{backend.qubits} qubits</div>
                    </div>
                  ))}
                </div>

                <ScrollArea className="h-[250px]">
                  <div className="space-y-2">
                    {quantumJobs.map(job => (
                      <div key={job.jobId} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs">{job.jobId.slice(0, 20)}...</span>
                          <Badge variant={
                            job.status === 'completed' ? 'default' :
                            job.status === 'running' ? 'secondary' : 'outline'
                          }>
                            {job.status}
                          </Badge>
                        </div>
                        {job.result && (
                          <div className="flex items-center justify-between text-sm">
                            <span className={
                              job.result.classification === 'fraud' ? 'text-red-500' :
                              job.result.classification === 'legitimate' ? 'text-green-500' : ''
                            }>
                              {job.result.classification.toUpperCase()}
                            </span>
                            <span>{(job.result.confidence * 100).toFixed(1)}% confidence</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IQM Quantum Specs</CardTitle>
              <CardDescription>European Hardware Alternative</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(IQM_SPECS).map(([key, specs]) => (
                <div key={key} className="p-4 rounded-lg border">
                  <div className="font-bold mb-2">{specs.name}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Qubits: <span className="font-bold">{specs.qubits}</span></div>
                    <div>1Q Fidelity: <span className="font-bold">{(specs.fidelity1Q * 100).toFixed(1)}%</span></div>
                    <div>2Q Fidelity: <span className="font-bold">{(specs.fidelity2Q * 100).toFixed(1)}%</span></div>
                    <div>T1: <span className="font-bold">{specs.coherenceT1}μs</span></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Taint Analysis */}
      <TabsContent value="taint">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-purple-500" />
              Taint Analysis
            </CardTitle>
            <CardDescription>Track stolen funds across the blockchain</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Stolen/Source Address</Label>
                <Input 
                  value={taintAddress}
                  onChange={(e) => setTaintAddress(e.target.value)}
                  placeholder="0x..."
                />
              </div>
              <Button className="mt-6" onClick={runTaintAnalysis}>
                <Search className="h-4 w-4 mr-2" />
                Trace Taint
              </Button>
            </div>

            {taintResults.size > 0 && (
              <div className="p-4 rounded-lg bg-muted">
                <h4 className="font-semibold mb-3">Tainted Addresses ({taintResults.size})</h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {Array.from(taintResults.entries())
                      .sort((a, b) => b[1] - a[1])
                      .map(([address, taint]) => (
                        <div key={address} className="flex items-center justify-between p-2 rounded bg-background">
                          <span className="font-mono text-xs">{address.slice(0, 20)}...</span>
                          <div className="flex items-center gap-2">
                            <Progress value={taint * 100} className="w-20" />
                            <span className={`text-sm font-bold ${taint > 0.5 ? 'text-red-500' : 'text-yellow-500'}`}>
                              {(taint * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* NFT Registry */}
      <TabsContent value="registry">
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5 text-cyan-500" />
                Sovereign Asset Registry
              </CardTitle>
              <CardDescription>Immutable hashtag & URL ownership</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Register New Hashtag</Label>
                  <Input 
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    placeholder="#YourHashtag"
                  />
                </div>
                <Button className="mt-6" onClick={mintHashtag}>
                  <Zap className="h-4 w-4 mr-2" />
                  Mint NFT
                </Button>
              </div>

              <ScrollArea className="h-[300px]">
                <div className="grid grid-cols-2 gap-3">
                  {nfts.map(nft => (
                    <div key={nft.tokenId} className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">{nft.assetType}</Badge>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="font-bold text-lg">{nft.assetValue}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {nft.tokenId.slice(0, 16)}...
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Owner: {nft.owner.slice(0, 12)}...
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registry Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted text-center">
                <div className="text-3xl font-bold">{registryStats.totalAssets}</div>
                <div className="text-sm text-muted-foreground">Total Assets</div>
              </div>
              <div className="p-4 rounded-lg bg-muted text-center">
                <div className="text-3xl font-bold">{registryStats.totalOwners}</div>
                <div className="text-sm text-muted-foreground">Unique Owners</div>
              </div>
              <div className="space-y-2">
                {Object.entries(registryStats.byType).map(([type, count]) => (
                  <div key={type} className="flex justify-between p-2 rounded bg-muted">
                    <span className="capitalize">{type}</span>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default ForensicsPanel;
