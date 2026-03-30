import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Search, Plus, Star, TrendingUp, TrendingDown, Filter, Tag,
  Code2, BarChart3, Activity, Brain, Sparkles, Copy, Trash2,
  Edit, Lock, Loader2, Rocket
} from "lucide-react";
import { BlurredCode, ProtectedCodeBadge } from "@/components/ui/blurred-code";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface Factor {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  factor_type: 'technical' | 'fundamental' | 'sentiment' | 'alternative';
  code: string;
  parameters: any;
  performance_metrics: any;
  is_active: boolean;
  tags: string[];
  category: string | null;
  sharpe_ratio: number | null;
  win_rate: number | null;
  total_return: number | null;
  created_at: string;
  updated_at: string;
}

const FACTOR_TYPE_ICONS: Record<string, any> = {
  technical: BarChart3,
  fundamental: TrendingUp,
  sentiment: Brain,
  alternative: Sparkles
};

const FACTOR_TYPE_COLORS: Record<string, string> = {
  technical: 'bg-blue-500',
  fundamental: 'bg-green-500',
  sentiment: 'bg-purple-500',
  alternative: 'bg-amber-500'
};

const FactorLibrary = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdminAuth();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<'date' | 'performance' | 'name'>('date');
  const [loading, setLoading] = useState(true);
  const [selectedFactor, setSelectedFactor] = useState<Factor | null>(null);
  const [generatingStrategy, setGeneratingStrategy] = useState(false);

  const autoGenerateFromFactor = async (factor: Factor) => {
    if (!user) return;
    setGeneratingStrategy(true);
    try {
      // Step 1: Generate strategy from factor
      const { data: genData, error: genErr } = await supabase.functions.invoke('generate-strategy', {
        body: { factorIds: [factor.id], userGoals: `Build a high-performance strategy using the ${factor.name} factor` }
      });
      if (genErr) throw genErr;
      if (genData?.error) { toast.error(genData.error); return; }

      const strategyId = genData?.strategy?.id;
      if (!strategyId) { toast.error('Failed to generate strategy'); return; }
      toast.success('Strategy generated! Enhancing...');

      // Step 2: Enhance
      const { data: enhData, error: enhErr } = await supabase.functions.invoke('enhance-strategy', {
        body: { strategyId }
      });
      if (enhErr) throw enhErr;
      toast.success('Strategy enhanced! Starting training...');

      // Step 3: Start training (first batch)
      const { data: trainData, error: trainErr } = await supabase.functions.invoke('train-strategy', {
        body: { strategyId, batchSize: 200 }
      });
      if (trainErr) throw trainErr;
      toast.success(`Training started: ${trainData?.totalCompleted || 0}/10,000 cycles. Continue in Graduation tab.`);
    } catch (err: any) {
      console.error('Auto-generate error:', err);
      toast.error(err.message || 'Auto-generate failed');
    } finally {
      setGeneratingStrategy(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFactors();
    }
  }, [user]);

  const fetchFactors = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_factors')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFactors((data as Factor[]) || []);
    } catch (err) {
      console.error('Error fetching factors:', err);
    } finally {
      setLoading(false);
    }
  };

  const duplicateFactor = async (factor: Factor) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ai_factors')
        .insert({
          user_id: user.id,
          name: `${factor.name} (Copy)`,
          description: factor.description,
          factor_type: factor.factor_type,
          code: factor.code,
          parameters: factor.parameters,
          tags: factor.tags,
          category: factor.category,
          is_active: true
        });

      if (error) throw error;
      toast.success("Factor duplicated!");
      fetchFactors();
    } catch (err) {
      toast.error("Failed to duplicate factor");
    }
  };

  const deleteFactor = async (factorId: string) => {
    try {
      const { error } = await supabase
        .from('ai_factors')
        .delete()
        .eq('id', factorId);

      if (error) throw error;
      toast.success("Factor deleted");
      fetchFactors();
      if (selectedFactor?.id === factorId) {
        setSelectedFactor(null);
      }
    } catch (err) {
      toast.error("Failed to delete factor");
    }
  };

  const updateFactorTags = async (factorId: string, newTags: string[]) => {
    try {
      const { error } = await supabase
        .from('ai_factors')
        .update({ tags: newTags })
        .eq('id', factorId);

      if (error) throw error;
      toast.success("Tags updated");
      fetchFactors();
    } catch (err) {
      toast.error("Failed to update tags");
    }
  };

  const allTags = [...new Set(factors.flatMap(f => f.tags || []))];
  const allCategories = [...new Set(factors.map(f => f.category).filter(Boolean))];

  const filteredFactors = factors
    .filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
                           (f.description?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
                           f.code.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || f.factor_type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
      const matchesTag = !tagFilter || (f.tags || []).includes(tagFilter);
      return matchesSearch && matchesType && matchesCategory && matchesTag;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'performance': return (b.sharpe_ratio || 0) - (a.sharpe_ratio || 0);
        case 'name': return a.name.localeCompare(b.name);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const factorsByType = {
    technical: factors.filter(f => f.factor_type === 'technical').length,
    fundamental: factors.filter(f => f.factor_type === 'fundamental').length,
    sentiment: factors.filter(f => f.factor_type === 'sentiment').length,
    alternative: factors.filter(f => f.factor_type === 'alternative').length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Factors</p>
                <p className="text-3xl font-bold">{factors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {Object.entries(factorsByType).map(([type, count]) => {
          const Icon = FACTOR_TYPE_ICONS[type];
          return (
            <Card key={type}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg ${FACTOR_TYPE_COLORS[type]} flex items-center justify-center`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground capitalize">{type}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search factors by name, description, or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="fundamental">Fundamental</SelectItem>
                <SelectItem value="sentiment">Sentiment</SelectItem>
                <SelectItem value="alternative">Alternative</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {allCategories.map(cat => (
                  <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Newest</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag filters */}
          {allTags.length > 0 && (
            <div className="flex gap-2 mt-4 flex-wrap">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Tags:
              </span>
              {allTags.map(tag => (
                <Badge
                  key={tag}
                  variant={tagFilter === tag ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Factors List */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Factor Library
              </span>
              <Badge variant="outline">{filteredFactors.length} factors</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              {filteredFactors.length === 0 ? (
                <div className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No factors found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate factors in the AI Research Lab
                  </p>
                </div>
              ) : (
                filteredFactors.map(factor => {
                  const Icon = FACTOR_TYPE_ICONS[factor.factor_type];
                  return (
                    <div
                      key={factor.id}
                      className={`p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors ${
                        selectedFactor?.id === factor.id ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedFactor(factor)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`h-10 w-10 rounded-lg ${FACTOR_TYPE_COLORS[factor.factor_type]} flex items-center justify-center`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium">{factor.name}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {factor.description || "No description"}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {factor.factor_type}
                              </Badge>
                              {factor.category && (
                                <Badge variant="outline" className="text-xs">
                                  {factor.category}
                                </Badge>
                              )}
                              {(factor.tags || []).slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm">
                          {factor.sharpe_ratio && (
                            <div className={factor.sharpe_ratio > 1 ? 'text-green-500' : 'text-muted-foreground'}>
                              Sharpe: {factor.sharpe_ratio.toFixed(2)}
                            </div>
                          )}
                          {factor.win_rate && (
                            <div className={factor.win_rate > 50 ? 'text-green-500' : 'text-red-500'}>
                              Win: {factor.win_rate.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Factor Details */}
        <div className="space-y-6">
          {selectedFactor ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedFactor.name}</CardTitle>
                      <CardDescription>{selectedFactor.description}</CardDescription>
                    </div>
                    <Badge className={FACTOR_TYPE_COLORS[selectedFactor.factor_type]}>
                      {selectedFactor.factor_type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Performance Metrics */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Sharpe</p>
                      <p className="font-bold">{selectedFactor.sharpe_ratio?.toFixed(2) || '—'}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                      <p className="font-bold">{selectedFactor.win_rate?.toFixed(1) || '—'}%</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-xs text-muted-foreground">Return</p>
                      <p className="font-bold">{selectedFactor.total_return?.toFixed(1) || '—'}%</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tags</p>
                    <div className="flex gap-1 flex-wrap">
                      {(selectedFactor.tags || []).map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                      {(selectedFactor.tags || []).length === 0 && (
                        <span className="text-sm text-muted-foreground">No tags</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button 
                      className="w-full"
                      size="sm"
                      onClick={() => autoGenerateFromFactor(selectedFactor)}
                      disabled={generatingStrategy}
                    >
                      {generatingStrategy ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating...</>
                      ) : (
                        <><Rocket className="h-4 w-4 mr-1" />Auto: Generate → Enhance → Train</>
                      )}
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => duplicateFactor(selectedFactor)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Duplicate
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteFactor(selectedFactor.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Code Preview - Protected */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Code2 className="h-4 w-4" />
                      Factor Code
                    </span>
                    <ProtectedCodeBadge />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    <BlurredCode 
                      code={selectedFactor.code}
                      isOwner={selectedFactor.user_id === user?.id}
                    />
                  </ScrollArea>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a factor to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FactorLibrary;
