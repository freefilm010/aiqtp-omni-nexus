import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Atom, Play, Cpu, Zap, TrendingUp, Shield, Activity, BarChart3,
  Layers, Network, Timer, CheckCircle2, AlertTriangle, DollarSign
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as quantumApi from "@/integrations/quantumApi";
import type { QuantumBackend, FraudDetectResult, RiskProfileResult, BondOptimizeResult } from "@/integrations/quantumApi";
import { useAuth } from "@/hooks/useAuth";

interface QuantumJob {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  backend: string;
  qubits: number;
  shots: number;
  createdAt: string;
  result?: quantumApi.QuantumRunResult;
}

const QuantumResearchLab = () => {
  const { user } = useAuth();
  const [backends, setBackends] = useState<QuantumBackend[]>([]);
  const [bestBackend, setBestBackend] = useState<string>("local_simulator");
  const [selectedBackend, setSelectedBackend] = useState('auto');
  const [qubits, setQubits] = useState([4]);
  const [shots, setShots] = useState([1024]);
  const [useZne, setUseZne] = useState(false);
  const [jobName, setJobName] = useState('QTC Price Optimization');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<QuantumJob[]>([]);

  // Finance tab state
  const [fraudFeatures, setFraudFeatures] = useState("120.5, 0.8, 3, 1200, 0.2, 45, 0, 1");
  const [fraudResult, setFraudResult] = useState<FraudDetectResult | null>(null);
  const [fraudLoading, setFraudLoading] = useState(false);

  const [riskPositions, setRiskPositions] = useState(
    '[{"symbol":"BTC","weight":0.4,"volatility":0.05},{"symbol":"ETH","weight":0.3,"volatility":0.04},{"symbol":"SOL","weight":0.3,"volatility":0.06}]'
  );
  const [riskResult, setRiskResult] = useState<RiskProfileResult | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  const [bondInput, setBondInput] = useState(
    '[{"name":"US Treasury 10Y","yield":0.045,"duration":8.5,"rating":"AAA"},{"name":"Apple Corp Bond","yield":0.052,"duration":5.2,"rating":"AA"},{"name":"HSBC Bond","yield":0.061,"duration":3.8,"rating":"A"}]'
  );
  const [bondResult, setBondResult] = useState<BondOptimizeResult | null>(null);
  const [bondLoading, setBondLoading] = useState(false);

  // Load backends from Render quantum agent (with Supabase fallback)
  useEffect(() => {
    const load = async () => {
      try {
        const data = await quantumApi.getBackends();
        setBackends(data.backends);
        setBestBackend(data.best_backend);
      } catch {
        // fallback: static list from paper benchmarks
        setBackends([
          { name: "local_simulator", family: "Statevector", qubits: 32, type: "simulator",
            layer_fidelity: 1.0, eplg: 0, t1_us: null, t2_us: null, clops: 100000,
            two_qubit_error: 0, recommended: false, available: true },
          { name: "ibm_torino", family: "Heron r2", qubits: 156, type: "real",
            layer_fidelity: 0.61, eplg: 6.2e-3, t1_us: 310, t2_us: 200, clops: 15000,
            two_qubit_error: 6.2e-3, recommended: true, available: false },
          { name: "ibm_sherbrooke", family: "Eagle r3", qubits: 127, type: "real",
            layer_fidelity: 0.26, eplg: 1.7e-2, t1_us: 262, t2_us: 176, clops: 5000,
            two_qubit_error: 7.6e-3, recommended: false, available: false },
        ]);
      }

      if (user) {
        const { data: jobData } = await supabase
          .from("quantum_jobs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        if (jobData) {
          setJobs(jobData.map((j: any) => ({
            id: j.id,
            name: j.name,
            status: j.status as QuantumJob['status'],
            backend: j.backend,
            qubits: j.qubits,
            shots: j.shots,
            createdAt: j.created_at,
            result: j.result as QuantumJob['result'] | undefined,
          })));
        }
      }
    };
    load();
  }, [user]);

  const submitQuantumJob = async () => {
    if (!user) { toast.error("Authentication required"); return; }
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.from("quantum_jobs").insert({
        user_id: user.id,
        name: jobName,
        status: 'queued',
        backend: selectedBackend,
        qubits: qubits[0],
        shots: shots[0],
      }).select().single();

      if (error) throw error;

      const newJob: QuantumJob = {
        id: data.id,
        name: data.name,
        status: 'queued',
        backend: data.backend,
        qubits: data.qubits,
        shots: data.shots,
        createdAt: data.created_at,
      };
      
      setJobs(prev => [newJob, ...prev]);
      toast.success(`Quantum job "${jobName}" submitted to ${selectedBackend}`);

      // Try Render quantum agent, then Supabase edge function, then local simulation
      const executeJob = async () => {
        let result: quantumApi.QuantumRunResult;
        try {
          result = await quantumApi.runCircuit({ circuit: "OPENQASM 2.0;", backend: selectedBackend, qubits: qubits[0], shots: shots[0], job_name: jobName });
        } catch {
          try {
            const { data: edgeResult } = await supabase.functions.invoke("quantum-compute", {
              body: { jobId: data.id, backend: selectedBackend, qubits: qubits[0], shots: shots[0], jobName },
            });
            result = edgeResult?.result ?? quantumApi.localSimulate(qubits[0], shots[0]);
          } catch {
            result = quantumApi.localSimulate(qubits[0], shots[0]);
          }
        }
        supabase.from("quantum_jobs")
          .update({ status: "completed", result: result as never, completed_at: new Date().toISOString() })
          .eq("id", data.id);
        setJobs(prev => prev.map(j => j.id === data.id ? { ...j, status: "completed", result } : j));
        toast.success(`Quantum job "${jobName}" completed!${result.simulated ? " (simulated)" : ""}`);
      };
      executeJob();
      
    } catch (error) {
      toast.error('Failed to submit quantum job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const runFraudDetect = async () => {
    setFraudLoading(true);
    try {
      const features = fraudFeatures.split(",").map(Number).filter(n => !isNaN(n));
      const result = await quantumApi.detectFraud({ features });
      setFraudResult(result);
      toast.success(`Fraud detection complete — ${result.is_fraud ? "🚨 FRAUD DETECTED" : "✅ Legitimate"}`);
    } catch (e: any) {
      toast.error(`Fraud detect failed: ${e.message}`);
    } finally {
      setFraudLoading(false);
    }
  };

  const runRiskProfile = async () => {
    setRiskLoading(true);
    try {
      const positions = JSON.parse(riskPositions);
      const result = await quantumApi.profileRisk({ positions });
      setRiskResult(result);
      toast.success(`Risk profile complete — VaR: $${result.var_usd.toLocaleString()}`);
    } catch (e: any) {
      toast.error(`Risk profile failed: ${e.message}`);
    } finally {
      setRiskLoading(false);
    }
  };

  const runBondOptimize = async () => {
    setBondLoading(true);
    try {
      const bonds = JSON.parse(bondInput);
      const result = await quantumApi.optimizeBonds({ bonds });
      setBondResult(result);
      toast.success(`Bond optimization complete — Yield: ${result.portfolio_yield.toFixed(2)}%`);
    } catch (e: any) {
      toast.error(`Bond optimize failed: ${e.message}`);
    } finally {
      setBondLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'running': return 'text-blue-500';
      case 'queued': return 'text-yellow-500';
      case 'failed': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Tabs defaultValue="submit" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="submit" className="flex items-center gap-2">
          <Play className="h-4 w-4" />
          Submit Job
        </TabsTrigger>
        <TabsTrigger value="backends" className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Backends
        </TabsTrigger>
        <TabsTrigger value="finance" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Finance
        </TabsTrigger>
        <TabsTrigger value="jobs" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Job History
        </TabsTrigger>
        <TabsTrigger value="qtc" className="flex items-center gap-2">
          <Atom className="h-4 w-4" />
          QTC Coin
        </TabsTrigger>
      </TabsList>

      <TabsContent value="submit">
        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Atom className="h-5 w-5 text-purple-500" />
                Quantum Circuit Configuration
              </CardTitle>
              <CardDescription>Configure and submit quantum computing jobs to IBM Quantum</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Job Name</Label>
                <Input 
                  value={jobName} 
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="Enter job name"
                />
              </div>

              <div className="space-y-2">
                <Label>Quantum Backend</Label>
                <Select value={selectedBackend} onValueChange={setSelectedBackend}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {backends.filter(b => b.status === 'online').map(backend => (
                      <SelectItem key={backend.name} value={backend.name}>
                        {backend.name} ({backend.qubits} qubits)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Number of Qubits</Label>
                  <span className="font-mono text-sm">{qubits[0]}</span>
                </div>
                <Slider 
                  value={qubits} 
                  onValueChange={setQubits}
                  max={12} 
                  min={2}
                  step={1} 
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Shots (Measurements)</Label>
                  <span className="font-mono text-sm">{shots[0].toLocaleString()}</span>
                </div>
                <Slider 
                  value={shots} 
                  onValueChange={setShots}
                  max={8192} 
                  min={256}
                  step={256} 
                />
              </div>

              <div className="space-y-2">
                <Label>Circuit Template</Label>
                <Select defaultValue="qaoa">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qaoa">QAOA (Portfolio Optimization)</SelectItem>
                    <SelectItem value="vqe">VQE (Time Crystal Stability)</SelectItem>
                    <SelectItem value="grover">Grover's (Arbitrage Search)</SelectItem>
                    <SelectItem value="qnn">QNN (Price Prediction)</SelectItem>
                    <SelectItem value="custom">Custom Circuit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                className="w-full" 
                size="lg" 
                onClick={submitQuantumJob}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Submit to IBM Quantum
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Results</CardTitle>
              <CardDescription>Latest quantum computation outputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobs.filter(j => j.status === 'completed').slice(0, 3).map(job => (
                <div key={job.id} className="p-4 rounded-lg border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{job.name}</span>
                    <Badge variant="outline" className="text-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                  {job.result && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Execution: {((job.result.elapsed_ms ?? 0) / 1000).toFixed(2)}s • {job.shots.toLocaleString()} shots
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(job.result.counts).slice(0, 4).map(([state, count]) => (
                          <div key={state} className="p-2 rounded bg-muted text-center">
                            <div className="font-mono text-xs">{state}</div>
                            <div className="text-sm font-bold">{count}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="backends">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-blue-500" />
              IBM Quantum Backends
            </CardTitle>
            <CardDescription>
              Quality metrics from AbuGhanem 2024 (arXiv:2410.00916). Best backend: <strong>{bestBackend}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {backends.map(backend => (
                <div key={backend.name} className={`p-4 rounded-lg border ${backend.recommended ? 'border-purple-500 bg-purple-500/5' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      <span className="font-medium">{backend.name}</span>
                      <Badge variant="outline">{backend.family}</Badge>
                      {backend.recommended && <Badge className="bg-purple-600">Recommended</Badge>}
                    </div>
                    <Badge variant={backend.type === 'real' ? 'default' : 'secondary'}>
                      {backend.type === 'real' ? 'Real QPU' : 'Simulator'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Qubits</div>
                      <div className="font-bold">{backend.qubits}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Layer Fidelity</div>
                      <div className={`font-bold ${backend.layer_fidelity > 0.5 ? 'text-green-500' : backend.layer_fidelity > 0.2 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                        {(backend.layer_fidelity * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">EPLG</div>
                      <div className="font-bold">{backend.eplg === 0 ? '—' : backend.eplg.toExponential(1)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">T1 (μs)</div>
                      <div className="font-bold">{backend.t1_us ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">T2 (μs)</div>
                      <div className="font-bold">{backend.t2_us ?? '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CLOPS</div>
                      <div className="font-bold">{backend.clops?.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress value={backend.layer_fidelity * 100} className="h-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="finance">
        <div className="space-y-6">
          {/* Fraud Detection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-500" />
                Quantum Fraud Detection
              </CardTitle>
              <CardDescription>
                Variational Quantum Classifier (VQC) — inspired by Intesa Sanpaolo / IBM production deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Transaction Features (comma-separated)</Label>
                <Input
                  value={fraudFeatures}
                  onChange={e => setFraudFeatures(e.target.value)}
                  placeholder="amount, frequency, merchant_risk, ..."
                />
                <p className="text-xs text-muted-foreground">Up to 8 numeric features: amount, velocity, merchant score, hour, country_risk, device_score, etc.</p>
              </div>
              <Button onClick={runFraudDetect} disabled={fraudLoading} className="w-full">
                {fraudLoading ? "Running VQC..." : "Run Quantum Fraud Classifier"}
              </Button>
              {fraudResult && (
                <div className={`p-4 rounded-lg border ${fraudResult.is_fraud ? 'border-red-500 bg-red-500/10' : 'border-green-500 bg-green-500/10'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {fraudResult.is_fraud
                      ? <AlertTriangle className="h-5 w-5 text-red-500" />
                      : <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    <span className="font-bold text-lg">
                      {fraudResult.is_fraud ? "FRAUD DETECTED" : "Legitimate Transaction"}
                    </span>
                    <Badge variant={fraudResult.is_fraud ? "destructive" : "default"}>
                      {(fraudResult.fraud_probability * 100).toFixed(1)}% fraud probability
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div><div className="text-muted-foreground">Confidence</div><div className="font-bold">{(fraudResult.confidence * 100).toFixed(1)}%</div></div>
                    <div><div className="text-muted-foreground">Threshold</div><div className="font-bold">{fraudResult.threshold}</div></div>
                    <div><div className="text-muted-foreground">Method</div><div className="font-bold">VQC</div></div>
                  </div>
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Feature Importances</div>
                    <div className="flex gap-1">
                      {fraudResult.feature_importances.map((imp, i) => (
                        <div key={i} className="flex-1 text-center">
                          <div className="bg-purple-500 rounded" style={{ height: `${Math.max(4, imp * 40)}px` }} />
                          <div className="text-xs mt-1">F{i+1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Profiling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-orange-500" />
                Quantum Risk Profiling (VaR)
              </CardTitle>
              <CardDescription>
                Quantum Amplitude Estimation — quadratic speedup over classical Monte Carlo for Value-at-Risk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Positions JSON (symbol, weight, volatility)</Label>
                <textarea
                  className="w-full h-24 p-2 text-xs font-mono rounded border bg-background resize-none"
                  value={riskPositions}
                  onChange={e => setRiskPositions(e.target.value)}
                />
              </div>
              <Button onClick={runRiskProfile} disabled={riskLoading} className="w-full">
                {riskLoading ? "Running QAE..." : "Run Quantum Risk Profile"}
              </Button>
              {riskResult && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg border">
                  <div className="text-center"><div className="text-muted-foreground text-xs">VaR (95%)</div><div className="font-bold text-orange-500">${riskResult.var_usd.toLocaleString()}</div><div className="text-xs">{riskResult.var_pct.toFixed(2)}%</div></div>
                  <div className="text-center"><div className="text-muted-foreground text-xs">CVaR (Expected Shortfall)</div><div className="font-bold text-red-500">${riskResult.cvar_usd.toLocaleString()}</div><div className="text-xs">{riskResult.cvar_pct.toFixed(2)}%</div></div>
                  <div className="text-center"><div className="text-muted-foreground text-xs">Portfolio Vol</div><div className="font-bold">{riskResult.portfolio_volatility.toFixed(2)}%</div></div>
                  <div className="text-center"><div className="text-muted-foreground text-xs">Quantum Speedup</div><div className="font-bold text-purple-500">{riskResult.quantum_speedup.speedup_factor}x</div><div className="text-xs">{riskResult.quantum_speedup.quantum_samples} vs {riskResult.quantum_speedup.classical_samples} samples</div></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bond Optimization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Quantum Bond Portfolio Optimizer
              </CardTitle>
              <CardDescription>
                QAOA with yield/duration constraints — inspired by HSBC quantum bond trading (IBM 2024)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Bonds JSON (name, yield, duration, rating)</Label>
                <textarea
                  className="w-full h-24 p-2 text-xs font-mono rounded border bg-background resize-none"
                  value={bondInput}
                  onChange={e => setBondInput(e.target.value)}
                />
              </div>
              <Button onClick={runBondOptimize} disabled={bondLoading} className="w-full">
                {bondLoading ? "Running QAOA..." : "Run Quantum Bond Optimizer"}
              </Button>
              {bondResult && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4 p-3 rounded-lg border text-center">
                    <div><div className="text-muted-foreground text-xs">Portfolio Yield</div><div className="font-bold text-green-500">{bondResult.portfolio_yield.toFixed(3)}%</div></div>
                    <div><div className="text-muted-foreground text-xs">Duration</div><div className={`font-bold ${bondResult.duration_gap < 0.5 ? 'text-green-500' : 'text-orange-500'}`}>{bondResult.portfolio_duration.toFixed(1)}y</div></div>
                    <div><div className="text-muted-foreground text-xs">Yield Floor</div><div className={`font-bold ${bondResult.yield_floor_met ? 'text-green-500' : 'text-red-500'}`}>{bondResult.yield_floor_met ? '✓ Met' : '✗ Not met'}</div></div>
                  </div>
                  <div className="space-y-2">
                    {bondResult.bonds.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
                        <span className="font-medium">{b.name}</span>
                        <div className="flex gap-4 text-muted-foreground">
                          <span>{b.rating}</span>
                          <span>{(b.yield * 100).toFixed(2)}%</span>
                          <span>{b.duration}y</span>
                        </div>
                        <Badge variant="outline">{(b.weight * 100).toFixed(1)}%</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="jobs">
        <Card>
          <CardHeader>
            <CardTitle>Job History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className={`h-2 w-2 rounded-full ${
                      job.status === 'completed' ? 'bg-green-500' :
                      job.status === 'running' ? 'bg-blue-500 animate-pulse' :
                      job.status === 'queued' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="font-medium">{job.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {job.backend} • {job.qubits} qubits • {job.shots} shots
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(job.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="qtc">
        <div className="grid grid-cols-3 gap-6">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Atom className="h-5 w-5 text-purple-500" />
                Quantum Time Crystal (QTC) Coin
              </CardTitle>
              <CardDescription>
                A novel cryptocurrency leveraging quantum time crystal stability properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 border">
                <div className="grid grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-500">QTC</div>
                    <div className="text-sm text-muted-foreground">Token Symbol</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">∞</div>
                    <div className="text-sm text-muted-foreground">Time Stability</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-500">127</div>
                    <div className="text-sm text-muted-foreground">Qubit Backing</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-500">Q²</div>
                    <div className="text-sm text-muted-foreground">Quantum Security</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Core Features</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Post-Quantum Cryptography</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Kyber-K2SO lattice-based encryption resistant to quantum attacks
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="h-4 w-4 text-green-500" />
                      <span className="font-medium">Time Crystal Consensus</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Novel consensus mechanism based on discrete time crystal oscillations
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Network className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">Quantum Entanglement Ledger</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Distributed ledger secured via quantum entanglement verification
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">QAOA Trading Optimization</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Quantum approximate optimization for portfolio balancing
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>QTC Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">Estimated Launch</div>
                <div className="text-2xl font-bold">Q3 2026</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">Total Supply</div>
                <div className="text-2xl font-bold">21M QTC</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">Quantum Proof Level</div>
                <div className="text-2xl font-bold text-green-500">NIST L5</div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">Research Status</div>
                <div className="text-lg font-bold">Active Development</div>
                <Progress value={67} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default QuantumResearchLab;
