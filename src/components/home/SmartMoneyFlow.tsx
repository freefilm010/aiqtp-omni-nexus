import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  DollarSign,
  BarChart3,
  AlertCircle
} from "lucide-react";

interface FlowData {
  id: string;
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
  const [flowData, setFlowData] = useState<FlowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFlowData();
  }, []);

  const fetchFlowData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('smart_money_flows')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (fetchError) throw fetchError;

      const mapped: FlowData[] = (data || []).map(d => ({
        id: d.id,
        asset: d.asset,
        inflow: Number(d.inflow_millions) || 0,
        outflow: Number(d.outflow_millions) || 0,
        netFlow: Number(d.net_flow_millions) || 0,
        whaleActivity: (d.whale_activity as FlowData['whaleActivity']) || 'neutral',
        institutionalBias: (d.institutional_bias as FlowData['institutionalBias']) || 'neutral',
        price: Number(d.price) || 0,
        change24h: Number(d.change_24h) || 0
      }));

      setFlowData(mapped);
    } catch (err: any) {
      console.error('Error fetching smart money flows:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      {error ? (
        <div className="flex items-center gap-2 text-destructive py-8 justify-center">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading flow data</span>
        </div>
      ) : flowData.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No Flow Data Available</p>
          <p className="text-sm">Smart money flow data will appear here when tracked.</p>
        </div>
      ) : (
        <>
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
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 text-[8px] sm:text-[9px] font-mono text-muted-foreground uppercase">
              <span>Asset</span>
              <span className="text-right">Price</span>
              <span className="text-right">24h</span>
              <span className="text-right">Net Flow</span>
              <span className="text-center hidden sm:block">Whales</span>
              <span className="text-center hidden sm:block">Inst. Bias</span>
            </div>

            {flowData.map((item) => (
              <div 
                key={item.id}
                className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 sm:gap-2 px-2 sm:px-3 py-2.5 sm:py-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)] hover:border-[hsl(222,14%,22%)] transition-colors items-center"
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[hsl(223,18%,15%)] flex items-center justify-center">
                    <span className="font-mono text-[8px] sm:text-[9px] font-bold text-foreground">{item.asset}</span>
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
        </>
      )}
    </Card>
  );
};

export default SmartMoneyFlow;