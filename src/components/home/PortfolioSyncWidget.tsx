import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePortfolioValuation } from "@/hooks/usePortfolioValuation";
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
  Layers,
  AlertCircle,
  AlertTriangle,
  XCircle
} from "lucide-react";

interface ConnectedAccount {
  id: string;
  name: string;
  type: 'exchange' | 'broker' | 'defi' | 'bank';
  status: 'connected' | 'syncing' | 'error';
  balance: number;
  change24h: number;
  lastSync: Date;
}

const PortfolioSyncWidget = () => {
  const { user } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    realAssets,
    testAssets,
    netWorth,
    netWorthIncludingStale,
    hasStaleData,
    hasMissingPrices,
    isLoading: portfolioLoading,
    refetch: refetchPortfolio,
  } = usePortfolioValuation();

  const portfolioAssets = useMemo(() => {
    const totalRealValue = realAssets.reduce((sum, asset) => sum + (asset.priceUnavailable ? 0 : asset.valueUsd), 0);

    return [...realAssets, ...testAssets].map((asset) => ({
      symbol: asset.symbol,
      name: asset.symbol,
      value: asset.valueUsd,
      quantity: asset.quantity,
      priceUsd: asset.priceUsd,
      change24h: asset.change24h ?? 0,
      allocation: !asset.isTestnet && totalRealValue > 0 ? (asset.valueUsd / totalRealValue) * 100 : 0,
      source: asset.isTestnet ? 'Test' : asset.isStale ? 'Stale' : asset.priceUnavailable ? 'No Price' : 'Live',
      isTestnet: asset.isTestnet,
      isStale: asset.isStale,
      priceUnavailable: asset.priceUnavailable,
    }));
  }, [realAssets, testAssets]);

  const displayBalance = netWorth;
  const totalChange = realAssets.reduce((sum, asset) => {
    if (asset.priceUnavailable || asset.change24h === null) return sum;
    return sum + (asset.valueUsd * asset.change24h) / 100;
  }, 0);
  const totalChangePercent = displayBalance > 0 ? (totalChange / displayBalance) * 100 : 0;
  const hasPortfolioAssets = portfolioAssets.length > 0;
  const showEmptyAccountsState = accounts.length === 0 && !hasPortfolioAssets;

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setAccounts([]);
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch connected accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from('connected_accounts_safe' as any)
        .select('id, user_id, account_name, account_type, status, balance, change_24h, last_sync_at, created_at, updated_at')
        .eq('user_id', user.id)
        .order('balance', { ascending: false });

      if (accountsError) throw accountsError;

      const mappedAccounts: ConnectedAccount[] = ((accountsData as any[]) || []).map((a: any) => ({
        id: a.id,
        name: a.account_name,
        type: a.account_type as ConnectedAccount['type'],
        status: a.status as ConnectedAccount['status'],
        balance: Number(a.balance) || 0,
        change24h: Number(a.change_24h) || 0,
        lastSync: new Date(a.last_sync_at || a.updated_at)
      }));

      setAccounts(mappedAccounts);
    } catch (err: any) {
      console.error('Error fetching portfolio data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await Promise.allSettled([fetchData(), refetchPortfolio()]);
    setIsSyncing(false);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'exchange': return '🪙';
      case 'broker': return '📈';
      case 'defi': return '🦊';
      case 'bank': return '🏦';
      default: return '💳';
    }
  };

  if (!user) {
    return (
      <Card className="p-5 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Sign In Required</p>
          <p className="text-sm">Sign in to view your unified portfolio.</p>
        </div>
      </Card>
    );
  }

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
            <p className="text-[10px] text-muted-foreground">{accounts.length} accounts synced</p>
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

      {error ? (
        <div className="flex items-center gap-2 text-destructive py-8 justify-center">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading portfolio</span>
        </div>
      ) : showEmptyAccountsState ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No Accounts Connected</p>
          <p className="text-sm mb-4">Connect your exchange or broker accounts to see unified portfolio.</p>
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Connect Account
          </Button>
        </div>
      ) : (
        <>
          {/* Total Balance */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-[hsl(270,91%,65%,0.1)] to-[hsl(224,100%,58%,0.05)] border border-[hsl(270,91%,65%,0.2)] mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Total Portfolio Value</span>
              <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[9px]">
                <Shield className="w-3 h-3 mr-1" />
                SECURED
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end gap-1 sm:gap-3">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-foreground">
                {showBalance ? `$${displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••••••'}
              </span>
              <div className={`flex items-center gap-1 pb-1 ${totalChangePercent >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                {totalChangePercent >= 0 ? <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" /> : <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="font-mono text-xs sm:text-sm font-bold">
                  {showBalance ? `${totalChangePercent >= 0 ? '+' : ''}${totalChangePercent.toFixed(2)}%` : '••••'}
                </span>
                <span className="font-mono text-xs sm:text-sm hidden sm:inline">
                  ({showBalance ? `${totalChange >= 0 ? '+' : ''}$${Math.abs(totalChange).toFixed(2)}` : '••••'})
                </span>
              </div>
            </div>
            <div className="mt-2 space-y-1">
              {hasStaleData && netWorthIncludingStale > netWorth && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{showBalance ? `Stale estimate: $${netWorthIncludingStale.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '••••'}</span>
                </div>
              )}
              {hasMissingPrices && (
                <div className="flex items-center gap-1 text-[10px] text-destructive">
                  <XCircle className="w-3 h-3" />
                  <span>Some holdings are missing price data</span>
                </div>
              )}
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
            {accounts.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {accounts.map((account) => (
                  <div 
                    key={account.id}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[hsl(223,18%,15%)] flex items-center justify-center text-lg">
                      {getAccountIcon(account.type)}
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
                          {account.change24h >= 0 ? '+' : ''}{account.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-[hsl(222,14%,12%)] bg-[hsl(223,18%,7%)] p-3 text-[11px] text-muted-foreground">
                No linked external accounts yet — portfolio value below is coming from your live holdings ledger.
              </div>
            )}
          </div>

          {/* Asset Allocation */}
          {hasPortfolioAssets && (
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">Portfolio Assets</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground">
                  <Layers className="w-3 h-3 mr-1" />
                  {portfolioAssets.length} total
                </Button>
              </div>
              <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {portfolioAssets.map((asset) => (
                  <div 
                    key={`${asset.symbol}-${asset.source}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[hsl(223,18%,15%)] flex items-center justify-center">
                      <span className="font-mono text-[10px] font-bold text-foreground">{asset.symbol}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs text-foreground">{asset.name}</span>
                        <span className="font-mono text-xs font-bold text-foreground">
                          {showBalance ? (asset.priceUnavailable ? '—' : `${asset.isStale ? '~' : ''}$${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`) : '••••'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {asset.quantity.toLocaleString(undefined, { maximumFractionDigits: asset.quantity < 1 ? 6 : 2 })} {asset.symbol}
                          </span>
                          <span className="font-mono text-[9px] text-muted-foreground">
                            {asset.priceUnavailable ? 'No live price' : `${asset.quantity.toLocaleString(undefined, { maximumFractionDigits: asset.quantity < 1 ? 6 : 2 })} × $${asset.priceUsd.toLocaleString(undefined, { minimumFractionDigits: asset.priceUsd < 1 ? 4 : 2, maximumFractionDigits: asset.priceUsd < 1 ? 4 : 2 })}`}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className="text-[8px] bg-[hsl(222,14%,20%)] text-muted-foreground">{asset.source}</Badge>
                          {!asset.isTestnet && (
                            <span className={`font-mono text-[10px] ${asset.change24h >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-16">
                      <Progress 
                        value={asset.allocation} 
                        className="h-1.5 [&>div]:bg-[hsl(270,91%,65%)]" 
                      />
                      <span className="font-mono text-[9px] text-muted-foreground">{asset.isTestnet ? 'test' : `${asset.allocation.toFixed(1)}%`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
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
                  className="h-12 sm:h-16 flex-col gap-1 sm:gap-1.5 bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)] hover:border-[hsl(222,14%,25%)]"
                >
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                  <span className="text-[10px] text-muted-foreground">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </>
      )}
    </Card>
  );
};

export default PortfolioSyncWidget;