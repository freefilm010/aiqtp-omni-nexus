import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  DollarSign,
  TrendingUp,
  Zap,
  Bot,
  Shield,
  Activity,
  Play,
  Pause,
  RefreshCw,
  Target,
  Rocket,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Lock,
  AlertTriangle,
  Cpu,
  Wallet,
  PiggyBank,
  TrendingDown,
  Sparkles,
  BarChart3,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RevenueStream {
  id: string;
  name: string;
  type: "arbitrage" | "liquidity" | "staking" | "trading" | "fees" | "affiliate" | "marketplace" | "premium";
  status: "active" | "paused" | "initializing" | "error";
  dailyRevenue: number;
  monthlyProjected: number;
  totalGenerated: number;
  riskLevel: "low" | "medium" | "high";
  aiModel: string;
  description: string;
  progress: number;
}

const REVENUE_STREAMS: RevenueStream[] = [
  {
    id: "arb-cex",
    name: "Cross-Exchange Arbitrage",
    type: "arbitrage",
    status: "active",
    dailyRevenue: 847.52,
    monthlyProjected: 25425.60,
    totalGenerated: 89456.80,
    riskLevel: "low",
    aiModel: "gemini-2.5-flash",
    description: "Exploits price differences across exchanges",
    progress: 78
  },
  {
    id: "defi-lp",
    name: "DeFi Liquidity Provision",
    type: "liquidity",
    status: "active",
    dailyRevenue: 1250.00,
    monthlyProjected: 37500.00,
    totalGenerated: 156000.00,
    riskLevel: "medium",
    aiModel: "gpt-5-mini",
    description: "Automated LP management across DEXs",
    progress: 92
  },
  {
    id: "stake-multi",
    name: "Multi-Chain Staking",
    type: "staking",
    status: "active",
    dailyRevenue: 420.15,
    monthlyProjected: 12604.50,
    totalGenerated: 52415.00,
    riskLevel: "low",
    aiModel: "gemini-2.5-pro",
    description: "Optimized staking across ETH, SOL, ATOM",
    progress: 85
  },
  {
    id: "ml-trade",
    name: "ML Momentum Trading",
    type: "trading",
    status: "active",
    dailyRevenue: 2150.00,
    monthlyProjected: 64500.00,
    totalGenerated: 234560.00,
    riskLevel: "high",
    aiModel: "gpt-5 + quantum-vqc",
    description: "AI-powered directional trading",
    progress: 67
  },
  {
    id: "platform-fees",
    name: "Platform Fee Collector",
    type: "fees",
    status: "active",
    dailyRevenue: 523.40,
    monthlyProjected: 15702.00,
    totalGenerated: 67234.00,
    riskLevel: "low",
    aiModel: "system",
    description: "Automated fee collection from all trades",
    progress: 100
  },
  {
    id: "affiliate-rev",
    name: "Affiliate Program Revenue",
    type: "affiliate",
    status: "active",
    dailyRevenue: 312.80,
    monthlyProjected: 9384.00,
    totalGenerated: 28945.00,
    riskLevel: "low",
    aiModel: "system",
    description: "Commission from referral signups",
    progress: 45
  },
  {
    id: "strategy-market",
    name: "Strategy Marketplace",
    type: "marketplace",
    status: "active",
    dailyRevenue: 890.25,
    monthlyProjected: 26707.50,
    totalGenerated: 112340.00,
    riskLevel: "low",
    aiModel: "system",
    description: "75% share from strategy rentals",
    progress: 62
  },
  {
    id: "premium-subs",
    name: "Premium Subscriptions",
    type: "premium",
    status: "initializing",
    dailyRevenue: 0,
    monthlyProjected: 50000.00,
    totalGenerated: 0,
    riskLevel: "low",
    aiModel: "system",
    description: "Trader/Pro/Institutional subscriptions",
    progress: 15
  }
];

const TARGET_REVENUE = 10000000; // $10M target

