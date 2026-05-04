import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Plus,
  RefreshCw,
  Settings,
  TrendingUp,
  PiggyBank,
  Wallet,
  ArrowRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DistributionRule {
  id: string;
  rule_name: string;
  source_type: string;
  distribution_type: string;
  percentage: number;
  target_wallet_id: string | null;
  is_active: boolean;
  min_threshold: number;
  execution_frequency: string;
  created_at: string;
}

interface PlatformWallet {
  id: string;
  wallet_type: string;
  currency: string;
}

const sourceTypes = [
  { value: 'finder_fee', label: 'Finder Fees' },
  { value: 'commission', label: 'Commissions' },
  { value: 'subscription', label: 'Subscriptions' },
  { value: 'trading_fee', label: 'Trading Fees' },
  { value: 'spread', label: 'Spreads' },
  { value: 'staking_yield', label: 'Staking Yields' },
  { value: 'investment_return', label: 'Investment Returns' },
  { value: 'api_fee', label: 'API Fees' },
  { value: 'premium_feature', label: 'Premium Features' }
];

const distributionTypes = [
  { value: 'reinvest', label: 'Reinvest', icon: TrendingUp, color: 'text-green-500' },
  { value: 'reserve', label: 'Reserve', icon: PiggyBank, color: 'text-yellow-500' },
  { value: 'withdraw', label: 'Withdraw', icon: Wallet, color: 'text-blue-500' },
  { value: 'compound', label: 'Compound', icon: RefreshCw, color: 'text-purple-500' }
];

const frequencies = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' }
];

