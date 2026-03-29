import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Zap,
  Megaphone,
  DollarSign,
  Brain,
  Briefcase,
  Rocket,
  Play,
  Pause,
  Clock,
  Settings,
  Loader2,
  RefreshCw
} from "lucide-react";

interface AutomationTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  trigger_type: string;
  trigger_config: any;
  action_type: string;
  action_config: any;
  webhook_url: string | null;
  is_active: boolean;
  is_system: boolean;
  schedule: string | null;
  last_run_at: string | null;
  run_count: number;
}

const categoryConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  marketing: { icon: Megaphone, label: "Marketing", color: "text-pink-500" },
  revenue: { icon: DollarSign, label: "Revenue", color: "text-green-500" },
  ai: { icon: Brain, label: "AI & Strategy", color: "text-purple-500" },
  portfolio: { icon: Briefcase, label: "Portfolio", color: "text-blue-500" },
  growth: { icon: Rocket, label: "Platform Growth", color: "text-amber-500" },
};

const AutomationTemplates = () => {
  const { isAdmin } = useAdminAuth();
  const [templates, setTemplates] = useState<AutomationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  if (!isAdmin) return null;

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("automation_templates")
        .select("*")
        .order("category", { ascending: true });
      if (error) throw error;
      setTemplates((data as AutomationTemplate[]) || []);
    } catch (err: any) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const toggleTemplate = async (id: string, currentState: boolean) => {
    setActivating(id);
    try {
      const { error } = await supabase
        .from("automation_templates")
        .update({ is_active: !currentState })
        .eq("id", id);
      if (error) throw error;
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, is_active: !currentState } : t));
      toast.success(!currentState ? "Automation activated" : "Automation paused");
    } catch (err: any) {
      toast.error("Failed to update automation");
    } finally {
      setActivating(null);
    }
  };

  const categories = Object.keys(categoryConfig);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
        <p className="text-muted-foreground mt-2">Loading automation templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Automation Templates
          </h2>
          <p className="text-muted-foreground">
            {templates.filter(t => t.is_active).length} active / {templates.length} total automations
          </p>
        </div>
        <Button variant="outline" onClick={fetchTemplates}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="marketing">
        <TabsList className="grid w-full grid-cols-5">
          {categories.map(cat => {
            const cfg = categoryConfig[cat];
            const Icon = cfg.icon;
            const count = templates.filter(t => t.category === cat).length;
            return (
              <TabsTrigger key={cat} value={cat} className="flex items-center gap-1 text-xs">
                <Icon className={`h-4 w-4 ${cfg.color}`} />
                {cfg.label} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.filter(t => t.category === cat).map(template => {
                const cfg = categoryConfig[cat];
                const Icon = cfg.icon;
                return (
                  <Card key={template.id} className={template.is_active ? "border-primary/30" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-5 w-5 ${cfg.color}`} />
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            {template.subcategory && (
                              <Badge variant="outline" className="text-xs mt-1 capitalize">{template.subcategory}</Badge>
                            )}
                          </div>
                        </div>
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => toggleTemplate(template.id, template.is_active)}
                          disabled={activating === template.id}
                        />
                      </div>
                      <CardDescription className="mt-2">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {template.trigger_type === 'schedule'
                              ? (template.trigger_config as any)?.description || template.trigger_config?.cron
                              : `On: ${(template.trigger_config as any)?.event || template.trigger_type}`
                            }
                          </span>
                          <span>Runs: {template.run_count}</span>
                        </div>

                        {template.is_active && !template.webhook_url && (
                          <Input
                            placeholder="Webhook URL (optional)"
                            className="text-xs h-8"
                            onChange={async (e) => {
                              if (e.target.value) {
                                await supabase
                                  .from("automation_templates")
                                  .update({ webhook_url: e.target.value })
                                  .eq("id", template.id);
                              }
                            }}
                          />
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={template.is_active ? "default" : "outline"}
                            className="flex-1"
                            disabled={!template.is_active}
                            onClick={() => toast.info(`Running ${template.name}...`)}
                          >
                            <Play className="h-3 w-3 mr-1" /> Run Now
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AutomationTemplates;
