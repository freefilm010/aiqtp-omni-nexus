import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Brain, Play } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ModelTrainer = () => {
  const { user } = useAuth();
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [models, setModels] = useState<any[]>([]);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    const { data } = await supabase.from('ml_models').select('*').order('created_at', { ascending: false }).limit(10);
    if (data) setModels(data);
  };

  const startTraining = () => {
    setTraining(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTraining(false);
          toast.success("Model training complete!");
          return 100;
        }
        return p + 5;
      });
    }, 500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-purple-500" />Model Configuration</CardTitle>
          <CardDescription>Configure and train your prediction model</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Model Type</Label>
              <Select defaultValue="lstm"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lstm">LSTM</SelectItem><SelectItem value="xgboost">XGBoost</SelectItem><SelectItem value="transformer">Transformer</SelectItem><SelectItem value="ensemble">Ensemble</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-2"><Label>Target Asset</Label>
              <Select defaultValue="btc"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="btc">BTC/USDT</SelectItem><SelectItem value="eth">ETH/USDT</SelectItem><SelectItem value="sol">SOL/USDT</SelectItem></SelectContent></Select>
            </div>
          </div>

          <div className="space-y-3"><div className="flex justify-between"><Label>Lookback Period (days)</Label><span className="font-mono">30</span></div><Slider defaultValue={[30]} max={365} step={1} /></div>
          <div className="space-y-3"><div className="flex justify-between"><Label>Prediction Horizon (hours)</Label><span className="font-mono">24</span></div><Slider defaultValue={[24]} max={168} step={1} /></div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Epochs</Label><Input type="number" defaultValue="100" /></div>
            <div className="space-y-2"><Label>Batch Size</Label><Input type="number" defaultValue="32" /></div>
          </div>

          {training && (
            <div className="space-y-2"><div className="flex justify-between text-sm"><span>Training Progress</span><span>{progress}%</span></div><Progress value={progress} /></div>
          )}

          <Button className="w-full" size="lg" onClick={startTraining} disabled={training}>
            {training ? <>Training...</> : <><Play className="h-4 w-4 mr-2" />Start Training</>}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Active Models</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {models.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground"><Brain className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No trained models yet</p></div>
          ) : models.map((model) => (
            <div key={model.id} className="p-4 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{model.model_name}</span>
                <Badge variant={model.status === 'deployed' ? 'default' : 'secondary'}>{model.status}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Accuracy</span>
                <span className="font-bold text-green-500">{(Number(model.accuracy) * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelTrainer;
