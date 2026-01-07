import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Atom, 
  Shield, 
  Zap, 
  Globe, 
  Brain,
  Lock,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Network,
  Battery,
  Sun,
  Target
} from "lucide-react";
import { toast } from "sonner";
import { 
  simulateDTCMining, 
  heartbeatOracle,
  type TemporalResonanceProof,
  type FloquetParameters
} from "@/lib/quantum/proofOfTemporalResonance";
import {
  cryptoAgility,
  assessHNDLRisk,
  type PQCKeyPair
} from "@/lib/crypto/postQuantumCrypto";
import ForensicsPanel from "@/components/forensics/ForensicsPanel";
import {
  quantumSentinel,
  type FraudDetectionResult,
  type TransactionNode
} from "@/lib/fraud/quantumSentinel";
import {
  gridFlexAI,
  generateBorderCorridorNodes,
  type GridNode,
  type ArbitrageOpportunity,
  SODIUM_ION_SPECS
} from "@/lib/energy/wireFluxGrid";

const TitanCodexDashboard = () => {
  const [activeProofs, setActiveProofs] = useState<TemporalResonanceProof[]>([]);
  const [isMining, setIsMining] = useState(false);
  const [heartbeat, setHeartbeat] = useState("");
  const [pqcKeys, setPqcKeys] = useState<PQCKeyPair | null>(null);
  const [fraudResults, setFraudResults] = useState<FraudDetectionResult[]>([]);
  const [gridNodes, setGridNodes] = useState<GridNode[]>([]);
  const [arbitrageOpps, setArbitrageOpps] = useState<ArbitrageOpportunity[]>([]);

  // Initialize systems
  useEffect(() => {
    // Generate heartbeat pulse
    const interval = setInterval(() => {
      setHeartbeat(heartbeatOracle.generateHeartbeat().slice(0, 16) + '...');
    }, 1000);

    // Initialize grid nodes
    const nodes = generateBorderCorridorNodes(50);
    nodes.forEach(node => gridFlexAI.registerNode(node));
    setGridNodes(nodes);

    // Find arbitrage opportunities
    setArbitrageOpps(gridFlexAI.findArbitrageOpportunities());

    return () => clearInterval(interval);
  }, []);

  // Mine QTC block
  const mineBlock = async () => {
    setIsMining(true);
    toast.info("Initiating Proof of Temporal Resonance...");

    const params: FloquetParameters = {
      numQubits: 8,
      gFactor: 0.97,
      disorderStrength: 0.5,
      interactionStrength: 1.0,
      annealingTime: 20
    };

    try {
      const result = await simulateDTCMining(
        `tx-${Date.now()}-genesis`,
        1024,
        params
      );

      if (result.success && result.proof) {
        setActiveProofs(prev => [result.proof!, ...prev].slice(0, 10));
        toast.success(`Block crystallized! Resonance: ${(result.proof.resonanceValue * 100).toFixed(1)}%`);
      } else {
        toast.error("Mining failed - entropy too high. Retrying...");
      }
    } catch (error) {
      toast.error("Quantum circuit execution failed");
    } finally {
      setIsMining(false);
    }
  };

  // Generate PQC keys
  const generateKeys = async () => {
    const keys = await cryptoAgility.generateKeyPair('signing');
    setPqcKeys(keys);
    toast.success(`ML-DSA keys generated - ${cryptoAgility.getSecurityLevel()}`);
  };

  // Run fraud analysis
  const analyzeFraud = async () => {
    const mockTx: TransactionNode = {
      id: `tx-${Date.now()}`,
      address: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      amount: Math.random() * 100000,
      timestamp: Date.now(),
      walletAge: Math.floor(Math.random() * 365),
      transactionCount: Math.floor(Math.random() * 500),
      velocity: Math.random() * 15,
      riskScore: Math.random(),
      features: []
    };

    const neighbors: TransactionNode[] = Array(5).fill(null).map((_, i) => ({
      ...mockTx,
      id: `neighbor-${i}`,
      amount: mockTx.amount * (0.1 + Math.random() * 0.3)
    }));

    const result = await quantumSentinel.analyze(mockTx, neighbors);
    setFraudResults(prev => [result, ...prev].slice(0, 5));

    if (result.classification === 'illicit') {
      toast.error(`ALERT: Illicit transaction detected (${(result.riskProbability * 100).toFixed(1)}% risk)`);
    } else if (result.classification === 'suspicious') {
      toast.warning(`Suspicious activity flagged for review`);
    } else {
      toast.success(`Transaction approved - low risk`);
    }
  };

  const gridHealth = gridFlexAI.getGridHealth();

  return (
    <Tabs defaultValue="quantum" className="space-y-6">
      <TabsList className="grid w-full grid-cols-6">
        <TabsTrigger value="quantum" className="flex items-center gap-2">
          <Atom className="h-4 w-4" />
          Quantum Core
        </TabsTrigger>
        <TabsTrigger value="crypto" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          PQC Shield
        </TabsTrigger>
        <TabsTrigger value="sentinel" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          AI Sentinel
        </TabsTrigger>
        <TabsTrigger value="forensics" className="flex items-center gap-2">
          <Target className="h-4 w-4" />
          Forensics
        </TabsTrigger>
        <TabsTrigger value="grid" className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          WireFlux Grid
        </TabsTrigger>
        <TabsTrigger value="status" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Stargate
        </TabsTrigger>
      </TabsList>

      {/* Quantum Core - PoTR Mining */}
      <TabsContent value="quantum">
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Atom className="h-5 w-5 text-purple-500" />
                Proof of Temporal Resonance (PoTR) Engine
              </CardTitle>
              <CardDescription>
                Discrete Time Crystal consensus - Period doubling verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Quantum Heartbeat Oracle</div>
                    <div className="font-mono text-lg">{heartbeat || 'Initializing...'}</div>
                  </div>
                  <Badge variant="outline" className="text-green-500">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    LIVE
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-500">{heartbeatOracle.getSubharmonicWindow()}</div>
                    <div className="text-xs text-muted-foreground">Block Height</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">8s</div>
                    <div className="text-xs text-muted-foreground">Block Time</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-500">{activeProofs.length}</div>
                    <div className="text-xs text-muted-foreground">Crystallized</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">DTC</div>
                    <div className="text-xs text-muted-foreground">Phase</div>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                onClick={mineBlock}
                disabled={isMining}
              >
                {isMining ? (
                  <>
                    <Cpu className="h-4 w-4 mr-2 animate-spin" />
                    Floquet Evolution in Progress...
                  </>
                ) : (
                  <>
                    <Atom className="h-4 w-4 mr-2" />
                    Mine QTC Block (Simulate DTC)
                  </>
                )}
              </Button>

              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {activeProofs.map((proof, i) => (
                    <div key={proof.proofHash} className="p-3 rounded-lg border text-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs">{proof.proofHash.slice(0, 24)}...</span>
                        <Badge variant="outline" className="text-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Crystallized
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Resonance: {(proof.resonanceValue * 100).toFixed(1)}%</span>
                        <span>Shots: {proof.shots}</span>
                        <span>{proof.executionTimeMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Floquet Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Qubits</div>
                <div className="font-bold">8</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">g-Factor (π-pulse)</div>
                <div className="font-bold">0.97</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Disorder Strength</div>
                <div className="font-bold">0.5</div>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <div className="text-xs text-muted-foreground">Annealing Time</div>
                <div className="font-bold">20 μs</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20">
                <div className="text-xs text-muted-foreground">Coherence Target</div>
                <div className="font-bold text-green-500">&gt; 30%</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* PQC Shield */}
      <TabsContent value="crypto">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                Post-Quantum Cryptography
              </CardTitle>
              <CardDescription>NIST FIPS 203/204/205 Compliant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border text-center">
                  <div className="font-bold text-blue-500">ML-KEM</div>
                  <div className="text-xs text-muted-foreground">Key Encapsulation</div>
                  <Badge variant="outline" className="mt-2">FIPS 203</Badge>
                </div>
                <div className="p-3 rounded-lg border text-center">
                  <div className="font-bold text-green-500">ML-DSA</div>
                  <div className="text-xs text-muted-foreground">Digital Signatures</div>
                  <Badge variant="outline" className="mt-2">FIPS 204</Badge>
                </div>
                <div className="p-3 rounded-lg border text-center">
                  <div className="font-bold text-purple-500">SLH-DSA</div>
                  <div className="text-xs text-muted-foreground">Hash-Based Backup</div>
                  <Badge variant="outline" className="mt-2">FIPS 205</Badge>
                </div>
              </div>

              <Button className="w-full" onClick={generateKeys}>
                <Lock className="h-4 w-4 mr-2" />
                Generate Quantum-Resistant Keys
              </Button>

              {pqcKeys && (
                <div className="p-4 rounded-lg bg-muted space-y-2">
                  <div className="text-xs text-muted-foreground">Algorithm</div>
                  <Badge>{pqcKeys.algorithm}</Badge>
                  <div className="text-xs text-muted-foreground mt-2">Public Key (truncated)</div>
                  <div className="font-mono text-xs break-all">{pqcKeys.publicKey.slice(0, 64)}...</div>
                  <div className="text-xs text-green-500 mt-2">{cryptoAgility.getSecurityLevel()}</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                HNDL Threat Assessment
              </CardTitle>
              <CardDescription>"Harvest Now, Decrypt Later" Risk Analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Legacy RSA-2048 Data', date: new Date('2020-01-01'), alg: 'RSA-2048' },
                { name: 'ECDSA Wallet Keys', date: new Date('2023-06-15'), alg: 'ECDSA-256' },
                { name: 'ML-KEM Protected', date: new Date('2026-01-01'), alg: 'ML-KEM-768' }
              ].map((asset, i) => {
                const risk = assessHNDLRisk(asset.date, asset.alg);
                return (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{asset.name}</span>
                      <Badge variant={
                        risk.quantumThreatLevel === 'critical' ? 'destructive' :
                        risk.quantumThreatLevel === 'high' ? 'destructive' :
                        risk.quantumThreatLevel === 'medium' ? 'secondary' : 'outline'
                      }>
                        {risk.quantumThreatLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {risk.recommendedAction}
                    </div>
                    <div className="text-xs mt-1">
                      CRQC Timeline: {risk.estimatedCRQCTimeline}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* AI Sentinel */}
      <TabsContent value="sentinel">
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-500" />
                Quantum-Ready Sentinel (GNN Fraud Detection)
              </CardTitle>
              <CardDescription>
                Ensemble GCN + GAT + GIN • FATF Travel Rule Compliant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={analyzeFraud}>
                <Shield className="h-4 w-4 mr-2" />
                Analyze Transaction (Simulated)
              </Button>

              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {fraudResults.map((result, i) => (
                    <div key={result.transactionId} className="p-4 rounded-lg border">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-sm">{result.transactionId}</span>
                        <Badge variant={
                          result.classification === 'illicit' ? 'destructive' :
                          result.classification === 'suspicious' ? 'secondary' : 'outline'
                        }>
                          {result.recommendation.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Risk Score</span>
                          <span className={
                            result.riskProbability > 0.7 ? 'text-red-500' :
                            result.riskProbability > 0.3 ? 'text-yellow-500' : 'text-green-500'
                          }>
                            {(result.riskProbability * 100).toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={result.riskProbability * 100} 
                          className={result.riskProbability > 0.7 ? '[&>div]:bg-red-500' : ''}
                        />
                      </div>
                      {result.patterns.length > 0 && (
                        <div className="space-y-1">
                          {result.patterns.map((p, j) => (
                            <div key={j} className="text-xs p-2 rounded bg-muted">
                              <span className="font-bold">{p.type.replace(/_/g, ' ').toUpperCase()}</span>
                              <span className="text-muted-foreground ml-2">({(p.confidence * 100).toFixed(0)}%)</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detection Patterns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['peel_chain', 'mixer_usage', 'layering', 'smurfing', 'unusual_velocity', 'dormant_activation'].map(pattern => (
                <div key={pattern} className="p-2 rounded bg-muted text-sm">
                  {pattern.replace(/_/g, ' ').toUpperCase()}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Forensics Panel */}
      <TabsContent value="forensics">
        <ForensicsPanel />
      </TabsContent>

      {/* WireFlux Grid */}
      <TabsContent value="grid">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Network className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-3xl font-bold">{gridHealth.onlineNodes}</div>
              <div className="text-sm text-muted-foreground">Online Nodes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Battery className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold">{gridHealth.totalCapacityMWh.toFixed(0)}</div>
              <div className="text-sm text-muted-foreground">MWh Capacity</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-3xl font-bold">{gridHealth.avgChargePercent.toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Avg Charge</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Sun className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-3xl font-bold text-green-500">{gridHealth.status.toUpperCase()}</div>
              <div className="text-sm text-muted-foreground">Grid Status</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Arbitrage Opportunities
              </CardTitle>
              <CardDescription>Real-time energy market spreads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {arbitrageOpps.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No significant arbitrage opportunities detected
                  </div>
                ) : arbitrageOpps.map((opp, i) => (
                  <div key={i} className="p-3 rounded-lg border">
                    <div className="flex justify-between items-center">
                      <span>{opp.buyMarket} → {opp.sellMarket}</span>
                      <Badge variant="outline" className="text-green-500">
                        +${opp.estimatedProfit.toFixed(2)}/MWh
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Spread: ${opp.priceDifferential.toFixed(2)} • Window: {opp.windowDuration}min
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sodium-Ion Specs (CATL Naxtra)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between p-2 rounded bg-muted">
                <span>Energy Density</span>
                <span className="font-bold">{SODIUM_ION_SPECS.energyDensity} Wh/kg</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted">
                <span>Temp Range</span>
                <span className="font-bold">{SODIUM_ION_SPECS.tempRangeMin}°C to +{SODIUM_ION_SPECS.tempRangeMax}°C</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted">
                <span>Cycle Life</span>
                <span className="font-bold">{SODIUM_ION_SPECS.cycleLife.toLocaleString()} cycles</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted">
                <span>Target Cost</span>
                <span className="font-bold text-green-500">${SODIUM_ION_SPECS.costPerKWh}/kWh</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-muted">
                <span>Round-Trip Efficiency</span>
                <span className="font-bold">{(SODIUM_ION_SPECS.roundTripEfficiency * 100)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Stargate Status */}
      <TabsContent value="status">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-500" />
              STARGATE PROTOCOL: OPERATIONAL STATUS
            </CardTitle>
            <CardDescription>
              Bir Tawil Development Zone • Quantum-Energy-Sovereignty Singularity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border text-center">
                <div className="text-4xl font-bold text-purple-500">QTC</div>
                <div className="text-lg font-semibold mt-2">Quantum Chronos</div>
                <div className="text-sm text-muted-foreground">1 QTC = 1 kWh + Coherence</div>
                <Badge variant="outline" className="mt-2">GENESIS PHASE</Badge>
              </div>
              <div className="p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-yellow-500/10 border text-center">
                <div className="text-4xl font-bold text-green-500">2GW</div>
                <div className="text-lg font-semibold mt-2">Target Capacity</div>
                <div className="text-sm text-muted-foreground">Border Corridor Grid</div>
                <Badge variant="outline" className="mt-2">PHASE 1</Badge>
              </div>
              <div className="p-6 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border text-center">
                <div className="text-4xl font-bold text-cyan-500">∞</div>
                <div className="text-lg font-semibold mt-2">Peace Engine</div>
                <div className="text-sm text-muted-foreground">Indigenous DAO Active</div>
                <Badge variant="outline" className="mt-2">SOVEREIGN</Badge>
              </div>
            </div>

            <div className="p-6 rounded-lg border bg-muted/50">
              <h4 className="font-semibold mb-4">EXECUTION TIMELINE</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span>Phase 0: Genesis - Entity Formation & IP Filing</span>
                  <Badge>COMPLETE</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Activity className="h-5 w-5 text-blue-500 animate-pulse" />
                  <span>Phase 1: Laboratory - Quantum Simulation & GNN Training</span>
                  <Badge variant="secondary">IN PROGRESS</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  <span>Phase 2: Anchor - SolarMobile Deployment & Testnet</span>
                  <Badge variant="outline">PENDING</Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  <span>Phase 3: Sovereignty - Bir Tawil Activation</span>
                  <Badge variant="outline">PENDING</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default TitanCodexDashboard;