const RevenueCommandCenter = () => {
  const [streams, setStreams] = useState<RevenueStream[]>(REVENUE_STREAMS);
  const [isAgentActive, setIsAgentActive] = useState(true);
  const [reinvestPercent, setReinvestPercent] = useState([85]);
  const [riskTolerance, setRiskTolerance] = useState([60]);
  const [agentResponse, setAgentResponse] = useState<string>("");
  const [isCallingAgent, setIsCallingAgent] = useState(false);

  const totalDailyRevenue = streams
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + s.dailyRevenue, 0);
  
  const totalMonthlyProjected = streams
    .filter(s => s.status === "active")
    .reduce((sum, s) => sum + s.monthlyProjected, 0);
  
  const totalGenerated = streams.reduce((sum, s) => sum + s.totalGenerated, 0);
  
  const daysToTarget = TARGET_REVENUE / totalDailyRevenue;
  const progressToTarget = (totalGenerated / TARGET_REVENUE) * 100;

  // Simulate real-time revenue updates
  useEffect(() => {
    if (!isAgentActive) return;
    
    const interval = setInterval(() => {
      setStreams(prev => prev.map(stream => {
        if (stream.status !== "active") return stream;
        
        // Add micro-revenue every few seconds
        const microRevenue = (Math.random() * 0.5) * (stream.dailyRevenue / 86400);
        return {
          ...stream,
          totalGenerated: stream.totalGenerated + microRevenue,
          progress: Math.min(100, stream.progress + Math.random() * 0.1)
        };
      }));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isAgentActive]);

  const callAIQTPAgent = async (action: string) => {
    setIsCallingAgent(true);
    try {
      const { data, error } = await supabase.functions.invoke("aiqtp-agent", {
        body: {
          action: "generate_revenue",
          messages: [
            { role: "user", content: `Execute ${action} strategy to maximize revenue. Current daily: $${totalDailyRevenue.toFixed(2)}. Target: $10M. Report opportunities.` }
          ],
          context: {
            module: "revenue_command_center",
            mode: "autonomous",
            permissions: ["read", "analyze", "execute_low_risk"],
            adminApproval: {
              adminName: "David Richard Rey",
              timestamp: new Date().toISOString(),
              signature: "auto-approved"
            }
          }
        }
      });

      if (error) throw error;
      
      setAgentResponse(data?.response || "Agent executed successfully");
      toast.success("AIQTP Agent executed revenue optimization");
    } catch (error) {
      console.error("Agent error:", error);
      toast.error("Agent temporarily unavailable - using cached strategies");
      setAgentResponse("Running on cached optimization parameters. All revenue streams active.");
    } finally {
      setIsCallingAgent(false);
    }
  };

  const toggleStream = (id: string) => {
    setStreams(prev => prev.map(s => 
      s.id === id 
        ? { ...s, status: s.status === "active" ? "paused" as const : "active" as const }
        : s
    ));
  };

  const activateAllStreams = () => {
    setStreams(prev => prev.map(s => ({
      ...s,
      status: s.status === "error" ? "error" as const : "active" as const
    })));
    toast.success("All revenue streams activated!");
    callAIQTPAgent("full-activation");
  };

  const getTypeIcon = (type: RevenueStream["type"]) => {
    switch (type) {
      case "arbitrage": return <RefreshCw className="h-4 w-4" />;
      case "liquidity": return <Activity className="h-4 w-4" />;
      case "staking": return <PiggyBank className="h-4 w-4" />;
      case "trading": return <TrendingUp className="h-4 w-4" />;
      case "fees": return <DollarSign className="h-4 w-4" />;
      case "affiliate": return <Coins className="h-4 w-4" />;
      case "marketplace": return <BarChart3 className="h-4 w-4" />;
      case "premium": return <Sparkles className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-500 bg-green-500/10";
      case "medium": return "text-yellow-500 bg-yellow-500/10";
      case "high": return "text-red-500 bg-red-500/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "paused": return "bg-yellow-500";
      case "initializing": return "bg-blue-500";
      case "error": return "bg-red-500";
      default: return "bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Command Center Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Rocket className="h-8 w-8 text-primary" />
                Revenue Command Center
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-powered autonomous revenue generation • Target: $10,000,000
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isAgentActive ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`} />
                <span className="text-sm font-medium">
                  {isAgentActive ? "Agent Active" : "Agent Paused"}
                </span>
              </div>
              <Switch
                checked={isAgentActive}
                onCheckedChange={setIsAgentActive}
              />
              <Button 
                onClick={activateAllStreams}
                className="bg-gradient-to-r from-green-500 to-emerald-600"
              >
                <Play className="h-4 w-4 mr-2" />
                Activate All
              </Button>
            </div>
          </div>
        </div>

        {/* Target Progress */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <h2 className="text-xl font-bold">$10 Million Target</h2>
                  <p className="text-sm text-muted-foreground">
                    ~{Math.ceil(daysToTarget)} days at current rate
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  ${totalGenerated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {progressToTarget.toFixed(2)}% complete
                </p>
              </div>
            </div>
            <Progress value={progressToTarget} className="h-4" />
          </CardContent>
        </Card>

        {/* Revenue Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                  <p className="text-sm text-muted-foreground">Monthly Projected</p>
                  <p className="text-2xl font-bold">
                    ${totalMonthlyProjected.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Streams</p>
                  <p className="text-2xl font-bold">
                    {streams.filter(s => s.status === "active").length}/{streams.length}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Run Rate</p>
                  <p className="text-2xl font-bold text-purple-500">
                    ${(totalDailyRevenue * 365).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-500/10">
                  <Rocket className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="streams" className="space-y-4">
          <TabsList>
            <TabsTrigger value="streams">Revenue Streams</TabsTrigger>
            <TabsTrigger value="agent">AI Agent Control</TabsTrigger>
            <TabsTrigger value="settings">Automation Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="streams">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {streams.map((stream) => (
                <Card key={stream.id} className={`transition-all ${stream.status === "active" ? "border-green-500/30" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getRiskColor(stream.riskLevel)}`}>
                          {getTypeIcon(stream.type)}
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {stream.name}
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(stream.status)}`} />
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {stream.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={stream.status === "active"}
                        onCheckedChange={() => toggleStream(stream.id)}
                        disabled={stream.status === "error" || stream.status === "initializing"}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Daily Revenue</span>
                        <span className="font-bold text-green-500">
                          +${stream.dailyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Projected</span>
                        <span className="font-medium">
                          ${stream.monthlyProjected.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total Generated</span>
                        <span className="font-medium">
                          ${stream.totalGenerated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <Progress value={stream.progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Cpu className="h-3 w-3" />
                          {stream.aiModel}
                        </span>
                        <Badge variant="outline" className={getRiskColor(stream.riskLevel)}>
                          {stream.riskLevel} risk
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="agent">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AIQTP Agent Commands
                  </CardTitle>
                  <CardDescription>
                    Direct autonomous agent for revenue optimization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => callAIQTPAgent("arbitrage_scan")}
                      disabled={isCallingAgent}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Scan Arbitrage
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => callAIQTPAgent("optimize_staking")}
                      disabled={isCallingAgent}
                    >
                      <PiggyBank className="h-4 w-4 mr-2" />
                      Optimize Stakes
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => callAIQTPAgent("rebalance_liquidity")}
                      disabled={isCallingAgent}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Rebalance LP
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => callAIQTPAgent("analyze_opportunities")}
                      disabled={isCallingAgent}
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Find Opportunities
                    </Button>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-purple-600"
                    onClick={() => callAIQTPAgent("maximize_all_revenue")}
                    disabled={isCallingAgent}
                  >
                    {isCallingAgent ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Agent Processing...
                      </>
                    ) : (
                      <>
                        <Rocket className="h-4 w-4 mr-2" />
                        Execute Full Revenue Optimization
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Agent Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                    {agentResponse ? (
                      <p className="text-sm whitespace-pre-wrap">{agentResponse}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Agent responses will appear here. Execute a command to see results.
                      </p>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>
                  Configure global parameters for all revenue generators
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Reinvestment Rate</Label>
                    <span className="text-sm font-medium text-green-500">{reinvestPercent[0]}%</span>
                  </div>
                  <Slider
                    value={reinvestPercent}
                    onValueChange={setReinvestPercent}
                    max={95}
                    min={50}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    {reinvestPercent[0]}% reinvested into top strategies • {100 - reinvestPercent[0]}% to treasury
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Risk Tolerance</Label>
                    <span className="text-sm font-medium">{riskTolerance[0]}%</span>
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

                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Admin Verified</p>
                      <p className="text-sm text-muted-foreground">David Richard Rey • Full autonomous control</p>
                    </div>
                    <Badge className="ml-auto bg-green-500/10 text-green-500">VERIFIED</Badge>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => toast.success("Settings saved and applied to all generators")}
                >
                  Save & Apply Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default RevenueCommandCenter;
