import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Target, TrendingUp, TrendingDown, Plus, X, Crosshair } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Prediction {
  id: string;
  user_id: string;
  ticker: string;
  prediction_type: string;
  direction: string;
  target_price: number | null;
  target_date: string | null;
  confidence: number;
  reasoning: string | null;
  outcome: string | null;
  upvotes: number;
  created_at: string;
}

const CommunityPredictions = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [ticker, setTicker] = useState("");
  const [direction, setDirection] = useState<"bullish" | "bearish">("bullish");
  const [targetPrice, setTargetPrice] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [confidence, setConfidence] = useState([50]);
  const [reasoning, setReasoning] = useState("");

  const fetchPredictions = useCallback(async () => {
    const { data } = await supabase
      .from("community_predictions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    setPredictions((data as Prediction[]) || []);
  }, []);

  useEffect(() => { fetchPredictions(); }, [fetchPredictions]);

  const handleSubmit = async () => {
    if (!user) { toast.error("Sign in to predict"); return; }
    if (!ticker.trim()) { toast.error("Ticker required"); return; }

    const { error } = await supabase.from("community_predictions").insert({
      user_id: user.id,
      ticker: ticker.toUpperCase().trim(),
      direction,
      target_price: targetPrice ? parseFloat(targetPrice) : null,
      target_date: targetDate || null,
      confidence: confidence[0],
      reasoning: reasoning.trim() || null,
    });

    if (error) { toast.error("Failed to submit"); return; }
    toast.success("Prediction submitted!");
    setTicker(""); setTargetPrice(""); setTargetDate(""); setReasoning("");
    setConfidence([50]); setShowCreate(false);
    fetchPredictions();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Crosshair className="h-5 w-5 text-primary" /> Predictions
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(!showCreate)} className="h-8">
          {showCreate ? <X className="h-3.5 w-3.5 mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
          {showCreate ? "Cancel" : "Make Prediction"}
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="pt-4 space-y-3">
            <div className="flex gap-2">
              <Input placeholder="Ticker (e.g. NVDA)" value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} className="bg-background w-32" />
              <Button variant={direction === "bullish" ? "default" : "outline"} size="sm" onClick={() => setDirection("bullish")} className="flex-1">
                <TrendingUp className="h-3.5 w-3.5 mr-1" /> Bullish
              </Button>
              <Button variant={direction === "bearish" ? "destructive" : "outline"} size="sm" onClick={() => setDirection("bearish")} className="flex-1">
                <TrendingDown className="h-3.5 w-3.5 mr-1" /> Bearish
              </Button>
            </div>
            <div className="flex gap-2">
              <Input type="number" placeholder="Target price $" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} className="bg-background" />
              <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} className="bg-background" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Confidence: {confidence[0]}%</label>
              <Slider value={confidence} onValueChange={setConfidence} min={10} max={100} step={5} className="mt-1" />
            </div>
            <Textarea placeholder="Reasoning (optional)..." value={reasoning} onChange={e => setReasoning(e.target.value)} className="bg-background min-h-[60px]" />
            <Button onClick={handleSubmit} className="w-full">Submit Prediction</Button>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[400px]">
        <div className="space-y-2 pr-2">
          {predictions.map(p => (
            <Card key={p.id} className="border-border/50">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-mono">${p.ticker}</Badge>
                    <Badge variant={p.direction === "bullish" ? "default" : "destructive"} className="text-[10px]">
                      {p.direction === "bullish" ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                      {p.direction}
                    </Badge>
                    {p.target_price && (
                      <span className="text-xs text-foreground font-medium">
                        <Target className="h-3 w-3 inline mr-0.5" />${Number(p.target_price).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-muted-foreground">Confidence: {p.confidence}%</span>
                  {p.target_date && <span className="text-[10px] text-muted-foreground">By: {p.target_date}</span>}
                  {p.outcome && <Badge variant={p.outcome === "correct" ? "default" : "destructive"} className="text-[9px]">{p.outcome}</Badge>}
                </div>
                {p.reasoning && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{p.reasoning}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommunityPredictions;
