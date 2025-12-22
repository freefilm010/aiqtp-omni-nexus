import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Brain, TrendingUp, Target, Zap, Loader2, Sparkles, Clock, Search, 
  SortAsc, SortDesc, FlaskConical, Trash2, Copy, Play, Archive,
  ArrowUpDown, CheckCircle2, AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import BacktestPanel from "@/components/research/BacktestPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type SortField = "name" | "date" | "status" | "type";
type SortOrder = "asc" | "desc";

const AIResearchLab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFactorType, setSelectedFactorType] = useState("technical");
  const [userGoals, setUserGoals] = useState("");
  const [selectedFactors, setSelectedFactors] = useState<string[]>([]);
  const [lastFactorGeneration, setLastFactorGeneration] = useState<Date | null>(null);
  const [lastStrategyGeneration, setLastStrategyGeneration] = useState<Date | null>(null);
  
  // Search and Sort State
  const [factorSearch, setFactorSearch] = useState("");
  const [strategySearch, setStrategySearch] = useState("");
  const [factorSortField, setFactorSortField] = useState<SortField>("date");
  const [factorSortOrder, setFactorSortOrder] = useState<SortOrder>("desc");
  const [strategySortField, setStrategySortField] = useState<SortField>("date");
  const [strategySortOrder, setStrategySortOrder] = useState<SortOrder>("desc");
  const [factorTypeFilter, setFactorTypeFilter] = useState<string>("all");
  const [strategyStatusFilter, setStrategyStatusFilter] = useState<string>("all");
  
  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'factor' | 'strategy'; id: string; name: string } | null>(null);
  
  const COOLDOWN_SECONDS = 30;
  
  const getFactorCooldownRemaining = () => {
    if (!lastFactorGeneration) return 0;
    const elapsed = (Date.now() - lastFactorGeneration.getTime()) / 1000;
    return Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed));
  };
  
  const getStrategyCooldownRemaining = () => {
    if (!lastStrategyGeneration) return 0;
    const elapsed = (Date.now() - lastStrategyGeneration.getTime()) / 1000;
    return Math.max(0, Math.ceil(COOLDOWN_SECONDS - elapsed));
  };
  
  const canGenerateFactors = getFactorCooldownRemaining() === 0;
  const canGenerateStrategy = getStrategyCooldownRemaining() === 0;
  
  // Force re-render for cooldown timer
  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastFactorGeneration || lastStrategyGeneration) {
        setTick(t => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastFactorGeneration, lastStrategyGeneration]);

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

  // Filtered and sorted factors
  const filteredFactors = useMemo(() => {
    if (!factors) return [];
    
    let result = [...factors];
    
    // Filter by search
    if (factorSearch) {
      const search = factorSearch.toLowerCase();
      result = result.filter(f => 
        f.name.toLowerCase().includes(search) || 
        f.description?.toLowerCase().includes(search)
      );
    }
    
    // Filter by type
    if (factorTypeFilter !== "all") {
      result = result.filter(f => f.factor_type === factorTypeFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (factorSortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "type":
          comparison = a.factor_type.localeCompare(b.factor_type);
          break;
        case "date":
        default:
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
      }
      return factorSortOrder === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [factors, factorSearch, factorTypeFilter, factorSortField, factorSortOrder]);

  // Filtered and sorted strategies
  const filteredStrategies = useMemo(() => {
    if (!strategies) return [];
    
    let result = [...strategies];
    
    // Filter by search
    if (strategySearch) {
      const search = strategySearch.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(search) || 
        s.description?.toLowerCase().includes(search)
      );
    }
    
    // Filter by status
    if (strategyStatusFilter !== "all") {
      result = result.filter(s => s.status === strategyStatusFilter);
    }
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (strategySortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "date":
        default:
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
      }
      return strategySortOrder === "asc" ? comparison : -comparison;
    });
    
    return result;
  }, [strategies, strategySearch, strategyStatusFilter, strategySortField, strategySortOrder]);

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
      setLastFactorGeneration(new Date());
      queryClient.invalidateQueries({ queryKey: ['ai-factors'] });
      toast.success(`Generated ${data.factors?.length || 0} new factors`);
    },
    onError: (error: any) => {
      if (error.message.includes('Rate limit') || error.message.includes('429')) {
        toast.error("Rate limit exceeded. Please wait before generating more factors.");
      } else {
        toast.error(error.message || "Failed to generate factors");
      }
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
          userGoals: userGoals || undefined
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setLastStrategyGeneration(new Date());
      queryClient.invalidateQueries({ queryKey: ['ai-strategies'] });
      toast.success(`Created strategy: ${data.strategy?.name}`);
      setSelectedFactors([]);
      setUserGoals("");
    },
    onError: (error: any) => {
      if (error.message.includes('Rate limit') || error.message.includes('429')) {
        toast.error("Rate limit exceeded. Please wait before generating more strategies.");
      } else {
        toast.error(error.message || "Failed to generate strategy");
      }
    }
  });

  // Update strategy status mutation
  const updateStrategyStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "backtesting" | "paper_trading" | "live" | "archived" }) => {
      const { error } = await supabase
        .from('ai_strategies')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-strategies'] });
      toast.success("Strategy status updated");
    },
    onError: (error: any) => {
      toast.error("Failed to update strategy: " + error.message);
    }
  });

  // Delete factor mutation
  const deleteFactorMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_factors')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-factors'] });
      toast.success("Factor deleted");
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete factor: " + error.message);
    }
  });

  // Delete strategy mutation
  const deleteStrategyMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ai_strategies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-strategies'] });
      toast.success("Strategy deleted");
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error("Failed to delete strategy: " + error.message);
    }
  });

  // Duplicate strategy mutation
  const duplicateStrategyMutation = useMutation({
    mutationFn: async (strategy: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('ai_strategies')
        .insert({
          user_id: user.id,
          name: `${strategy.name} (Copy)`,
          description: strategy.description,
          status: 'draft',
          factors: strategy.factors,
          entry_rules: strategy.entry_rules,
          exit_rules: strategy.exit_rules,
          risk_parameters: strategy.risk_parameters,
          code: strategy.code
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-strategies'] });
      toast.success("Strategy duplicated");
    },
    onError: (error: any) => {
      toast.error("Failed to duplicate: " + error.message);
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
    const colors: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      backtesting: 'bg-primary/20 text-primary',
      paper_trading: 'bg-accent/20 text-accent-foreground',
      live: 'bg-success/20 text-success',
      archived: 'bg-muted text-muted-foreground'
    };
    return colors[status] || 'bg-muted';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return <CheckCircle2 className="h-3 w-3" />;
      case 'backtesting': return <FlaskConical className="h-3 w-3" />;
      case 'paper_trading': return <Play className="h-3 w-3" />;
      case 'archived': return <Archive className="h-3 w-3" />;
      default: return <AlertCircle className="h-3 w-3" />;
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    
    if (deleteTarget.type === 'factor') {
      deleteFactorMutation.mutate(deleteTarget.id);
    } else {
      deleteStrategyMutation.mutate(deleteTarget.id);
    }
  };

  const toggleSort = (field: SortField, isStrategy: boolean) => {
    if (isStrategy) {
      if (strategySortField === field) {
        setStrategySortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setStrategySortField(field);
        setStrategySortOrder('desc');
      }
    } else {
      if (factorSortField === field) {
        setFactorSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
      } else {
        setFactorSortField(field);
        setFactorSortOrder('desc');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 pt-24">
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
            <Button onClick={() => navigate('/trading')} variant="outline">
              Back to Trading
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AI Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{factors?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {factors?.filter(f => f.is_active).length || 0} active
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{strategies?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {strategies?.filter(s => s.status === 'live').length || 0} live
                </p>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  Backtests Run
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {strategies?.filter(s => s.status !== 'draft').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">This session</p>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-gold" />
                  AI Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="factors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="factors">Factor Generation</TabsTrigger>
              <TabsTrigger value="strategies">Strategy Builder</TabsTrigger>
              <TabsTrigger value="backtest" className="flex items-center gap-1">
                <FlaskConical className="h-3 w-3" />
                Backtesting
              </TabsTrigger>
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
                    disabled={generateFactorsMutation.isPending || !canGenerateFactors}
                    className="w-full"
                  >
                    {generateFactorsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : !canGenerateFactors ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Wait {getFactorCooldownRemaining()}s
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

              {/* Search and Filter Bar */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search factors..."
                    value={factorSearch}
                    onChange={(e) => setFactorSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={factorTypeFilter} onValueChange={setFactorTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="fundamental">Fundamental</SelectItem>
                    <SelectItem value="sentiment">Sentiment</SelectItem>
                    <SelectItem value="alternative">Alternative</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleSort('date', false)}>
                      Date {factorSortField === 'date' && (factorSortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('name', false)}>
                      Name {factorSortField === 'name' && (factorSortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('type', false)}>
                      Type {factorSortField === 'type' && (factorSortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {selectedFactors.length > 0 && (
                  <Badge variant="secondary">
                    {selectedFactors.length} selected
                  </Badge>
                )}
              </div>

              {/* Factors List */}
              <div className="grid gap-4">
                {factorsLoading ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading factors...
                    </CardContent>
                  </Card>
                ) : filteredFactors.length > 0 ? (
                  filteredFactors.map((factor: any) => (
                    <Card
                      key={factor.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedFactors.includes(factor.id)
                          ? 'border-primary ring-2 ring-primary/20'
                          : ''
                      }`}
                      onClick={() => toggleFactorSelection(factor.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              {selectedFactors.includes(factor.id) && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                              <CardTitle className="text-lg">{factor.name}</CardTitle>
                            </div>
                            <CardDescription>{factor.description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{factor.factor_type}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget({ type: 'factor', id: factor.id, name: factor.name });
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-xs bg-muted p-3 rounded overflow-x-auto max-h-24">
                          {factor.code?.substring(0, 200)}...
                        </pre>
                        <p className="text-xs text-muted-foreground mt-2">
                          Created {new Date(factor.created_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {factorSearch || factorTypeFilter !== 'all' 
                        ? 'No factors match your search criteria.' 
                        : 'No factors yet. Generate your first AI factor above.'}
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
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-muted/50 rounded-md">
                      {selectedFactors.length > 0 ? (
                        selectedFactors.map(id => {
                          const factor = factors?.find((f: any) => f.id === id);
                          return (
                            <Badge 
                              key={id} 
                              variant="secondary"
                              className="cursor-pointer hover:bg-destructive/20"
                              onClick={() => toggleFactorSelection(id)}
                            >
                              {factor?.name}
                              <span className="ml-1">×</span>
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
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {userGoals.length}/500 characters
                    </p>
                  </div>

                  <Button
                    onClick={() => generateStrategyMutation.mutate()}
                    disabled={generateStrategyMutation.isPending || selectedFactors.length === 0 || !canGenerateStrategy}
                    className="w-full"
                  >
                    {generateStrategyMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Strategy...
                      </>
                    ) : !canGenerateStrategy ? (
                      <>
                        <Clock className="mr-2 h-4 w-4" />
                        Wait {getStrategyCooldownRemaining()}s
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

              {/* Search and Filter Bar for Strategies */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search strategies..."
                    value={strategySearch}
                    onChange={(e) => setStrategySearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={strategyStatusFilter} onValueChange={setStrategyStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="backtesting">Backtesting</SelectItem>
                    <SelectItem value="paper_trading">Paper Trading</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleSort('date', true)}>
                      Date {strategySortField === 'date' && (strategySortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('name', true)}>
                      Name {strategySortField === 'name' && (strategySortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('status', true)}>
                      Status {strategySortField === 'status' && (strategySortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Strategies List */}
              <div className="grid gap-4">
                {strategiesLoading ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading strategies...
                    </CardContent>
                  </Card>
                ) : filteredStrategies.length > 0 ? (
                  filteredStrategies.map((strategy: any) => (
                    <Card key={strategy.id} className="hover:shadow-md transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <CardTitle className="text-lg">{strategy.name}</CardTitle>
                            <CardDescription>{strategy.description}</CardDescription>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(strategy.status)} flex items-center gap-1`}>
                              {getStatusIcon(strategy.status)}
                              {strategy.status.replace('_', ' ')}
                            </Badge>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  Actions
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => updateStrategyStatusMutation.mutate({ id: strategy.id, status: 'draft' })}
                                >
                                  <AlertCircle className="mr-2 h-4 w-4" /> Draft
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateStrategyStatusMutation.mutate({ id: strategy.id, status: 'backtesting' })}
                                >
                                  <FlaskConical className="mr-2 h-4 w-4" /> Backtesting
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateStrategyStatusMutation.mutate({ id: strategy.id, status: 'paper_trading' })}
                                >
                                  <Play className="mr-2 h-4 w-4" /> Paper Trading
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateStrategyStatusMutation.mutate({ id: strategy.id, status: 'live' })}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Live
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => updateStrategyStatusMutation.mutate({ id: strategy.id, status: 'archived' })}
                                >
                                  <Archive className="mr-2 h-4 w-4" /> Archived
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => duplicateStrategyMutation.mutate(strategy)}>
                                  <Copy className="mr-2 h-4 w-4" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeleteTarget({ type: 'strategy', id: strategy.id, name: strategy.name })}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Entry Rules</h4>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-20">
                              {JSON.stringify(strategy.entry_rules, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Exit Rules</h4>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-20">
                              {JSON.stringify(strategy.exit_rules, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Risk Parameters</h4>
                            <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-20">
                              {JSON.stringify(strategy.risk_parameters, null, 2)}
                            </pre>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(strategy.created_at).toLocaleDateString()} • 
                          Updated {new Date(strategy.updated_at).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      {strategySearch || strategyStatusFilter !== 'all'
                        ? 'No strategies match your search criteria.'
                        : 'No strategies yet. Create your first AI strategy above.'}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Backtesting Tab */}
            <TabsContent value="backtest">
              <BacktestPanel 
                strategies={strategies || []}
                onBacktestComplete={(result) => {
                  console.log('Backtest completed:', result);
                  toast.success(`Backtest complete: ${result.totalReturn >= 0 ? '+' : ''}${(result.totalReturn * 100).toFixed(2)}% return`);
                }}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIResearchLab;
