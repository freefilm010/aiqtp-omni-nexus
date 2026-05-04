import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings2,
  Plus,
  RefreshCw,
  Percent,
  Target,
  Clock,
  Trash2,
  Edit
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DistributionRule {
  id: string;
  rule_name: string;
  source_type: string;
  distribution_type: string;
  percentage: number;
  min_threshold: number | null;
  execution_frequency: string | null;
  target_wallet_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface PlatformWallet {
  id: string;
  wallet_type: string;
  currency: string;
}

const sourceTypes = [
  'subscription',
  'commission',
  'spread',
  'api_access',
  'premium_signals',
  'strategy_rental',
  'marketplace',
  'all'
];

const distributionTypes = [
  'reinvest',
  'reserve',
  'platform_fee',
  'creator_share',
  'withdrawal'
];

const frequencies = [
  'instant',
  'hourly',
  'daily',
  'weekly',
  'monthly'
];

const ProfitDistributionRules = () => {
  const [rules, setRules] = useState<DistributionRule[]>([]);
  const [wallets, setWallets] = useState<PlatformWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DistributionRule | null>(null);
  const [newRule, setNewRule] = useState({
    rule_name: '',
    source_type: 'all',
    distribution_type: 'reinvest',
    percentage: 20,
    min_threshold: 0,
    execution_frequency: 'instant',
    target_wallet_id: '',
    is_active: true
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
        .order('created_at', { ascending: false });

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
        .select('id, wallet_type, currency')
        .eq('is_active', true);

      if (error) console.warn('platform_wallets unavailable:', error.message);
      else setWallets(data || []);
    } catch (error) {
      console.warn('Error fetching wallets:', error);
    }
  };

  const saveRule = async () => {
    if (!newRule.rule_name) {
      toast.error('Please enter a rule name');
      return;
    }

    try {
      if (editingRule) {
        const { error } = await supabase
          .from('profit_distribution_rules')
          .update({
            rule_name: newRule.rule_name,
            source_type: newRule.source_type,
            distribution_type: newRule.distribution_type,
            percentage: newRule.percentage,
            min_threshold: newRule.min_threshold || null,
            execution_frequency: newRule.execution_frequency,
            target_wallet_id: newRule.target_wallet_id || null,
            is_active: newRule.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRule.id);

        if (error) throw error;
        toast.success('Rule updated successfully');
      } else {
        const { error } = await supabase
          .from('profit_distribution_rules')
          .insert({
            rule_name: newRule.rule_name,
            source_type: newRule.source_type,
            distribution_type: newRule.distribution_type,
            percentage: newRule.percentage,
            min_threshold: newRule.min_threshold || null,
            execution_frequency: newRule.execution_frequency,
            target_wallet_id: newRule.target_wallet_id || null,
            is_active: newRule.is_active
          });

        if (error) throw error;
        toast.success('Rule created successfully');
      }

      setDialogOpen(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (error) {
      console.warn('Error saving rule:', error);
      toast.error('Failed to save rule');
    }
  };

  const toggleRule = async (rule: DistributionRule) => {
    try {
      const { error } = await supabase
        .from('profit_distribution_rules')
        .update({ is_active: !rule.is_active, updated_at: new Date().toISOString() })
        .eq('id', rule.id);

      if (error) throw error;
      toast.success(`Rule ${!rule.is_active ? 'enabled' : 'disabled'}`);
      fetchRules();
    } catch (error) {
      console.warn('Error toggling rule:', error);
      toast.error('Failed to update rule');
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('profit_distribution_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Rule deleted');
      fetchRules();
    } catch (error) {
      console.warn('Error deleting rule:', error);
      toast.error('Failed to delete rule');
    }
  };

  const openEdit = (rule: DistributionRule) => {
    setEditingRule(rule);
    setNewRule({
      rule_name: rule.rule_name,
      source_type: rule.source_type,
      distribution_type: rule.distribution_type,
      percentage: rule.percentage,
      min_threshold: rule.min_threshold || 0,
      execution_frequency: rule.execution_frequency || 'instant',
      target_wallet_id: rule.target_wallet_id || '',
      is_active: rule.is_active
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setNewRule({
      rule_name: '',
      source_type: 'all',
      distribution_type: 'reinvest',
      percentage: 20,
      min_threshold: 0,
      execution_frequency: 'instant',
      target_wallet_id: '',
      is_active: true
    });
  };

  const getWalletLabel = (walletId: string | null) => {
    if (!walletId) return '-';
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? `${wallet.currency} (${wallet.wallet_type})` : walletId;
  };

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
          <h1 className="text-3xl font-bold">Profit Distribution Rules</h1>
          <p className="text-muted-foreground">
            Configure automatic profit distribution from revenue streams
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchRules}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingRule(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? 'Edit Distribution Rule' : 'Create Distribution Rule'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rule Name</label>
                  <Input
                    placeholder="e.g., Platform Commission Split"
                    value={newRule.rule_name}
                    onChange={(e) => setNewRule(prev => ({ ...prev, rule_name: e.target.value }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
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
                        {sourceTypes.map(type => (
                          <SelectItem key={type} value={type} className="capitalize">
                            {type.replace('_', ' ')}
                          </SelectItem>
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
                        {distributionTypes.map(type => (
                          <SelectItem key={type} value={type} className="capitalize">
                            {type.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Percentage (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={newRule.percentage}
                      onChange={(e) => setNewRule(prev => ({ ...prev, percentage: Number(e.target.value) }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Min Threshold (USD)</label>
                    <Input
                      type="number"
                      min={0}
                      value={newRule.min_threshold}
                      onChange={(e) => setNewRule(prev => ({ ...prev, min_threshold: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Frequency</label>
                    <Select 
                      value={newRule.execution_frequency}
                      onValueChange={(v) => setNewRule(prev => ({ ...prev, execution_frequency: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map(freq => (
                          <SelectItem key={freq} value={freq} className="capitalize">
                            {freq}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Wallet</label>
                    <Select 
                      value={newRule.target_wallet_id}
                      onValueChange={(v) => setNewRule(prev => ({ ...prev, target_wallet_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select wallet" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {wallets.map(wallet => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.currency} ({wallet.wallet_type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm font-medium">Active</label>
                  <Switch
                    checked={newRule.is_active}
                    onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveRule}>
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Total Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {rules.filter(r => r.is_active).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Target className="h-4 w-4" />
              Total Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.filter(r => r.is_active).reduce((acc, r) => acc + r.percentage, 0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across active rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Next Execution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Instant</div>
            <p className="text-xs text-muted-foreground mt-1">
              Most rules execute immediately
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Rules</CardTitle>
        </CardHeader>
        <CardContent>
          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Percent className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No distribution rules configured</p>
              <p className="text-sm">Create rules to automate profit distribution</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.rule_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {rule.source_type.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {rule.distribution_type.replace('_', ' ')}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono">{rule.percentage}%</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getWalletLabel(rule.target_wallet_id)}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={() => toggleRule(rule)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfitDistributionRules;
