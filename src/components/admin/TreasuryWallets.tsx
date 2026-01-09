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
  DialogDescription,
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
  ArrowDownLeft,
  Send,
  AlertTriangle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMarketPrices } from "@/hooks/useMarketPrices";
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
  const { getPrice } = useMarketPrices(15000);

  const [wallets, setWallets] = useState<PlatformWallet[]>([]);
  const [distributionLogs, setDistributionLogs] = useState<DistributionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWalletOpen, setNewWalletOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<PlatformWallet | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
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

  const openWithdraw = (wallet: PlatformWallet) => {
    setSelectedWallet(wallet);
    setWithdrawAmount("");
    setWithdrawAddress("");
    setWithdrawOpen(true);
  };

  const executeWithdrawal = async () => {
    if (!selectedWallet || !withdrawAmount || !withdrawAddress) {
      toast.error('Please fill all fields');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Invalid amount');
      return;
    }

    if (amount > Number(selectedWallet.available_balance)) {
      toast.error('Insufficient available balance');
      return;
    }

    setWithdrawing(true);
    try {
      // Update wallet balance
      const newAvailable = Number(selectedWallet.available_balance) - amount;
      const newBalance = Number(selectedWallet.balance) - amount;

      const { error: walletError } = await supabase
        .from('platform_wallets')
        .update({
          balance: newBalance,
          available_balance: newAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedWallet.id);

      if (walletError) throw walletError;

      // Log the distribution
      const { error: logError } = await supabase
        .from('profit_distribution_log')
        .insert({
          from_wallet_id: selectedWallet.id,
          amount: amount,
          currency: selectedWallet.currency,
          status: 'completed',
          metadata: { 
            type: 'admin_withdrawal',
            destination: withdrawAddress 
          }
        });

      if (logError) throw logError;

      toast.success(`Withdrawal of ${amount} ${selectedWallet.currency} initiated`);
      setWithdrawOpen(false);
      fetchWallets();
      fetchDistributionLogs();
    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  const getUsdRate = (currency: string): number => {
    const c = currency.toUpperCase();

    if (c === "USD" || c === "USDC") return 1;
    if (c === "EUR") return 1.08; // fallback until we wire a live FX feed

    if (c === "BTC") return getPrice("BTC")?.priceNumeric ?? 67000;
    if (c === "ETH") return getPrice("ETH")?.priceNumeric ?? 3400;
    if (c === "GOLD") return getPrice("GOLD")?.priceNumeric ?? 2100;

    return 1;
  };

  const totalBalance = wallets.reduce((acc, w) => {
    return acc + Number(w.balance) * getUsdRate(w.currency);
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full mt-3"
                            onClick={() => openWithdraw(wallet)}
                            disabled={Number(wallet.available_balance) <= 0}
                          >
                            <Send className="h-3 w-3 mr-2" />
                            Withdraw
                          </Button>
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

      {/* Withdrawal Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Withdraw {selectedWallet?.currency}
            </DialogTitle>
            <DialogDescription>
              Available: {selectedWallet ? Number(selectedWallet.available_balance).toLocaleString() : 0} {selectedWallet?.currency}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Destination Address</label>
              <Input
                placeholder="Wallet address or bank details..."
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
              />
            </div>
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <p className="text-xs text-amber-500">
                Withdrawals are irreversible. Double-check the destination address.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>
              Cancel
            </Button>
            <Button onClick={executeWithdrawal} disabled={withdrawing}>
              {withdrawing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Confirm Withdrawal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TreasuryWallets;
