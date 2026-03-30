import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Fuel, TrendingDown, TrendingUp, Clock, Zap, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

interface ChainGasData {
  chain: string;
  symbol: string;
  gasPrice: number;
  unit: string;
  deploymentCost: number;
  deploymentCostUsd: number;
  txCost: number;
  txCostUsd: number;
  congestion: 'low' | 'medium' | 'high';
  trend: 'falling' | 'stable' | 'rising';
  bestTimeWindow: string;
  nativePrice: number;
}

const CHAIN_CONFIGS = [
  { chain: 'Ethereum', symbol: 'ETH', baseGas: 25, deployGas: 2100000, txGas: 65000, volatility: 0.4 },
  { chain: 'Polygon', symbol: 'MATIC', baseGas: 80, deployGas: 2100000, txGas: 65000, volatility: 0.3 },
  { chain: 'Arbitrum', symbol: 'ETH', baseGas: 0.1, deployGas: 2100000, txGas: 65000, volatility: 0.2 },
  { chain: 'Optimism', symbol: 'ETH', baseGas: 0.005, deployGas: 2100000, txGas: 65000, volatility: 0.15 },
  { chain: 'Solana', symbol: 'SOL', baseGas: 0.000005, deployGas: 1, txGas: 1, volatility: 0.05 },
  { chain: 'BSC', symbol: 'BNB', baseGas: 3, deployGas: 2100000, txGas: 65000, volatility: 0.25 },
  { chain: 'Avalanche', symbol: 'AVAX', baseGas: 25, deployGas: 2100000, txGas: 65000, volatility: 0.3 },
  { chain: 'Base', symbol: 'ETH', baseGas: 0.008, deployGas: 2100000, txGas: 65000, volatility: 0.1 },
];

const NATIVE_PRICES: Record<string, number> = {
  ETH: 3850, MATIC: 0.72, SOL: 185, BNB: 610, AVAX: 38,
};

const TIME_WINDOWS = [
  'Weekends 2-6 AM UTC',
  'Weekdays 12-4 AM UTC',
  'Sunday early morning',
  'Tuesday-Wednesday nights',
];

function generateGasData(seed: number): ChainGasData[] {
  return CHAIN_CONFIGS.map((cfg, i) => {
    const noise = Math.abs(Math.sin(seed + i * 7.3)) * cfg.volatility;
    const gasPrice = cfg.baseGas * (1 + noise - cfg.volatility / 2);
    const nativePrice = NATIVE_PRICES[cfg.symbol] || 1;

    let deploymentCost: number;
    let txCost: number;

    if (cfg.chain === 'Solana') {
      deploymentCost = 0.00589 * (1 + noise);
      txCost = 0.000005 * (1 + noise);
    } else {
      const gasPriceWei = gasPrice * 1e9;
      deploymentCost = (cfg.deployGas * gasPriceWei) / 1e18;
      txCost = (cfg.txGas * gasPriceWei) / 1e18;
    }

    const congestionVal = noise / cfg.volatility;
    const congestion: 'low' | 'medium' | 'high' = 
      congestionVal < 0.4 ? 'low' : congestionVal < 0.7 ? 'medium' : 'high';
    
    const trendVal = Math.sin(seed * 0.1 + i);
    const trend: 'falling' | 'stable' | 'rising' = 
      trendVal < -0.3 ? 'falling' : trendVal > 0.3 ? 'rising' : 'stable';

    return {
      chain: cfg.chain,
      symbol: cfg.symbol,
      gasPrice: Number(gasPrice.toFixed(4)),
      unit: cfg.chain === 'Solana' ? 'lamports' : 'gwei',
      deploymentCost,
      deploymentCostUsd: deploymentCost * nativePrice,
      txCost,
      txCostUsd: txCost * nativePrice,
      congestion,
      trend,
      bestTimeWindow: TIME_WINDOWS[i % TIME_WINDOWS.length],
      nativePrice,
    };
  });
}

interface GasFeeOptimizerProps {
  selectedChain?: string;
  onChainRecommend?: (chain: string) => void;
}

const GasFeeOptimizer = ({ selectedChain, onChainRecommend }: GasFeeOptimizerProps) => {
  const [gasData, setGasData] = useState<ChainGasData[]>([]);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const refresh = useCallback(() => {
    const seed = Date.now() / 60000;
    setGasData(generateGasData(seed));
    setLastRefresh(Date.now());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  const sorted = [...gasData].sort((a, b) => a.deploymentCostUsd - b.deploymentCostUsd);
  const cheapest = sorted[0];

  const congestionColor = (c: string) => {
    if (c === 'low') return 'text-green-500';
    if (c === 'medium') return 'text-yellow-500';
    return 'text-red-500';
  };

  const congestionBg = (c: string) => {
    if (c === 'low') return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (c === 'medium') return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    return 'bg-red-500/10 text-red-400 border-red-500/20';
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Fuel className="h-4 w-4 text-primary" />
            Gas Fee Optimizer
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh} className="h-7 px-2">
            <RefreshCw className="h-3 w-3 mr-1" />
            <span className="text-xs">Refresh</span>
          </Button>
        </div>
        {cheapest && (
          <p className="text-xs text-muted-foreground">
            Cheapest deployment: <span className="text-primary font-medium">{cheapest.chain}</span> at ${cheapest.deploymentCostUsd.toFixed(2)}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <TooltipProvider>
          <div className="grid gap-2">
            {sorted.map((d) => {
              const isSelected = selectedChain?.toLowerCase() === d.chain.toLowerCase();
              const isCheapest = d === cheapest;
              return (
                <div
                  key={d.chain}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                    isSelected
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/50 hover:border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{d.chain}</span>
                        {isCheapest && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-green-500/10 text-green-400 border-green-500/20">
                            <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                            Best
                          </Badge>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {d.gasPrice} {d.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="text-right">
                          <div className="font-mono font-medium">${d.deploymentCostUsd.toFixed(2)}</div>
                          <div className="text-muted-foreground text-[10px]">deploy</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="text-xs">
                        <p>{d.deploymentCost.toFixed(6)} {d.symbol}</p>
                        <p>Tx cost: ${d.txCostUsd.toFixed(4)}</p>
                        <p>Best time: {d.bestTimeWindow}</p>
                      </TooltipContent>
                    </Tooltip>

                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className={`text-[10px] px-1 py-0 h-4 ${congestionBg(d.congestion)}`}>
                        {d.congestion === 'low' ? <Zap className="h-2.5 w-2.5" /> :
                         d.congestion === 'high' ? <AlertTriangle className="h-2.5 w-2.5" /> :
                         <Clock className="h-2.5 w-2.5" />}
                      </Badge>
                      {d.trend === 'falling' ? (
                        <TrendingDown className="h-3 w-3 text-green-500" />
                      ) : d.trend === 'rising' ? (
                        <TrendingUp className="h-3 w-3 text-red-500" />
                      ) : (
                        <span className="h-3 w-3 text-muted-foreground">—</span>
                      )}
                    </div>

                    {onChainRecommend && !isSelected && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 px-1.5 text-[10px]"
                        onClick={() => onChainRecommend(d.chain.toLowerCase())}
                      >
                        Use
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>

        <p className="text-[10px] text-muted-foreground text-center pt-1">
          Updated {Math.round((Date.now() - lastRefresh) / 1000)}s ago · Auto-refreshes every 30s
        </p>
      </CardContent>
    </Card>
  );
};

export default GasFeeOptimizer;
