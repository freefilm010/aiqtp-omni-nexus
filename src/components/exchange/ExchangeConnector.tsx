import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Link,
  CheckCircle2,
  XCircle,
  Settings,
  Key,
  RefreshCw,
  Shield,
  Wallet,
  AlertTriangle
} from "lucide-react";

interface ExchangeConfig {
  id: string;
  name: string;
  logo: string;
  type: 'cex' | 'dex';
  chain?: string;
  connected: boolean;
  apiKey?: string;
  permissions: string[];
  lastSync?: Date;
  balance?: number;
}

const availableExchanges: Omit<ExchangeConfig, 'connected' | 'apiKey' | 'permissions' | 'lastSync' | 'balance'>[] = [
  { id: 'binance', name: 'Binance', logo: '🟡', type: 'cex' },
  { id: 'coinbase', name: 'Coinbase Pro', logo: '🔵', type: 'cex' },
  { id: 'kraken', name: 'Kraken', logo: '🟣', type: 'cex' },
  { id: 'kucoin', name: 'KuCoin', logo: '🟢', type: 'cex' },
  { id: 'okx', name: 'OKX', logo: '⚫', type: 'cex' },
  { id: 'bybit', name: 'Bybit', logo: '🟠', type: 'cex' },
  { id: 'gate', name: 'Gate.io', logo: '🔴', type: 'cex' },
  { id: 'huobi', name: 'Huobi', logo: '🔷', type: 'cex' },
  { id: 'bitget', name: 'Bitget', logo: '🔶', type: 'cex' },
  { id: 'mexc', name: 'MEXC', logo: '💎', type: 'cex' },
  { id: 'uniswap', name: 'Uniswap V3', logo: '🦄', type: 'dex', chain: 'Ethereum' },
  { id: 'raydium', name: 'Raydium', logo: '☀️', type: 'dex', chain: 'Solana' },
  { id: 'jupiter', name: 'Jupiter', logo: '🪐', type: 'dex', chain: 'Solana' },
  { id: 'pancakeswap', name: 'PancakeSwap', logo: '🥞', type: 'dex', chain: 'BSC' },
  { id: 'curve', name: 'Curve Finance', logo: '🌀', type: 'dex', chain: 'Ethereum' },
  { id: 'sushiswap', name: 'SushiSwap', logo: '🍣', type: 'dex', chain: 'Multi-chain' },
];

