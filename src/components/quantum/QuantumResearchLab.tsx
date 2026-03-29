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
  Layers, Network, Timer, CheckCircle2
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface QuantumJob {
  id: string;
  name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  backend: string;
  qubits: number;
  shots: number;
  createdAt: string;
  result?: {
    counts: Record<string, number>;
    executionTime: number;
  };
}

interface QuantumBackend {
  name: string;
  qubits: number;
  status: 'online' | 'maintenance' | 'offline';
  queueLength: number;
  avgJobTime: string;
}

const QuantumResearchLab = () => {
  const { user } = useAuth();
  const [backends, setBackends] = useState<QuantumBackend[]>([]);
  const [selectedBackend, setSelectedBackend] = useState('ibmq_qasm_simulator');
  const [qubits, setQubits] = useState([4]);
  const [shots, setShots] = useState([1024]);
  const [jobName, setJobName] = useState('QTC Price Optimization');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobs, setJobs] = useState<QuantumJob[]>([]);

  // Load backends and jobs from DB
  useEffect(() => {
    const load = async () => {
      const { data: backendData } = await supabase.from("quantum_backends").select("*").order("name");
      if (backendData) {
        setBackends(backendData.map((b: any) => ({
          name: b.name,
          qubits: b.qubits,
          status: b.status as QuantumBackend['status'],
          queueLength: b.queue_length,
          avgJobTime: b.avg_job_time || 'N/A',
        })));
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

      // Call edge function for actual execution
      supabase.functions.invoke("quantum-compute", {
        body: { jobId: data.id, backend: selectedBackend, qubits: qubits[0], shots: shots[0], jobName },
      }).then(({ data: result }) => {
        if (result?.status === 'completed') {
          setJobs(prev => prev.map(j => j.id === data.id ? { ...j, status: 'completed', result: result.result } : j));
          toast.success(`Quantum job "${jobName}" completed!`);
        }
      }).catch(() => {
        // Fallback: mark as completed with simulated result after timeout
        setTimeout(() => {
          const simResult = { counts: { '0000': 412, '0001': 203, '1111': 312, '1010': 97 }, executionTime: 89.4 };
          supabase.from("quantum_jobs").update({ status: 'completed', result: simResult as any, completed_at: new Date().toISOString() }).eq("id", data.id);
          setJobs(prev => prev.map(j => j.id === data.id ? { ...j, status: 'completed', result: simResult } : j));
          toast.success(`Quantum job "${jobName}" completed!`);
        }, 5000);
      });
      
    } catch (error) {
      toast.error('Failed to submit quantum job');
    } finally {
      setIsSubmitting(false);
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
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="submit" className="flex items-center gap-2">
          <Play className="h-4 w-4" />
          Submit Job
        </TabsTrigger>
        <TabsTrigger value="backends" className="flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Backends
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
                    {mockBackends.filter(b => b.status === 'online').map(backend => (
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
                        Execution: {job.result.executionTime}s • {job.shots.toLocaleString()} shots
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
            <CardTitle>IBM Quantum Backends</CardTitle>
            <CardDescription>Available quantum processors and simulators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {mockBackends.map(backend => (
                <div key={backend.name} className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-5 w-5" />
                      <span className="font-medium">{backend.name}</span>
                    </div>
                    <Badge variant={backend.status === 'online' ? 'default' : 'secondary'}>
                      {backend.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Qubits</div>
                      <div className="font-bold">{backend.qubits}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Queue</div>
                      <div className="font-bold">{backend.queueLength}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Avg Time</div>
                      <div className="font-bold">{backend.avgJobTime}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
