import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet,
  Link as LinkIcon,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Shield,
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Layers
} from "lucide-react";

// Robinhood/Coinbase-inspired unified portfolio view
// Multi-brokerage sync with real-time aggregation

interface ConnectedAccount {
  id: string;
  name: string;
  logo: string;
  type: 'exchange' | 'broker' | 'defi' | 'bank';
  status: 'connected' | 'syncing' | 'error';
  balance: number;
  change24h: number;
  lastSync: Date;
}

interface Asset {
  symbol: string;
  name: string;
  value: number;
  quantity: number;
  change24h: number;
  allocation: number;
  source: string;
}

const PortfolioSyncWidget = () => {
  const [showBalance, setShowBalance] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const connectedAccounts: ConnectedAccount[] = [
    { id: '1', name: 'Coinbase', logo: '🪙', type: 'exchange', status: 'connected', balance: 45678.90, change24h: 2.34, lastSync: new Date() },
    { id: '2', name: 'Binance', logo: '🔶', type: 'exchange', status: 'connected', balance: 23456.78, change24h: -0.87, lastSync: new Date() },
    { id: '3', name: 'Robinhood', logo: '🪶', type: 'broker', status: 'connected', balance: 12345.67, change24h: 1.23, lastSync: new Date() },
    { id: '4', name: 'MetaMask', logo: '🦊', type: 'defi', status: 'syncing', balance: 8901.23, change24h: 5.67, lastSync: new Date() },
  ];

  const topAssets: Asset[] = [
    { symbol: 'BTC', name: 'Bitcoin', value: 48500, quantity: 0.5, change24h: 2.34, allocation: 53.4, source: 'Coinbase' },
    { symbol: 'ETH', name: 'Ethereum', value: 17300, quantity: 5, change24h: 1.56, allocation: 19.1, source: 'Binance' },
    { symbol: 'NVDA', name: 'NVIDIA', value: 8900, quantity: 8, change24h: 3.21, allocation: 9.8, source: 'Robinhood' },
    { symbol: 'SOL', name: 'Solana', value: 7500, quantity: 40, change24h: -1.23, allocation: 8.3, source: 'MetaMask' },
    { symbol: 'AAPL', name: 'Apple', value: 5400, quantity: 25, change24h: 0.87, allocation: 5.9, source: 'Robinhood' },
  ];

  const totalBalance = connectedAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const totalChange = connectedAccounts.reduce((sum, acc) => sum + (acc.balance * acc.change24h / 100), 0);
  const totalChangePercent = (totalChange / totalBalance) * 100;

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <Card className="p-5 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(270,91%,65%,0.2)] to-[hsl(270,91%,65%,0.05)]">
            <Wallet className="w-5 h-5 text-[hsl(270,91%,65%)]" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Unified Portfolio</h3>
            <p className="text-[10px] text-muted-foreground">{connectedAccounts.length} accounts synced</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => setShowBalance(!showBalance)}
          >
            {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 w-8 p-0 text-muted-foreground hover:text-foreground ${isSyncing ? 'animate-spin' : ''}`}
            onClick={handleSync}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Total Balance */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[hsl(270,91%,65%,0.1)] to-[hsl(224,100%,58%,0.05)] border border-[hsl(270,91%,65%,0.2)] mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
          <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[9px]">
            <Shield className="w-3 h-3 mr-1" />
            SECURED
          </Badge>
        </div>
        <div className="flex items-end gap-3">
          <span className="font-mono text-3xl font-bold text-foreground">
            {showBalance ? `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '••••••••'}
          </span>
          <div className={`flex items-center gap-1 pb-1 ${totalChangePercent >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
            {totalChangePercent >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            <span className="font-mono text-sm font-bold">
              {showBalance ? `${totalChangePercent >= 0 ? '+' : ''}${totalChangePercent.toFixed(2)}%` : '••••'}
            </span>
            <span className="font-mono text-sm">
              ({showBalance ? `${totalChange >= 0 ? '+' : ''}$${Math.abs(totalChange).toFixed(2)}` : '••••'})
            </span>
          </div>
        </div>
      </div>

      {/* Connected Accounts */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">Connected Accounts</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-[hsl(270,91%,65%)] hover:text-[hsl(270,91%,65%)]">
            <Plus className="w-3 h-3 mr-1" />
            Add Account
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {connectedAccounts.map((account) => (
            <div 
              key={account.id}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]"
            >
              <div className="w-8 h-8 rounded-lg bg-[hsl(223,18%,15%)] flex items-center justify-center text-lg">
                {account.logo}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-xs text-foreground">{account.name}</span>
                  {account.status === 'connected' && <CheckCircle2 className="w-3 h-3 text-[hsl(162,91%,32%)]" />}
                  {account.status === 'syncing' && <RefreshCw className="w-3 h-3 text-[hsl(43,96%,56%)] animate-spin" />}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {showBalance ? `$${account.balance.toLocaleString()}` : '••••'}
                  </span>
                  <span className={`font-mono text-[9px] ${account.change24h >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                    {account.change24h >= 0 ? '+' : ''}{account.change24h}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-muted-foreground">Top Holdings</span>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground">
            <Layers className="w-3 h-3 mr-1" />
            View All
          </Button>
        </div>
        <div className="space-y-2">
          {topAssets.map((asset) => (
            <div 
              key={asset.symbol}
              className="flex items-center gap-3 p-2.5 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]"
            >
              <div className="w-8 h-8 rounded-lg bg-[hsl(223,18%,15%)] flex items-center justify-center">
                <span className="font-mono text-[10px] font-bold text-foreground">{asset.symbol}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs text-foreground">{asset.name}</span>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {showBalance ? `$${asset.value.toLocaleString()}` : '••••'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-muted-foreground">{asset.quantity} {asset.symbol}</span>
                    <Badge className="text-[8px] bg-[hsl(222,14%,20%)] text-muted-foreground">{asset.source}</Badge>
                  </div>
                  <span className={`font-mono text-[10px] ${asset.change24h >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                    {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                  </span>
                </div>
              </div>
              <div className="w-16">
                <Progress 
                  value={asset.allocation} 
                  className="h-1.5 [&>div]:bg-[hsl(270,91%,65%)]" 
                />
                <span className="font-mono text-[9px] text-muted-foreground">{asset.allocation}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: TrendingUp, label: 'Buy', color: 'hsl(162,91%,32%)' },
          { icon: TrendingDown, label: 'Sell', color: 'hsl(355,88%,58%)' },
          { icon: RefreshCw, label: 'Swap', color: 'hsl(224,100%,58%)' },
          { icon: PieChart, label: 'Analyze', color: 'hsl(270,91%,65%)' },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Button 
              key={action.label}
              variant="ghost" 
              size="sm" 
              className="h-16 flex-col gap-1.5 bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)] hover:border-[hsl(222,14%,25%)]"
            >
              <Icon className="w-5 h-5" style={{ color: action.color }} />
              <span className="text-[10px] text-muted-foreground">{action.label}</span>
            </Button>
          );
        })}
      </div>
    </Card>
  );
};

export default PortfolioSyncWidget;
