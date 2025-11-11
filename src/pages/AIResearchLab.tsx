import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, Target, Zap, Loader2, Sparkles } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const AIResearchLab = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFactorType, setSelectedFactorType] = useState("technical");
  const [userGoals, setUserGoals] = useState("");
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);

  // Fetch factors
  const { data: factors, isLoading: factorsLoading } = useQuery({
    queryKey: ['ai-factors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_factors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch strategies
  const { data: strategies, isLoading: strategiesLoading } = useQuery({
    queryKey: ['ai-strategies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_strategies')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Generate factors mutation
  const generateFactorsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-factors', {
        body: {
          marketData: {
            context: 'Current market analysis',
            timeframe: '1d',
            assets: ['BTC', 'ETH', 'SPY']
          },
          factorType: selectedFactorType
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-factors'] });
      toast({
        title: "Factors Generated",
        description: `Successfully generated ${data.factors?.length || 0} new factors`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate factors",
        variant: "destructive",
      });
    }
  });

  // Generate strategy mutation
  const generateStrategyMutation = useMutation({
    mutationFn: async () => {
      if (selectedFactors.length === 0) {
        throw new Error('Please select at least one factor');
      }

      const { data, error } = await supabase.functions.invoke('generate-strategy', {
        body: {
          factorIds: selectedFactors,
          userGoals: userGoals || 'Balanced risk-return profile'
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-strategies'] });
      toast({
        title: "Strategy Generated",
        description: `Created strategy: ${data.strategy?.name}`,
      });
      setSelectedFactors([]);
      setUserGoals("");
    },
    onError: (error: any) => {
      toast({
        title: "Strategy Creation Failed",
        description: error.message || "Failed to generate strategy",
        variant: "destructive",
      });
    }
  });

  const toggleFactorSelection = (factorId: string) => {
    setSelectedFactors(prev =>
      prev.includes(factorId)
        ? prev.filter(id => id !== factorId)
        : [...prev, factorId]
    );
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-muted',
      backtesting: 'bg-primary/20 text-primary',
      paper_trading: 'bg-accent/20 text-accent-foreground',
      live: 'bg-primary',
      archived: 'bg-muted'
    };
    return colors[status as keyof typeof colors] || 'bg-muted';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                AIQTP RD-Agent
              </h1>
              <p className="text-muted-foreground mt-2">
                AI-Powered Quantitative Trading Research & Development
              </p>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline">
              Back to Dashboard
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{factors?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Generated</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{strategies?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Best Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Coming soon</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-accent" />
                  AI Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="factors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="factors">Factor Generation</TabsTrigger>
              <TabsTrigger value="strategies">Strategy Builder</TabsTrigger>
            </TabsList>

            {/* Factors Tab */}
            <TabsContent value="factors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Generate AI Trading Factors</CardTitle>
                  <CardDescription>
                    Use AIQTP RD-Agent to discover novel trading factors
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Factor Type</label>
                    <Select value={selectedFactorType} onValueChange={setSelectedFactorType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="fundamental">Fundamental</SelectItem>
                        <SelectItem value="sentiment">Sentiment</SelectItem>
                        <SelectItem value="alternative">Alternative Data</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={() => generateFactorsMutation.mutate()}
                    disabled={generateFactorsMutation.isPending}
                    className="w-full"
                  >
                    {generateFactorsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Factors
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Factors List */}
              <div className="grid gap-4">
                {factorsLoading ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Loading factors...
                    </CardContent>
                  </Card>
                ) : factors && factors.length > 0 ? (
                  factors.map((factor: any) => (
                    <Card
                      key={factor.id}
                      className={`cursor-pointer transition-all ${
                        selectedFactors.includes(factor.id)
                          ? 'border-primary ring-2 ring-primary'
                          : ''
                      }`}
                      onClick={() => toggleFactorSelection(factor.id)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{factor.name}</CardTitle>
                            <CardDescription>{factor.description}</CardDescription>
                          </div>
                          <Badge variant="secondary">{factor.factor_type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                          {factor.code.substring(0, 200)}...
                        </pre>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No factors yet. Generate your first AI factor above.
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Strategies Tab */}
            <TabsContent value="strategies" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Build AI Trading Strategy</CardTitle>
                  <CardDescription>
                    Combine factors into a complete trading strategy
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Selected Factors</label>
                    <div className="flex flex-wrap gap-2">
                      {selectedFactors.length > 0 ? (
                        selectedFactors.map(id => {
                          const factor = factors?.find((f: any) => f.id === id);
                          return (
                            <Badge key={id} variant="secondary">
                              {factor?.name}
                            </Badge>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Select factors from the Factor Generation tab
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Goals (Optional)</label>
                    <Textarea
                      placeholder="E.g., 'Focus on low volatility with consistent returns' or 'Aggressive growth with 15% max drawdown'"
                      value={userGoals}
                      onChange={(e) => setUserGoals(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={() => generateStrategyMutation.mutate()}
                    disabled={generateStrategyMutation.isPending || selectedFactors.length === 0}
                    className="w-full"
                  >
                    {generateStrategyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Strategy...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Generate Strategy
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Strategies List */}
              <div className="grid gap-4">
                {strategiesLoading ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Loading strategies...
                    </CardContent>
                  </Card>
                ) : strategies && strategies.length > 0 ? (
                  strategies.map((strategy: any) => (
                    <Card key={strategy.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{strategy.name}</CardTitle>
                            <CardDescription>{strategy.description}</CardDescription>
                          </div>
                          <Badge className={getStatusColor(strategy.status)}>
                            {strategy.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Entry Rules</h4>
                          <pre className="text-xs bg-muted p-2 rounded">
                            {JSON.stringify(strategy.entry_rules, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Exit Rules</h4>
                          <pre className="text-xs bg-muted p-2 rounded">
                            {JSON.stringify(strategy.exit_rules, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Risk Parameters</h4>
                          <pre className="text-xs bg-muted p-2 rounded">
                            {JSON.stringify(strategy.risk_parameters, null, 2)}
                          </pre>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No strategies yet. Create your first AI strategy above.
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AIResearchLab;