const ExchangeConnector = () => {
  const [exchanges, setExchanges] = useState<ExchangeConfig[]>([
    { ...availableExchanges[0], connected: true, apiKey: '***...abc', permissions: ['read', 'trade'], lastSync: new Date(), balance: 45230.50 },
    { ...availableExchanges[10], connected: true, permissions: ['wallet'], lastSync: new Date(), balance: 12450.00 },
  ]);
  const [connectingExchange, setConnectingExchange] = useState<typeof availableExchanges[0] | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [permissions, setPermissions] = useState({
    read: true,
    trade: false,
    withdraw: false
  });

  const handleConnect = () => {
    if (!connectingExchange) return;

    if (connectingExchange.type === 'cex' && (!apiKey || !secretKey)) {
      toast.error("Please enter API credentials");
      return;
    }

    const newExchange: ExchangeConfig = {
      ...connectingExchange,
      connected: true,
      apiKey: connectingExchange.type === 'cex' ? `***...${apiKey.slice(-3)}` : undefined,
      permissions: Object.entries(permissions).filter(([_, v]) => v).map(([k]) => k),
      lastSync: new Date(),
      balance: Math.random() * 50000
    };

    setExchanges(prev => [...prev, newExchange]);
    setConnectingExchange(null);
    setApiKey("");
    setSecretKey("");
    setPassphrase("");
    toast.success(`Connected to ${connectingExchange.name}`);
  };

  const handleDisconnect = (id: string) => {
    setExchanges(prev => prev.filter(e => e.id !== id));
    toast.success("Exchange disconnected");
  };

  const connectedIds = exchanges.filter(e => e.connected).map(e => e.id);
  const unconnectedExchanges = availableExchanges.filter(e => !connectedIds.includes(e.id));

  const totalBalance = exchanges.reduce((sum, e) => sum + (e.balance || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Connected Exchanges</p>
              <p className="text-3xl font-bold">{exchanges.filter(e => e.connected).length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className="text-3xl font-bold">${totalBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CEX Connected</p>
              <p className="text-3xl font-bold">{exchanges.filter(e => e.connected && e.type === 'cex').length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">DEX Connected</p>
              <p className="text-3xl font-bold">{exchanges.filter(e => e.connected && e.type === 'dex').length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Exchanges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Connected Exchanges
          </CardTitle>
          <CardDescription>Manage your exchange connections</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exchanges.filter(e => e.connected).map((exchange) => (
              <div key={exchange.id} className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{exchange.logo}</span>
                    <div>
                      <p className="font-medium">{exchange.name}</p>
                      <div className="flex gap-1">
                        <Badge variant={exchange.type === 'cex' ? 'default' : 'secondary'} className="text-xs">
                          {exchange.type.toUpperCase()}
                        </Badge>
                        {exchange.chain && (
                          <Badge variant="outline" className="text-xs">{exchange.chain}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="font-medium">${exchange.balance?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Permissions</span>
                    <div className="flex gap-1">
                      {exchange.permissions.map(p => (
                        <Badge key={p} variant="outline" className="text-xs capitalize">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  {exchange.apiKey && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">API Key</span>
                      <span className="font-mono text-xs">{exchange.apiKey}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sync
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDisconnect(exchange.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Available Exchanges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Available Exchanges
          </CardTitle>
          <CardDescription>Connect to more exchanges via CCXT unified API</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {unconnectedExchanges.map((exchange) => (
                <Dialog key={exchange.id}>
                  <DialogTrigger asChild>
                    <div 
                      className="p-4 rounded-lg border hover:border-primary hover:bg-muted/50 cursor-pointer transition-all"
                      onClick={() => setConnectingExchange(exchange)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{exchange.logo}</span>
                        <div>
                          <p className="font-medium">{exchange.name}</p>
                          <div className="flex gap-1">
                            <Badge variant={exchange.type === 'cex' ? 'default' : 'secondary'} className="text-xs">
                              {exchange.type.toUpperCase()}
                            </Badge>
                            {exchange.chain && (
                              <Badge variant="outline" className="text-xs">{exchange.chain}</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">{exchange.logo}</span>
                        Connect {exchange.name}
                      </DialogTitle>
                    </DialogHeader>

                    {exchange.type === 'cex' ? (
                      <div className="space-y-4">
                        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                            <div className="text-sm">
                              <p className="font-medium text-amber-500">Security Notice</p>
                              <p className="text-muted-foreground">Only grant read & trade permissions. Never enable withdrawals.</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>API Key</Label>
                          <Input
                            type="password"
                            placeholder="Enter your API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Secret Key</Label>
                          <Input
                            type="password"
                            placeholder="Enter your secret key"
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                          />
                        </div>

                        {(exchange.id === 'kucoin' || exchange.id === 'okx') && (
                          <div className="space-y-2">
                            <Label>Passphrase</Label>
                            <Input
                              type="password"
                              placeholder="Enter passphrase (if required)"
                              value={passphrase}
                              onChange={(e) => setPassphrase(e.target.value)}
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          <Label>Permissions</Label>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Key className="h-4 w-4 text-muted-foreground" />
                                <span>Read (balances, orders)</span>
                              </div>
                              <Switch checked={permissions.read} onCheckedChange={(v) => setPermissions(p => ({ ...p, read: v }))} />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                                <span>Trade (create orders)</span>
                              </div>
                              <Switch checked={permissions.trade} onCheckedChange={(v) => setPermissions(p => ({ ...p, trade: v }))} />
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-destructive" />
                                <span className="text-destructive">Withdraw (not recommended)</span>
                              </div>
                              <Switch checked={permissions.withdraw} onCheckedChange={(v) => setPermissions(p => ({ ...p, withdraw: v }))} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-muted/50 text-center">
                          <Wallet className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <p className="font-medium">Connect Wallet</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Connect your {exchange.chain} wallet to trade on {exchange.name}
                          </p>
                        </div>
                        <Button className="w-full" size="lg" onClick={handleConnect}>
                          <Wallet className="h-4 w-4 mr-2" />
                          Connect Wallet
                        </Button>
                      </div>
                    )}

                    {exchange.type === 'cex' && (
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setConnectingExchange(null)}>Cancel</Button>
                        <Button onClick={handleConnect}>
                          <Shield className="h-4 w-4 mr-2" />
                          Connect Securely
                        </Button>
                      </DialogFooter>
                    )}
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExchangeConnector;
