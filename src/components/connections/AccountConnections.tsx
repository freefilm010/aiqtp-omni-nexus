import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePersistentState } from "@/hooks/usePersistentState";
import {
  Wallet,
  Building2,
  CreditCard,
  ArrowRightLeft,
  Check,
  X,
  Plus,
  Unlink,
  Shield,
  Lock,
  ChevronRight
} from "lucide-react";

interface Connection {
  id: string;
  name: string;
  type: 'exchange' | 'bank' | 'wallet' | 'service';
  icon: string;
  connected: boolean;
  accounts?: string[];
}

interface StoredConnectionState {
  connected: boolean;
  accounts?: string[];
}

const availableConnections: Connection[] = [
  { id: 'coinbase', name: 'Coinbase', type: 'exchange', icon: '🟡', connected: false },
  { id: 'binance', name: 'Binance', type: 'exchange', icon: '🟡', connected: false },
  { id: 'kraken', name: 'Kraken', type: 'exchange', icon: '🟣', connected: false },
  { id: 'robinhood', name: 'Robinhood', type: 'exchange', icon: '🟢', connected: false },
  { id: 'metamask', name: 'MetaMask', type: 'wallet', icon: '🦊', connected: false },
  { id: 'ledger', name: 'Ledger', type: 'wallet', icon: '⬛', connected: false },
  { id: 'trustwallet', name: 'Trust Wallet', type: 'wallet', icon: '🔵', connected: false },
  { id: 'chase', name: 'Chase', type: 'bank', icon: '🏦', connected: false },
  { id: 'bofa', name: 'Bank of America', type: 'bank', icon: '🔴', connected: false },
  { id: 'wells', name: 'Wells Fargo', type: 'bank', icon: '🔴', connected: false },
  { id: 'plaid', name: 'Plaid', type: 'service', icon: '🔗', connected: false },
  { id: 'stripe', name: 'Stripe', type: 'service', icon: '💳', connected: false },
];

const AccountConnections = () => {
  const { user } = useAuth();
  const [storedConnections, setStoredConnections] = usePersistentState<Record<string, StoredConnectionState>>(
    `account-connections:${user?.id ?? "guest"}`,
    {}
  );
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const connections = availableConnections.map((connection) => ({
    ...connection,
    connected: storedConnections[connection.id]?.connected ?? false,
    accounts: storedConnections[connection.id]?.accounts,
  }));

  const mockAccounts = [
    { id: 'acc1', name: '*****cdfc', type: 'Trading Account' },
    { id: 'acc2', name: '*****a3b2', type: 'Savings Account' },
  ];

  const handleConnect = (connectionId: string) => {
    setConnectingId(connectionId);
    setSelectedAccounts(storedConnections[connectionId]?.accounts ?? []);
    setShowAccountSelector(true);
  };

  const confirmConnection = () => {
    if (connectingId && selectedAccounts.length > 0) {
      setStoredConnections(prev => ({
        ...prev,
        [connectingId]: {
          connected: true,
          accounts: selectedAccounts,
        },
      }));
      toast.success(`Connected to ${connections.find(c => c.id === connectingId)?.name}`);
      setShowAccountSelector(false);
      setConnectingId(null);
      setSelectedAccounts([]);
    }
  };

  const handleDisconnect = (connectionId: string) => {
    setStoredConnections(prev => {
      const next = { ...prev };
      delete next[connectionId];
      return next;
    });
    toast.success('Account disconnected');
  };

  const handleAccountSelectorOpenChange = (open: boolean) => {
    setShowAccountSelector(open);

    if (!open) {
      setConnectingId(null);
      setSelectedAccounts([]);
    }
  };

  const connectedCount = connections.filter(c => c.connected).length;

  const ConnectionCard = ({ connection }: { connection: Connection }) => (
    <Card className={`${connection.connected ? 'border-green-500/30 bg-green-500/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{connection.icon}</span>
            <div>
              <h4 className="font-medium">{connection.name}</h4>
              <span className="text-xs text-muted-foreground capitalize">{connection.type}</span>
            </div>
          </div>
          {connection.connected ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-500 text-green-500">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => handleDisconnect(connection.id)}
              >
                <Unlink className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handleConnect(connection.id)}
            >
              Connect
            </Button>
          )}
        </div>
        {connection.connected && connection.accounts && (
          <div className="mt-3 pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              {connection.accounts.length} account(s) linked
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Account Connections</h2>
          <p className="text-muted-foreground">
            Link your exchanges, wallets, and bank accounts
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {connectedCount} Connected
        </Badge>
      </div>

      {/* Security Notice */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h4 className="font-medium">Bank-Level Security</h4>
            <p className="text-sm text-muted-foreground">
              Your data is encrypted and we never store your credentials. Read-only access only.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Exchanges */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5" />
          Crypto Exchanges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.filter(c => c.type === 'exchange').map(c => (
            <ConnectionCard key={c.id} connection={c} />
          ))}
        </div>
      </div>

      {/* Wallets */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Crypto Wallets
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.filter(c => c.type === 'wallet').map(c => (
            <ConnectionCard key={c.id} connection={c} />
          ))}
        </div>
      </div>

      {/* Banks */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Bank Accounts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.filter(c => c.type === 'bank').map(c => (
            <ConnectionCard key={c.id} connection={c} />
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Services
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.filter(c => c.type === 'service').map(c => (
            <ConnectionCard key={c.id} connection={c} />
          ))}
        </div>
      </div>

      {/* Account Selector Dialog */}
      <Dialog open={showAccountSelector} onOpenChange={handleAccountSelectorOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-2xl">💼</span>
              </div>
              <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-2xl">
                  {connections.find(c => c.id === connectingId)?.icon}
                </span>
              </div>
            </div>
            <DialogTitle className="text-center">Select accounts</DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              AIQTP will only share data from <strong>{connections.find(c => c.id === connectingId)?.name}</strong> accounts you select.
            </p>
          </DialogHeader>

          <div className="space-y-3 my-4">
            {mockAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer"
                onClick={() => {
                  setSelectedAccounts(prev =>
                    prev.includes(account.id)
                      ? prev.filter(a => a !== account.id)
                      : [...prev, account.id]
                  );
                }}
              >
                <Checkbox 
                  checked={selectedAccounts.includes(account.id)}
                  onCheckedChange={() => {}}
                />
                <span>{account.name}</span>
              </div>
            ))}
          </div>

          <Button 
            className="w-full" 
            onClick={confirmConnection}
            disabled={selectedAccounts.length === 0}
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountConnections;