const ProfitAutomation = () => {
  const [rules, setRules] = useState<DistributionRule[]>([]);
  const [wallets, setWallets] = useState<PlatformWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRuleOpen, setNewRuleOpen] = useState(false);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    source_type: 'finder_fee',
    distribution_type: 'reinvest',
    percentage: 60,
    target_wallet_id: '',
    min_threshold: 0,
    execution_frequency: 'immediate'
  });

  useEffect(() => {
    fetchRules();
    fetchWallets();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('profit_distribution_rules')
        .select('*')
        .order('source_type', { ascending: true });

      if (error) {
        console.warn('profit_distribution_rules unavailable:', error.message);
        setRules([]);
      } else {
        setRules(data || []);
      }
    } catch (error) {
      console.warn('Error fetching rules:', error);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_wallets')
        .select('id, wallet_type, currency');

      if (error) console.warn('platform_wallets unavailable:', error.message);
      else setWallets(data || []);
    } catch (error) {
      console.warn('Error fetching wallets:', error);
    }
  };

  const toggleRule = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profit_distribution_rules')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setRules(prev => prev.map(r => 
        r.id === id ? { ...r, is_active: !currentStatus } : r
      ));
      toast.success('Rule updated');
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const addRule = async () => {
    if (!newRule.rule_name) {
      toast.error('Please enter a rule name');
      return;
    }

    try {
      const { error } = await supabase
        .from('profit_distribution_rules')
        .insert({
          rule_name: newRule.rule_name,
          source_type: newRule.source_type,
          distribution_type: newRule.distribution_type,
          percentage: newRule.percentage,
          target_wallet_id: newRule.target_wallet_id || null,
          min_threshold: newRule.min_threshold,
          execution_frequency: newRule.execution_frequency,
          is_active: true
        });

      if (error) throw error;
      
      toast.success('Distribution rule added');
      setNewRuleOpen(false);
      setNewRule({
        rule_name: '',
        source_type: 'finder_fee',
        distribution_type: 'reinvest',
        percentage: 60,
        target_wallet_id: '',
        min_threshold: 0,
        execution_frequency: 'immediate'
      });
      fetchRules();
    } catch (error) {
      console.error('Error adding rule:', error);
      toast.error('Failed to add rule');
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profit_distribution_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Rule deleted');
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const groupedRules = rules.reduce((acc, rule) => {
    if (!acc[rule.source_type]) {
      acc[rule.source_type] = [];
    }
    acc[rule.source_type].push(rule);
    return acc;
  }, {} as Record<string, DistributionRule[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profit Automation</h1>
          <p className="text-muted-foreground">
            Configure automated profit distribution rules
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRules}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={newRuleOpen} onOpenChange={setNewRuleOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Distribution Rule</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rule Name</label>
                  <Input
                    placeholder="e.g., Reinvest Finder Fees"
                    value={newRule.rule_name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, rule_name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Revenue Source</label>
                  <Select 
                    value={newRule.source_type}
                    onValueChange={(v) => setNewRule(prev => ({ ...prev, source_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sourceTypes.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Distribution Type</label>
                  <Select 
                    value={newRule.distribution_type}
                    onValueChange={(v) => setNewRule(prev => ({ ...prev, distribution_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {distributionTypes.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-sm font-medium">Percentage</label>
                    <span className="text-sm text-muted-foreground">{newRule.percentage}%</span>
                  </div>
                  <Slider
                    value={[newRule.percentage]}
                    onValueChange={([v]) => setNewRule(prev => ({ ...prev, percentage: v }))}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Wallet (optional)</label>
                  <Select 
                    value={newRule.target_wallet_id}
                    onValueChange={(v) => setNewRule(prev => ({ ...prev, target_wallet_id: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select wallet" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map(w => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.currency} ({w.wallet_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Execution Frequency</label>
                  <Select 
                    value={newRule.execution_frequency}
                    onValueChange={(v) => setNewRule(prev => ({ ...prev, execution_frequency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencies.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Minimum Threshold (USD)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={newRule.min_threshold}
                    onChange={(e) => setNewRule(prev => ({ ...prev, min_threshold: Number(e.target.value) }))}
                  />
                </div>

                <Button onClick={addRule} className="w-full">
                  <Zap className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reinvest Rules</p>
                <p className="text-2xl font-bold">
                  {rules.filter(r => r.distribution_type === 'reinvest' && r.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <PiggyBank className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserve Rules</p>
                <p className="text-2xl font-bold">
                  {rules.filter(r => r.distribution_type === 'reserve' && r.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Wallet className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Withdraw Rules</p>
                <p className="text-2xl font-bold">
                  {rules.filter(r => r.distribution_type === 'withdraw' && r.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <RefreshCw className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Compound Rules</p>
                <p className="text-2xl font-bold">
                  {rules.filter(r => r.distribution_type === 'compound' && r.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules by Source */}
      {Object.keys(groupedRules).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Distribution Rules</h3>
            <p className="text-muted-foreground mb-4">
              Create rules to automatically distribute profits from various revenue streams
            </p>
            <Button onClick={() => setNewRuleOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Rule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRules).map(([sourceType, sourceRules]) => {
            const sourceLabel = sourceTypes.find(s => s.value === sourceType)?.label || sourceType;
            return (
              <Card key={sourceType}>
                <CardHeader>
                  <CardTitle className="text-lg">{sourceLabel}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sourceRules.map((rule) => {
                    const distType = distributionTypes.find(d => d.value === rule.distribution_type);
                    const Icon = distType?.icon || Settings;
                    const targetWallet = wallets.find(w => w.id === rule.target_wallet_id);
                    
                    return (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-4">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleRule(rule.id, rule.is_active)}
                          />
                          <div className={`p-2 rounded-lg ${distType?.color || ''} bg-current/10`}>
                            <Icon className={`h-4 w-4 ${distType?.color || ''}`} />
                          </div>
                          <div>
                            <h4 className="font-medium">{rule.rule_name}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{rule.percentage}%</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{distType?.label}</span>
                              {targetWallet && (
                                <>
                                  <ArrowRight className="h-3 w-3" />
                                  <span>{targetWallet.currency}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{rule.execution_frequency}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRule(rule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProfitAutomation;
