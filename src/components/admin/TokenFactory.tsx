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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Coins, Plus, Droplets, Gift, Trophy, Users, TrendingUp, 
  Wallet, ArrowUpRight, Settings, RefreshCw, Send
} from "lucide-react";

interface PlatformToken {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  total_supply: number;
  circulating_supply: number;
  treasury_supply: number;
  faucet_pool: number;
  is_active: boolean;
  is_native: boolean;
  created_at: string;
}

interface FaucetClaim {
  id: string;
  token_id: string;
  user_id: string;
  wallet_address: string;
  amount: number;
  chain: string;
  status: string;
  created_at: string;
}

const CHAINS = [
  { id: 'ethereum', name: 'Ethereum', color: 'bg-blue-500' },
  { id: 'polygon', name: 'Polygon', color: 'bg-purple-500' },
  { id: 'bsc', name: 'BNB Chain', color: 'bg-yellow-500' },
  { id: 'avalanche', name: 'Avalanche', color: 'bg-red-500' },
  { id: 'arbitrum', name: 'Arbitrum', color: 'bg-cyan-500' },
  { id: 'base', name: 'Base', color: 'bg-blue-400' },
  { id: 'solana', name: 'Solana', color: 'bg-gradient-to-r from-purple-500 to-green-400' },
  { id: 'qtc-mainnet', name: 'QTC Mainnet', color: 'bg-gradient-to-r from-cyan-500 to-purple-500' },
];

interface DexToken {
  id: string;
  name: string;
  symbol: string;
  address: string;
  chain: string;
  status: string;
  score: number;
  is_verified: boolean;
  created_at: string;
}

