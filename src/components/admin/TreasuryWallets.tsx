import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Wallet,
  DollarSign,
  Bitcoin,
  Image,
  Building2,
  Gem,
  TrendingUp,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlatformWallet {
  id: string;
  wallet_type: string;
  currency: string;
  balance: number;
  available_balance: number;
  locked_balance: number;
  wallet_address: string | null;
  is_active: boolean;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

interface DistributionLog {
  id: string;
  amount: number;
  currency: string;
  status: string;
  executed_at: string;
  metadata: unknown;
}

const walletIcons: Record<string, React.ElementType> = {
  fiat: DollarSign,
  crypto: Bitcoin,
  nft: Image,
  commodity: Gem,
  real_estate: Building2,
  collectible: Gem
};

const TreasuryWallets = () => {
  const [wallets, setWallets] = useState<PlatformWallet[]>([]);
  const [distributionLogs, setDistributionLogs] = useState<DistributionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWalletOpen, setNewWalletOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({
    wallet_type: 'crypto',
    currency: '',
    wallet_address: ''
  });

  useEffect(() => {
    fetchWallets();
    fetchDistributionLogs();
  }, []);

  const fetchWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_wallets')
        .select('*')
        .order('wallet_type', { ascending: true });

      if (error) throw error;
      setWallets(data || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      toast.error('Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributionLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('profit_distribution_log')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDistributionLogs(data || []);
    } catch (error) {
      console.error('Error fetching distribution logs:', error);
    }
  };

  const addWallet = async () => {
    if (!newWallet.currency) {
      toast.error('Please enter a currency');
      return;
    }

    try {
      const { error } = await supabase
        .from('platform_wallets')
        .insert({
          wallet_type: newWallet.wallet_type,
          currency: newWallet.currency.toUpperCase(),
          wallet_address: newWallet.wallet_address || null,
          balance: 0,
          available_balance: 0,
          locked_balance: 0
        });

      if (error) throw error;
      
      toast.success('Wallet added successfully');
      setNewWalletOpen(false);
      setNewWallet({ wallet_type: 'crypto', currency: '', wallet_address: '' });
      fetchWallets();
    } catch (error) {
      console.error('Error adding wallet:', error);
      toast.error('Failed to add wallet');
    }
  };

  const totalBalance = wallets.reduce((acc, w) => {
    // Simple conversion (in production, use real rates)
    if (w.currency === 'USD' || w.currency === 'USDC') return acc + Number(w.balance);
    if (w.currency === 'EUR') return acc + Number(w.balance) * 1.08;
    if (w.currency === 'BTC') return acc + Number(w.balance) * 67000;
    if (w.currency === 'ETH') return acc + Number(w.balance) * 3400;
    if (w.currency === 'GOLD') return acc + Number(w.balance) * 2100;
    return acc + Number(w.balance);
  }, 0);

  const groupedWallets = wallets.reduce((acc, wallet) => {
    if (!acc[wallet.wallet_type]) {
      acc[wallet.wallet_type] = [];
    }
    acc[wallet.wallet_type].push(wallet);
    return acc;
  }, {} as Record<string, PlatformWallet[]>);

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
          <h1 className="text-3xl font-bold">Treasury Wallets</h1>
          <p className="text-muted-foreground">
            Multi-asset platform treasury management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { fetchWallets(); fetchDistributionLogs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={newWalletOpen} onOpenChange={setNewWalletOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Wallet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Wallet</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wallet Type</label>
                  <Select 
                    value={newWallet.wallet_type} 
                    onValueChange={(v) => setNewWallet(prev => ({ ...prev, wallet_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fiat">Fiat</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                      <SelectItem value="nft">NFT</SelectItem>
                      <SelectItem value="commodity">Commodity</SelectItem>
                      <SelectItem value="real_estate">Real Estate</SelectItem>
                      <SelectItem value="collectible">Collectible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Currency/Asset</label>
                  <Input
                    placeholder="e.g., BTC, SOL, GBP"
                    value={newWallet.currency}
                    onChange={(e) => setNewWallet(prev => ({ ...prev, currency: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Wallet Address (optional)</label>
                  <Input
                    placeholder="0x..."
                    value={newWallet.wallet_address}
                    onChange={(e) => setNewWallet(prev => ({ ...prev, wallet_address: e.target.value }))}
                  />
                </div>
                <Button onClick={addWallet} className="w-full">
                  Add Wallet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Total Value Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Treasury Value (USD)</p>
              <p className="text-4xl font-bold">${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <Wallet className="h-12 w-12 text-primary opacity-50" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="wallets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wallets">All Wallets</TabsTrigger>
          <TabsTrigger value="distributions">Distribution History</TabsTrigger>
        </TabsList>

        <TabsContent value="wallets">
          <div className="grid gap-6">
            {Object.entries(groupedWallets).map(([type, typeWallets]) => {
              const Icon = walletIcons[type] || Wallet;
              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <Icon className="h-5 w-5" />
                      {type.replace('_', ' ')} Wallets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {typeWallets.map((wallet) => (
                        <div
                          key={wallet.id}
                          className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-lg">{wallet.currency}</span>
                            <Badge variant={wallet.is_active ? 'default' : 'secondary'}>
                              {wallet.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Balance:</span>
                              <span className="font-medium">{Number(wallet.balance).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Available:</span>
                              <span className="text-green-500">{Number(wallet.available_balance).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Locked:</span>
                              <span className="text-yellow-500">{Number(wallet.locked_balance).toLocaleString()}</span>
                            </div>
                          </div>
                          {wallet.wallet_address && (
                            <p className="text-xs text-muted-foreground mt-2 truncate">
                              {wallet.wallet_address}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="distributions">
          <Card>
            <CardHeader>
              <CardTitle>Profit Distribution History</CardTitle>
            </CardHeader>
            <CardContent>
              {distributionLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No distributions yet</p>
                  <p className="text-sm">Profits will be automatically distributed based on your rules</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Executed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributionLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          <span className="flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-green-500" />
                            {Number(log.amount).toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>{log.currency}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(log.executed_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TreasuryWallets;
