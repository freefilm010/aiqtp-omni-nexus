import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search, Rocket, Zap, Loader2, TrendingUp, Activity, BarChart3,
  Layers, Target, ArrowUpDown, Sparkles, Package
} from "lucide-react";

interface StrategyTemplate {
  name: string;
  category: string;
  indicators: string[];
  desc: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  trend: TrendingUp,
  momentum: Activity,
  volatility: BarChart3,
  volume: Layers,
  mean_reversion: ArrowUpDown,
  breakout: Target,
  pattern: Sparkles,
  combo: Package,
};

const CATEGORY_LABELS: Record<string, string> = {
  trend: "Trend Following",
  momentum: "Momentum",
  volatility: "Volatility",
  volume: "Volume",
  mean_reversion: "Mean Reversion",
  breakout: "Breakout",
  pattern: "Pattern Recognition",
  combo: "Multi-Indicator Combos",
};

const StrategyTemplates = () => {
  const [templates, setTemplates] = useState<StrategyTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchTemplates();
  }, [categoryFilter]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-strategies', {
        body: { action: 'list-templates', category: categoryFilter }
      });
      if (error) throw error;
      setTemplates(data.templates || []);
      setCategories(data.categories || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  const generateFromTemplate = async (templateName: string) => {
    setGenerating(templateName);
    try {
      const { data, error } = await supabase.functions.invoke('seed-strategies', {
        body: { action: 'generate-from-template', templateIndex: templateName }
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success(`Strategy "${data.strategy.name}" created! Head to Graduation tab to enhance & train.`);
    } catch (err: any) {
      toast.error(err.message || "Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const bulkGenerate = async () => {
    setBulkGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-strategies', {
        body: { action: 'bulk-generate', count: 10, category: categoryFilter }
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      toast.success(`${data.generated} strategies generated! Go to Graduation to auto-enhance & train them all.`, { duration: 5000 });
    } catch (err: any) {
      toast.error(err.message || "Bulk generation failed");
    } finally {
      setBulkGenerating(false);
    }
  };

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.desc.toLowerCase().includes(search.toLowerCase()) ||
    t.indicators.some(i => i.toLowerCase().includes(search.toLowerCase()))
  );

  const templatesByCategory = filteredTemplates.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, StrategyTemplate[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Strategy Template Library — {templates.length}+ Pre-Built Strategies
          </CardTitle>
          <CardDescription>
            One-click generate from proven trading patterns • Auto-enhance via AI • Train through 10K cycles • Graduate to rental marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search strategies (e.g. RSI, MACD, Bollinger, EMA...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] || cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={bulkGenerate}
              disabled={bulkGenerating}
              className="shrink-0"
            >
              {bulkGenerating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" />Bulk Generate 10</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading templates...</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-6">
            {Object.entries(templatesByCategory).map(([cat, catTemplates]) => {
              const Icon = CATEGORY_ICONS[cat] || Activity;
              return (
                <Card key={cat}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {CATEGORY_LABELS[cat] || cat}
                      <Badge variant="outline">{catTemplates.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catTemplates.map(template => (
                        <div
                          key={template.name}
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm">{template.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{template.desc}</p>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {template.indicators.map(ind => (
                              <Badge key={ind} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {ind}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => generateFromTemplate(template.name)}
                            disabled={generating === template.name}
                          >
                            {generating === template.name ? (
                              <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Creating...</>
                            ) : (
                              <><Rocket className="h-3 w-3 mr-1" />Generate Strategy</>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default StrategyTemplates;
