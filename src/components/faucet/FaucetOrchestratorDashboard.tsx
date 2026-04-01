import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Activity, Droplets, Gauge, TrendingUp, Server,
  Play, Square, Zap, AlertTriangle, BarChart3, Clock
} from "lucide-react";
import { getOrchestrator, type OrchestratorMetrics, type FaucetClaim } from "@/lib/faucet/faucetOrchestrator";

const FaucetOrchestratorDashboard = () => {
  const [metrics, setMetrics] = useState<OrchestratorMetrics | null>(null);
  const [recentClaims, setRecentClaims] = useState<FaucetClaim[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showTestnet, setShowTestnet] = useState(true);

  const orchestrator = getOrchestrator();

  const refreshMetrics = useCallback(() => {
    setMetrics(orchestrator.getMetrics());
    setRecentClaims(orchestrator.getHistory(20));
  }, [orchestrator]);

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 5000);
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  const handleToggleScheduler = () => {
    if (isRunning) {
      orchestrator.stopScheduler();
      setIsRunning(false);
    } else {
      orchestrator.startScheduler(15_000);
      setIsRunning(true);
    }
  };

  const handleClaimAll = async () => {
    const results = await orchestrator.claimAll();
    if (results.length > 0) {
      refreshMetrics();
    }
  };

  if (!metrics) return null;

  const filteredProviders = orchestrator.getProviders().filter(p =>
    showTestnet || p.type !== "TESTNET"
  );

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-lg">Faucet Orchestrator</h3>
          <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
            {isRunning ? "RUNNING" : "STOPPED"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Switch
              id="show-testnet"
              checked={showTestnet}
              onCheckedChange={setShowTestnet}
            />
            <Label htmlFor="show-testnet" className="text-xs">Testnet</Label>
          </div>
          <Button size="sm" variant="outline" onClick={handleClaimAll}>
            <Zap className="h-3 w-3 mr-1" />
            Claim All
          </Button>
          <Button
            size="sm"
            variant={isRunning ? "destructive" : "default"}
            onClick={handleToggleScheduler}
          >
            {isRunning ? <Square className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
            {isRunning ? "Stop" : "Start"}
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          icon={<Droplets className="h-4 w-4 text-blue-500" />}
          label="Total Claims"
          value={metrics.totalClaimed.toString()}
        />
        <MetricCard
          icon={<Activity className="h-4 w-4 text-green-500" />}
          label="Claims/Hour"
          value={metrics.claimsPerHour.toString()}
        />
        <MetricCard
          icon={<Gauge className="h-4 w-4 text-amber-500" />}
          label="Utilization"
          value={`${(metrics.cooldownUtilization * 100).toFixed(0)}%`}
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          label="Fail Rate"
          value={`${(metrics.failRate * 100).toFixed(1)}%`}
        />
      </div>

      {/* Provider Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Provider Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(["PLATFORM", "MINING", "STAKING", "REWARDS", "TESTNET"] as const).map(type => {
            const data = metrics.providerBreakdown[type];
            if (!showTestnet && type === "TESTNET") return null;
            if (data.count === 0) return null;
            return (
              <div key={type} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1.5">{type}</Badge>
                  <span className="text-muted-foreground">{data.count} providers</span>
                </div>
                <span className="font-mono font-medium">{data.totalClaimed.toFixed(2)} claimed</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Provider Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Providers ({filteredProviders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
          {filteredProviders.map(provider => {
            const now = Date.now();
            const canClaim = orchestrator.canClaim(provider.name);
            const cooldownRemaining = provider.lastClaim
              ? Math.max(0, provider.cooldownMs - (now - provider.lastClaim))
              : 0;
            const cooldownPercent = provider.lastClaim
              ? Math.min(100, ((now - provider.lastClaim) / provider.cooldownMs) * 100)
              : 100;

            return (
              <div key={provider.name} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs truncate">{provider.name}</span>
                    <Badge
                      variant={canClaim ? "default" : "secondary"}
                      className="text-[9px] px-1"
                    >
                      {canClaim ? "READY" : "COOLING"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={cooldownPercent} className="h-1 flex-1" />
                    {cooldownRemaining > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />
                        {formatCooldown(cooldownRemaining)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono">{provider.totalClaimed.toFixed(2)}</div>
                  <div className="text-[10px] text-muted-foreground">{provider.asset}</div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Recent Claims Stream */}
      {recentClaims.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Live Claim Stream
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-[200px] overflow-y-auto">
            {recentClaims.map((claim, i) => (
              <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/20">
                <div className="flex items-center gap-2">
                  <Droplets className="h-3 w-3 text-blue-400" />
                  <span className="text-muted-foreground">{claim.provider}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-green-500">
                    +{claim.amount.toFixed(4)} {claim.asset}
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    {new Date(claim.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        {icon}
        <div>
          <div className="text-lg font-bold">{value}</div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatCooldown(ms: number): string {
  const hours = Math.floor(ms / 3600_000);
  const mins = Math.floor((ms % 3600_000) / 60_000);
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default FaucetOrchestratorDashboard;
