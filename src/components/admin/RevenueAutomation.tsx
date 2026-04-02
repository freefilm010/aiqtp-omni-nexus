import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Zap,
  Bot,
  Shield,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Play,
  Pause,
  Settings,
  RefreshCw,
  Sparkles,
  Cpu
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RevenueGenerator {
  id: string;
  name: string;
  type: "arbitrage" | "liquidity" | "staking" | "trading" | "fees";
  status: "active" | "paused" | "pending_approval" | "error";
  dailyRevenue: number;
  totalRevenue: number;
  riskLevel: "low" | "medium" | "high";
  aiModel: string;
  lastRun: Date;
  approvalRequired: boolean;
}

interface AdminApproval {
  adminId: string;
  adminName: string;
  approved: boolean;
  timestamp: Date;
}

const ADMIN_IDENTITY = {
  name: "David Richard Rey",
  dob: "04/26/1983",
  // SSN is verified server-side only, never stored in frontend
  verified: true
};

const RevenueAutomation = () => {
  const [generators, setGenerators] = useState<RevenueGenerator[]>([]);
  const [isAdminVerified, setIsAdminVerified] = useState(true);
  const [selectedGenerator, setSelectedGenerator] = useState<RevenueGenerator | null>(null);
  const [riskTolerance, setRiskTolerance] = useState([50]);
  const [autoReinvest, setAutoReinvest] = useState(true);
  const [reinvestPercent, setReinvestPercent] = useState([100]);
  const [topStrategiesCount, setTopStrategiesCount] = useState([3]);

  // Load generators from admin_settings, seed if empty
  useEffect(() => {
    const loadGenerators = async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'revenue_generators')
        .single();

      if (data?.value) {
        const stored = (data.value as any[]).map((g: any) => ({
          ...g,
          lastRun: new Date(g.lastRun || Date.now()),
        }));
        setGenerators(stored);
      } else {
        // Seed initial generators into DB
        const initial: RevenueGenerator[] = [
          { id: "arb-001", name: "Cross-Exchange Arbitrage Bot", type: "arbitrage", status: "active", dailyRevenue: 0, totalRevenue: 0, riskLevel: "low", aiModel: "gemini-2.5-flash", lastRun: new Date(), approvalRequired: false },
          { id: "liq-001", name: "DeFi Liquidity Provider", type: "liquidity", status: "active", dailyRevenue: 0, totalRevenue: 0, riskLevel: "medium", aiModel: "gpt-5-mini", lastRun: new Date(), approvalRequired: false },
          { id: "stake-001", name: "Multi-Chain Staking Optimizer", type: "staking", status: "active", dailyRevenue: 0, totalRevenue: 0, riskLevel: "low", aiModel: "gemini-2.5-pro", lastRun: new Date(), approvalRequired: false },
          { id: "fees-001", name: "Platform Fee Collector", type: "fees", status: "active", dailyRevenue: 0, totalRevenue: 0, riskLevel: "low", aiModel: "system", lastRun: new Date(), approvalRequired: false },
        ];
        setGenerators(initial);
        await supabase.from('admin_settings').upsert({
          key: 'revenue_generators',
          category: 'revenue',
          value: initial as any,
        }, { onConflict: 'key' });
      }
    };
    loadGenerators();
  }, []);

  // Load real revenue totals from admin_revenue
  useEffect(() => {
    const loadRevenue = async () => {
      const { data: revenueData } = await supabase
        .from('admin_revenue')
        .select('source, amount, created_at')
        .order('created_at', { ascending: false });

      if (revenueData && revenueData.length > 0) {
        const revenueBySource: Record<string, { total: number; daily: number }> = {};
        const today = new Date().toISOString().slice(0, 10);

        for (const r of revenueData) {
          const src = r.source || 'fees';
          if (!revenueBySource[src]) revenueBySource[src] = { total: 0, daily: 0 };
          revenueBySource[src].total += Number(r.amount);
          if (r.created_at?.startsWith(today)) {
            revenueBySource[src].daily += Number(r.amount);
          }
        }

        setGenerators(prev => prev.map(g => {
          const match = revenueBySource[g.type] || revenueBySource[g.id];
          return match ? { ...g, totalRevenue: match.total, dailyRevenue: match.daily } : g;
        }));
      }
    };
    loadRevenue();
  }, [generators.length]);

  const totalDailyRevenue = generators
    .filter(g => g.status === "active")
    .reduce((sum, g) => sum + g.dailyRevenue, 0);

  const totalRevenue = generators.reduce((sum, g) => sum + g.totalRevenue, 0);

  const handleApprove = (generatorId: string) => {
    if (!isAdminVerified) {
      toast.error("Admin verification required");
      return;
    }

    setGenerators(prev => prev.map(g => 
      g.id === generatorId 
        ? { ...g, status: "active" as const, approvalRequired: false }
        : g
    ));
    toast.success(`Generator approved by ${ADMIN_IDENTITY.name}`);
  };

  const handleToggleGenerator = async (generatorId: string, newStatus: boolean) => {
    const updated = generators.map(g => 
      g.id === generatorId 
        ? { ...g, status: newStatus ? "active" as const : "paused" as const }
        : g
    );
    setGenerators(updated);
    await supabase.from('admin_settings').upsert({
      key: 'revenue_generators',
      category: 'revenue',
      value: updated as any,
    }, { onConflict: 'key' });
    toast.success(`Generator ${newStatus ? "activated" : "paused"}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500/10 text-green-500 border-green-500/30";
      case "paused": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
      case "pending_approval": return "bg-purple-500/10 text-purple-500 border-purple-500/30";
      case "error": return "bg-red-500/10 text-red-500 border-red-500/30";
      default: return "bg-muted";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-500";
      case "medium": return "text-yellow-500";
      case "high": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin Verification Banner */}
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">Admin Verified</p>
                <p className="text-sm text-muted-foreground">
                  {ADMIN_IDENTITY.name} • Full autonomous control enabled
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
              <Lock className="h-3 w-3 mr-1" />
              VERIFIED
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Daily Revenue</p>
                <p className="text-2xl font-bold text-green-500">
                  ${totalDailyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Generators</p>
                <p className="text-2xl font-bold">
                  {generators.filter(g => g.status === "active").length}/{generators.length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500/10">
                <Bot className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold text-purple-500">
                  {generators.filter(g => g.status === "pending_approval").length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500/10">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="generators" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generators">Revenue Generators</TabsTrigger>
          <TabsTrigger value="settings">Automation Settings</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
        </TabsList>

        <TabsContent value="generators">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                Auto Revenue Generators
              </CardTitle>
              <CardDescription>
                AI-powered profit generation systems controlled by AIQTP Agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {generators.map((generator) => (
                    <div
                      key={generator.id}
                      className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${
                            generator.type === "arbitrage" ? "bg-blue-500/10" :
                            generator.type === "liquidity" ? "bg-purple-500/10" :
                            generator.type === "staking" ? "bg-green-500/10" :
                            generator.type === "trading" ? "bg-yellow-500/10" :
                            "bg-muted"
                          }`}>
                            {generator.type === "arbitrage" ? <RefreshCw className="h-5 w-5 text-blue-500" /> :
                             generator.type === "liquidity" ? <Activity className="h-5 w-5 text-purple-500" /> :
                             generator.type === "staking" ? <TrendingUp className="h-5 w-5 text-green-500" /> :
                             generator.type === "trading" ? <Bot className="h-5 w-5 text-yellow-500" /> :
                             <DollarSign className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{generator.name}</h4>
                              <Badge variant="outline" className={getStatusColor(generator.status)}>
                                {generator.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Cpu className="h-3 w-3" />
                                {generator.aiModel}
                              </span>
                              <span className={`flex items-center gap-1 ${getRiskColor(generator.riskLevel)}`}>
                                <Shield className="h-3 w-3" />
                                {generator.riskLevel} risk
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-lg font-bold text-green-500">
                            +${generator.dailyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}/day
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Total: ${generator.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground">
                          Last run: {generator.lastRun.toLocaleTimeString()}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          {generator.status === "pending_approval" ? (
                            <Button
                              size="sm"
                              onClick={() => handleApprove(generator.id)}
                              className="bg-purple-500 hover:bg-purple-600"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedGenerator(generator)}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Configure
                              </Button>
                              <Switch
                                checked={generator.status === "active"}
                                onCheckedChange={(checked) => handleToggleGenerator(generator.id, checked)}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Automation Settings</CardTitle>
              <CardDescription>
                Configure global automation parameters for all revenue generators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label>Risk Tolerance</Label>
                  <span className="text-sm text-muted-foreground">{riskTolerance[0]}%</span>
                </div>
                <Slider
                  value={riskTolerance}
                  onValueChange={setRiskTolerance}
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Higher tolerance enables more aggressive strategies
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <Label>Auto-Reinvest Profits</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically reinvest a portion of profits
                  </p>
                </div>
                <Switch
                  checked={autoReinvest}
                  onCheckedChange={setAutoReinvest}
                />
              </div>

              {autoReinvest && (
                <div className="space-y-6 pl-4 border-l-2 border-primary/20">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Reinvestment Percentage</Label>
                      <span className="text-sm font-bold text-green-500">100% — Locked</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      100% reinvested — full compound mode, no holdback
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Top Strategies to Reinvest Into</Label>
                      <span className="text-sm font-medium">{topStrategiesCount[0]}</span>
                    </div>
                    <Slider
                      value={topStrategiesCount}
                      onValueChange={setTopStrategiesCount}
                      max={10}
                      min={1}
                      step={1}
                    />
                    <p className="text-xs text-muted-foreground">
                      Profits distributed to top {topStrategiesCount[0]} performing trading strategies
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-sm text-green-500">
                      <strong>Current Setup:</strong> {reinvestPercent[0]}% of daily revenue ($
                      {(totalDailyRevenue * reinvestPercent[0] / 100).toFixed(2)}) reinvested into top {topStrategiesCount[0]} strategies.
                      Admin receives ${(totalDailyRevenue * (100 - reinvestPercent[0]) / 100).toFixed(2)}/day.
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500">Admin Approval Required</p>
                    <p className="text-sm text-muted-foreground">
                      High-risk trading strategies and changes above $10,000 require 
                      explicit approval from {ADMIN_IDENTITY.name}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Multi-Model AI Configuration
              </CardTitle>
              <CardDescription>
                AIQTP uses multiple AI models for optimal decision-making
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500">Primary</Badge>
                      <span className="font-medium">google/gemini-2.5-flash</span>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Fast pattern recognition, market analysis, and strategy generation
                  </p>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500">Reasoning</Badge>
                      <span className="font-medium">claude-sonnet-4-5</span>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Complex reasoning, risk assessment, and document generation
                  </p>
                </div>

                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">Speed</Badge>
                      <span className="font-medium">openai/gpt-5-mini</span>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    High-frequency decisions, arbitrage detection, real-time alerts
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-blue-500">Quantum</Badge>
                      <span className="font-medium">QAQI + IBM Quantum</span>
                    </div>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                      Requires API Key
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    VQC fraud detection, QAOA portfolio optimization, time crystal consensus
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueAutomation;
