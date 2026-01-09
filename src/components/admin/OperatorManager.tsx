import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building2, Plus, Wallet, ArrowRightLeft, Users, Bot, 
  TrendingUp, DollarSign, Layers, Copy, Settings, Eye
} from "lucide-react";

interface Territory {
  id: string;
  name: string;
  description: string;
  territory_type: string;
  total_revenue: number;
  total_expenses: number;
  active_operators: number;
  is_active: boolean;
}

interface Operator {
  id: string;
  territory_id: string;
  operator_type: string;
  name: string;
  description: string;
  is_clone: boolean;
  is_admin_owned: boolean;
  owner_user_id: string;
  commission_rate: number;
  reinvestment_rate: number;
  status: string;
  created_at: string;
}

interface OperatorWallet {
  id: string;
  operator_id: string;
  currency: string;
  balance: number;
  available_balance: number;
  total_fees_collected: number;
}

interface Transaction {
  id: string;
  from_operator_id: string;
  to_operator_id: string;
  amount: number;
  currency: string;
  transaction_type: string;
  description: string;
  created_at: string;
}

const OPERATOR_TYPES = [
  { id: 'trading_bot', name: 'Trading Bot', icon: Bot },
  { id: 'affiliate', name: 'Affiliate', icon: Users },
  { id: 'service', name: 'Service', icon: Settings },
  { id: 'fee_collector', name: 'Fee Collector', icon: DollarSign },
  { id: 'reinvestment_pool', name: 'Reinvestment Pool', icon: TrendingUp },
];

