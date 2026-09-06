import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, LineChart } from "lucide-react";

interface Row {
  id: string;
  name: string;
  profitability: number;
  consistency: number;
  winRate: number;
  maxDrawdown: number;
  totalTrades: number;
  graduated: boolean;
}

const RealGraduationPass = ({ onComplete }: { onComplete?: () => void }) => {
  const [running, setRunning] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [summary, setSummary] = useState<{ evaluated: number; graduated: number } | null>(null);

  const run = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("strategy-graduation", { body: { limit: 25 } });
    setRunning(false);

    if (error) return toast.error(error.message);
    if (!data?.success) return toast.error(data?.error || "Graduation pass failed");

    setRows(data.results || []);
    setSummary({ evaluated: data.evaluated, graduated: data.graduated });
    toast.success(`${data.graduated} of ${data.evaluated} strategies graduated on real market data`);
    onComplete?.();
  };

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" /> Evidence-Based Graduation Pass
        </CardTitle>
        <CardDescription>
          Re-tests pending strategies against real Binance price history (BTC, ETH and SOL hourly) and stores every
          result. Only strategies that clear the bar on that real data graduate — nothing is estimated.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={run} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LineChart className="h-4 w-4 mr-2" />}
            Run pass on next 25 strategies
          </Button>
          {summary && (
            <span className="text-sm text-muted-foreground">
              {summary.graduated} graduated / {summary.evaluated} tested
            </span>
          )}
        </div>

        {rows.length > 0 && (
          <ScrollArea className="h-64 rounded-md border">
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Return {r.profitability}% · Consistency {r.consistency}% · Win {r.winRate}% · Drawdown{" "}
                      {r.maxDrawdown}% · {r.totalTrades} trades
                    </p>
                  </div>
                  <Badge variant={r.graduated ? "default" : "secondary"} className="shrink-0">
                    {r.graduated ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                    {r.graduated ? "Graduated" : "Held back"}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default RealGraduationPass;
