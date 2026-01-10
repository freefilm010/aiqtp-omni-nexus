import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Users,
  DollarSign,
  BarChart3
} from "lucide-react";

// AInvest-inspired Smart Money Flow + Institutional Tracker
// Combined with Bloomberg-style analytics

interface FlowData {
  asset: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  whaleActivity: 'accumulating' | 'distributing' | 'neutral';
  institutionalBias: 'bullish' | 'bearish' | 'neutral';
  price: number;
  change24h: number;
}

const SmartMoneyFlow = () => {
  const [flowData, setFlowData] = useState<FlowData[]>([
    { asset: 'BTC', inflow: 847.2, outflow: 312.5, netFlow: 534.7, whaleActivity: 'accumulating', institutionalBias: 'bullish', price: 97234.56, change24h: 2.34 },
    { asset: 'ETH', inflow: 234.8, outflow: 189.3, netFlow: 45.5, whaleActivity: 'accumulating', institutionalBias: 'bullish', price: 3456.78, change24h: 1.56 },
    { asset: 'SOL', inflow: 156.4, outflow: 98.7, netFlow: 57.7, whaleActivity: 'accumulating', institutionalBias: 'bullish', price: 189.34, change24h: 5.23 },
    { asset: 'XRP', inflow: 45.2, outflow: 67.8, netFlow: -22.6, whaleActivity: 'distributing', institutionalBias: 'bearish', price: 2.34, change24h: -1.23 },
    { asset: 'DOGE', inflow: 23.4, outflow: 89.2, netFlow: -65.8, whaleActivity: 'distributing', institutionalBias: 'bearish', price: 0.38, change24h: -3.45 },
  ]);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setFlowData(prev => prev.map(item => ({
        ...item,
        inflow: item.inflow + (Math.random() - 0.4) * 10,
        outflow: item.outflow + (Math.random() - 0.5) * 8,
        netFlow: item.netFlow + (Math.random() - 0.45) * 5,
        price: item.price * (1 + (Math.random() - 0.5) * 0.002),
        change24h: item.change24h + (Math.random() - 0.5) * 0.1
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalInflow = flowData.reduce((sum, d) => sum + d.inflow, 0);
  const totalOutflow = flowData.reduce((sum, d) => sum + d.outflow, 0);
  const totalNetFlow = totalInflow - totalOutflow;

  return (
    <Card className="p-5 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[hsl(162,91%,32%,0.15)]">
            <Activity className="w-4 h-4 text-[hsl(162,91%,32%)]" />
          </div>
          <h3 className="font-bold text-foreground">Smart Money Flow</h3>
          <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[9px]">LIVE</Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="w-3 h-3" />
          <span className="font-mono">24h</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-[hsl(162,91%,32%,0.08)] border border-[hsl(162,91%,32%,0.2)]">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowUpRight className="w-3 h-3 text-[hsl(162,91%,32%)]" />
            <span className="text-[10px] text-muted-foreground uppercase">Inflow</span>
          </div>
          <span className="font-mono text-lg font-bold text-[hsl(162,91%,32%)]">${totalInflow.toFixed(1)}M</span>
        </div>
        <div className="p-3 rounded-xl bg-[hsl(355,88%,58%,0.08)] border border-[hsl(355,88%,58%,0.2)]">
          <div className="flex items-center gap-1.5 mb-1">
            <ArrowDownRight className="w-3 h-3 text-[hsl(355,88%,58%)]" />
            <span className="text-[10px] text-muted-foreground uppercase">Outflow</span>
          </div>
          <span className="font-mono text-lg font-bold text-[hsl(355,88%,58%)]">${totalOutflow.toFixed(1)}M</span>
        </div>
        <div className={`p-3 rounded-xl ${totalNetFlow >= 0 ? 'bg-[hsl(162,91%,32%,0.08)] border-[hsl(162,91%,32%,0.2)]' : 'bg-[hsl(355,88%,58%,0.08)] border-[hsl(355,88%,58%,0.2)]'} border`}>
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3" style={{ color: totalNetFlow >= 0 ? 'hsl(162,91%,32%)' : 'hsl(355,88%,58%)' }} />
            <span className="text-[10px] text-muted-foreground uppercase">Net Flow</span>
          </div>
          <span className="font-mono text-lg font-bold" style={{ color: totalNetFlow >= 0 ? 'hsl(162,91%,32%)' : 'hsl(355,88%,58%)' }}>
            {totalNetFlow >= 0 ? '+' : ''}${totalNetFlow.toFixed(1)}M
          </span>
        </div>
      </div>

      {/* Flow Table */}
      <div className="space-y-2">
        {/* Header */}
        <div className="grid grid-cols-6 gap-2 px-3 py-2 text-[9px] font-mono text-muted-foreground uppercase">
          <span>Asset</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h</span>
          <span className="text-right">Net Flow</span>
          <span className="text-center">Whales</span>
          <span className="text-center">Inst. Bias</span>
        </div>

        {/* Rows */}
        {flowData.map((item) => (
          <div 
            key={item.asset}
            className="grid grid-cols-6 gap-2 px-3 py-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)] hover:border-[hsl(222,14%,22%)] transition-colors items-center"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[hsl(223,18%,15%)] flex items-center justify-center">
                <span className="font-mono text-[9px] font-bold text-foreground">{item.asset}</span>
              </div>
            </div>
            
            <div className="text-right">
              <span className="font-mono text-xs font-medium text-foreground">
                ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="text-right">
              <span className={`font-mono text-xs font-medium ${item.change24h >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(2)}%
              </span>
            </div>
            
            <div className="text-right">
              <span className={`font-mono text-xs font-bold ${item.netFlow >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                {item.netFlow >= 0 ? '+' : ''}{item.netFlow.toFixed(1)}M
              </span>
            </div>
            
            <div className="flex justify-center">
              <Badge 
                className={`text-[8px] ${
                  item.whaleActivity === 'accumulating' ? 'bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]' :
                  item.whaleActivity === 'distributing' ? 'bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)]' :
                  'bg-[hsl(222,14%,25%)] text-muted-foreground'
                }`}
              >
                {item.whaleActivity === 'accumulating' ? '📈 ACC' : item.whaleActivity === 'distributing' ? '📉 DIST' : '➖ NEU'}
              </Badge>
            </div>
            
            <div className="flex justify-center">
              {item.institutionalBias === 'bullish' ? (
                <TrendingUp className="w-4 h-4 text-[hsl(162,91%,32%)]" />
              ) : item.institutionalBias === 'bearish' ? (
                <TrendingDown className="w-4 h-4 text-[hsl(355,88%,58%)]" />
              ) : (
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Whale Alert Ticker */}
      <div className="mt-4 p-3 rounded-lg bg-[hsl(43,96%,56%,0.08)] border border-[hsl(43,96%,56%,0.2)]">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-[hsl(43,96%,56%)]" />
          <span className="text-xs text-[hsl(43,96%,56%)] font-medium">Whale Alert:</span>
          <span className="text-xs text-foreground/80 animate-pulse">
            🐋 500 BTC ($48.6M) moved from Binance to unknown wallet
          </span>
        </div>
      </div>
    </Card>
  );
};

export default SmartMoneyFlow;