export default function OperatorManager() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [wallets, setWallets] = useState<OperatorWallet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOperatorDialog, setShowOperatorDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<string>('all');

  const [newOperator, setNewOperator] = useState({
    territory_id: '',
    operator_type: 'trading_bot',
    name: '',
    description: '',
    commission_rate: 5,
    reinvestment_rate: 10,
  });

  const [newTransaction, setNewTransaction] = useState({
    from_operator_id: '',
    to_operator_id: '',
    amount: 0,
    currency: 'QTC',
    transaction_type: 'transfer',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [territoriesRes, operatorsRes, walletsRes, transactionsRes] = await Promise.all([
      supabase.from('operator_territories').select('*').order('name'),
      supabase.from('operators').select('*').order('created_at', { ascending: false }),
      supabase.from('operator_wallets').select('*'),
      supabase.from('operator_transactions').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (territoriesRes.data) setTerritories(territoriesRes.data);
    if (operatorsRes.data) setOperators(operatorsRes.data);
    if (walletsRes.data) setWallets(walletsRes.data);
    if (transactionsRes.data) setTransactions(transactionsRes.data);
    setLoading(false);
  };

  const createOperator = async () => {
    // First create operator
    const { data: opData, error: opError } = await supabase.from('operators').insert({
      territory_id: newOperator.territory_id,
      operator_type: newOperator.operator_type,
      name: newOperator.name,
      description: newOperator.description,
      commission_rate: newOperator.commission_rate,
      reinvestment_rate: newOperator.reinvestment_rate,
      is_admin_owned: true,
      status: 'active',
    }).select().single();

    if (opError) {
      toast.error('Failed to create operator');
      console.error(opError);
      return;
    }

    // Create wallets for QTC and USD
    const walletsToCreate = ['QTC', 'USD'].map(currency => ({
      operator_id: opData.id,
      currency,
    }));

    await supabase.from('operator_wallets').insert(walletsToCreate);

    // Update territory operator count
    await supabase.from('operator_territories')
      .update({ active_operators: territories.find(t => t.id === newOperator.territory_id)!.active_operators + 1 })
      .eq('id', newOperator.territory_id);

    toast.success(`Operator "${newOperator.name}" created with wallets!`);
    setShowOperatorDialog(false);
    fetchData();
    setNewOperator({
      territory_id: '',
      operator_type: 'trading_bot',
      name: '',
      description: '',
      commission_rate: 5,
      reinvestment_rate: 10,
    });
  };

  const cloneOperator = async (operator: Operator) => {
    const cloneName = `${operator.name} (Clone ${Date.now().toString().slice(-4)})`;
    
    const { data, error } = await supabase.from('operators').insert({
      territory_id: operator.territory_id,
      operator_type: operator.operator_type,
      name: cloneName,
      description: `Clone of ${operator.name}`,
      parent_operator_id: operator.id,
      is_clone: true,
      is_admin_owned: true,
      commission_rate: operator.commission_rate,
      reinvestment_rate: operator.reinvestment_rate,
      status: 'active',
    }).select().single();

    if (error) {
      toast.error('Failed to clone operator');
      return;
    }

    // Create wallets for clone
    await supabase.from('operator_wallets').insert([
      { operator_id: data.id, currency: 'QTC' },
      { operator_id: data.id, currency: 'USD' },
    ]);

    toast.success(`Cloned: ${cloneName}`);
    fetchData();
  };

  const getOperatorWallets = (operatorId: string) => {
    return wallets.filter(w => w.operator_id === operatorId);
  };

  const getTerritoryName = (territoryId: string) => {
    return territories.find(t => t.id === territoryId)?.name || 'Unassigned';
  };

  const getOperatorName = (operatorId: string) => {
    return operators.find(o => o.id === operatorId)?.name || 'Unknown';
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const filteredOperators = selectedTerritory === 'all' 
    ? operators 
    : operators.filter(o => o.territory_id === selectedTerritory);

  const totalOperators = operators.length;
  const activeOperators = operators.filter(o => o.status === 'active').length;
  const totalRevenue = territories.reduce((acc, t) => acc + Number(t.total_revenue), 0);
  const totalWalletBalance = wallets.reduce((acc, w) => acc + Number(w.balance), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Operators</p>
                <p className="text-3xl font-bold">{totalOperators}</p>
                <p className="text-xs text-muted-foreground">{activeOperators} active</p>
              </div>
              <Building2 className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Territories</p>
                <p className="text-3xl font-bold">{territories.length}</p>
              </div>
              <Layers className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold">{formatNumber(totalRevenue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Wallet Holdings</p>
                <p className="text-3xl font-bold">{formatNumber(totalWalletBalance)}</p>
              </div>
              <Wallet className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Territories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {territories.map(territory => (
          <Card 
            key={territory.id} 
            className={`cursor-pointer transition-all hover:border-primary/50 ${
              selectedTerritory === territory.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => setSelectedTerritory(
              selectedTerritory === territory.id ? 'all' : territory.id
            )}
          >
            <CardContent className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{territory.territory_type}</Badge>
                <span className="text-sm font-mono">{territory.active_operators} ops</span>
              </div>
              <h4 className="font-medium">{territory.name}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">{territory.description}</p>
              <div className="mt-2 text-sm">
                <span className="text-green-500">{formatNumber(Number(territory.total_revenue))}</span>
                <span className="text-muted-foreground"> revenue</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="operators" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="operators" className="gap-2">
              <Building2 className="h-4 w-4" /> Operators
            </TabsTrigger>
            <TabsTrigger value="wallets" className="gap-2">
              <Wallet className="h-4 w-4" /> Wallets
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <ArrowRightLeft className="h-4 w-4" /> Transactions
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Dialog open={showOperatorDialog} onOpenChange={setShowOperatorDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> New Operator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Operator</DialogTitle>
                  <DialogDescription>
                    Create a new operator with its own wallet for accounting
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Territory</Label>
                      <Select
                        value={newOperator.territory_id}
                        onValueChange={(v) => setNewOperator({ ...newOperator, territory_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select territory" />
                        </SelectTrigger>
                        <SelectContent>
                          {territories.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newOperator.operator_type}
                        onValueChange={(v) => setNewOperator({ ...newOperator, operator_type: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_TYPES.map(type => (
                            <SelectItem key={type.id} value={type.id}>
                              <div className="flex items-center gap-2">
                                <type.icon className="h-4 w-4" />
                                {type.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., Alpha Bot #1, Affiliate John"
                      value={newOperator.name}
                      onChange={(e) => setNewOperator({ ...newOperator, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      placeholder="Brief description"
                      value={newOperator.description}
                      onChange={(e) => setNewOperator({ ...newOperator, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Commission Rate (%)</Label>
                      <Input
                        type="number"
                        value={newOperator.commission_rate}
                        onChange={(e) => setNewOperator({ ...newOperator, commission_rate: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Reinvestment Rate (%)</Label>
                      <Input
                        type="number"
                        value={newOperator.reinvestment_rate}
                        onChange={(e) => setNewOperator({ ...newOperator, reinvestment_rate: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowOperatorDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createOperator} disabled={!newOperator.name || !newOperator.territory_id}>
                    Create Operator
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="operators">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTerritory === 'all' ? 'All Operators' : getTerritoryName(selectedTerritory)}
              </CardTitle>
              <CardDescription>
                {filteredOperators.length} operators • Each with independent accounting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Territory</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Reinvest</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperators.map(operator => {
                    const opWallets = getOperatorWallets(operator.id);
                    const totalBalance = opWallets.reduce((acc, w) => acc + Number(w.balance), 0);
                    
                    return (
                      <TableRow key={operator.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {operator.is_clone && (
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            )}
                            <div>
                              <p className="font-medium">{operator.name}</p>
                              {operator.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {operator.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {OPERATOR_TYPES.find(t => t.id === operator.operator_type)?.name || operator.operator_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{getTerritoryName(operator.territory_id)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {operator.commission_rate}%
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {operator.reinvestment_rate}%
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="text-sm">
                            {opWallets.map(w => (
                              <div key={w.id} className="font-mono">
                                {formatNumber(Number(w.balance))} {w.currency}
                              </div>
                            ))}
                            {opWallets.length === 0 && (
                              <span className="text-muted-foreground">No wallets</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={operator.status === 'active' ? 'default' : 'secondary'}>
                            {operator.status}
                          </Badge>
                          {operator.is_admin_owned && (
                            <Badge className="ml-1" variant="outline">Admin</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => cloneOperator(operator)}
                              title="Clone operator"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallets">
          <Card>
            <CardHeader>
              <CardTitle>Operator Wallets</CardTitle>
              <CardDescription>
                All wallets across operators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operator</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Fees Collected</TableHead>
                    <TableHead className="text-right">Total In</TableHead>
                    <TableHead className="text-right">Total Out</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map(wallet => (
                    <TableRow key={wallet.id}>
                      <TableCell className="font-medium">
                        {getOperatorName(wallet.operator_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{wallet.currency}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(Number(wallet.balance))}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-500">
                        {formatNumber(Number(wallet.available_balance))}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-500">
                        {formatNumber(Number(wallet.total_fees_collected))}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(Number((wallet as any).total_deposited || 0))}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(Number((wallet as any).total_withdrawn || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Fund flows between operators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No transactions yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map(tx => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {tx.from_operator_id ? getOperatorName(tx.from_operator_id) : 'External'}
                        </TableCell>
                        <TableCell>
                          {tx.to_operator_id ? getOperatorName(tx.to_operator_id) : 'External'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatNumber(Number(tx.amount))} {tx.currency}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{tx.transaction_type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {tx.description || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(tx.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