export default function TokenFactory() {
  const [tokens, setTokens] = useState<PlatformToken[]>([]);
  const [claims, setClaims] = useState<FaucetClaim[]>([]);
  const [dexTokens, setDexTokens] = useState<DexToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFaucetDialog, setShowFaucetDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState<PlatformToken | null>(null);
  
  const [newToken, setNewToken] = useState({
    symbol: '',
    name: '',
    chain: 'ethereum',
    total_supply: 1000000000,
    treasury_supply: 900000000,
    faucet_pool: 50000000,
  });

  const [faucetSettings, setFaucetSettings] = useState({
    amount_per_claim: 100,
    cooldown_hours: 24,
    max_claims_per_day: 1000,
  });

  useEffect(() => {
    fetchTokens();
    fetchClaims();
    fetchDexTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('platform_tokens unavailable:', error.message);
      } else {
        setTokens(data || []);
      }
    } catch (e) {
      console.warn('fetchTokens failed:', e);
    }
    setLoading(false);
  };

  const fetchDexTokens = async () => {
    try {
      const { data, error } = await supabase
        .from("dex_tokens")
        .select("id, name, symbol, address, chain, status, score, is_verified, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) console.warn("dex_tokens unavailable:", error.message);
      else setDexTokens((data as DexToken[]) ?? []);
    } catch (e) {
      console.warn("fetchDexTokens failed:", e);
    }
  };

  const handleDexApproval = async (id: string, action: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("dex_tokens")
        .update({ status: action, is_verified: action === "approved" })
        .eq("id", id);
      if (error) toast.error(`Failed to ${action} token`);
      else { toast.success(`Token ${action}`); fetchDexTokens(); }
    } catch (e) {
      console.warn("handleDexApproval failed:", e);
      toast.error(`Failed to ${action} token`);
    }
  };

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('faucet_claims')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) console.warn('faucet_claims unavailable:', error.message);
      else setClaims(data || []);
    } catch (e) {
      console.warn('fetchClaims failed:', e);
    }
  };

  const createToken = async () => {
    const { error } = await supabase.from('platform_tokens').insert({
      symbol: newToken.symbol.toUpperCase(),
      name: newToken.name,
      chain: newToken.chain,
      total_supply: newToken.total_supply,
      treasury_supply: newToken.treasury_supply,
      faucet_pool: newToken.faucet_pool,
      circulating_supply: newToken.total_supply - newToken.treasury_supply - newToken.faucet_pool,
      is_active: true,
    });

    if (error) {
      toast.error('Failed to create token');
      console.error(error);
    } else {
      toast.success(`$${newToken.symbol} created successfully!`);
      setShowCreateDialog(false);
      fetchTokens();
      setNewToken({
        symbol: '',
        name: '',
        chain: 'ethereum',
        total_supply: 1000000000,
        treasury_supply: 900000000,
        faucet_pool: 50000000,
      });
    }
  };

  const toggleTokenActive = async (token: PlatformToken) => {
    const { error } = await supabase
      .from('platform_tokens')
      .update({ is_active: !token.is_active })
      .eq('id', token.id);

    if (error) {
      toast.error('Failed to update token');
    } else {
      toast.success(`${token.symbol} ${!token.is_active ? 'activated' : 'deactivated'}`);
      fetchTokens();
    }
  };

  const getChainBadge = (chain: string) => {
    const chainInfo = CHAINS.find(c => c.id === chain);
    return (
      <Badge className={`${chainInfo?.color || 'bg-muted'} text-white`}>
        {chainInfo?.name || chain}
      </Badge>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const totalTreasuryValue = tokens.reduce((acc, t) => acc + t.treasury_supply, 0);
  const totalFaucetPool = tokens.reduce((acc, t) => acc + t.faucet_pool, 0);
  const totalCirculating = tokens.reduce((acc, t) => acc + t.circulating_supply, 0);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tokens</p>
                <p className="text-3xl font-bold">{tokens.length}</p>
              </div>
              <Coins className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Treasury Holdings</p>
                <p className="text-3xl font-bold">{formatNumber(totalTreasuryValue)}</p>
              </div>
              <Wallet className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faucet Pool</p>
                <p className="text-3xl font-bold">{formatNumber(totalFaucetPool)}</p>
              </div>
              <Droplets className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Circulating</p>
                <p className="text-3xl font-bold">{formatNumber(totalCirculating)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tokens" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="tokens" className="gap-2">
              <Coins className="h-4 w-4" /> Tokens
            </TabsTrigger>
            <TabsTrigger value="faucet" className="gap-2">
              <Droplets className="h-4 w-4" /> Faucet Claims
            </TabsTrigger>
            <TabsTrigger value="distribution" className="gap-2">
              <Send className="h-4 w-4" /> Distribution
            </TabsTrigger>
            <TabsTrigger value="approvals" className="gap-2">
              <Settings className="h-4 w-4" />
              Approvals
              {dexTokens.filter((t) => t.status === "pending").length > 0 && (
                <Badge className="ml-1 h-4 px-1 text-[10px] bg-amber-500">
                  {dexTokens.filter((t) => t.status === "pending").length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Create Token
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Token</DialogTitle>
                <DialogDescription>
                  Deploy a new token across any blockchain ecosystem
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input
                      placeholder="e.g. MYTOKEN"
                      value={newToken.symbol}
                      onChange={(e) => setNewToken({ ...newToken, symbol: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Chain</Label>
                    <Select
                      value={newToken.chain}
                      onValueChange={(v) => setNewToken({ ...newToken, chain: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHAINS.map(chain => (
                          <SelectItem key={chain.id} value={chain.id}>
                            {chain.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Token Name</Label>
                  <Input
                    placeholder="e.g. My Awesome Token"
                    value={newToken.name}
                    onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Total Supply</Label>
                    <Input
                      type="number"
                      value={newToken.total_supply}
                      onChange={(e) => setNewToken({ ...newToken, total_supply: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Treasury</Label>
                    <Input
                      type="number"
                      value={newToken.treasury_supply}
                      onChange={(e) => setNewToken({ ...newToken, treasury_supply: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Faucet Pool</Label>
                    <Input
                      type="number"
                      value={newToken.faucet_pool}
                      onChange={(e) => setNewToken({ ...newToken, faucet_pool: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createToken} disabled={!newToken.symbol || !newToken.name}>
                  Create Token
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle>Platform Tokens</CardTitle>
              <CardDescription>
                Manage tokens across all blockchain ecosystems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead className="text-right">Total Supply</TableHead>
                    <TableHead className="text-right">Treasury</TableHead>
                    <TableHead className="text-right">Faucet Pool</TableHead>
                    <TableHead className="text-right">Circulating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map(token => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-bold">{token.symbol.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-medium">${token.symbol}</p>
                            <p className="text-xs text-muted-foreground">{token.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getChainBadge(token.chain)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatNumber(token.total_supply)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-500">
                        {formatNumber(token.treasury_supply)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-blue-500">
                        {formatNumber(token.faucet_pool)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-purple-500">
                        {formatNumber(token.circulating_supply)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={token.is_active ? "default" : "secondary"}>
                          {token.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {token.is_native && (
                          <Badge className="ml-1 bg-gradient-to-r from-cyan-500 to-purple-500">
                            Native
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedToken(token);
                              setShowFaucetDialog(true);
                            }}
                          >
                            <Droplets className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTokenActive(token)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faucet">
          <Card>
            <CardHeader>
              <CardTitle>Recent Faucet Claims</CardTitle>
              <CardDescription>
                Track token distribution through faucets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Token</TableHead>
                    <TableHead>Chain</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {claims.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No faucet claims yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    claims.map(claim => {
                      const token = tokens.find(t => t.id === claim.token_id);
                      return (
                        <TableRow key={claim.id}>
                          <TableCell className="font-mono text-sm">
                            {claim.wallet_address.slice(0, 6)}...{claim.wallet_address.slice(-4)}
                          </TableCell>
                          <TableCell>${token?.symbol || 'Unknown'}</TableCell>
                          <TableCell>{getChainBadge(claim.chain)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(claim.amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              claim.status === 'completed' ? 'default' :
                              claim.status === 'pending' ? 'secondary' : 'destructive'
                            }>
                              {claim.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(claim.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" /> Revenue Distribution
                </CardTitle>
                <CardDescription>
                  5% revenue split across platform wallets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between">
                    <span>Treasury Wallet</span>
                    <span className="font-mono">40%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rewards Pool</span>
                    <span className="font-mono">30%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Staking Pool</span>
                    <span className="font-mono">20%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Development Fund</span>
                    <span className="font-mono">10%</span>
                  </div>
                </div>
                <Button className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" /> Run Distribution
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" /> Quick Actions
                </CardTitle>
                <CardDescription>
                  Launch campaigns and contests
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Gift className="h-4 w-4" /> Create Airdrop Campaign
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Trophy className="h-4 w-4" /> Launch Trading Contest
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Users className="h-4 w-4" /> Invite Influencer
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2">
                  <Send className="h-4 w-4" /> Bulk Token Transfer
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> DEX Token Approvals
              </CardTitle>
              <CardDescription>
                Review and approve community-submitted tokens before they appear on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dexTokens.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No DEX tokens submitted yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Token</TableHead>
                      <TableHead>Chain</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dexTokens.map((token) => (
                      <TableRow key={token.id}>
                        <TableCell className="font-medium">
                          <div>
                            <p>{token.symbol}</p>
                            <p className="text-xs text-muted-foreground">{token.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>{token.chain}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {token.address.slice(0, 8)}…{token.address.slice(-6)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={token.score >= 70 ? "default" : token.score >= 40 ? "secondary" : "destructive"}>
                            {token.score}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={token.status === "approved" ? "default" : token.status === "pending" ? "secondary" : "destructive"}
                          >
                            {token.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(token.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {token.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => handleDexApproval(token.id, "approved")}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => handleDexApproval(token.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          )}
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

      {/* Faucet Settings Dialog */}
      <Dialog open={showFaucetDialog} onOpenChange={setShowFaucetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faucet Settings - ${selectedToken?.symbol}</DialogTitle>
            <DialogDescription>
              Configure faucet distribution for this token
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Amount Per Claim</Label>
              <Input
                type="number"
                value={faucetSettings.amount_per_claim}
                onChange={(e) => setFaucetSettings({ 
                  ...faucetSettings, 
                  amount_per_claim: Number(e.target.value) 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Cooldown (hours)</Label>
              <Input
                type="number"
                value={faucetSettings.cooldown_hours}
                onChange={(e) => setFaucetSettings({ 
                  ...faucetSettings, 
                  cooldown_hours: Number(e.target.value) 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Claims Per Day</Label>
              <Input
                type="number"
                value={faucetSettings.max_claims_per_day}
                onChange={(e) => setFaucetSettings({ 
                  ...faucetSettings, 
                  max_claims_per_day: Number(e.target.value) 
                })}
              />
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Faucet Pool: <span className="font-mono text-foreground">
                  {formatNumber(selectedToken?.faucet_pool || 0)} ${selectedToken?.symbol}
                </span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFaucetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast.success('Faucet settings updated');
              setShowFaucetDialog(false);
            }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
