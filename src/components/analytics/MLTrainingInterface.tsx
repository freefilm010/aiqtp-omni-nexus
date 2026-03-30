import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter
} from "recharts";
import { 
  Brain, 
  Play, 
  Pause, 
  RefreshCw, 
  Download, 
  Upload,
  Settings,
  Layers,
  GitBranch,
  Target,
  Cpu,
  Database,
  TrendingUp,
  Zap,
  Save,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModelConfig {
  type: string;
  layers: number[];
  activation: string;
  optimizer: string;
  learningRate: number;
  batchSize: number;
  epochs: number;
  dropout: number;
  regularization: string;
  regularizationStrength: number;
}

interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss: number;
  valAccuracy: number;
}

interface Model {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  status: "training" | "ready" | "deployed" | "failed";
  createdAt: Date;
  metrics: TrainingMetrics[];
}

const MLTrainingInterface = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [currentEpoch, setCurrentEpoch] = useState(0);

  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    type: "neural-network",
    layers: [128, 64, 32],
    activation: "relu",
    optimizer: "adam",
    learningRate: 0.001,
    batchSize: 32,
    epochs: 100,
    dropout: 0.2,
    regularization: "l2",
    regularizationStrength: 0.01,
  });

  const [features, setFeatures] = useState([
    { name: "RSI", selected: true },
    { name: "MACD", selected: true },
    { name: "Bollinger Bands", selected: true },
    { name: "Moving Averages", selected: true },
    { name: "Volume", selected: true },
    { name: "ATR", selected: true },
    { name: "Stochastic", selected: false },
    { name: "Williams %R", selected: false },
    { name: "OBV", selected: true },
    { name: "ADX", selected: true },
    { name: "CCI", selected: false },
    { name: "MFI", selected: false },
  ]);

  const [trainingHistory, setTrainingHistory] = useState<TrainingMetrics[]>([]);
  const [savedModels, setSavedModels] = useState<Model[]>([]);

  // Load saved models from DB
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("ml_models")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) {
        setSavedModels(data.map((m: any) => ({
          id: m.id,
          name: m.name,
          type: m.model_type,
          accuracy: Number(m.accuracy),
          status: m.status as Model["status"],
          createdAt: new Date(m.created_at),
          metrics: (m.training_metrics as TrainingMetrics[]) || [],
        })));
      }
    };
    load();
  }, [user]);

  // Feature importance data
  const featureImportance = [
    { feature: "RSI", importance: 0.18 },
    { feature: "MACD", importance: 0.15 },
    { feature: "Volume", importance: 0.14 },
    { feature: "ADX", importance: 0.12 },
    { feature: "Bollinger", importance: 0.11 },
    { feature: "MA", importance: 0.10 },
    { feature: "ATR", importance: 0.08 },
    { feature: "OBV", importance: 0.07 },
    { feature: "Other", importance: 0.05 },
  ];

  // Confusion matrix data
  const confusionMatrix = [
    { predicted: "Buy", actualBuy: 85, actualSell: 12, actualHold: 8 },
    { predicted: "Sell", actualBuy: 10, actualSell: 82, actualHold: 15 },
    { predicted: "Hold", actualBuy: 5, actualSell: 6, actualHold: 77 },
  ];

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setCurrentEpoch(0);

    // Simulate training
    for (let epoch = 1; epoch <= modelConfig.epochs; epoch++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setCurrentEpoch(epoch);
      setTrainingProgress((epoch / modelConfig.epochs) * 100);

      if (epoch % 10 === 0) {
        setTrainingHistory(prev => [...prev, {
          epoch,
          loss: 0.5 * Math.exp(-epoch / 30) + 0.08 + Math.abs(Math.sin(epoch * 1.618)) * 0.03,
          accuracy: 0.5 + 0.45 * (1 - Math.exp(-epoch / 25)) + Math.abs(Math.sin(epoch * 2.236)) * 0.03,
          valLoss: 0.55 * Math.exp(-epoch / 35) + 0.1 + Math.abs(Math.sin(epoch * 3.14)) * 0.05,
          valAccuracy: 0.48 + 0.42 * (1 - Math.exp(-epoch / 30)) + Math.abs(Math.sin(epoch * 0.618)) * 0.04,
        }]);
      }
    }

    setIsTraining(false);
    toast({
      title: "Training Complete",
      description: `Model trained for ${modelConfig.epochs} epochs with ${(trainingHistory[trainingHistory.length - 1]?.accuracy * 100 || 85).toFixed(1)}% accuracy`,
    });
  };

  const handleSaveModel = async () => {
    if (!user) return;
    const accuracy = trainingHistory.length > 0 ? (trainingHistory[trainingHistory.length - 1]?.accuracy * 100 || 85) : 85;
    const { data, error } = await supabase.from("ml_models").insert({
      user_id: user.id,
      name: `New Model ${savedModels.length + 1}`,
      model_type: modelConfig.type,
      accuracy,
      status: "ready",
      config: modelConfig as any,
      training_metrics: trainingHistory as any,
      feature_importance: featureImportance as any,
      confusion_matrix: confusionMatrix as any,
    }).select().single();

    if (!error && data) {
      const newModel: Model = {
        id: data.id,
        name: data.name,
        type: data.model_type,
        accuracy: Number(data.accuracy),
        status: "ready",
        createdAt: new Date(data.created_at),
        metrics: trainingHistory,
      };
      setSavedModels([newModel, ...savedModels]);
      toast({ title: "Model Saved", description: "Model saved to database" });
    }
  };

  const handleDeployModel = async (modelId: string) => {
    // Undeploy current deployed, deploy new
    const currentDeployed = savedModels.find(m => m.status === "deployed");
    if (currentDeployed) {
      await supabase.from("ml_models").update({ status: "ready" }).eq("id", currentDeployed.id);
    }
    await supabase.from("ml_models").update({ status: "deployed" }).eq("id", modelId);
    setSavedModels(savedModels.map(m => 
      m.id === modelId ? { ...m, status: "deployed" as const } : 
      m.status === "deployed" ? { ...m, status: "ready" as const } : m
    ));
    toast({ title: "Model Deployed", description: "Model is now active in production" });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="training" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="models">Saved Models</TabsTrigger>
        </TabsList>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Training Progress</CardTitle>
                <CardDescription>
                  {isTraining ? `Epoch ${currentEpoch}/${modelConfig.epochs}` : "Ready to train"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isTraining && (
                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{trainingProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={trainingProgress} />
                  </div>
                )}
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingHistory.slice(-50)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="epoch" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="loss" stroke="hsl(0, 84%, 60%)" name="Train Loss" />
                    <Line yAxisId="left" type="monotone" dataKey="valLoss" stroke="hsl(38, 92%, 50%)" name="Val Loss" strokeDasharray="5 5" />
                    <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="hsl(142, 71%, 45%)" name="Train Acc" />
                    <Line yAxisId="right" type="monotone" dataKey="valAccuracy" stroke="hsl(180, 84%, 35%)" name="Val Acc" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Training Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Model Type</Label>
                  <Select value={modelConfig.type} onValueChange={(v) => setModelConfig({ ...modelConfig, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neural-network">Neural Network</SelectItem>
                      <SelectItem value="lstm">LSTM</SelectItem>
                      <SelectItem value="transformer">Transformer</SelectItem>
                      <SelectItem value="random-forest">Random Forest</SelectItem>
                      <SelectItem value="gradient-boosting">Gradient Boosting</SelectItem>
                      <SelectItem value="svm">Support Vector Machine</SelectItem>
                      <SelectItem value="ensemble">Ensemble Model</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Epochs: {modelConfig.epochs}</Label>
                  <Slider 
                    value={[modelConfig.epochs]} 
                    onValueChange={([v]) => setModelConfig({ ...modelConfig, epochs: v })}
                    max={500}
                    min={10}
                    step={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Batch Size: {modelConfig.batchSize}</Label>
                  <Slider 
                    value={[modelConfig.batchSize]} 
                    onValueChange={([v]) => setModelConfig({ ...modelConfig, batchSize: v })}
                    max={256}
                    min={8}
                    step={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Learning Rate: {modelConfig.learningRate}</Label>
                  <Slider 
                    value={[modelConfig.learningRate * 1000]} 
                    onValueChange={([v]) => setModelConfig({ ...modelConfig, learningRate: v / 1000 })}
                    max={100}
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dropout: {modelConfig.dropout}</Label>
                  <Slider 
                    value={[modelConfig.dropout * 100]} 
                    onValueChange={([v]) => setModelConfig({ ...modelConfig, dropout: v / 100 })}
                    max={50}
                    min={0}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1" 
                    onClick={handleStartTraining}
                    disabled={isTraining}
                  >
                    {isTraining ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Training...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Training
                      </>
                    )}
                  </Button>
                  {isTraining && (
                    <Button variant="outline" onClick={() => setIsTraining(false)}>
                      <Pause className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Button variant="outline" className="w-full" onClick={handleSaveModel} disabled={isTraining}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Model
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Current Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Training Loss</p>
                  <p className="text-3xl font-bold text-destructive">
                    {(trainingHistory[trainingHistory.length - 1]?.loss || 0).toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Training Accuracy</p>
                  <p className="text-3xl font-bold text-success">
                    {((trainingHistory[trainingHistory.length - 1]?.accuracy || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Validation Loss</p>
                  <p className="text-3xl font-bold text-warning">
                    {(trainingHistory[trainingHistory.length - 1]?.valLoss || 0).toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Validation Accuracy</p>
                  <p className="text-3xl font-bold text-accent">
                    {((trainingHistory[trainingHistory.length - 1]?.valAccuracy || 0) * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Architecture Tab */}
        <TabsContent value="architecture" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Neural Network Architecture</CardTitle>
              <CardDescription>Configure layer structure and hyperparameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Hidden Layers</Label>
                    <Textarea 
                      value={modelConfig.layers.join(", ")}
                      onChange={(e) => setModelConfig({
                        ...modelConfig,
                        layers: e.target.value.split(",").map(n => parseInt(n.trim()) || 64)
                      })}
                      placeholder="128, 64, 32"
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated neuron counts per layer</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Activation Function</Label>
                    <Select value={modelConfig.activation} onValueChange={(v) => setModelConfig({ ...modelConfig, activation: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relu">ReLU</SelectItem>
                        <SelectItem value="leaky-relu">Leaky ReLU</SelectItem>
                        <SelectItem value="elu">ELU</SelectItem>
                        <SelectItem value="selu">SELU</SelectItem>
                        <SelectItem value="tanh">Tanh</SelectItem>
                        <SelectItem value="sigmoid">Sigmoid</SelectItem>
                        <SelectItem value="swish">Swish</SelectItem>
                        <SelectItem value="gelu">GELU</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Optimizer</Label>
                    <Select value={modelConfig.optimizer} onValueChange={(v) => setModelConfig({ ...modelConfig, optimizer: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adam">Adam</SelectItem>
                        <SelectItem value="adamw">AdamW</SelectItem>
                        <SelectItem value="sgd">SGD</SelectItem>
                        <SelectItem value="rmsprop">RMSprop</SelectItem>
                        <SelectItem value="nadam">Nadam</SelectItem>
                        <SelectItem value="adagrad">Adagrad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Regularization</Label>
                    <Select value={modelConfig.regularization} onValueChange={(v) => setModelConfig({ ...modelConfig, regularization: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="l1">L1 (Lasso)</SelectItem>
                        <SelectItem value="l2">L2 (Ridge)</SelectItem>
                        <SelectItem value="elastic">Elastic Net</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Visual Architecture */}
                <div className="border rounded-lg p-4 bg-secondary/20">
                  <h4 className="font-semibold mb-4">Architecture Preview</h4>
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-2 bg-primary text-primary-foreground rounded text-sm w-full text-center">
                      Input Layer ({features.filter(f => f.selected).length} features)
                    </div>
                    {modelConfig.layers.map((neurons, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="h-4 w-px bg-border" />
                        <div className="p-2 bg-accent text-accent-foreground rounded text-sm w-full text-center">
                          Dense({neurons}) + {modelConfig.activation}
                          {modelConfig.dropout > 0 && ` + Dropout(${modelConfig.dropout})`}
                        </div>
                      </div>
                    ))}
                    <div className="h-4 w-px bg-border" />
                    <div className="p-2 bg-success text-success-foreground rounded text-sm w-full text-center">
                      Output Layer (3 classes: Buy/Sell/Hold)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Feature Selection</CardTitle>
                <CardDescription>Choose input features for the model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {features.map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <Checkbox 
                        id={feature.name}
                        checked={feature.selected}
                        onCheckedChange={(checked) => {
                          const newFeatures = [...features];
                          newFeatures[idx].selected = checked as boolean;
                          setFeatures(newFeatures);
                        }}
                      />
                      <Label htmlFor={feature.name}>{feature.name}</Label>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {features.filter(f => f.selected).length} features selected
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Importance</CardTitle>
                <CardDescription>Contribution of each feature to predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={featureImportance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 0.2]} />
                    <YAxis dataKey="feature" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="importance" fill="hsl(220, 91%, 25%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Evaluation Tab */}
        <TabsContent value="evaluation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Confusion Matrix</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="p-2"></th>
                        <th className="p-2 text-center">Actual Buy</th>
                        <th className="p-2 text-center">Actual Sell</th>
                        <th className="p-2 text-center">Actual Hold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confusionMatrix.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">Predicted {row.predicted}</td>
                          <td className={`p-2 text-center ${row.predicted === "Buy" ? 'bg-success/20 font-bold' : ''}`}>
                            {row.actualBuy}
                          </td>
                          <td className={`p-2 text-center ${row.predicted === "Sell" ? 'bg-success/20 font-bold' : ''}`}>
                            {row.actualSell}
                          </td>
                          <td className={`p-2 text-center ${row.predicted === "Hold" ? 'bg-success/20 font-bold' : ''}`}>
                            {row.actualHold}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Classification Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Precision", value: 0.82 },
                    { label: "Recall", value: 0.79 },
                    { label: "F1 Score", value: 0.80 },
                    { label: "AUC-ROC", value: 0.87 },
                    { label: "Cohen's Kappa", value: 0.71 },
                    { label: "Matthews CC", value: 0.68 },
                  ].map((metric, idx) => (
                    <div key={idx} className="p-3 bg-secondary/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className="text-2xl font-bold">{(metric.value * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Saved Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Models</CardTitle>
              <CardDescription>Manage your trained models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedModels.map((model) => (
                  <div key={model.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          {model.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{model.type}</Badge>
                          <Badge variant={model.status === "deployed" ? "default" : "secondary"}>
                            {model.status}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Created {model.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Accuracy</p>
                          <p className="text-xl font-bold text-success">{model.accuracy.toFixed(1)}%</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant={model.status === "deployed" ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleDeployModel(model.id)}
                          >
                            {model.status === "deployed" ? "Undeploy" : "Deploy"}
                          </Button>
                          <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MLTrainingInterface;
