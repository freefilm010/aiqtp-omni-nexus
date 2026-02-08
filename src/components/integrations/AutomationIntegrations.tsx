import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  Webhook, 
  Play, 
  Plus, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ExternalLink,
  Settings,
  Loader2
} from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  type: 'zapier' | 'n8n' | 'molt' | 'custom';
  webhookUrl: string;
  isActive: boolean;
  lastRun?: string;
}

const AUTOMATION_TYPES = [
  { id: 'zapier', name: 'Zapier', color: 'bg-orange-500', icon: '⚡' },
  { id: 'n8n', name: 'n8n', color: 'bg-purple-500', icon: '🔄' },
  { id: 'molt', name: 'Molt.bot', color: 'bg-blue-500', icon: '🦋' },
  { id: 'custom', name: 'Custom Webhook', color: 'bg-gray-500', icon: '🔗' },
];

const AutomationIntegrations = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('quick');
  const [isLoading, setIsLoading] = useState(false);
  const [automations, setAutomations] = useState<Automation[]>([]);
  
  // Quick webhook trigger
  const [quickWebhookUrl, setQuickWebhookUrl] = useState('');
  const [quickPayload, setQuickPayload] = useState('{}');
  
  // New automation form
  const [newAutomation, setNewAutomation] = useState({
    name: '',
    type: 'zapier' as 'zapier' | 'n8n' | 'molt' | 'custom',
    webhookUrl: '',
  });

  const triggerQuickWebhook = async () => {
    if (!quickWebhookUrl) {
      toast({ title: 'Error', description: 'Please enter a webhook URL', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      let payload = {};
      try {
        payload = JSON.parse(quickPayload);
      } catch {
        payload = { message: quickPayload };
      }
      
      const { data, error } = await supabase.functions.invoke('automation-hub', {
        body: {
          action: 'trigger_webhook',
          webhookUrl: quickWebhookUrl,
          webhookData: payload,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: 'Webhook Triggered',
        description: 'Request sent successfully. Check your automation platform for results.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to trigger webhook',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAutomation = async () => {
    if (!newAutomation.name || !newAutomation.webhookUrl) {
      toast({ title: 'Error', description: 'Name and Webhook URL are required', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('automation-hub', {
        body: {
          action: 'create_automation',
          name: newAutomation.name,
          automationType: newAutomation.type,
          webhookUrl: newAutomation.webhookUrl,
        },
      });
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Automation created successfully' });
      setNewAutomation({ name: '', type: 'zapier', webhookUrl: '' });
      loadAutomations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create automation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAutomations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('automation-hub', {
        body: { action: 'get_automations' },
      });
      
      if (error) throw error;
      setAutomations(data?.data?.automations || []);
    } catch (error) {
      console.error('Failed to load automations:', error);
    }
  };

  const runAutomation = async (automationId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('automation-hub', {
        body: {
          action: 'run_automation',
          automationId,
        },
      });
      
      if (error) throw error;
      
      toast({ title: 'Success', description: 'Automation executed successfully' });
      loadAutomations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to run automation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Webhook className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Automation Hub</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Connect Zapier, n8n, Molt.bot & custom webhooks
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {AUTOMATION_TYPES.map((type) => (
              <Badge key={type.id} variant="outline" className="text-xs">
                {type.icon} {type.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="quick" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Quick Trigger
            </TabsTrigger>
            <TabsTrigger value="automations" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              My Automations
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  placeholder="https://hooks.zapier.com/... or https://your-n8n.com/webhook/..."
                  value={quickWebhookUrl}
                  onChange={(e) => setQuickWebhookUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payload (JSON)</Label>
                <Input
                  placeholder='{"event": "test", "data": {}}'
                  value={quickPayload}
                  onChange={(e) => setQuickPayload(e.target.value)}
                />
              </div>
              <Button onClick={triggerQuickWebhook} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Trigger Webhook
              </Button>
            </div>

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Quick Setup Guides</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href="https://zapier.com/apps/webhook/integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  Zapier Webhooks
                </a>
                <a
                  href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  n8n Webhooks
                </a>
                <a
                  href="https://molt.bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  Molt.bot Setup
                </a>
                <a
                  href="https://incomefactory.manus.space"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3 w-3" />
                  Income Factory
                </a>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="automations">
            <ScrollArea className="h-[300px]">
              {automations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No automations configured yet</p>
                  <Button variant="link" onClick={() => setActiveTab('create')}>
                    Create your first automation
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {automations.map((automation) => (
                    <div
                      key={automation.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-lg">
                          {AUTOMATION_TYPES.find((t) => t.id === automation.type)?.icon || '🔗'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{automation.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {automation.type} • {automation.lastRun ? `Last run: ${new Date(automation.lastRun).toLocaleString()}` : 'Never run'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={automation.isActive ? 'default' : 'secondary'}>
                          {automation.isActive ? (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {automation.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runAutomation(automation.id)}
                          disabled={isLoading}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <Button variant="outline" className="w-full mt-4" onClick={loadAutomations}>
              <Activity className="h-4 w-4 mr-2" />
              Refresh Automations
            </Button>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <div className="space-y-2">
              <Label>Automation Name</Label>
              <Input
                placeholder="My Trading Alert"
                value={newAutomation.name}
                onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {AUTOMATION_TYPES.map((type) => (
                  <Button
                    key={type.id}
                    variant={newAutomation.type === type.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewAutomation({ ...newAutomation, type: type.id as any })}
                    className="flex items-center gap-1"
                  >
                    <span>{type.icon}</span>
                    <span className="text-xs">{type.name}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <Input
                placeholder="https://..."
                value={newAutomation.webhookUrl}
                onChange={(e) => setNewAutomation({ ...newAutomation, webhookUrl: e.target.value })}
              />
            </div>
            
            <Button onClick={createAutomation} disabled={isLoading} className="w-full">
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Automation
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AutomationIntegrations;
